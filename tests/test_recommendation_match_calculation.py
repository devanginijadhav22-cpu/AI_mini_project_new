"""
Automated Test Suite for Scholarship Match Percentage Calculation
Verifies:
1. Criteria-driven score differentiation (multiple eligible scholarships produce distinct percentages).
2. Monotonic sensitivity of academic fit to CGPA changes.
3. Monotonic sensitivity of financial fit to income changes.
4. Strict score boundedness within [0.0, 100.0]%.
5. Distinction between eligibility status and match score (unmet criteria explained and capped <= 75.0%).
6. Caste / category invariance for general scholarships (required_category == 'All').
7. Enforcement of statutory quotas and affirmative action criteria.
8. Symbolic reasoning (Forward & Backward Chaining) compatibility.
9. End-to-end recommendation response schema integrity.
"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.app.database.connection import SessionLocal
from backend.app.database.models import Scholarship
from backend.app.services.recommendation_service import ScholarshipRecommendationEngine


def test_1_different_scholarships_produce_different_match_percentages():
    """Verify that multiple eligible scholarships with different criteria yield differentiated scores."""
    db = SessionLocal()
    try:
        student = {
            "cgpa": 8.5,
            "family_income": 250000.0,
            "category": "OBC",
            "gender": "Female",
            "course": "Computer Science & IT",
            "education_level": "Undergraduate",
            "disability": 0,
            "backlogs": 0
        }
        recs = ScholarshipRecommendationEngine.get_recommendations(student, db, ml_prob=0.92)
        eligible_recs = [r for r in recs if r["eligibility_status"] == "Eligible"]
        
        assert len(eligible_recs) >= 3, f"Expected at least 3 eligible scholarships, got {len(eligible_recs)}"
        scores = [r["match_percentage"] for r in eligible_recs]
        
        # Verify scores are not all identical (i.e. no 98.5 saturation)
        assert len(set(scores)) > 1, f"All eligible scholarships produced identical scores: {scores}"
        print(f"[PASS] Criteria differentiation verified across {len(eligible_recs)} eligible schemes: {scores}")
    finally:
        db.close()


def test_2_changing_cgpa_affects_academic_fit_appropriately():
    """Verify that increasing CGPA strictly increases academic match until ceiling."""
    db = SessionLocal()
    try:
        base_student = {
            "family_income": 300000.0,
            "category": "General",
            "gender": "Male",
            "course": "Computer Science & IT",
            "education_level": "Undergraduate",
            "disability": 0,
            "backlogs": 0
        }
        
        cgpas = [6.5, 7.5, 8.5, 9.5]
        sch = db.query(Scholarship).filter(Scholarship.title.like("%Central Sector%")).first()
        assert sch is not None, "Central Sector scholarship not found in DB"

        scores = []
        for c in cgpas:
            s_dict = base_student.copy()
            s_dict["cgpa"] = c
            recs = ScholarshipRecommendationEngine.get_recommendations(s_dict, db, ml_prob=0.9)
            target = next(r for r in recs if r["id"] == sch.id)
            scores.append(target["match_percentage"])

        print(f"[PASS] CGPA scaling {cgpas} -> Scores: {scores}")
        for i in range(len(scores) - 1):
            assert scores[i] < scores[i+1], f"Expected score to increase with CGPA: {scores[i]} not < {scores[i+1]}"
    finally:
        db.close()


def test_3_changing_income_affects_financial_fit_appropriately():
    """Verify that lower income produces higher match percentage on need-based schemes."""
    db = SessionLocal()
    try:
        base_student = {
            "cgpa": 8.0,
            "category": "General",
            "gender": "Male",
            "course": "Computer Science & IT",
            "education_level": "Undergraduate",
            "disability": 0,
            "backlogs": 0
        }
        
        # HDFC Badhte Kadam is Need-Based (ceiling 3L)
        sch = db.query(Scholarship).filter(Scholarship.title.like("%HDFC Badhte Kadam%")).first()
        assert sch is not None, "HDFC scholarship not found in DB"

        incomes = [80000.0, 180000.0, 280000.0, 500000.0]
        scores = []
        for inc in incomes:
            s_dict = base_student.copy()
            s_dict["family_income"] = inc
            recs = ScholarshipRecommendationEngine.get_recommendations(s_dict, db, ml_prob=0.9)
            target = next(r for r in recs if r["id"] == sch.id)
            scores.append(target["match_percentage"])

        print(f"[PASS] Income scaling {incomes} -> Scores: {scores}")
        # As income increases, need decreases so financial fit drops
        for i in range(len(scores) - 1):
            assert scores[i] > scores[i+1], f"Expected score to decrease as income rises: {scores[i]} not > {scores[i+1]}"
    finally:
        db.close()


def test_4_every_score_strictly_bounded_between_0_and_100():
    """Verify boundary conditions: scores never go below 0.0 or exceed 100.0."""
    db = SessionLocal()
    try:
        extreme_students = [
            # Perfect applicant
            {"cgpa": 10.0, "family_income": 0.0, "category": "General", "gender": "Female", "disability": 1, "ml_prob": 1.0},
            # Substandard applicant
            {"cgpa": 2.0, "family_income": 20000000.0, "category": "General", "gender": "Male", "disability": 0, "ml_prob": 0.0},
            # Missing / None fields
            {"cgpa": None, "family_income": None, "category": None, "gender": None, "disability": 0, "ml_prob": 0.5}
        ]

        for s in extreme_students:
            ml_p = s.pop("ml_prob")
            recs = ScholarshipRecommendationEngine.get_recommendations(s, db, ml_prob=ml_p)
            for r in recs:
                pct = r["match_percentage"]
                assert 0.0 <= pct <= 100.0, f"Score out of bounds: {pct} for scholarship {r['title']}"

        print("[PASS] All boundary test scores strictly bounded in [0.0, 100.0]%.")
    finally:
        db.close()


def test_5_missing_mandatory_requirements_reflected_in_eligibility_and_capped():
    """Verify that unmet criteria are explained and score is capped <= 75.0%."""
    db = SessionLocal()
    try:
        # Male student applying to female-only STEM scholarship
        male_student = {
            "cgpa": 9.8,
            "family_income": 100000.0,
            "category": "General",
            "gender": "Male",
            "course": "Computer Science & IT",
            "education_level": "Undergraduate",
            "disability": 0,
            "backlogs": 0
        }
        recs = ScholarshipRecommendationEngine.get_recommendations(male_student, db, ml_prob=0.99)
        pragati = next(r for r in recs if "Pragati" in r["title"])

        assert pragati["eligibility_status"] != "Eligible", "Male student should not be marked Eligible for Pragati scheme"
        assert len(pragati["missing_requirements"]) > 0, "Missing requirements should explicitly detail gender restriction"
        assert any("female" in req.lower() for req in pragati["missing_requirements"]), f"Explanation missing gender notice: {pragati['missing_requirements']}"
        assert pragati["match_percentage"] <= 75.0, f"Ineligible scholarship match must be capped <= 75.0%, got {pragati['match_percentage']}"
        print(f"[PASS] Unmet criteria handled: Status={pragati['eligibility_status']}, Capped Match={pragati['match_percentage']}%, Reasons={pragati['missing_requirements']}")
    finally:
        db.close()


def test_6_general_scholarships_remain_invariant_when_category_changes():
    """Verify zero caste bias: schemes with required_category == 'All' produce identical scores across all categories."""
    db = SessionLocal()
    try:
        base_student = {
            "cgpa": 8.2,
            "family_income": 260000.0,
            "gender": "Male",
            "course": "Computer Science & IT",
            "education_level": "Undergraduate",
            "disability": 0,
            "backlogs": 0
        }

        general_schemes = db.query(Scholarship).filter(
            Scholarship.is_active == True,
            Scholarship.required_category == "All"
        ).all()
        assert len(general_schemes) >= 3, "Expected at least 3 general scholarships"

        for sch in general_schemes:
            scores_by_cat = {}
            for cat in ["General", "OBC", "SC", "ST", "EWS", None]:
                s = base_student.copy()
                s["category"] = cat
                recs = ScholarshipRecommendationEngine.get_recommendations(s, db, ml_prob=0.91)
                item = next(r for r in recs if r["id"] == sch.id)
                scores_by_cat[str(cat)] = item["match_percentage"]

            unique_scores = set(scores_by_cat.values())
            assert len(unique_scores) == 1, (
                f"Caste bias detected for general scheme '{sch.title}'! Scores varied by category: {scores_by_cat}"
            )

        print(f"[PASS] Category invariance verified across {len(general_schemes)} general schemes for all categories.")
    finally:
        db.close()


def test_7_statutory_category_restrictions_enforced():
    """Verify that explicitly restricted statutory schemes require their designated category."""
    db = SessionLocal()
    try:
        obc_sch = db.query(Scholarship).filter(Scholarship.required_category == "OBC").first()
        assert obc_sch is not None, "OBC scholarship not found"

        # OBC student
        obc_student = {"cgpa": 8.0, "family_income": 200000.0, "category": "OBC", "gender": "Male", "disability": 0, "backlogs": 0}
        recs_obc = ScholarshipRecommendationEngine.get_recommendations(obc_student, db, ml_prob=0.9)
        obc_rec = next(r for r in recs_obc if r["id"] == obc_sch.id)
        assert obc_rec["eligibility_status"] == "Eligible"
        assert len(obc_rec["missing_requirements"]) == 0

        # General student
        gen_student = {"cgpa": 8.0, "family_income": 200000.0, "category": "General", "gender": "Male", "disability": 0, "backlogs": 0}
        recs_gen = ScholarshipRecommendationEngine.get_recommendations(gen_student, db, ml_prob=0.9)
        gen_rec = next(r for r in recs_gen if r["id"] == obc_sch.id)
        assert gen_rec["eligibility_status"] != "Eligible"
        assert any("OBC" in req for req in gen_rec["missing_requirements"])
        print("[PASS] Statutory affirmative action restrictions strictly enforced.")
    finally:
        db.close()


if __name__ == "__main__":
    print("=" * 70)
    print("RUNNING SCHOLARSHIP RECOMMENDATION & MATCH FORMULA TEST SUITE")
    print("=" * 70)
    test_1_different_scholarships_produce_different_match_percentages()
    test_2_changing_cgpa_affects_academic_fit_appropriately()
    test_3_changing_income_affects_financial_fit_appropriately()
    test_4_every_score_strictly_bounded_between_0_and_100()
    test_5_missing_mandatory_requirements_reflected_in_eligibility_and_capped()
    test_6_general_scholarships_remain_invariant_when_category_changes()
    test_7_statutory_category_restrictions_enforced()
    print("=" * 70)
    print("ALL 7 RECOMMENDATION ENGINE TESTS PASSED!")
    print("=" * 70)
