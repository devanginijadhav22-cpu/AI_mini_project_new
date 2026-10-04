"""
Machine Learning Service for FastAPI Backend
"""

import os
import json
from ml.predict import ScholarshipPredictor

class MLService:
    _instance = None

    @classmethod
    def get_instance(cls):
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance

    def __init__(self):
        self.predictor = ScholarshipPredictor()

    def predict_eligibility(self, student_dict: dict) -> dict:
        return self.predictor.predict_single(student_dict)

    def get_model_performance(self) -> dict:
        metrics_file = os.path.join(
            os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
            "ml", "models", "model_metrics.json"
        )
        if os.path.exists(metrics_file):
            with open(metrics_file, "r") as f:
                return json.load(f)
        return {
            "best_model": "Gradient Boosting",
            "selected_metric": "F1 Score",
            "timestamp": "N/A",
            "models_benchmarked": {},
            "feature_importance": [],
            "total_records": 55000,
            "test_size": 11000,
            "num_features": 79
        }
