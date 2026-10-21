"""
Pydantic Schemas for Scholarships, Applications, and Recommendations
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class ScholarshipBase(BaseModel):
    title: str
    provider: str
    description: str
    amount: float
    deadline: str
    category: str
    min_cgpa: float = 6.0
    max_income: float = 800000.0
    max_backlogs: int = 1
    min_attendance: float = 65.0
    required_category: str = "All"
    required_education_level: str = "All"
    required_courses: str = "All"
    required_documents: str = "Income Certificate, Marksheet, Identity Proof"
    is_active: bool = True

class ScholarshipCreate(ScholarshipBase):
    pass

class ScholarshipResponse(ScholarshipBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class RecommendedScholarship(BaseModel):
    id: int
    title: str
    provider: str
    amount: float
    deadline: str
    category: str
    match_percentage: float
    eligibility_status: str # "Eligible", "Conditionally Eligible", "Not Eligible"
    ml_probability: float
    missing_requirements: List[str]
    required_documents: List[str]
    description: str
    application_id: Optional[int] = None
    application_status: Optional[str] = None
    award_status: Optional[str] = None
    decision_remarks: Optional[str] = None
    applied_at: Optional[datetime] = None
    reviewed_at: Optional[datetime] = None
    disbursed_at: Optional[datetime] = None
    disbursement_reference: Optional[str] = None
    disbursement_notes: Optional[str] = None

class ApplicationCreate(BaseModel):
    scholarship_id: int
    remarks: Optional[str] = None

class ApplicationResponse(BaseModel):
    id: int
    scholarship_id: int
    scholarship_title: str
    provider: str
    amount: float
    status: str
    applied_at: datetime
    score_at_application: float
    match_score: Optional[float] = None
    remarks: Optional[str] = None
    decision_remarks: Optional[str] = None
    reviewed_at: Optional[datetime] = None
    reviewer_name: Optional[str] = None
    award_status: Optional[str] = "NOT_AWARDED"
    disbursed_at: Optional[datetime] = None
    disbursement_reference: Optional[str] = None
    disbursement_notes: Optional[str] = None

    class Config:
        from_attributes = True

class DocumentResponse(BaseModel):
    id: int
    document_type: str
    filename: str
    file_size_kb: Optional[float] = 0.0
    verification_status: str
    admin_remarks: Optional[str] = None
    uploaded_at: datetime
    verified_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class NotificationResponse(BaseModel):
    id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
