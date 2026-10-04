"""
Pydantic Schemas for Hybrid Eligibility Assessment and Explainable AI
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
from backend.app.schemas.scholarship_schemas import RecommendedScholarship

class FactorDetail(BaseModel):
    factor: str
    impact: str
    description: str

class EligibilityAssessmentResponse(BaseModel):
    id: Optional[int] = None
    rule_status: str # "ELIGIBLE", "CONDITIONALLY_ELIGIBLE", "NOT_ELIGIBLE"
    ml_probability: float
    ml_percentage: float
    hybrid_score: float
    final_verdict: str
    explanation: Dict[str, Any]
    positive_factors: List[FactorDetail]
    negative_factors: List[FactorDetail]
    improvement_tips: List[str]
    rule_checks: Dict[str, Any]
    top_recommendations: List[RecommendedScholarship]
    assessed_at: datetime

    class Config:
        from_attributes = True

class EligibilityHistoryItem(BaseModel):
    id: int
    rule_status: str
    ml_probability: float
    hybrid_score: float
    final_verdict: str
    created_at: datetime

    class Config:
        from_attributes = True
