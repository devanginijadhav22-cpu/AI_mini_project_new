"""
Scholarship Recommendation Engine
Calculates transparent, bounded, multidimensional match scores (0.0 to 100.0%)
and ranks active scholarships for a student based on:
1. Machine Learning Profile Readiness (35% weight: 0.0 - 35.0 pts)
2. Academic Fit Relative to Published Criteria (35% weight: 0.0 - 35.0 pts)
3. Financial Need & Scheme Purpose Alignment (20% weight: 0.0 - 20.0 pts)
4. Statutory Quota & Affirmative Action Eligibility (10% weight: 0.0 - 10.0 pts)

Guarantees:
- Category Independence: General scholarships (required_category == 'All') receive
  equal statutory alignment (10.0 pts) across all categories, ensuring zero caste bias.
- Continuous Differentiation: Students who exceed minimum requirements receive
  meaningfully differentiated scores based on actual margin of surplus and scheme purpose.
- Strict Rule Distinction: High match percentages cannot override mandatory criteria;
  missing prerequisites are evaluated via the symbolic rule engine and penalized accordingly.
- Score Boundedness: Every final score is strictly clamped to [0.0, 100.0]%.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.database.models import Scholarship
from backend.app.services.rule_engine import RuleBasedExpertSystem

class ScholarshipRecommendationEngine:
    @staticmethod
    def get_recommendations(student_dict: dict, db: Session, ml_prob: float = 0.8) -> List[Dict[str, Any]]:
        """
        Scans all active scholarships, checks individual criteria via rule engine,
        computes transparent multidimensional match %, and returns them sorted by relevance.
        """
        scholarships = db.query(Scholarship).filter(Scholarship.is_active == True).all()
        recommendations = []

        raw_cgpa = student_dict.get("cgpa")
        cgpa = float(raw_cgpa) if raw_cgpa is not None else 0.0

        raw_income = student_dict.get("family_income")
        income = float(raw_income) if raw_income is not None else 1000000.0

        raw_cat = student_dict.get("category")
        category = str(raw_cat).strip() if raw_cat is not None and str(raw_cat).strip().lower() not in ["none", "null", ""] else None

        raw_gender = student_dict.get("gender")
        gender = str(raw_gender).strip() if raw_gender is not None else "Male"

        raw_course = student_dict.get("course")
        course = str(raw_course).strip() if raw_course is not None else ""

        raw_disability = student_dict.get("disability")
        disability = int(raw_disability) if raw_disability is not None else 0

        # Bounded ML probability
        clamped_ml_prob = max(0.0, min(1.0, float(ml_prob or 0.0)))

        for s in scholarships:
            eval_res = RuleBasedExpertSystem.evaluate_scholarship_specific(student_dict, s)
            missing = eval_res["missing_requirements"]

            # -------------------------------------------------------------
            # Sub-score 1: ML Profile Strength (35% Weight: 0.0 - 35.0 pts)
            # Holistic demographic-free readiness based on 24 trained features
            # -------------------------------------------------------------
            ml_component = clamped_ml_prob * 35.0

            # -------------------------------------------------------------
            # Sub-score 2: Academic Fit (35% Weight: 0.0 - 35.0 pts)
            # Evaluates student CGPA against the scholarship's published min_cgpa
            # -------------------------------------------------------------
            min_cgpa = float(getattr(s, "min_cgpa", 6.0) or 6.0)
            if cgpa >= min_cgpa:
                # Student meets the minimum qualification: baseline = 20.0 pts
                # Additional merit scaled over headroom from min_cgpa towards 10.0: up to 15.0 pts
                headroom = max(10.0 - min_cgpa, 0.5)
                surplus = min(max(cgpa - min_cgpa, 0.0), headroom)
                academic_component = 20.0 + (surplus / headroom) * 15.0
            else:
                # Below minimum qualification: proportional reduction based on deficit
                deficit_ratio = (min_cgpa - cgpa) / max(min_cgpa, 1.0)
                academic_component = max(0.0, 20.0 - (deficit_ratio * 40.0))

            # -------------------------------------------------------------
            # Sub-score 3: Financial Need & Scheme Alignment (20% Weight: 0.0 - 20.0 pts)
            # Evaluates family income against published income ceiling and scheme purpose
            # -------------------------------------------------------------
            max_income = float(getattr(s, "max_income", 800000.0) or 800000.0)
            sch_cat = str(getattr(s, "category", "General") or "General")

            if income <= max_income:
                need_ratio = max(0.0, min(1.0, (max_income - income) / max(max_income, 1.0)))
                if sch_cat == "Merit":
                    # For pure merit schemes with high ceilings, qualifying earns higher base
                    financial_component = 15.0 + (need_ratio * 5.0)
                else:
                    # For Need-Based, Merit-cum-Means, and Rural Upliftment schemes,
                    # greater relative financial need earns higher fit
                    financial_component = 10.0 + (need_ratio * 10.0)
            else:
                # Exceeds published income ceiling
                excess_ratio = (income - max_income) / max(max_income, 1.0)
                financial_component = max(0.0, 10.0 - (excess_ratio * 25.0))

            # -------------------------------------------------------------
            # Sub-score 4: Statutory & Affirmative Action Alignment (10% Weight: 0.0 - 10.0 pts)
            # Strictly respects category independence for General schemes
            # -------------------------------------------------------------
            req_cat = getattr(s, "required_category", "All") or "All"

            if sch_cat == "Disability / PwD":
                statutory_component = 10.0 if disability == 1 else 0.0
            elif req_cat == "All":
                # General scholarship: Category-independent guarantee (10.0 pts for all)
                statutory_component = 10.0
            elif req_cat == "Female":
                statutory_component = 10.0 if gender == "Female" else 0.0
            elif req_cat in ["SC", "ST", "OBC", "EWS"]:
                if category == req_cat:
                    statutory_component = 10.0
                elif category in [None, "", "Not Specified"]:
                    statutory_component = 5.0  # Provisional pending verification
                else:
                    statutory_component = 0.0
            else:
                statutory_component = 10.0

            # Course / Discipline alignment refinement within statutory component if specified
            req_courses = getattr(s, "required_courses", "All") or "All"
            if req_courses != "All" and course:
                matched_course = any(c.strip().lower() in course.lower() for c in req_courses.split(","))
                if not matched_course:
                    # Minor discount if course outside primary target
                    statutory_component = max(0.0, statutory_component - 3.0)

            total_raw_match = ml_component + academic_component + financial_component + statutory_component

            # -------------------------------------------------------------
            # Distinction Between Eligibility and Match:
            # Unmet mandatory prerequisites incur a structured deduction
            # and cap the score below the qualified threshold (<= 75.0%)
            # -------------------------------------------------------------
            if len(missing) > 0:
                penalty = len(missing) * 15.0
                final_match = max(min(total_raw_match - penalty, 75.0), 10.0)
            else:
                # Fully eligible: smooth score up to 100.0 without arbitrary 98.5 cap
                final_match = min(max(total_raw_match, 0.0), 100.0)

            # Parse required documents
            doc_list = [d.strip() for d in s.required_documents.split(",") if d.strip()]

            recommendations.append({
                "id": s.id,
                "title": s.title,
                "provider": s.provider,
                "amount": s.amount,
                "deadline": s.deadline,
                "category": s.category,
                "match_percentage": round(final_match, 1),
                "eligibility_status": eval_res["status"],
                "ml_probability": round(clamped_ml_prob, 3),
                "missing_requirements": missing,
                "required_documents": doc_list,
                "description": s.description
            })

        # Sort recommendations by match percentage descending
        recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)
        return recommendations
