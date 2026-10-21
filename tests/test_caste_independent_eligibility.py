"""
Automated Regression, Fairness, and Invariance Test Suite
Verifies Caste-Independent General Eligibility, Symbolic Reasoning (Forward & Backward Chaining),
and Model Artifact Integrity.
"""

import os
import sys
import json
import numpy as np
import pandas as pd
import joblib

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml.feature_engineering import CATEGORICAL_FEATURES, NUMERICAL_FEATURES, ALL_FEATURE_COLUMNS
from ml.data_preprocessing import MODELS_DIR
from ml.predict import ScholarshipPredictor
from backend.app.services.rule_engine import RuleBasedExpertSystem, build_scholarship_knowledge_base, Fact
from backend.app.services.hybrid_expert_service import HybridExpertService
from backend.app.services.recommendation_service import ScholarshipRecommendationEngine
from backend.app.database.connection import SessionLocal
from backend.app.database.models import Scholarship


# -----------------------------------------------------------------------------
# Test 1: Feature Schema Verification
# -----------------------------------------------------------------------------
def test_feature_schema_strictly_contains_no_category():
    """Verify that 'category' is completely absent from all ML feature lists and artifacts."""
    assert "category" not in CATEGORICAL_FEATURES, "Found 'category' in CATEGORICAL_FEATURES!"
    assert "category" not in ALL_FEATURE_COLUMNS, "Found 'category' in ALL_FEATURE_COLUMNS!"

    # Check saved feature names artifact
    feat_names_path = os.path.join(MODELS_DIR, "feature_names.pkl")
    assert os.path.exists(feat_names_path), "feature_names.pkl does not exist!"
    saved_features = joblib.load(feat_names_path)
    for feat in saved_features:
        assert "category" not in feat.lower(), f"Saved feature artifact contains prohibited category feature: {feat}"

    # Check model metrics JSON
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    with open(metrics_path, "r") as f:
        metrics = json.load(f)
    for fi in metrics.get("feature_importance", []):
        assert "category" not in fi["feature"].lower(), f"Feature importance contains prohibited category feature: {fi['feature']}"


# -----------------------------------------------------------------------------
# Test 2: Counterfactual ML Invariance (Zero-Variance Guarantee)
# -----------------------------------------------------------------------------
def test_counterfactual_ml_invariance():
    """
    Changing only a student's caste/category while keeping all other inputs constant
    MUST yield the EXACT same ML predicted probability and verdict.
    """
    predictor = ScholarshipPredictor()
    base_student = {
        "student_id": "TEST_STU_001",
        "age": 20,
        "gender": "Female",
        "state": "Maharashtra",
        "disability": 0,
        "rural_urban": "Urban",
        "first_generation": 0,
        "education_level": "Undergraduate",
        "course": "Computer Science & IT",
        "year": 3,
        "cgpa": 8.4,
        "percentage": 82.0,
        "backlogs": 0,
        "attendance": 88.0,
        "institution_type": "Private",
        "family_income": 350000,
        "family_size": 4,
        "parent_occupation": "Private Sector / Service",
        "earning_members": 1,
        "financial_dependency": "Both Parents",
        "sports_achievement": "None",
        "academic_achievement": "None",
        "extracurricular_score": 6,
        "previous_scholarship": 0
    }

    probabilities = []
    categories_to_test = ["General", "OBC", "SC", "ST", "EWS"]

    for cat in categories_to_test:
        test_input = base_student.copy()
        test_input["category"] = cat  # Legacy caller attempting to pass category
        result = predictor.predict_single(test_input)
        probabilities.append(result["probability"])

    # Assert all probabilities are mathematically identical (variance == 0.0 within float precision)
    std_dev = np.std(probabilities)
    assert np.isclose(std_dev, 0.0, atol=1e-12), f"ML probability varied across categories! Values: {probabilities}, std: {std_dev}"
    assert len(set(probabilities)) == 1, f"Expected 1 unique probability, got: {set(probabilities)}"


# -----------------------------------------------------------------------------
# Test 3: Counterfactual Hybrid & Rule Invariance
# -----------------------------------------------------------------------------
def test_counterfactual_hybrid_expert_invariance():
    """
    Verify that HybridExpertService produces identical rule scores, hybrid scores,
    and final verdicts regardless of passed category.
    """
    service = HybridExpertService()
    student_payload = {
        "cgpa": 7.8,
        "family_income": 280000,
        "backlogs": 0,
        "attendance": 84.0,
        "age": 21,
        "gender": "Male",
        "state": "Karnataka",
        "disability": 0,
        "rural_urban": "Rural",
        "first_generation": 1,
        "education_level": "Undergraduate",
        "course": "Mechanical Engineering",
        "year": 2,
        "percentage": 76.5,
        "institution_type": "Government",
        "family_size": 5,
        "parent_occupation": "Farmer / Agriculture",
        "earning_members": 1,
        "financial_dependency": "Both Parents",
        "sports_achievement": "State",
        "academic_achievement": "None",
        "extracurricular_score": 7,
        "previous_scholarship": 0
    }

    hybrid_scores = []
    rule_scores = []
    verdicts = []

    for cat in ["General", "OBC", "SC", "ST", "EWS"]:
        p = student_payload.copy()
        p["category"] = cat
        eval_res = service.evaluate_student(p)
        hybrid_scores.append(eval_res["hybrid_score"])
        rule_scores.append(eval_res["rule_score"])
        verdicts.append(eval_res["final_verdict"])

    assert len(set(hybrid_scores)) == 1, f"Hybrid scores varied: {hybrid_scores}"
    assert len(set(rule_scores)) == 1, f"Rule scores varied: {rule_scores}"
    assert len(set(verdicts)) == 1, f"Verdicts varied: {verdicts}"


# -----------------------------------------------------------------------------
# Test 4: Forward Chaining Reasoning Tests
# -----------------------------------------------------------------------------
def test_forward_chaining_eligible_case():
    """Test that Forward Chaining fires all eligible rules and derives 'generally_eligible'."""
    re = RuleBasedExpertSystem()
    student = {
        "cgpa": 8.5,
        "family_income": 200000,
        "backlogs": 0,
        "attendance": 90.0
    }
    result = re.evaluate_general_baseline(student)
    assert result["rule_status"] == "ELIGIBLE"
    sr = result["symbolic_reasoning"]
    assert "generally_eligible" in sr["forward_chaining"]["derived_facts"]
    assert sr["forward_chaining"]["fired_rules_count"] >= 5


def test_forward_chaining_conditional_case():
    """Test that Forward Chaining derives conditional status when 1 backlog is present."""
    re = RuleBasedExpertSystem()
    student = {
        "cgpa": 7.5,
        "family_income": 300000,
        "backlogs": 1,
        "attendance": 80.0
    }
    result = re.evaluate_general_baseline(student)
    assert result["rule_status"] == "CONDITIONALLY_ELIGIBLE"
    sr = result["symbolic_reasoning"]
    assert "conditionally_eligible" in sr["forward_chaining"]["derived_facts"]
    assert "generally_eligible" not in sr["forward_chaining"]["derived_facts"]


def test_forward_chaining_ineligible_case():
    """Test that substandard CGPA or excessive backlogs fails to derive eligibility."""
    re = RuleBasedExpertSystem()
    student = {
        "cgpa": 4.5,
        "family_income": 1200000,
        "backlogs": 3,
        "attendance": 50.0
    }
    result = re.evaluate_general_baseline(student)
    assert result["rule_status"] == "NOT_ELIGIBLE"
    sr = result["symbolic_reasoning"]
    assert "generally_eligible" not in sr["forward_chaining"]["derived_facts"]
    assert "conditionally_eligible" not in sr["forward_chaining"]["derived_facts"]


# -----------------------------------------------------------------------------
# Test 5: Backward Chaining Goal Verification Tests
# -----------------------------------------------------------------------------
def test_backward_chaining_goal_proof_success():
    """Test that Backward Chaining successfully proves the goal 'generally_eligible'."""
    re = RuleBasedExpertSystem()
    student = {
        "cgpa": 7.2,
        "family_income": 450000,
        "backlogs": 0,
        "attendance": 78.0
    }
    result = re.evaluate_general_baseline(student)
    bc = result["symbolic_reasoning"]["backward_chaining"]
    assert bc["status"] == "SATISFIED"
    assert bc["satisfied"] is True


def test_backward_chaining_unmet_prerequisite():
    """Test that Backward Chaining fails when attendance is below acceptable threshold."""
    re = RuleBasedExpertSystem()
    student = {
        "cgpa": 7.2,
        "family_income": 450000,
        "backlogs": 0,
        "attendance": 58.0  # Fails attendance norm
    }
    result = re.evaluate_general_baseline(student)
    bc = result["symbolic_reasoning"]["backward_chaining"]
    assert bc["satisfied"] is False


def test_missing_data_represented_as_unknown():
    """Test that missing required fields are represented as UNKNOWN rather than defaulted."""
    re = RuleBasedExpertSystem()
    facts = re.extract_ground_facts({"cgpa": None, "family_income": 300000})
    assert facts["academic_merit_passed"].status == "UNKNOWN"


# -----------------------------------------------------------------------------
# Test 6: General Merit Scholarship Invariance in Recommendations
# -----------------------------------------------------------------------------
def test_general_merit_scholarship_recommendation_invariance():
    """
    Verify that scholarships with required_category == 'All' receive the exact same
    match percentage and ranking across different categories.
    """
    db = SessionLocal()
    try:
        student_base = {
            "cgpa": 8.0,
            "family_income": 300000,
            "gender": "Male",
            "backlogs": 0,
            "education_level": "Undergraduate"
        }

        matches_by_cat = {}
        for cat in ["General", "OBC", "SC", "ST", "EWS"]:
            s_dict = student_base.copy()
            s_dict["category"] = cat
            recs = ScholarshipRecommendationEngine.get_recommendations(s_dict, db, ml_prob=0.85)
            # Find a general merit scholarship (e.g. Central Sector Scheme)
            general_schs = [r for r in recs if r["title"] == "Central Sector Scheme for College and University Students"]
            if general_schs:
                matches_by_cat[cat] = general_schs[0]["match_percentage"]

        if matches_by_cat:
            assert len(set(matches_by_cat.values())) == 1, f"General scholarship matches varied by category: {matches_by_cat}"
    finally:
        db.close()


# -----------------------------------------------------------------------------
# Test 7: Statutory Restricted Scholarship for Uncategorized Applicant
# -----------------------------------------------------------------------------
def test_statutory_restricted_scholarship_for_uncategorized_student():
    """
    Verify that an applicant with no stored category in their general profile:
    1. Passes general baseline eligibility evaluation.
    2. Receives valid recommendation with statutory condition flagged for OBC-restricted scholarship.
    3. Can apply and maintain PENDING status until administrative statutory verification.
    """
    db = SessionLocal()
    try:
        re = RuleBasedExpertSystem()
        hybrid_svc = HybridExpertService()

        # Student with NO category in profile
        student_uncategorized = {
            "student_id": "TEST_UNCAT_001",
            "age": 21,
            "gender": "Male",
            "state": "Maharashtra",
            "category": None,  # General profile stores NO category
            "disability": 0,
            "rural_urban": "Urban",
            "first_generation": 0,
            "education_level": "Undergraduate",
            "course": "Computer Science & IT",
            "year": 3,
            "year_of_study": 3,
            "cgpa": 8.2,
            "percentage": 78.0,
            "backlogs": 0,
            "attendance": 85.0,
            "institution_type": "Government",
            "family_income": 200000.0,
            "family_size": 4,
            "parent_occupation": "Farmer / Agriculture",
            "earning_members": 1,
            "financial_dependency": "Both Parents",
            "sports_achievement": "None",
            "academic_achievement": "None",
            "extracurricular_score": 6,
            "certifications_count": 2,
            "leadership_experience": False,
            "previous_scholarship": 0
        }

        # 1. General Baseline Verification (must pass without category)
        gen_eval = re.evaluate_general_baseline(student_uncategorized)
        assert gen_eval["rule_status"] == "ELIGIBLE", f"Expected ELIGIBLE, got {gen_eval['rule_status']}"

        hybrid_res = hybrid_svc.evaluate_student(student_uncategorized)
        assert hybrid_res["hybrid_score"] >= 75.0, f"Expected high hybrid score, got {hybrid_res['hybrid_score']}"

        # 2. Specific OBC Scholarship Evaluation
        obc_sch = db.query(Scholarship).filter(Scholarship.required_category == "OBC").first()
        if obc_sch:
            spec_eval = RuleBasedExpertSystem.evaluate_scholarship_specific(student_uncategorized, obc_sch)
            assert spec_eval["status"] == "Conditionally Eligible", f"Expected Conditionally Eligible, got {spec_eval['status']}"
            assert any("OBC" in req for req in spec_eval["missing_requirements"]), "Expected OBC statutory notice in missing_requirements"

            # 3. Recommendation Engine Retention
            recs = ScholarshipRecommendationEngine.get_recommendations(student_uncategorized, db, ml_prob=hybrid_res["ml_probability"])
            obc_recs = [r for r in recs if r["id"] == obc_sch.id]
            assert len(obc_recs) == 1, "OBC scholarship must be present in recommendations list"
            assert obc_recs[0]["eligibility_status"] == "Conditionally Eligible"
            assert obc_recs[0]["match_percentage"] > 50.0, "Match percentage should reflect high academic and need merit"
    finally:
        db.close()


if __name__ == "__main__":
    print("Running automated regression and fairness test suite...")
    test_feature_schema_strictly_contains_no_category()
    print("PASS: Feature schema verified.")
    test_counterfactual_ml_invariance()
    print("PASS: Counterfactual ML invariance verified (0.000 variance).")
    test_counterfactual_hybrid_expert_invariance()
    print("PASS: Counterfactual Hybrid expert invariance verified.")
    test_forward_chaining_eligible_case()
    test_forward_chaining_conditional_case()
    test_forward_chaining_ineligible_case()
    print("PASS: Forward chaining rules verified.")
    test_backward_chaining_goal_proof_success()
    test_backward_chaining_unmet_prerequisite()
    test_missing_data_represented_as_unknown()
    print("PASS: Backward chaining goal verification passed.")
    test_general_merit_scholarship_recommendation_invariance()
    print("PASS: General merit scholarship ranking invariance verified.")
    test_statutory_restricted_scholarship_for_uncategorized_student()
    print("PASS: Statutory restricted scholarship flow for uncategorized applicant verified.")
    print("\nALL INVARIANCE AND REASONING TESTS PASSED PERFECTLY!")
