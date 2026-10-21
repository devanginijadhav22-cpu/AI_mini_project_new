"""
Pydantic Schemas for Student Profile, Academics, Financials, and Achievements
"""

from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

class StudentProfileSchema(BaseModel):
    age: int = Field(20, ge=15, le=40)
    gender: str = "Female"
    phone: Optional[str] = None
    state: str = "Maharashtra"
    city: str = "Mumbai"
    category: Optional[str] = None
    disability: int = 0
    rural_urban: str = "Urban"
    first_generation: int = 0
    institution_type: str = "Government"
    hostel_day_scholar: str = "Hosteller"

class AcademicRecordSchema(BaseModel):
    education_level: str = "Undergraduate"
    course: str = "Computer Science & IT"
    year_of_study: int = 2
    cgpa: float = Field(8.2, ge=0.0, le=10.0)
    percentage: float = Field(78.5, ge=0.0, le=100.0)
    backlogs: int = Field(0, ge=0, le=20)
    attendance: float = Field(85.0, ge=0.0, le=100.0)
    previous_scholarship: int = 0

class FinancialRecordSchema(BaseModel):
    family_income: float = Field(250000.0, ge=0.0)
    family_size: int = Field(4, ge=1, le=15)
    parent_occupation: str = "Farmer / Agriculture"
    earning_members: int = Field(1, ge=1, le=10)
    financial_dependency: str = "Both Parents"

class AchievementRecordSchema(BaseModel):
    sports_achievement: str = "None"
    academic_achievement: str = "None"
    extracurricular_score: int = Field(5, ge=1, le=10)
    certifications_count: int = 1
    leadership_experience: bool = False

class FullStudentProfileResponse(BaseModel):
    user_id: int
    full_name: str
    email: str
    profile: StudentProfileSchema
    academics: AcademicRecordSchema
    financials: FinancialRecordSchema
    achievements: AchievementRecordSchema
    profile_completion_percentage: int

    class Config:
        from_attributes = True

class AssessmentPayload(BaseModel):
    # Step 1: Personal
    age: Optional[int] = None
    gender: Optional[str] = None
    state: Optional[str] = None
    city: Optional[str] = None
    category: Optional[str] = None
    disability: Optional[int] = None
    rural_urban: Optional[str] = None
    first_generation: Optional[int] = None
    institution_type: Optional[str] = None
    hostel_day_scholar: Optional[str] = None
    
    # Step 2: Academic
    education_level: Optional[str] = None
    course: Optional[str] = None
    year_of_study: Optional[int] = None
    cgpa: Optional[float] = None
    percentage: Optional[float] = None
    backlogs: Optional[int] = None
    attendance: Optional[float] = None
    previous_scholarship: Optional[int] = None
    
    # Step 3: Financial
    family_income: Optional[float] = None
    family_size: Optional[int] = None
    parent_occupation: Optional[str] = None
    earning_members: Optional[int] = None
    financial_dependency: Optional[str] = None
    
    # Step 4: Achievements
    sports_achievement: Optional[str] = None
    academic_achievement: Optional[str] = None
    extracurricular_score: Optional[int] = None
    certifications_count: Optional[int] = None
    leadership_experience: Optional[bool] = None
