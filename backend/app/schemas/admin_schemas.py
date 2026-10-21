"""
Pydantic Schemas for Admin Analytics and System Monitoring
"""

from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime

class AdminDashboardStats(BaseModel):
    total_students: int
    total_scholarships: int
    total_applications: int
    eligible_students_count: int
    average_eligibility_score: float
    pending_applications: int
    approved_applications: int

class AnalyticsData(BaseModel):
    eligibility_distribution: List[Dict[str, Any]]
    applications_by_scholarship: List[Dict[str, Any]]
    category_distribution: List[Dict[str, Any]]
    income_brackets: List[Dict[str, Any]]
    academic_performance_distribution: List[Dict[str, Any]]
    model_prediction_distribution: List[Dict[str, Any]]

class ModelPerformanceData(BaseModel):
    best_model: str
    selected_metric: str
    timestamp: str
    models_benchmarked: Dict[str, Any]
    feature_importance: List[Dict[str, Any]]
    total_records: int
    test_size: int
    num_features: int

class StudentSummary(BaseModel):
    id: int
    full_name: str
    email: str
    category: str
    education_level: str
    course: str
    cgpa: float
    family_income: float
    profile_completion: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ApplicationAdminView(BaseModel):
    id: int
    student_id: int
    student_name: str
    student_email: str
    scholarship_id: int
    scholarship_title: str
    amount: float
    status: str
    applied_at: datetime
    score_at_application: float
    required_category: Optional[str] = "All"
    remarks: Optional[str] = None

    class Config:
        from_attributes = True

class StatusUpdateRequest(BaseModel):
    status: str # "APPROVED", "REJECTED", "UNDER_REVIEW"
    remarks: Optional[str] = None
