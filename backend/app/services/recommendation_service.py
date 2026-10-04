"""
Scholarship Recommendation Engine
Calculates match percentage, verifies missing prerequisites, and ranks scholarships.
"""

from typing import List, Dict, Any
from sqlalchemy.orm import Session
from backend.app.database.models import Scholarship
from backend.app.services.rule_engine import RuleBasedExpertSystem

class ScholarshipRecommendationEngine:
    @staticmethod
    def get_recommendations(student_dict: dict, db: Session, ml_prob: float = 0.8) -> List[Dict[str, Any]]:
        """
        Scans all active scholarships, checks individual criteria,
        computes multidimensional match %, and returns them sorted by relevance.
        """
        scholarships = db.query(Scholarship).filter(Scholarship.is_active == True).all()
        recommendations = []

        cgpa = float(student_dict.get("cgpa", 0.0))
        income = float(student_dict.get("family_income", 1000000.0))
        category = str(student_dict.get("category", "General"))
        gender = str(student_dict.get("gender", "Male"))
        backlogs = int(student_dict.get("backlogs", 0))
        education_level = str(student_dict.get("education_level", "Undergraduate"))

        for s in scholarships:
            eval_res = RuleBasedExpertSystem.evaluate_scholarship_specific(student_dict, s)
            missing = eval_res["missing_requirements"]

            # Compute Match Score (0 - 100%)
            # Base match starts with ML profile strength (50% weight)
            base_match = ml_prob * 50.0

            # Academic Fit (25% weight): CGPA vs min_cgpa
            if cgpa >= s.min_cgpa:
                merit_ratio = min((cgpa / max(s.min_cgpa, 1.0)), 1.25)
                academic_match = min(merit_ratio * 25.0, 25.0)
            else:
                deficit = (s.min_cgpa - cgpa) / max(s.min_cgpa, 1.0)
                academic_match = max(25.0 - (deficit * 40.0), 0.0)

            # Socioeconomic Fit (15% weight): Income vs max_income
            if income <= s.max_income:
                financial_match = 15.0
            else:
                excess_ratio = (income - s.max_income) / max(s.max_income, 1.0)
                financial_match = max(15.0 - (excess_ratio * 20.0), 0.0)

            # Category & Discipline Fit (10% weight)
            category_match = 10.0
            if s.required_category != "All":
                if s.required_category == "Female" and gender != "Female":
                    category_match = 0.0
                elif s.required_category in ["SC", "ST", "OBC", "EWS"] and category != s.required_category:
                    category_match = 0.0

            total_raw_match = base_match + academic_match + financial_match + category_match

            # Penalty for missing hard criteria
            if len(missing) > 0:
                penalty = len(missing) * 12.0
                final_match = max(total_raw_match - penalty, 15.0)
            else:
                final_match = min(total_raw_match, 98.5)

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
                "ml_probability": round(ml_prob, 3),
                "missing_requirements": missing,
                "required_documents": doc_list,
                "description": s.description
            })

        # Sort recommendations by match percentage descending
        recommendations.sort(key=lambda x: x["match_percentage"], reverse=True)
        return recommendations
