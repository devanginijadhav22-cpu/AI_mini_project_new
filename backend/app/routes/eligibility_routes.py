"""
Eligibility Assessment and Explainable AI Routes
"""

import json
import logging
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.database.models import (
    User, StudentProfile, AcademicRecord, FinancialRecord, AchievementRecord,
    EligibilityResult, Notification
)
from backend.app.schemas.student_schemas import AssessmentPayload
from backend.app.auth.jwt_handler import require_role
from backend.app.services.hybrid_expert_service import HybridExpertService
from backend.app.services.recommendation_service import ScholarshipRecommendationEngine
from backend.app.routes.student_routes import calculate_completion, is_profile_complete

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/eligibility", tags=["Eligibility Assessment"])
hybrid_service = HybridExpertService()


def prepare_student_features(profile, academics, financials, achievements, user_id: int) -> dict:
    """
    Single centralized function that transforms student DB records into the exact
    feature dictionary expected by the ML model and Rule Engine.
    Field names MUST match what feature_engineering.py defines.
    NOTE: The ML model was trained with 'year' (not 'year_of_study') — we map here.
    """
    return {
        "student_id":          f"STU{user_id}",
        # Personal
        "age":                 profile.age,
        "gender":              profile.gender,
        "state":               profile.state,
        "category":            profile.category,
        "disability":          profile.disability,
        "rural_urban":         profile.rural_urban,
        "first_generation":    profile.first_generation,
        "institution_type":    profile.institution_type,
        "hostel_day_scholar":  profile.hostel_day_scholar,
        # Academic — NOTE: ML model uses 'year' not 'year_of_study'
        "education_level":     academics.education_level,
        "course":              academics.course,
        "year":                academics.year_of_study,   # field name mapping
        "year_of_study":       academics.year_of_study,   # keep for rule engine
        "cgpa":                academics.cgpa,
        "percentage":          academics.percentage,
        "backlogs":            academics.backlogs,
        "attendance":          academics.attendance,
        "previous_scholarship": academics.previous_scholarship,
        # Financial
        "family_income":       financials.family_income,
        "family_size":         financials.family_size,
        "parent_occupation":   financials.parent_occupation,
        "earning_members":     financials.earning_members,
        "financial_dependency": financials.financial_dependency,
        # Achievements
        "sports_achievement":    achievements.sports_achievement,
        "academic_achievement":  achievements.academic_achievement,
        "extracurricular_score": achievements.extracurricular_score,
        "certifications_count":  achievements.certifications_count,
        "leadership_experience": achievements.leadership_experience,
    }


@router.post("/check")
def assess_eligibility(
    payload_data: AssessmentPayload,
    payload: dict = Depends(require_role(["STUDENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logger.info(f"[ELIGIBILITY CHECK] Starting for user_id={user_id} ({user.email})")

    # 1. Save/update submitted form data to THIS user's database records
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    if not profile:
        profile = StudentProfile(user_id=user_id)
        db.add(profile)
    if payload_data.age is not None: profile.age = payload_data.age
    if payload_data.gender is not None: profile.gender = payload_data.gender
    if payload_data.state is not None: profile.state = payload_data.state
    if payload_data.city is not None: profile.city = payload_data.city
    if payload_data.category is not None: profile.category = payload_data.category
    if payload_data.disability is not None: profile.disability = payload_data.disability
    if payload_data.rural_urban is not None: profile.rural_urban = payload_data.rural_urban
    if payload_data.first_generation is not None: profile.first_generation = payload_data.first_generation
    if payload_data.institution_type is not None: profile.institution_type = payload_data.institution_type
    if payload_data.hostel_day_scholar is not None: profile.hostel_day_scholar = payload_data.hostel_day_scholar

    academics = db.query(AcademicRecord).filter(AcademicRecord.user_id == user_id).first()
    if not academics:
        academics = AcademicRecord(user_id=user_id)
        db.add(academics)
    if payload_data.education_level is not None: academics.education_level = payload_data.education_level
    if payload_data.course is not None: academics.course = payload_data.course
    if payload_data.year_of_study is not None: academics.year_of_study = payload_data.year_of_study
    if payload_data.cgpa is not None: academics.cgpa = payload_data.cgpa
    if payload_data.percentage is not None: academics.percentage = payload_data.percentage
    if payload_data.backlogs is not None: academics.backlogs = payload_data.backlogs
    if payload_data.attendance is not None: academics.attendance = payload_data.attendance
    if payload_data.previous_scholarship is not None: academics.previous_scholarship = payload_data.previous_scholarship

    financials = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).first()
    if not financials:
        financials = FinancialRecord(user_id=user_id)
        db.add(financials)
    if payload_data.family_income is not None: financials.family_income = payload_data.family_income
    if payload_data.family_size is not None: financials.family_size = payload_data.family_size
    if payload_data.parent_occupation is not None: financials.parent_occupation = payload_data.parent_occupation
    if payload_data.earning_members is not None: financials.earning_members = payload_data.earning_members
    if payload_data.financial_dependency is not None: financials.financial_dependency = payload_data.financial_dependency

    achievements = db.query(AchievementRecord).filter(AchievementRecord.user_id == user_id).first()
    if not achievements:
        achievements = AchievementRecord(user_id=user_id)
        db.add(achievements)
    if payload_data.sports_achievement is not None: achievements.sports_achievement = payload_data.sports_achievement
    if payload_data.academic_achievement is not None: achievements.academic_achievement = payload_data.academic_achievement
    if payload_data.extracurricular_score is not None: achievements.extracurricular_score = payload_data.extracurricular_score
    if payload_data.certifications_count is not None: achievements.certifications_count = payload_data.certifications_count
    if payload_data.leadership_experience is not None: achievements.leadership_experience = payload_data.leadership_experience

    db.commit()
    db.refresh(profile)
    db.refresh(academics)
    db.refresh(financials)
    db.refresh(achievements)

    logger.info(f"[ELIGIBILITY CHECK] Profile data saved for user_id={user_id}")

    # 2. Verify profile completeness before running AI
    completion = calculate_completion(profile, academics, financials, achievements)
    logger.info(f"[ELIGIBILITY CHECK] Profile completion: {completion}%")

    if completion < 100:
        from backend.app.routes.student_routes import get_missing_details
        missing_sections, missing_fields = get_missing_details(profile, academics, financials, achievements)
        raise HTTPException(
            status_code=422,
            detail={
                "success": False,
                "code": "PROFILE_INCOMPLETE",
                "message": "Complete your profile before running AI eligibility verification.",
                "completion_percentage": completion,
                "missing_sections": missing_sections,
                "missing_fields": missing_fields,
            }
        )

    # 3. Build centralized feature dictionary from this student's actual DB data
    student_dict = prepare_student_features(profile, academics, financials, achievements, user_id)
    logger.info(f"[ELIGIBILITY CHECK] Features prepared. CGPA={student_dict['cgpa']}, Income={student_dict['family_income']}")

    # 4. Execute Hybrid Assessment (Rule Engine + ML)
    try:
        assessment = hybrid_service.evaluate_student(student_dict)
        logger.info(f"[ELIGIBILITY CHECK] ML probability: {assessment['ml_probability']:.4f}, Rule: {assessment['rule_status']}, Hybrid: {assessment['hybrid_score']}")
    except Exception as e:
        logger.error(f"[ELIGIBILITY CHECK] AI pipeline error for user_id={user_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"AI eligibility engine error: {str(e)}. Ensure ML models are trained and available in ml/models/."
        )

    # 5. Generate Personalized Scholarship Recommendations for this student
    try:
        recommendations = ScholarshipRecommendationEngine.get_recommendations(
            student_dict, db, ml_prob=assessment["ml_probability"]
        )
        logger.info(f"[ELIGIBILITY CHECK] Generated {len(recommendations)} recommendations for user_id={user_id}")
    except Exception as e:
        logger.error(f"[ELIGIBILITY CHECK] Recommendation engine error: {e}")
        recommendations = []

    # 6. Persist eligibility result to database (linked to THIS user)
    result_record = EligibilityResult(
        user_id=user_id,
        rule_status=assessment["rule_status"],
        ml_probability=assessment["ml_probability"],
        hybrid_score=assessment["hybrid_score"],
        final_verdict=assessment["final_verdict"],
        positive_factors_json=json.dumps(assessment["positive_factors"]),
        negative_factors_json=json.dumps(assessment["negative_factors"]),
        improvement_tips_json=json.dumps(assessment["improvement_tips"])
    )
    db.add(result_record)

    # Add notification for the student
    note = Notification(
        user_id=user_id,
        title="AI Eligibility Assessment Complete",
        message=(
            f"Your Hybrid Eligibility Score is {assessment['hybrid_score']}/100 "
            f"({assessment['final_verdict']}). "
            f"Found {len(recommendations)} matching scholarship(s)."
        ),
        type="SUCCESS"
    )
    db.add(note)
    db.commit()
    db.refresh(result_record)

    logger.info(f"[ELIGIBILITY CHECK] Result saved. result_id={result_record.id}, verdict={assessment['final_verdict']}")

    return {
        "id":                   result_record.id,
        "rule_status":          assessment["rule_status"],
        "rule_checks":          assessment["rule_checks"],
        "rule_score":           assessment["rule_score"],
        "ml_probability":       assessment["ml_probability"],
        "ml_percentage":        assessment["ml_percentage"],
        "hybrid_score":         assessment["hybrid_score"],
        "final_verdict":        assessment["final_verdict"],
        "combination_rationale": assessment["combination_rationale"],
        "positive_factors":     assessment["positive_factors"],
        "negative_factors":     assessment["negative_factors"],
        "improvement_tips":     assessment["improvement_tips"],
        "top_recommendations":  recommendations,
        "assessed_at":          result_record.created_at
    }


@router.post("/verify")
def verify_from_profile(
    payload: dict = Depends(require_role(["STUDENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Triggers AI verification using the student's SAVED database profile.
    No form submission needed — uses whatever is already in the database.
    """
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    logger.info(f"[ELIGIBILITY VERIFY] Starting from saved profile for user_id={user_id}")

    profile      = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    academics    = db.query(AcademicRecord).filter(AcademicRecord.user_id == user_id).first()
    financials   = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).first()
    achievements = db.query(AchievementRecord).filter(AchievementRecord.user_id == user_id).first()

    completion = calculate_completion(profile, academics, financials, achievements)
    logger.info(f"[ELIGIBILITY VERIFY] Profile completion: {completion}%")

    if completion < 100:
        missing_sections = []
        from backend.app.routes.student_routes import (
            _section_filled, REQUIRED_PERSONAL_FIELDS, REQUIRED_ACADEMIC_FIELDS,
            REQUIRED_FINANCIAL_FIELDS, REQUIRED_ACHIEVEMENT_FIELDS
        )
        if not _section_filled(profile, REQUIRED_PERSONAL_FIELDS):
            missing_sections.append("Personal Information")
        if not _section_filled(academics, REQUIRED_ACADEMIC_FIELDS):
            missing_sections.append("Academic Records")
        if not _section_filled(financials, REQUIRED_FINANCIAL_FIELDS):
            missing_sections.append("Financial Information")
        if not _section_filled(achievements, REQUIRED_ACHIEVEMENT_FIELDS):
            missing_sections.append("Achievements")

        raise HTTPException(
            status_code=422,
            detail={
                "success": False,
                "code": "PROFILE_INCOMPLETE",
                "message": "Complete your profile before running AI eligibility verification.",
                "completion_percentage": completion,
                "missing_sections": missing_sections,
            }
        )

    student_dict = prepare_student_features(profile, academics, financials, achievements, user_id)

    try:
        assessment = hybrid_service.evaluate_student(student_dict)
        logger.info(f"[ELIGIBILITY VERIFY] ML={assessment['ml_probability']:.4f}, Rule={assessment['rule_status']}, Hybrid={assessment['hybrid_score']}")
    except Exception as e:
        logger.error(f"[ELIGIBILITY VERIFY] AI pipeline error: {e}")
        raise HTTPException(status_code=500, detail=f"AI eligibility engine error: {str(e)}")

    try:
        recommendations = ScholarshipRecommendationEngine.get_recommendations(
            student_dict, db, ml_prob=assessment["ml_probability"]
        )
    except Exception as e:
        logger.error(f"[ELIGIBILITY VERIFY] Recommendation error: {e}")
        recommendations = []

    result_record = EligibilityResult(
        user_id=user_id,
        rule_status=assessment["rule_status"],
        ml_probability=assessment["ml_probability"],
        hybrid_score=assessment["hybrid_score"],
        final_verdict=assessment["final_verdict"],
        positive_factors_json=json.dumps(assessment["positive_factors"]),
        negative_factors_json=json.dumps(assessment["negative_factors"]),
        improvement_tips_json=json.dumps(assessment["improvement_tips"])
    )
    db.add(result_record)

    note = Notification(
        user_id=user_id,
        title="AI Eligibility Verification Complete",
        message=(
            f"Hybrid Score: {assessment['hybrid_score']}/100 ({assessment['final_verdict']}). "
            f"Found {len(recommendations)} scholarship match(es)."
        ),
        type="SUCCESS"
    )
    db.add(note)
    db.commit()
    db.refresh(result_record)

    logger.info(f"[ELIGIBILITY VERIFY] Saved result_id={result_record.id} for user_id={user_id}")

    return {
        "id":                   result_record.id,
        "rule_status":          assessment["rule_status"],
        "rule_checks":          assessment["rule_checks"],
        "rule_score":           assessment["rule_score"],
        "ml_probability":       assessment["ml_probability"],
        "ml_percentage":        assessment["ml_percentage"],
        "hybrid_score":         assessment["hybrid_score"],
        "final_verdict":        assessment["final_verdict"],
        "combination_rationale": assessment["combination_rationale"],
        "positive_factors":     assessment["positive_factors"],
        "negative_factors":     assessment["negative_factors"],
        "improvement_tips":     assessment["improvement_tips"],
        "top_recommendations":  recommendations,
        "assessed_at":          result_record.created_at
    }


@router.get("/latest")
def get_latest_result(payload: dict = Depends(require_role(["STUDENT", "ADMIN"])), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    latest = db.query(EligibilityResult).filter(
        EligibilityResult.user_id == user_id
    ).order_by(EligibilityResult.created_at.desc()).first()

    if not latest:
        return {"status": "none", "message": "No assessment taken yet"}

    pos_factors = json.loads(latest.positive_factors_json or "[]")
    neg_factors = json.loads(latest.negative_factors_json or "[]")
    tips        = json.loads(latest.improvement_tips_json or "[]")

    # Generate current recommendations from THIS user's saved profile
    profile      = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    academics    = db.query(AcademicRecord).filter(AcademicRecord.user_id == user_id).first()
    financials   = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).first()
    achievements = db.query(AchievementRecord).filter(AchievementRecord.user_id == user_id).first()

    recs = []
    if profile and academics and financials:
        student_dict = prepare_student_features(profile, academics, financials, achievements or AchievementRecord(), user_id)
        recs = ScholarshipRecommendationEngine.get_recommendations(student_dict, db, ml_prob=latest.ml_probability)

    return {
        "id":                latest.id,
        "rule_status":       latest.rule_status,
        "ml_probability":    latest.ml_probability,
        "ml_percentage":     round(latest.ml_probability * 100, 1),
        "hybrid_score":      latest.hybrid_score,
        "final_verdict":     latest.final_verdict,
        "positive_factors":  pos_factors,
        "negative_factors":  neg_factors,
        "improvement_tips":  tips,
        "top_recommendations": recs,
        "assessed_at":       latest.created_at
    }


@router.get("/history")
def get_history(payload: dict = Depends(require_role(["STUDENT", "ADMIN"])), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    results = db.query(EligibilityResult).filter(
        EligibilityResult.user_id == user_id
    ).order_by(EligibilityResult.created_at.desc()).all()

    return [
        {
            "id":              r.id,
            "rule_status":     r.rule_status,
            "ml_probability":  r.ml_probability,
            "ml_percentage":   round(r.ml_probability * 100, 1),
            "hybrid_score":    r.hybrid_score,
            "final_verdict":   r.final_verdict,
            "created_at":      r.created_at
        }
        for r in results
    ]
