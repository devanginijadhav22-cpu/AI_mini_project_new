"""
Scholarship Applications and Student Recommendations Routes
"""

from typing import List
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.database.models import (
    User, Application, Scholarship, EligibilityResult, StudentProfile,
    AcademicRecord, FinancialRecord, Notification
)
from backend.app.schemas.scholarship_schemas import (
    ApplicationCreate, ApplicationResponse, RecommendedScholarship
)
from backend.app.auth.jwt_handler import require_role
from backend.app.services.recommendation_service import ScholarshipRecommendationEngine

router = APIRouter(tags=["Applications & Recommendations"])


def extract_student_dict(profile, academics, financials) -> dict:
    return {
        "cgpa": academics.cgpa if academics and academics.cgpa is not None else 8.0,
        "family_income": financials.family_income if financials and financials.family_income is not None else 250000.0,
        "backlogs": academics.backlogs if academics and academics.backlogs is not None else 0,
        "category": profile.category if profile and profile.category else None,
        "gender": profile.gender if profile and profile.gender else "Male",
        "education_level": academics.education_level if academics and academics.education_level else "Undergraduate",
        "attendance": academics.attendance if academics and academics.attendance is not None else 85.0,
        "course": academics.course if academics and academics.course else "",
        "disability": profile.disability if profile and profile.disability is not None else 0
    }


@router.post("/applications", response_model=ApplicationResponse)
def submit_application(
    app_in: ApplicationCreate,
    payload: dict = Depends(require_role(["STUDENT"])),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))
    
    # Check if scholarship exists
    scholarship = db.query(Scholarship).filter(Scholarship.id == app_in.scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship does not exist.")

    # Check for duplicate application
    existing = db.query(Application).filter(
        Application.user_id == user_id,
        Application.scholarship_id == app_in.scholarship_id
    ).first()
    if existing:
        raise HTTPException(
            status_code=400,
            detail=f"You have already applied for '{scholarship.title}' on {existing.applied_at.strftime('%d-%b-%Y')}."
        )

    # Get student's saved assessment at application time
    latest_eval = db.query(EligibilityResult).filter(
        EligibilityResult.user_id == user_id
    ).order_by(EligibilityResult.created_at.desc()).first()

    score = latest_eval.hybrid_score if latest_eval else 75.0
    eval_id = latest_eval.id if latest_eval else None

    # Compute the scholarship-specific match score for this exact scheme
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    academics = db.query(AcademicRecord).filter(AcademicRecord.user_id == user_id).first()
    financials = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).first()

    student_dict = extract_student_dict(profile, academics, financials)
    prob = latest_eval.ml_probability if latest_eval else 0.85
    sch_recs = ScholarshipRecommendationEngine.get_recommendations(student_dict, db, ml_prob=prob)
    target_rec = next((r for r in sch_recs if r["id"] == scholarship.id), None)
    match_score = target_rec["match_percentage"] if target_rec else None

    new_app = Application(
        user_id=user_id,
        scholarship_id=app_in.scholarship_id,
        status="PENDING",
        score_at_application=score,
        eligibility_result_id=eval_id,
        match_score_at_application=match_score,
        remarks=app_in.remarks
    )
    db.add(new_app)

    # Add confirmation notification
    note = Notification(
        user_id=user_id,
        title="Application Successfully Submitted",
        message=f"Your application for '{scholarship.title}' (Grant: ₹{scholarship.amount:,.0f}) has been submitted for administrative verification.",
        type="APPLICATION"
    )
    db.add(note)
    db.commit()
    db.refresh(new_app)

    return {
        "id": new_app.id,
        "scholarship_id": scholarship.id,
        "scholarship_title": scholarship.title,
        "provider": scholarship.provider,
        "amount": scholarship.amount,
        "status": new_app.status,
        "applied_at": new_app.applied_at,
        "score_at_application": new_app.score_at_application,
        "match_score": new_app.match_score_at_application,
        "remarks": new_app.remarks
    }

@router.get("/applications", response_model=List[ApplicationResponse])
def get_student_applications(
    payload: dict = Depends(require_role(["STUDENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))
    apps = db.query(Application).filter(Application.user_id == user_id).order_by(Application.applied_at.desc()).all()

    results = []
    for a in apps:
        s = a.scholarship
        rev = a.reviewer
        results.append({
            "id": a.id,
            "scholarship_id": a.scholarship_id,
            "scholarship_title": s.title if s else "Scholarship",
            "provider": s.provider if s else "N/A",
            "amount": s.amount if s else 0.0,
            "status": a.status,
            "applied_at": a.applied_at,
            "score_at_application": a.score_at_application,
            "match_score": a.match_score_at_application,
            "remarks": a.remarks,
            "decision_remarks": a.decision_remarks or a.remarks,
            "reviewed_at": a.reviewed_at,
            "reviewer_name": rev.full_name if rev else None,
            "award_status": a.award_status or "NOT_AWARDED",
            "disbursed_at": a.disbursed_at,
            "disbursement_reference": a.disbursement_reference,
            "disbursement_notes": a.disbursement_notes
        })
    return results

@router.get("/recommendations", response_model=List[RecommendedScholarship])
def get_recommendations(
    payload: dict = Depends(require_role(["STUDENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user_id).first()
    academics = db.query(AcademicRecord).filter(AcademicRecord.user_id == user_id).first()
    financials = db.query(FinancialRecord).filter(FinancialRecord.user_id == user_id).first()

    latest_eval = db.query(EligibilityResult).filter(
        EligibilityResult.user_id == user_id
    ).order_by(EligibilityResult.created_at.desc()).first()

    prob = latest_eval.ml_probability if latest_eval else 0.85
    student_dict = extract_student_dict(profile, academics, financials)

    recs = ScholarshipRecommendationEngine.get_recommendations(student_dict, db, ml_prob=prob)

    # Attach authenticated student's real application and award records
    user_apps = db.query(Application).filter(Application.user_id == user_id).all()
    apps_by_sch = {a.scholarship_id: a for a in user_apps}

    for rec in recs:
        app = apps_by_sch.get(rec["id"])
        if app:
            rec["application_id"] = app.id
            rec["application_status"] = app.status
            rec["award_status"] = app.award_status or "NOT_AWARDED"
            rec["decision_remarks"] = app.decision_remarks or app.remarks
            rec["applied_at"] = app.applied_at
            rec["reviewed_at"] = app.reviewed_at
            rec["disbursed_at"] = app.disbursed_at
            rec["disbursement_reference"] = app.disbursement_reference
            rec["disbursement_notes"] = app.disbursement_notes

    return recs
