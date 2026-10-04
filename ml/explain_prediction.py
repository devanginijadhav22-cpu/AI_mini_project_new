"""
Explainable AI (XAI) Service for Scholarship Eligibility
Deconstructs student feature impact into:
1. Positive factors ("Why am I eligible?")
2. Negative factors / Areas for improvement ("What can I improve?")
"""

import os
import joblib
import numpy as np
import pandas as pd
from ml.feature_engineering import engineer_features, CATEGORICAL_FEATURES, NUMERICAL_FEATURES

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

class ScholarshipExplainer:
    def __init__(self):
        self.preprocessor = None
        self.feature_names = None
        self.rf_model = None
        self._load()
        
    def _load(self):
        prep_path = os.path.join(MODELS_DIR, "preprocessor.pkl")
        fn_path = os.path.join(MODELS_DIR, "feature_names.pkl")
        rf_path = os.path.join(MODELS_DIR, "rf_explainer_model.pkl")
        
        if os.path.exists(prep_path):
            self.preprocessor = joblib.load(prep_path)
        if os.path.exists(fn_path):
            self.feature_names = joblib.load(fn_path)
        if os.path.exists(rf_path):
            self.rf_model = joblib.load(rf_path)
            
    def explain(self, student_data: dict, ml_probability: float):
        """
        Analyzes the student's attributes against academic-financial thresholds
        and returns structured positive and negative explanatory factors.
        """
        positive_factors = []
        negative_factors = []
        
        # 1. Academic Performance
        cgpa = float(student_data.get("cgpa", 0.0))
        percentage = float(student_data.get("percentage", 0.0))
        backlogs = int(student_data.get("backlogs", 0))
        attendance = float(student_data.get("attendance", 0.0))
        
        if cgpa >= 8.5:
            positive_factors.append({
                "factor": "Outstanding Academic CGPA",
                "impact": "High Positive",
                "description": f"Your CGPA of {cgpa:.2f}/10.0 places you in the top tier of merit candidates."
            })
        elif cgpa >= 7.0:
            positive_factors.append({
                "factor": "Solid Academic Performance",
                "impact": "Moderate Positive",
                "description": f"Your CGPA of {cgpa:.2f} satisfies requirements for most general scholarships."
            })
        else:
            negative_factors.append({
                "factor": "CGPA Below Optimal Merit Threshold",
                "impact": "Negative",
                "description": f"A CGPA of {cgpa:.2f} restricts access to high-competition merit scholarships (target 7.5+)."
            })
            
        if backlogs == 0:
            positive_factors.append({
                "factor": "Clean Academic Record (Zero Backlogs)",
                "impact": "Positive",
                "description": "No active backlogs ensures seamless compliance with strict government norms."
            })
        else:
            negative_factors.append({
                "factor": f"Active Backlogs ({backlogs})",
                "impact": "Strong Negative",
                "description": f"Having {backlogs} backlog(s) may disqualify you from premier scholarship schemes."
            })
            
        if attendance >= 80.0:
            positive_factors.append({
                "factor": "High Institutional Attendance",
                "impact": "Positive",
                "description": f"Attendance record of {attendance:.1f}% demonstrates ongoing institutional discipline."
            })
        elif attendance < 70.0:
            negative_factors.append({
                "factor": "Low Attendance Record",
                "impact": "Moderate Negative",
                "description": f"Attendance is {attendance:.1f}%. Many sponsors require at least 75% verified attendance."
            })

        # 2. Socioeconomic & Financial Factors
        income = float(student_data.get("family_income", 1000000))
        family_size = int(student_data.get("family_size", 4))
        earning_members = int(student_data.get("earning_members", 1))
        
        per_capita = income / max(family_size, 1)
        
        if income <= 250000:
            positive_factors.append({
                "factor": "High Need-Based Eligibility",
                "impact": "High Positive",
                "description": f"Annual family income of ₹{income:,.0f} falls within priority brackets for full fee waivers."
            })
        elif income <= 600000:
            positive_factors.append({
                "factor": "Eligible for Mid-Income Subsidies",
                "impact": "Moderate Positive",
                "description": f"Family income of ₹{income:,.0f} complies with standard state scholarship ceilings (≤ ₹6 Lakhs)."
            })
        elif income > 800000:
            negative_factors.append({
                "factor": "Family Income Exceeds EWS/Need Thresholds",
                "impact": "Strong Negative",
                "description": f"Annual income of ₹{income:,.0f} exceeds ceilings for need-based programs (focus on pure merit awards)."
            })
            
        if family_size >= 5 and earning_members == 1:
            positive_factors.append({
                "factor": "Significant Household Dependency Ratio",
                "impact": "Positive",
                "description": f"Single earner supporting {family_size} members increases socioeconomic priority."
            })

        # 3. Inclusivity & Diversity
        category = str(student_data.get("category", "General"))
        disability = int(student_data.get("disability", 0))
        first_gen = int(student_data.get("first_generation", 0))
        rural_urban = str(student_data.get("rural_urban", "Urban"))
        
        if category in ["SC", "ST", "OBC", "EWS"]:
            positive_factors.append({
                "factor": f"Reservation Category Consideration ({category})",
                "impact": "Positive",
                "description": f"Eligible for targeted Central/State ministry affirmative quotas for {category} scholars."
            })
            
        if disability == 1:
            positive_factors.append({
                "factor": "Persons with Disabilities (PwD) Priority Quota",
                "impact": "High Positive",
                "description": "Eligible for dedicated PwD financial aid programs with reduced threshold criteria."
            })
            
        if first_gen == 1:
            positive_factors.append({
                "factor": "First-Generation Higher Education Learner",
                "impact": "Positive",
                "description": "Qualifies for special social equity foundation grants for first-generation students."
            })
            
        if rural_urban == "Rural":
            positive_factors.append({
                "factor": "Rural Regional Demographics",
                "impact": "Positive",
                "description": "Scores positively on regional diversity upliftment indices."
            })

        # 4. Achievements & Extracurriculars
        sports = str(student_data.get("sports_achievement", "None"))
        academic = str(student_data.get("academic_achievement", "None"))
        ec_score = int(student_data.get("extracurricular_score", 1))
        
        if sports in ["State", "National"]:
            positive_factors.append({
                "factor": f"Excellence in Sports ({sports} Level)",
                "impact": "High Positive",
                "description": f"{sports}-level athletic achievements unlock sports quota endowments."
            })
            
        if academic in ["School/College Topper", "Olympiad/Merit", "Research/Published"]:
            positive_factors.append({
                "factor": f"Academic Distinction ({academic})",
                "impact": "High Positive",
                "description": f"Recognized honors significantly amplify competitive ranking."
            })
            
        # Recommendations for Improvement
        improvement_tips = []
        if backlogs > 0:
            improvement_tips.append("Clear pending backlogs in the upcoming examination cycle to unlock 100% of merit awards.")
        if cgpa < 8.0:
            improvement_tips.append("Aim for an 8.0+ CGPA in the current semester to qualify for tier-1 national foundation grants.")
        if attendance < 75.0:
            improvement_tips.append("Improve attendance above 75% to ensure administrative verification approval.")
        if sports == "None" and academic == "None" and ec_score < 6:
            improvement_tips.append("Participate in co-curricular hackathons, state competitions, or certifications to enhance profile strength.")
        if int(student_data.get("previous_scholarship", 0)) == 0:
            improvement_tips.append("Ensure official Income & Category certificates are renewed and digitally verified on DigiLocker.")
            
        return {
            "ml_probability": round(ml_probability, 4),
            "ml_percentage": round(ml_probability * 100, 1),
            "positive_factors": positive_factors,
            "negative_factors": negative_factors,
            "improvement_tips": improvement_tips
        }
