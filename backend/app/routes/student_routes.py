"""
Student Profile and Dashboard Routes
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.database.models import (
    User, StudentProfile, AcademicRecord, FinancialRecord, AchievementRecord,
    Application, EligibilityResult, Scholarship
)
from backend.app.schemas.student_schemas import (
    FullStudentProfileResponse, StudentProfileSchema, AcademicRecordSchema,
    FinancialRecordSchema, AchievementRecordSchema
)
from backend.app.auth.jwt_handler import require_role
from backend.app.services.rule_engine import RuleBasedExpertSystem
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/student", tags=["Student"])

# Required fields per section - a section is only "filled" when these have real values
REQUIRED_PERSONAL_FIELDS   = ["state", "city", "gender", "age"]
REQUIRED_ACADEMIC_FIELDS   = ["education_level", "course", "year_of_study", "cgpa", "attendance"]
REQUIRED_FINANCIAL_FIELDS  = ["family_income", "family_size", "parent_occupation", "earning_members"]
REQUIRED_ACHIEVEMENT_FIELDS = ["sports_achievement", "academic_achievement"]

def _section_filled(obj, required_fields: list) -> bool:
    """Returns True only if the record exists AND all required fields have meaningful values."""
    if obj is None:
        return False
    for field in required_fields:
        val = getattr(obj, field, None)
        if val is None:
            return False
        if isinstance(val, str) and val.strip() == "":
            return False
        # Numeric fields that must be > 0
        if field in ("cgpa", "attendance", "family_income") and isinstance(val, (int, float)) and val <= 0:
            return False
        if field == "age" and isinstance(val, int) and val <= 0:
            return False
    return True


def calculate_completion(profile, academics, financials, achievements) -> int:
    """
    Returns profile completion percentage (0-100).
    Each of the 4 sections contributes 25%.
    A section counts ONLY when all required fields have real, non-empty values.
    """
    score = 0
    if _section_filled(profile, REQUIRED_PERSONAL_FIELDS):
        score += 25
    if _section_filled(academics, REQUIRED_ACADEMIC_FIELDS):
        score += 25
    if _section_filled(financials, REQUIRED_FINANCIAL_FIELDS):
        score += 25
    if _section_filled(achievements, REQUIRED_ACHIEVEMENT_FIELDS):
        score += 25
    return score


def is_profile_complete(profile, academics, financials, achievements) -> bool:
    return calculate_completion(profile, academics, financials, achievements) == 100


def get_missing_details(profile, academics, financials, achievements):
    """
    Returns (missing_sections, missing_fields) detailing exactly which
    sections and fields are missing for partial completion routing.
    """
    missing_sections = []
    missing_fields = {}

    def check(obj, fields, sec_name):
        missing = []
        if obj is None:
            missing = list(fields)
        else:
            for f in fields:
                val = getattr(obj, f, None)
                if val is None or (isinstance(val, str) and val.strip() == ""):
                    missing.append(f)
                elif f in ("cgpa", "attendance", "family_income") and isinstance(val, (int, float)) and val <= 0:
                    missing.append(f)
                elif f == "age" and isinstance(val, int) and val <= 0:
                    missing.append(f)
        if missing:
            missing_sections.append(sec_name)
            missing_fields[sec_name] = missing

    check(profile, REQUIRED_PERSONAL_FIELDS, "personal")
    check(academics, REQUIRED_ACADEMIC_FIELDS, "academic")
    check(financials, REQUIRED_FINANCIAL_FIELDS, "financial")
    check(achievements, REQUIRED_ACHIEVEMENT_FIELDS, "achievements")
    return missing_sections, missing_fields


@router.get("/profile")
def get_profile(payload: dict = Depends(require_role(["STUDENT", "ADMIN"])), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="Student not found")

    profile      = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    academics    = db.query(AcademicRecord).filter(AcademicRecord.user_id == user_id).first()
    financials   = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).first()
    achievements = db.query(AchievementRecord).filter(AchievementRecord.user_id == user_id).first()

    completion = calculate_completion(profile, academics, financials, achievements)
    complete   = (completion == 100)
    missing_sections, missing_fields = get_missing_details(profile, academics, financials, achievements)

    # IMPORTANT: Return actual DB values — do NOT fall back to hardcoded defaults.
    # Null values tell the frontend the profile is truly incomplete.
    return {
        "user_id": user.id,
        "full_name": user.full_name,
        "email": user.email,
        "profile": {
            "age":               profile.age if profile else None,
            "gender":            profile.gender if profile else None,
            "phone":             profile.phone if profile else None,
            "state":             profile.state if profile else None,
            "city":              profile.city if profile else None,
            "category":          profile.category if profile else None,
            "disability":        profile.disability if profile else 0,
            "rural_urban":       profile.rural_urban if profile else None,
            "first_generation":  profile.first_generation if profile else 0,
            "institution_type":  profile.institution_type if profile else None,
            "hostel_day_scholar": profile.hostel_day_scholar if profile else None,
        },
        "academics": {
            "education_level":     academics.education_level if academics else None,
            "course":              academics.course if academics else None,
            "year_of_study":       academics.year_of_study if academics else None,
            "cgpa":                academics.cgpa if academics else None,
            "percentage":          academics.percentage if academics else None,
            "backlogs":            academics.backlogs if academics else 0,
            "attendance":          academics.attendance if academics else None,
            "previous_scholarship": academics.previous_scholarship if academics else 0,
        },
        "financials": {
            "family_income":       financials.family_income if financials else None,
            "family_size":         financials.family_size if financials else None,
            "parent_occupation":   financials.parent_occupation if financials else None,
            "earning_members":     financials.earning_members if financials else None,
            "financial_dependency": financials.financial_dependency if financials else None,
        },
        "achievements": {
            "sports_achievement":    achievements.sports_achievement if achievements else None,
            "academic_achievement":  achievements.academic_achievement if achievements else None,
            "extracurricular_score": achievements.extracurricular_score if achievements else 5,
            "certifications_count":  achievements.certifications_count if achievements else 0,
            "leadership_experience": achievements.leadership_experience if achievements else False,
        },
        "profile_completion_percentage": completion,
        "profile_is_complete": complete,
        "missing_sections": missing_sections,
        "missing_fields": missing_fields,
    }


@router.put("/profile")
def update_profile(data: dict, payload: dict = Depends(require_role(["STUDENT", "ADMIN"])), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))

    # 1. Update Personal Profile
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
    p_data = data.get("profile", {})
    for k, v in p_data.items():
        if hasattr(profile, k):
            setattr(profile, k, v)

    # 2. Update Academics
    academics = db.query(AcademicRecord).filter(AcademicRecord.user_id == user_id).first()
    if not academics:
        academics = AcademicRecord(user_id=user_id)
        db.add(academics)
    a_data = data.get("academics", {})
    for k, v in a_data.items():
        if hasattr(academics, k):
            setattr(academics, k, v)

    # 3. Update Financials
    financials = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).first()
    if not financials:
        financials = FinancialRecord(user_id=user_id)
        db.add(financials)
    f_data = data.get("financials", {})
    for k, v in f_data.items():
        if hasattr(financials, k):
            setattr(financials, k, v)

    # 4. Update Achievements
    achievements = db.query(AchievementRecord).filter(AchievementRecord.user_id == user_id).first()
    if not achievements:
        achievements = AchievementRecord(user_id=user_id)
        db.add(achievements)
    ach_data = data.get("achievements", {})
    for k, v in ach_data.items():
        if hasattr(achievements, k):
            setattr(achievements, k, v)

    db.commit()
    db.refresh(profile)
    db.refresh(academics)
    db.refresh(financials)
    db.refresh(achievements)

    completion = calculate_completion(profile, academics, financials, achievements)
    complete = (completion == 100)
    missing_sections, missing_fields = get_missing_details(profile, academics, financials, achievements)
    logger.info(f"[PROFILE UPDATE] user_id={user_id} completion={completion}%")

    return {
        "message": "Profile updated successfully",
        "profile_completion_percentage": completion,
        "profile_is_complete": complete,
        "missing_sections": missing_sections,
        "missing_fields": missing_fields,
    }


@router.get("/dashboard")
def get_student_dashboard(payload: dict = Depends(require_role(["STUDENT"])), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))

    profile      = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    academics    = db.query(AcademicRecord).filter(AcademicRecord.user_id == user_id).first()
    financials   = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).first()
    achievements = db.query(AchievementRecord).filter(AchievementRecord.user_id == user_id).first()

    completion = calculate_completion(profile, academics, financials, achievements)
    complete   = (completion == 100)
    missing_sections, missing_fields = get_missing_details(profile, academics, financials, achievements)

    # Latest Eligibility Assessment — scoped to THIS user only
    latest_result = db.query(EligibilityResult).filter(
        EligibilityResult.user_id == user_id
    ).order_by(EligibilityResult.created_at.desc()).first()

    # Applications — scoped to THIS user only
    applications    = db.query(Application).filter(Application.user_id == user_id).all()
    submitted_count = len(applications)
    pending_count   = sum(1 for a in applications if a.status in ["PENDING", "UNDER_REVIEW"])
    approved_count  = sum(1 for a in applications if a.status == "APPROVED")

    # Only calculate scholarship matches if profile is complete
    eligible_count  = 0
    potential_count = 0
    total_active    = 0

    if complete:
        scholarships = db.query(Scholarship).filter(Scholarship.is_active == True).all()
        total_active = len(scholarships)
        student_dict = {
            "cgpa":            academics.cgpa,
            "family_income":   financials.family_income,
            "backlogs":        academics.backlogs,
            "category":        profile.category,
            "gender":          profile.gender,
            "education_level": academics.education_level,
            "attendance":      academics.attendance,
        }
        for s in scholarships:
            res = RuleBasedExpertSystem.evaluate_scholarship_specific(student_dict, s)
            if res["is_eligible"]:
                eligible_count += 1
            elif len(res["missing_requirements"]) == 1:
                potential_count += 1
    else:
        total_active = db.query(Scholarship).filter(Scholarship.is_active == True).count()

    return {
        "profile_completion":           completion,
        "profile_is_complete":          complete,
        "missing_sections":             missing_sections,
        "missing_fields":               missing_fields,
        "eligible_scholarships_count":  eligible_count,
        "potential_scholarships_count": potential_count,
        "applications_submitted":       submitted_count,
        "applications_pending":         pending_count,
        "applications_approved":        approved_count,
        "latest_score":                 latest_result.hybrid_score if latest_result else None,
        "latest_verdict":               latest_result.final_verdict if latest_result else None,
        "latest_probability":           round(latest_result.ml_probability * 100, 1) if latest_result else None,
        "total_active_scholarships":    total_active,
    }
