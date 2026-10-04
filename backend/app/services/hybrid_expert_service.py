"""
Hybrid Expert System (Rule Engine + Machine Learning Synergy)
"""

from typing import Dict, Any
from backend.app.services.rule_engine import RuleBasedExpertSystem
from backend.app.services.ml_service import MLService

class HybridExpertService:
    def __init__(self):
        self.rule_engine = RuleBasedExpertSystem()
        self.ml_service = MLService.get_instance()

    def evaluate_student(self, student_dict: dict) -> Dict[str, Any]:
        """
        Executes both Rule Engine and ML inference, then merges their outputs
        into a coherent, explainable verdict.
        """
        # 1. Rule Engine Evaluation
        rule_eval = self.rule_engine.evaluate_general_baseline(student_dict)
        rule_status = rule_eval["rule_status"] # ELIGIBLE, CONDITIONALLY_ELIGIBLE, NOT_ELIGIBLE

        # Calculate discrete Rule Compliance Score (0 - 100)
        if rule_status == "ELIGIBLE":
            rule_score = 100.0
        elif rule_status == "CONDITIONALLY_ELIGIBLE":
            rule_score = 70.0
        else:
            # Fraction of rules passed
            total_rules = max(rule_eval["total_passed"] + rule_eval["total_failed"], 1)
            rule_score = (rule_eval["total_passed"] / total_rules) * 45.0

        # 2. Machine Learning Inference & XAI
        ml_eval = self.ml_service.predict_eligibility(student_dict)
        ml_prob = ml_eval["probability"]
        ml_score = ml_prob * 100.0 # 0 - 100

        # 3. Transparent Weighted Hybrid Combination
        # Weighting: 55% ML multidimensional pattern recognition + 45% Statutory rule compliance
        ml_weight = 0.55
        rule_weight = 0.45
        hybrid_score = round((ml_weight * ml_score) + (rule_weight * rule_score), 1)

        # 4. Final Verdict Synthesis
        if rule_status == "NOT_ELIGIBLE":
            if ml_prob >= 0.65:
                final_verdict = "Conditionally Eligible (High Profile Merit, Unmet Mandatory Rule)"
            else:
                final_verdict = "Not Eligible"
        elif rule_status == "CONDITIONALLY_ELIGIBLE":
            final_verdict = "Conditionally Eligible"
        else: # rule_status == "ELIGIBLE"
            if ml_prob >= 0.75:
                final_verdict = "Highly Eligible"
            elif ml_prob >= 0.50:
                final_verdict = "Likely Eligible"
            else:
                final_verdict = "Marginally Eligible (Criteria Met, High Profile Competition)"

        # Explanation logic text for students & evaluators
        combination_rationale = (
            f"Your Hybrid Eligibility Score of {hybrid_score}/100 is derived from a 55% weight on "
            f"AI Multidimensional Profile Probability ({ml_score:.1f}%) and 45% on Strict Statutory Rule "
            f"Compliance ({rule_score:.1f}%). The Rule Engine ensures you satisfy non-negotiable legal thresholds "
            f"(backlogs, income ceilings, attendance), while the Gradient Boosting AI assesses holistic merit, "
            f"demographic equity, and peer competitiveness."
        )

        return {
            "rule_status": rule_status,
            "rule_checks": rule_eval,
            "rule_score": rule_score,
            "ml_probability": ml_prob,
            "ml_percentage": round(ml_score, 1),
            "hybrid_score": hybrid_score,
            "final_verdict": final_verdict,
            "combination_rationale": combination_rationale,
            "explanation": ml_eval["explanation"],
            "positive_factors": ml_eval["explanation"]["positive_factors"],
            "negative_factors": ml_eval["explanation"]["negative_factors"],
            "improvement_tips": ml_eval["explanation"]["improvement_tips"]
        }
