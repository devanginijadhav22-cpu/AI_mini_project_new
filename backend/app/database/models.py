"""
Relational Database Models for Scholarship Eligibility System
"""

import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, Text, ForeignKey, DateTime, Enum
)
from sqlalchemy.orm import relationship
from backend.app.database.connection import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(120), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(120), nullable=False)
    role = Column(String(20), default="STUDENT", nullable=False) # "STUDENT", "ADMIN"
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    # Relationships
    profile = relationship("StudentProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    academic_record = relationship("AcademicRecord", back_populates="user", uselist=False, cascade="all, delete-orphan")
    financial_record = relationship("FinancialRecord", back_populates="user", uselist=False, cascade="all, delete-orphan")
    achievements = relationship("AchievementRecord", back_populates="user", uselist=False, cascade="all, delete-orphan")
    applications = relationship("Application", back_populates="user", cascade="all, delete-orphan")
    eligibility_results = relationship("EligibilityResult", back_populates="user", cascade="all, delete-orphan")
    documents = relationship("StudentDocument", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")


class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    # All fields are nullable — None means the student has NOT filled this in yet
    age = Column(Integer, nullable=True)
    gender = Column(String(20), nullable=True)
    phone = Column(String(20), nullable=True)
    state = Column(String(50), nullable=True)
    city = Column(String(50), nullable=True)
    category = Column(String(20), nullable=True)  # General, OBC, SC, ST, EWS
    disability = Column(Integer, default=0)       # 0 or 1 — can default to 0
    rural_urban = Column(String(20), nullable=True)  # Rural, Semi-Urban, Urban
    first_generation = Column(Integer, default=0)    # 0 or 1 — can default to 0
    institution_type = Column(String(50), nullable=True)
    hostel_day_scholar = Column(String(20), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="profile")


class AcademicRecord(Base):
    __tablename__ = "academic_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    # Nullable — only set when student fills the form
    education_level = Column(String(50), nullable=True)   # Undergraduate, Postgraduate, Diploma, Doctorate
    course = Column(String(100), nullable=True)
    year_of_study = Column(Integer, nullable=True)
    cgpa = Column(Float, nullable=True)
    percentage = Column(Float, nullable=True)
    backlogs = Column(Integer, default=0)         # can default 0
    attendance = Column(Float, nullable=True)
    previous_scholarship = Column(Integer, default=0)  # can default 0
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="academic_record")


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    family_income = Column(Float, nullable=True)
    family_size = Column(Integer, nullable=True)
    parent_occupation = Column(String(80), nullable=True)
    earning_members = Column(Integer, nullable=True)
    financial_dependency = Column(String(40), nullable=True)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="financial_record")


class AchievementRecord(Base):
    __tablename__ = "achievement_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    sports_achievement = Column(String(50), nullable=True)    # None, District, State, National
    academic_achievement = Column(String(50), nullable=True)  # None, School/College Topper, Olympiad/Merit, Research/Published
    extracurricular_score = Column(Integer, default=5)        # 1-10
    certifications_count = Column(Integer, default=0)
    leadership_experience = Column(Boolean, default=False)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

    user = relationship("User", back_populates="achievements")


class Scholarship(Base):
    __tablename__ = "scholarships"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(200), nullable=False, index=True)
    provider = Column(String(150), nullable=False)
    description = Column(Text, nullable=False)
    amount = Column(Float, nullable=False)  # in INR
    deadline = Column(String(50), nullable=False)
    category = Column(String(100), default="Merit-cum-Means")

    # Eligibility Constraints for Rule Engine
    min_cgpa = Column(Float, default=6.0)
    max_income = Column(Float, default=800000.0)
    max_backlogs = Column(Integer, default=1)
    min_attendance = Column(Float, default=65.0)
    required_category = Column(String(50), default="All")  # All, SC, ST, OBC, EWS, Female
    required_education_level = Column(String(50), default="All")
    required_courses = Column(String(255), default="All")
    required_documents = Column(Text, default="Income Certificate, Marksheet, Identity Proof")
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    applications = relationship("Application", back_populates="scholarship", cascade="all, delete-orphan")
    criteria = relationship("ScholarshipCriterion", back_populates="scholarship", cascade="all, delete-orphan")


class ScholarshipCriterion(Base):
    __tablename__ = "scholarship_criteria"

    id = Column(Integer, primary_key=True, index=True)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id", ondelete="CASCADE"), nullable=False)
    field_name = Column(String(50), nullable=False)  # e.g. "cgpa", "family_income"
    operator = Column(String(10), default=">=")      # ">=", "<=", "==", "in"
    threshold_value = Column(String(100), nullable=False)
    is_mandatory = Column(Boolean, default=True)
    description = Column(String(255), nullable=True)

    scholarship = relationship("Scholarship", back_populates="criteria")


class Application(Base):
    __tablename__ = "applications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    scholarship_id = Column(Integer, ForeignKey("scholarships.id", ondelete="CASCADE"), nullable=False)
    status = Column(String(30), default="PENDING")  # PENDING, UNDER_REVIEW, APPROVED, REJECTED
    applied_at = Column(DateTime, default=datetime.datetime.utcnow)
    score_at_application = Column(Float, default=0.0)
    remarks = Column(Text, nullable=True)

    user = relationship("User", back_populates="applications")
    scholarship = relationship("Scholarship", back_populates="applications")


class EligibilityResult(Base):
    __tablename__ = "eligibility_results"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    rule_status = Column(String(50), nullable=False)  # "ELIGIBLE", "CONDITIONALLY_ELIGIBLE", "NOT_ELIGIBLE"
    ml_probability = Column(Float, nullable=False)     # e.g. 0.88
    hybrid_score = Column(Float, nullable=False)       # e.g. 86.5
    final_verdict = Column(String(50), nullable=False) # "Highly Eligible", "Eligible", etc.
    positive_factors_json = Column(Text, default="[]")
    negative_factors_json = Column(Text, default="[]")
    improvement_tips_json = Column(Text, default="[]")
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="eligibility_results")


class StudentDocument(Base):
    __tablename__ = "student_documents"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    document_type = Column(String(80), nullable=False)
    filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size_kb = Column(Float, default=0.0)
    verification_status = Column(String(30), default="VERIFIED")  # PENDING, VERIFIED, REJECTED
    uploaded_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="documents")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(30), default="INFO")  # "SUCCESS", "INFO", "WARNING", "APPLICATION"
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

    user = relationship("User", back_populates="notifications")


class ModelVersion(Base):
    __tablename__ = "model_versions"

    id = Column(Integer, primary_key=True, index=True)
    version_name = Column(String(80), nullable=False)
    model_type = Column(String(80), nullable=False)
    accuracy = Column(Float, nullable=False)
    precision = Column(Float, nullable=False)
    recall = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    is_active = Column(Boolean, default=True)
    metrics_json = Column(Text, default="{}")
    trained_at = Column(DateTime, default=datetime.datetime.utcnow)
