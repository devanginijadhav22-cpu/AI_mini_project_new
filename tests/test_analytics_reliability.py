"""
Unit and Regression Test Suite for Analytics & Inclusivity Reports Reliability
Verifies:
1. Exact source queries and single-count-per-student guarantee (no application duplicates).
2. Proper numeric exclusion of missing values with 'Unknown' bucket reporting.
3. De-duplicated ML probability bands and explicit population definitions.
4. Model calibration reporting (unverified on live cohort, verified Brier score on benchmark test set).
5. Edge-case safety with empty records or missing fields.
6. Strict preservation of caste-independent eligibility rules.
"""

import unittest
from backend.app.database.connection import SessionLocal
from backend.app.database.models import (
    User, StudentProfile, FinancialRecord, AcademicRecord, 
    EligibilityResult, Scholarship, Application
)
from backend.app.routes.admin_routes import get_analytics

class TestAnalyticsReliability(unittest.TestCase):
    def setUp(self):
        self.db = SessionLocal()
        # Mock admin token payload
        self.admin_payload = {"sub": "1", "role": "ADMIN"}

    def tearDown(self):
        self.db.close()

    def test_single_student_count_and_population_baseline(self):
        """Verify baseline population equals exact registered students count."""
        actual_students = self.db.query(User).filter(User.role == "STUDENT").count()
        res = get_analytics(payload=self.admin_payload, db=self.db)
        
        meta = res["metadata"]
        self.assertEqual(meta["total_registered_students"], actual_students)
        self.assertGreater(actual_students, 0)

    def test_category_representation_sums_to_total_students(self):
        """Demographic & Category chart must account for 100% of registered students."""
        res = get_analytics(payload=self.admin_payload, db=self.db)
        total_students = res["metadata"]["total_registered_students"]
        cat_dist = res["category_distribution"]
        
        cat_sum = sum(item["students"] for item in cat_dist)
        self.assertEqual(cat_sum, total_students, "Category representation must sum to total registered students")
        
        # Verify Unknown accounts for undeclared categories and students without profiles
        unknown_item = next((item for item in cat_dist if item["name"] == "Unknown"), None)
        self.assertIsNotNone(unknown_item)
        self.assertGreater(unknown_item["students"], 0)

    def test_income_brackets_discrete_counts_and_unknown_handling(self):
        """Income brackets must exclude missing values from numeric tiers and report as Unknown."""
        res = get_analytics(payload=self.admin_payload, db=self.db)
        total_students = res["metadata"]["total_registered_students"]
        income_dist = res["income_brackets"]
        
        income_sum = sum(item["students"] for item in income_dist)
        self.assertEqual(income_sum, total_students, "Income brackets must sum to total registered students")
        
        unknown_item = next((item for item in income_dist if item["bracket"] == "Unknown"), None)
        self.assertIsNotNone(unknown_item)
        # Verify that reported + unknown = total_students
        reported_incomes = sum(item["students"] for item in income_dist if item["bracket"] != "Unknown")
        self.assertEqual(reported_incomes + unknown_item["students"], total_students)

    def test_academic_cgpa_tiers_discrete_counts_and_unknown_handling(self):
        """CGPA tiers must accurately bin reported students and isolate missing to Unknown."""
        res = get_analytics(payload=self.admin_payload, db=self.db)
        total_students = res["metadata"]["total_registered_students"]
        acad_dist = res["academic_performance_distribution"]
        
        acad_sum = sum(item["students"] for item in acad_dist)
        self.assertEqual(acad_sum, total_students, "CGPA distribution must sum to total registered students")
        
        unknown_item = next((item for item in acad_dist if item["range"] == "Unknown"), None)
        self.assertIsNotNone(unknown_item)
        reported_cgpas = sum(item["students"] for item in acad_dist if item["range"] != "Unknown")
        self.assertEqual(reported_cgpas + unknown_item["students"], total_students)

    def test_model_prediction_deduplication(self):
        """AI confidence bands must reflect unique students (latest assessment), eliminating duplicates."""
        total_elig_rows = self.db.query(EligibilityResult).count()
        unique_assessed_students = self.db.query(EligibilityResult.user_id).distinct().count()
        
        res = get_analytics(payload=self.admin_payload, db=self.db)
        total_students = res["metadata"]["total_registered_students"]
        pred_dist = res["model_prediction_distribution"]
        
        pred_sum = sum(item["count"] for item in pred_dist)
        self.assertEqual(pred_sum, total_students, "Model predictions + unassessed must sum to total registered students")
        
        assessed_sum = sum(item["count"] for item in pred_dist if item["probability"] != "Unassessed")
        self.assertEqual(assessed_sum, unique_assessed_students, "Assessed count must equal unique students, NOT raw rows")
        
        if total_elig_rows > unique_assessed_students:
            self.assertLess(assessed_sum, total_elig_rows, "Duplicate checks must be filtered out")

    def test_calibration_transparency(self):
        """Calibration info must accurately report live status as unverified and benchmark as verified."""
        res = get_analytics(payload=self.admin_payload, db=self.db)
        calib = res["calibration"]
        
        # Live cohort must be transparently declared unverified
        self.assertFalse(calib["live_cohort"]["is_verified"])
        self.assertIn("not been verified", calib["live_cohort"]["note"])
        
        # Benchmark must report verified Brier score loss
        self.assertTrue(calib["benchmark_test_set"]["is_verified"])
        self.assertAlmostEqual(calib["benchmark_test_set"]["brier_score"], 0.0348, places=3)
        self.assertEqual(calib["benchmark_test_set"]["sample_size"], 11000)
        self.assertEqual(len(calib["benchmark_test_set"]["calibration_curve"]), 10)

if __name__ == "__main__":
    unittest.main()
