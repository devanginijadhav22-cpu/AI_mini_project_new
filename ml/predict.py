"""
Predictor Module for Scholarship Eligibility
Author: AI Mini Project Team
"""

import os
import joblib
import pandas as pd
import numpy as np
from ml.feature_engineering import (
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    engineer_features
)
from ml.explain_prediction import ScholarshipExplainer

MODELS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "models")

class ScholarshipPredictor:
    def __init__(self):
        self.model = None
        self.preprocessor = None
        self.explainer = ScholarshipExplainer()
        self.load_artifacts()
        
    def load_artifacts(self):
        model_path = os.path.join(MODELS_DIR, "trained_model.pkl")
        prep_path = os.path.join(MODELS_DIR, "preprocessor.pkl")
        
        if os.path.exists(model_path) and os.path.exists(prep_path):
            self.model = joblib.load(model_path)
            self.preprocessor = joblib.load(prep_path)
            print("ML Model and Preprocessor loaded successfully.")
        else:
            print("Warning: Model artifacts not found. Please train models first.")
            
    def predict_single(self, student_dict: dict):
        """
        Takes raw dictionary of student features, applies preprocessing,
        computes probability of eligibility, and generates explainability factors.
        """
        if self.model is None or self.preprocessor is None:
            self.load_artifacts()
            if self.model is None:
                raise RuntimeError("ML model not initialized. Run training first.")
                
        # Format as single-row DataFrame
        df = pd.DataFrame([student_dict])
        
        # Apply feature engineering
        df_engineered = engineer_features(df)
        
        # Transform using fitted preprocessor
        X_trans = self.preprocessor.transform(df_engineered)
        
        # Predict probability
        if hasattr(self.model, "predict_proba"):
            prob = float(self.model.predict_proba(X_trans)[0][1])
        else:
            decision = float(self.model.decision_function(X_trans)[0])
            prob = float(1 / (1 + np.exp(-decision)))
            
        prediction = int(prob >= 0.5)
        
        # Generate XAI explanation
        explanation = self.explainer.explain(student_dict, prob)
        
        return {
            "prediction": prediction,
            "probability": round(prob, 4),
            "percentage": round(prob * 100, 1),
            "verdict": "Likely Eligible" if prob >= 0.65 else ("Conditionally Eligible" if prob >= 0.45 else "Unlikely Eligible"),
            "explanation": explanation
        }

if __name__ == "__main__":
    predictor = ScholarshipPredictor()
    sample_student = {
        "student_id": "TEST_001",
        "age": 20,
        "gender": "Female",
        "state": "Maharashtra",
        "category": "OBC",
        "disability": 0,
        "rural_urban": "Semi-Urban",
        "first_generation": 1,
        "education_level": "Undergraduate",
        "course": "Computer Science & IT",
        "year": 3,
        "cgpa": 8.75,
        "percentage": 83.5,
        "backlogs": 0,
        "attendance": 88.0,
        "institution_type": "Government",
        "family_income": 220000,
        "family_size": 4,
        "parent_occupation": "Farmer / Agriculture",
        "earning_members": 1,
        "financial_dependency": "Both Parents",
        "sports_achievement": "District",
        "academic_achievement": "School/College Topper",
        "extracurricular_score": 8,
        "previous_scholarship": 0
    }
    
    result = predictor.predict_single(sample_student)
    print("\nSample Student Test Result:")
    print(f"ML Eligibility Probability: {result['percentage']}% ({result['verdict']})")
    print(f"Positive Factors: {len(result['explanation']['positive_factors'])}")
    for f in result['explanation']['positive_factors']:
        print(f"  + {f['factor']} ({f['impact']})")
    print(f"Negative Factors: {len(result['explanation']['negative_factors'])}")
    for f in result['explanation']['negative_factors']:
        print(f"  - {f['factor']} ({f['impact']})")
