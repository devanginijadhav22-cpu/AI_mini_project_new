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
    unique_applicants: Optional[int] = 0
    eligible_students_count: int
    average_eligibility_score: float
    pending_applications: int
    under_review_applications: Optional[int] = 0
    needs_info_applications: Optional[int] = 0
    approved_applications: int
    rejected_applications: Optional[int] = 0

class AnalyticsData(BaseModel):
    eligibility_distribution: List[Dict[str, Any]]
    applications_by_scholarship: List[Dict[str, Any]]
    category_distribution: List[Dict[str, Any]]
    income_brackets: List[Dict[str, Any]]
    academic_performance_distribution: List[Dict[str, Any]]
    model_prediction_distribution: List[Dict[str, Any]]
    metadata: Optional[Dict[str, Any]] = None
    calibration: Optional[Dict[str, Any]] = None

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
    category: Optional[str] = None
    education_level: Optional[str] = None
    course: Optional[str] = None
    cgpa: Optional[float] = None
    family_income: Optional[float] = None
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
    scholarship_category: Optional[str] = None
    provider: Optional[str] = None
    amount: float
    status: str
    applied_at: datetime
    score_at_application: float
    match_score: Optional[float] = None
    eligibility_result_id: Optional[int] = None
    required_category: Optional[str] = "All"
    remarks: Optional[str] = None
    decision_remarks: Optional[str] = None
    reviewer_id: Optional[int] = None
    reviewer_name: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    award_status: Optional[str] = "NOT_AWARDED"
    disbursed_at: Optional[datetime] = None
    disbursement_reference: Optional[str] = None
    documents_count: Optional[int] = 0

    class Config:
        from_attributes = True

class StatusUpdateRequest(BaseModel):
    status: str  # "UNDER_REVIEW", "NEEDS_INFORMATION", "APPROVED", "REJECTED"
    remarks: Optional[str] = None  # Mandatory for APPROVED, REJECTED, NEEDS_INFORMATION

class DocumentStatusUpdateRequest(BaseModel):
    verification_status: str  # "VERIFIED", "NEEDS_CORRECTION", "REJECTED", "PENDING"
    admin_remarks: Optional[str] = None

class DisbursementRequest(BaseModel):
    disbursement_reference: str
    disbursement_notes: Optional[str] = None

class AwardApplicantView(BaseModel):
    application_id: int
    student_id: int
    student_name: str
    student_email: str
    scholarship_id: int
    scholarship_title: str
    amount: float
    status: str
    award_status: str
    decision_remarks: Optional[str] = None
    decision_date: Optional[datetime] = None
    reviewer_name: Optional[str] = None
    disbursed_at: Optional[datetime] = None
    disbursement_reference: Optional[str] = None
    disbursement_notes: Optional[str] = None

    class Config:
        from_attributes = True
