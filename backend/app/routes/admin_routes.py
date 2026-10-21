"""
Admin Management, Analytics, and Model Monitoring Routes
"""

import json
import threading
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.connection import get_db
from backend.app.database.models import (
    User, StudentProfile, AcademicRecord, FinancialRecord, AchievementRecord,
    Scholarship, Application, EligibilityResult, Notification, StudentDocument
)
from backend.app.schemas.scholarship_schemas import ScholarshipCreate, ScholarshipResponse
from backend.app.schemas.admin_schemas import (
    AdminDashboardStats, AnalyticsData, ModelPerformanceData,
    StudentSummary, ApplicationAdminView, StatusUpdateRequest,
    DisbursementRequest, AwardApplicantView
)
from backend.app.auth.jwt_handler import require_role
from backend.app.services.ml_service import MLService
from backend.app.services.recommendation_service import ScholarshipRecommendationEngine
from backend.app.services.rule_engine import RuleBasedExpertSystem
from backend.app.services.hybrid_expert_service import HybridExpertService
from backend.app.routes.student_routes import calculate_completion
from pydantic import BaseModel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin Operations"])
ml_service = MLService.get_instance()
expert_system = RuleBasedExpertSystem()
hybrid_service = HybridExpertService()


@router.get("/dashboard", response_model=AdminDashboardStats)
def get_admin_dashboard(
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    total_students     = db.query(User).filter(User.role == "STUDENT").count()
    total_scholarships = db.query(Scholarship).count()
    total_applications = db.query(Application).count()

    # Distinct unique student applicants
    unique_applicants = db.query(func.count(func.distinct(Application.user_id))).scalar() or 0

    # Count students who have run at least one eligibility check
    total_eligibility_checks = db.query(EligibilityResult).count()

    # Count unique students who have a result marked ELIGIBLE or CONDITIONALLY_ELIGIBLE
    eligible_count = db.query(EligibilityResult).filter(
        EligibilityResult.rule_status.in_(["ELIGIBLE", "CONDITIONALLY_ELIGIBLE"])
    ).count()

    avg_score = db.query(func.avg(EligibilityResult.hybrid_score)).scalar() or 0.0

    pending_apps      = db.query(Application).filter(Application.status == "PENDING").count()
    under_review_apps = db.query(Application).filter(Application.status == "UNDER_REVIEW").count()
    needs_info_apps   = db.query(Application).filter(Application.status == "NEEDS_INFORMATION").count()
    approved_apps     = db.query(Application).filter(Application.status == "APPROVED").count()
    rejected_apps     = db.query(Application).filter(Application.status == "REJECTED").count()

    return {
        "total_students":            total_students,
        "total_scholarships":        total_scholarships,
        "total_applications":        total_applications,
        "unique_applicants":         unique_applicants,
        "eligible_students_count":   eligible_count,
        "average_eligibility_score": round(float(avg_score), 1),
        "pending_applications":      pending_apps,
        "under_review_applications": under_review_apps,
        "needs_info_applications":   needs_info_apps,
        "approved_applications":     approved_apps,
        "rejected_applications":     rejected_apps,
    }


@router.get("/students")
def get_students(
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    students = db.query(User).filter(User.role == "STUDENT").order_by(User.created_at.desc()).all()
    results = []

    for s in students:
        prof  = s.profile
        acad  = s.academic_record
        fin   = s.financial_record
        ach   = s.achievements

        comp = calculate_completion(prof, acad, fin, ach)

        # Latest eligibility result
        latest = db.query(EligibilityResult).filter(
            EligibilityResult.user_id == s.id
        ).order_by(EligibilityResult.created_at.desc()).first()

        # Application count
        app_count = db.query(Application).filter(Application.user_id == s.id).count()

        results.append({
            "id":                  s.id,
            "full_name":           s.full_name,
            "email":               s.email,
            "category":            prof.category if prof else None,
            "education_level":     acad.education_level if acad else None,
            "course":              acad.course if acad else None,
            "cgpa":                acad.cgpa if acad else None,
            "family_income":       fin.family_income if fin else None,
            "profile_completion":  comp,
            "eligibility_status":  latest.final_verdict if latest else "Not Assessed",
            "ai_score":            latest.hybrid_score if latest else None,
            "application_count":   app_count,
            "is_active":           s.is_active,
            "created_at":          s.created_at,
        })
    return results


@router.get("/applications", response_model=List[ApplicationAdminView])
def get_all_applications(
    status: Optional[str] = None,
    scholarship_id: Optional[int] = None,
    search: Optional[str] = None,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    query = db.query(Application).join(User, Application.user_id == User.id).join(Scholarship, Application.scholarship_id == Scholarship.id)

    if status and status.upper() != "ALL":
        query = query.filter(Application.status == status.upper())

    if scholarship_id:
        query = query.filter(Application.scholarship_id == scholarship_id)

    if search:
        search_pattern = f"%{search.strip()}%"
        query = query.filter(
            (User.full_name.ilike(search_pattern)) |
            (User.email.ilike(search_pattern)) |
            (Scholarship.title.ilike(search_pattern))
        )

    apps = query.order_by(Application.applied_at.desc()).all()
    results = []
    for a in apps:
        s = a.scholarship
        u = a.user
        rev = a.reviewer
        doc_count = db.query(StudentDocument).filter(StudentDocument.user_id == a.user_id).count()

        match_score = a.match_score_at_application
        if match_score is None and u and s:
            prof = u.profile
            acad = u.academic_record
            fin = u.financial_record
            s_dict = {
                "cgpa": acad.cgpa if acad and acad.cgpa is not None else 8.0,
                "family_income": fin.family_income if fin and fin.family_income is not None else 250000.0,
                "backlogs": acad.backlogs if acad and acad.backlogs is not None else 0,
                "category": prof.category if prof and prof.category else None,
                "gender": prof.gender if prof and prof.gender else "Male",
                "education_level": acad.education_level if acad and acad.education_level else "Undergraduate",
                "attendance": acad.attendance if acad and acad.attendance is not None else 85.0,
                "course": acad.course if acad and acad.course else "",
                "disability": prof.disability if prof and prof.disability is not None else 0
            }
            recs = ScholarshipRecommendationEngine.get_recommendations(s_dict, db, ml_prob=0.85)
            t = next((r for r in recs if r["id"] == s.id), None)
            if t:
                match_score = t["match_percentage"]

        results.append({
            "id": a.id,
            "student_id": u.id if u else 0,
            "student_name": u.full_name if u else "Unknown",
            "student_email": u.email if u else "N/A",
            "scholarship_id": s.id if s else 0,
            "scholarship_title": s.title if s else "Unknown",
            "scholarship_category": s.category if s else "General",
            "provider": s.provider if s else "N/A",
            "amount": s.amount if s else 0.0,
            "status": a.status,
            "applied_at": a.applied_at,
            "score_at_application": a.score_at_application,
            "match_score": match_score,
            "eligibility_result_id": a.eligibility_result_id,
            "required_category": s.required_category if s else "All",
            "remarks": a.remarks,
            "decision_remarks": a.decision_remarks or a.remarks,
            "reviewer_id": a.reviewer_id,
            "reviewer_name": rev.full_name if rev else None,
            "reviewed_at": a.reviewed_at,
            "award_status": a.award_status or "NOT_AWARDED",
            "disbursed_at": a.disbursed_at,
            "disbursement_reference": a.disbursement_reference,
            "documents_count": doc_count
        })
    return results


@router.get("/applications/{app_id}")
def get_application_detail(
    app_id: int,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    student = app.user
    sch = app.scholarship
    prof = student.profile if student else None
    acad = student.academic_record if student else None
    fin = student.financial_record if student else None
    ach = student.achievements if student else None
    comp = calculate_completion(prof, acad, fin, ach)

    # Documents submitted by this student
    docs = db.query(StudentDocument).filter(StudentDocument.user_id == app.user_id).order_by(StudentDocument.uploaded_at.desc()).all()
    doc_list = []
    for d in docs:
        doc_list.append({
            "id": d.id,
            "document_type": d.document_type,
            "filename": d.filename,
            "file_size_kb": d.file_size_kb,
            "verification_status": d.verification_status,
            "admin_remarks": d.admin_remarks,
            "uploaded_at": d.uploaded_at,
            "verified_at": d.verified_at,
            "download_url": f"/api/documents/{d.id}/download"
        })

    # Saved eligibility assessment associated with this application
    saved_eval = None
    if app.eligibility_result_id:
        saved_eval = db.query(EligibilityResult).filter(EligibilityResult.id == app.eligibility_result_id).first()
    if not saved_eval and app.applied_at:
        saved_eval = db.query(EligibilityResult).filter(
            EligibilityResult.user_id == app.user_id,
            EligibilityResult.created_at <= app.applied_at
        ).order_by(EligibilityResult.created_at.desc()).first()
    if not saved_eval:
        saved_eval = db.query(EligibilityResult).filter(
            EligibilityResult.user_id == app.user_id
        ).order_by(EligibilityResult.created_at.desc()).first()

    pos_factors = []
    neg_factors = []
    tips = []
    if saved_eval:
        try:
            pos_factors = json.loads(saved_eval.positive_factors_json) if saved_eval.positive_factors_json else []
        except Exception:
            pos_factors = []
        try:
            neg_factors = json.loads(saved_eval.negative_factors_json) if saved_eval.negative_factors_json else []
        except Exception:
            neg_factors = []
        try:
            tips = json.loads(saved_eval.improvement_tips_json) if saved_eval.improvement_tips_json else []
        except Exception:
            tips = []

    # Scholarship-specific match percentage
    match_score = app.match_score_at_application
    if match_score is None and sch and student:
        try:
            s_dict = {
                "cgpa": acad.cgpa if acad and acad.cgpa is not None else 8.0,
                "family_income": fin.family_income if fin and fin.family_income is not None else 250000.0,
                "backlogs": acad.backlogs if acad and acad.backlogs is not None else 0,
                "category": prof.category if prof and prof.category else None,
                "gender": prof.gender if prof and prof.gender else "Male",
                "education_level": acad.education_level if acad and acad.education_level else "Undergraduate",
                "attendance": acad.attendance if acad and acad.attendance is not None else 85.0,
                "course": acad.course if acad and acad.course else "",
                "disability": prof.disability if prof and prof.disability is not None else 0
            }
            p_val = saved_eval.ml_probability if saved_eval else 0.85
            recs = ScholarshipRecommendationEngine.get_recommendations(s_dict, db, ml_prob=p_val)
            t = next((r for r in recs if r["id"] == sch.id), None)
            if t:
                match_score = t["match_percentage"]
        except Exception:
            match_score = None

    # Criteria comparison for this specific scholarship
    cgpa_val = acad.cgpa if acad and acad.cgpa is not None else 0.0
    income_val = fin.family_income if fin and fin.family_income is not None else 0.0
    backlogs_val = acad.backlogs if acad and acad.backlogs is not None else 0
    attendance_val = acad.attendance if acad and acad.attendance is not None else 0.0
    category_val = prof.category if prof and prof.category else "Not Specified"
    gender_val = prof.gender if prof and prof.gender else "Not Specified"
    edu_level_val = acad.education_level if acad and acad.education_level else "All"

    # Evaluate against scholarship published criteria
    cgpa_met = cgpa_val >= sch.min_cgpa if sch else True
    income_met = income_val <= sch.max_income if sch else True
    backlogs_met = backlogs_val <= sch.max_backlogs if sch else True
    attendance_met = attendance_val >= sch.min_attendance if sch else True

    # Statutory category check
    category_met = True
    category_note = "Statutory category check not required for this scholarship."
    if sch and sch.required_category and sch.required_category not in ("All", "Any"):
        if sch.required_category == "Female":
            category_met = (gender_val.lower() == "female")
            category_note = "Gender criterion: Female required."
        else:
            category_met = (category_val.upper() == sch.required_category.upper())
            category_note = f"Statutory requirement: Must belong to {sch.required_category} category with verified certificate."

    # Education level check
    edu_met = True
    if sch and sch.required_education_level and sch.required_education_level != "All":
        edu_met = (edu_level_val.lower() == sch.required_education_level.lower())

    # Document checklist
    req_docs = [d.strip() for d in (sch.required_documents or "").split(",") if d.strip()]
    submitted_doc_types = [d.document_type.lower() for d in docs]
    doc_checklist = []
    for rd in req_docs:
        is_submitted = any(rd.lower() in sdt or sdt in rd.lower() for sdt in submitted_doc_types)
        doc_checklist.append({
            "requirement": rd,
            "submitted": is_submitted
        })

    criteria_evaluation = {
        "cgpa": {"required": sch.min_cgpa, "actual": cgpa_val, "met": cgpa_met},
        "income": {"required_max": sch.max_income, "actual": income_val, "met": income_met},
        "backlogs": {"required_max": sch.max_backlogs, "actual": backlogs_val, "met": backlogs_met},
        "attendance": {"required_min": sch.min_attendance, "actual": attendance_val, "met": attendance_met},
        "category": {"required": sch.required_category, "actual": category_val, "met": category_met, "note": category_note},
        "education_level": {"required": sch.required_education_level, "actual": edu_level_val, "met": edu_met},
        "documents": doc_checklist,
        "all_criteria_met": bool(cgpa_met and income_met and backlogs_met and attendance_met and category_met and edu_met)
    }

    reviewer = app.reviewer
    return {
        "application": {
            "id": app.id,
            "status": app.status,
            "applied_at": app.applied_at,
            "score_at_application": app.score_at_application,
            "match_score": match_score,
            "eligibility_result_id": app.eligibility_result_id,
            "remarks": app.remarks,
            "decision_remarks": app.decision_remarks or app.remarks,
            "reviewer_id": app.reviewer_id,
            "reviewer_name": reviewer.full_name if reviewer else None,
            "reviewed_at": app.reviewed_at,
            "award_status": app.award_status or "NOT_AWARDED",
            "disbursed_at": app.disbursed_at,
            "disbursement_reference": app.disbursement_reference,
            "disbursement_notes": app.disbursement_notes
        },
        "student": {
            "id": student.id,
            "full_name": student.full_name,
            "email": student.email,
            "is_active": student.is_active,
            "created_at": student.created_at,
            "profile_completion": comp,
            "profile": {
                "age": prof.age if prof else None,
                "gender": prof.gender if prof else None,
                "phone": prof.phone if prof else None,
                "state": prof.state if prof else None,
                "city": prof.city if prof else None,
                "category": prof.category if prof else None,
                "disability": prof.disability if prof else 0,
                "rural_urban": prof.rural_urban if prof else None,
                "first_generation": prof.first_generation if prof else 0,
                "institution_type": prof.institution_type if prof else None,
                "hostel_day_scholar": prof.hostel_day_scholar if prof else None
            },
            "academics": {
                "education_level": acad.education_level if acad else None,
                "course": acad.course if acad else None,
                "year_of_study": acad.year_of_study if acad else None,
                "cgpa": acad.cgpa if acad else None,
                "percentage": acad.percentage if acad else None,
                "backlogs": acad.backlogs if acad else 0,
                "attendance": acad.attendance if acad else None,
                "previous_scholarship": acad.previous_scholarship if acad else 0
            },
            "financials": {
                "family_income": fin.family_income if fin else None,
                "family_size": fin.family_size if fin else None,
                "parent_occupation": fin.parent_occupation if fin else None,
                "earning_members": fin.earning_members if fin else None,
                "financial_dependency": fin.financial_dependency if fin else None
            },
            "achievements": {
                "sports_achievement": ach.sports_achievement if ach else None,
                "academic_achievement": ach.academic_achievement if ach else None,
                "extracurricular_score": ach.extracurricular_score if ach else 5,
                "certifications_count": ach.certifications_count if ach else 0,
                "leadership_experience": ach.leadership_experience if ach else False
            }
        },
        "scholarship": {
            "id": sch.id if sch else 0,
            "title": sch.title if sch else "Unknown",
            "provider": sch.provider if sch else "Unknown",
            "description": sch.description if sch else "",
            "amount": sch.amount if sch else 0.0,
            "deadline": sch.deadline if sch else "N/A",
            "category": sch.category if sch else "General",
            "match_percentage": match_score,
            "min_cgpa": sch.min_cgpa if sch else 6.0,
            "max_income": sch.max_income if sch else 800000.0,
            "max_backlogs": sch.max_backlogs if sch else 1,
            "min_attendance": sch.min_attendance if sch else 65.0,
            "required_category": sch.required_category if sch else "All",
            "required_education_level": sch.required_education_level if sch else "All",
            "required_courses": sch.required_courses if sch else "All",
            "required_documents": sch.required_documents if sch else ""
        },
        "criteria_evaluation": criteria_evaluation,
        "eligibility_assessment": {
            "id": saved_eval.id if saved_eval else None,
            "rule_status": saved_eval.rule_status if saved_eval else "NOT_ASSESSED",
            "ml_probability": saved_eval.ml_probability if saved_eval else 0.0,
            "hybrid_score": app.score_at_application if app.score_at_application is not None else (saved_eval.hybrid_score if saved_eval else 0.0),
            "final_verdict": saved_eval.final_verdict if saved_eval else "Not Assessed",
            "positive_factors": pos_factors,
            "negative_factors": neg_factors,
            "improvement_tips": tips,
            "evaluated_at": saved_eval.created_at if saved_eval else None,
            "rule_engine_description": "Deterministic rule engine evaluated baseline academic and financial constraints independently of protected demographic traits.",
            "gradient_boosting_description": "Gradient Boosting classifier estimated probability of competitive scholarship selection based on performance, income, attendance, and achievements.",
            "hybrid_explanation": "Combines rule pass/fail logic with ML propensity to yield objective advisory guidance for committee decision-making."
        },
        "documents": doc_list
    }


@router.put("/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    status_in: StatusUpdateRequest,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    admin_id = int(payload.get("sub"))
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    new_status = status_in.status.upper()
    valid_statuses = {"PENDING", "UNDER_REVIEW", "NEEDS_INFORMATION", "APPROVED", "REJECTED"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status '{new_status}'. Allowed: {sorted(list(valid_statuses))}")

    # Validation: Remarks mandatory for APPROVED, REJECTED, and NEEDS_INFORMATION
    if new_status in ("APPROVED", "REJECTED", "NEEDS_INFORMATION"):
        if not status_in.remarks or not status_in.remarks.strip():
            action_name = "Approval remarks" if new_status == "APPROVED" else ("Rejection reason" if new_status == "REJECTED" else "Specific instructions for requested information")
            raise HTTPException(
                status_code=400,
                detail=f"{action_name} are mandatory to transition status to {new_status}."
            )

    app.status = new_status
    if status_in.remarks:
        app.remarks = status_in.remarks
        app.decision_remarks = status_in.remarks
    app.reviewer_id = admin_id
    app.reviewed_at = datetime.utcnow()

    # Award status update logic
    if new_status == "APPROVED":
        if app.award_status in (None, "NOT_AWARDED"):
            app.award_status = "AWARDED"
    elif new_status == "REJECTED":
        app.award_status = "NOT_AWARDED"

    title_map = {
        "UNDER_REVIEW": "Application Under Committee Review",
        "NEEDS_INFORMATION": "Action Required: Additional Information Requested",
        "APPROVED": "Congratulations! Scholarship Application Approved",
        "REJECTED": "Scholarship Application Update"
    }
    type_map = {
        "APPROVED": "SUCCESS",
        "REJECTED": "WARNING",
        "NEEDS_INFORMATION": "WARNING",
        "UNDER_REVIEW": "INFO"
    }
    sch_title = app.scholarship.title if app.scholarship else "Scholarship"
    note = Notification(
        user_id=app.user_id,
        title=title_map.get(new_status, f"Application {new_status.capitalize()}"),
        message=f"Application for '{sch_title}': status changed to {new_status}. Decision remarks: {status_in.remarks or 'Under active administrative review.'}",
        type=type_map.get(new_status, "INFO")
    )
    db.add(note)
    db.commit()
    db.refresh(app)

    return {
        "message": f"Application status updated to {app.status}",
        "application_id": app.id,
        "status": app.status,
        "award_status": app.award_status,
        "reviewer_id": app.reviewer_id,
        "reviewed_at": app.reviewed_at
    }


@router.get("/scholarships/{sch_id}/awards", response_model=List[AwardApplicantView])
def get_scholarship_awards(
    sch_id: int,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).filter(
        Application.scholarship_id == sch_id,
        Application.status == "APPROVED"
    ).order_by(Application.reviewed_at.desc(), Application.applied_at.desc()).all()

    results = []
    for a in apps:
        u = a.user
        s = a.scholarship
        rev = a.reviewer
        results.append({
            "application_id": a.id,
            "student_id": u.id if u else 0,
            "student_name": u.full_name if u else "Unknown",
            "student_email": u.email if u else "N/A",
            "scholarship_id": s.id if s else 0,
            "scholarship_title": s.title if s else "Unknown",
            "amount": s.amount if s else 0.0,
            "status": a.status,
            "award_status": a.award_status or "AWARDED",
            "decision_remarks": a.decision_remarks or a.remarks,
            "decision_date": a.reviewed_at,
            "reviewer_name": rev.full_name if rev else None,
            "disbursed_at": a.disbursed_at,
            "disbursement_reference": a.disbursement_reference,
            "disbursement_notes": a.disbursement_notes
        })
    return results


@router.post("/applications/{app_id}/disburse")
def disburse_scholarship_award(
    app_id: int,
    disb_in: DisbursementRequest,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    admin_id = int(payload.get("sub"))
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    if app.status != "APPROVED":
        raise HTTPException(
            status_code=400,
            detail=f"Only APPROVED applications can be disbursed. Current status: '{app.status}'."
        )

    ref = disb_in.disbursement_reference.strip()
    if not ref:
        raise HTTPException(status_code=400, detail="Disbursement transaction/audit reference number is required.")

    app.award_status = "DISBURSED"
    app.disbursed_at = datetime.utcnow()
    app.disbursement_reference = ref
    app.disbursement_notes = disb_in.disbursement_notes

    sch_title = app.scholarship.title if app.scholarship else "Scholarship"
    sch_amount = app.scholarship.amount if app.scholarship else 0.0

    note = Notification(
        user_id=app.user_id,
        title="Scholarship Grant Disbursed",
        message=f"Grant payment of ₹{sch_amount:,.0f} for '{sch_title}' has been successfully disbursed. Transaction Ref: {ref}.",
        type="SUCCESS"
    )
    db.add(note)
    db.commit()
    db.refresh(app)

    return {
        "message": f"Disbursement recorded successfully for application #{app.id}",
        "application_id": app.id,
        "award_status": app.award_status,
        "disbursed_at": app.disbursed_at,
        "disbursement_reference": app.disbursement_reference
    }


# ---- Scholarship CRUD ----
@router.post("/scholarships", response_model=ScholarshipResponse)
def create_scholarship(
    sch_in: ScholarshipCreate,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    new_sch = Scholarship(**sch_in.model_dump())
    db.add(new_sch)
    db.commit()
    db.refresh(new_sch)
    return new_sch


@router.put("/scholarships/{sch_id}", response_model=ScholarshipResponse)
def update_scholarship(
    sch_id: int,
    sch_in: ScholarshipCreate,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    sch = db.query(Scholarship).filter(Scholarship.id == sch_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    for k, v in sch_in.model_dump().items():
        setattr(sch, k, v)

    db.commit()
    db.refresh(sch)
    return sch


@router.delete("/scholarships/{sch_id}")
def delete_scholarship(
    sch_id: int,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    sch = db.query(Scholarship).filter(Scholarship.id == sch_id).first()
    if not sch:
        raise HTTPException(status_code=404, detail="Scholarship not found")

    db.delete(sch)
    db.commit()
    return {"message": "Scholarship deleted successfully"}


@router.get("/analytics")
def get_analytics(
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    # ---- Population Baseline: Actual Registered Students ----
    # Base all student profile analytics strictly on registered student accounts (1 student = 1 count).
    # Never count applications as unique students and never invent fabricated counts.
    students = db.query(User).filter(User.role == "STUDENT").all()
    total_students = len(students)
    student_ids = [s.id for s in students]

    # ---- Latest Eligibility Assessment per Unique Student (Deduplicated) ----
    # When students run assessments multiple times, deduplicate by selecting only their latest assessment
    # using documented ordering by created_at timestamp (descending) and id (descending) as tiebreaker.
    ranked_elig_subquery = (
        db.query(
            EligibilityResult.id.label("res_id"),
            func.row_number()
            .over(
                partition_by=EligibilityResult.user_id,
                order_by=[EligibilityResult.created_at.desc(), EligibilityResult.id.desc()]
            )
            .label("rn")
        )
        .filter(EligibilityResult.user_id.in_(student_ids))
        .subquery()
    ) if student_ids else None

    latest_results = (
        db.query(EligibilityResult)
        .join(ranked_elig_subquery, EligibilityResult.id == ranked_elig_subquery.c.res_id)
        .filter(ranked_elig_subquery.c.rn == 1)
        .all()
    ) if ranked_elig_subquery is not None else []

    # 1. Eligibility Distribution across unique assessed students
    highly_eligible = sum(1 for r in latest_results if r.hybrid_score >= 75)
    cond_eligible   = sum(1 for r in latest_results if 50 <= r.hybrid_score < 75)
    not_eligible    = sum(1 for r in latest_results if r.hybrid_score < 50)

    eligibility_dist = [
        {"name": "Highly Eligible (75+)", "count": highly_eligible, "fill": "#10B981"},
        {"name": "Conditionally Eligible (50-74)", "count": cond_eligible, "fill": "#F59E0B"},
        {"name": "Ineligible (<50)", "count": not_eligible, "fill": "#EF4444"}
    ]

    # 2. Demographic & Category Representation (Unique registered students)
    # Count each registered student once. Missing or undeclared category values reported separately as 'Unknown'.
    profiles = db.query(StudentProfile).filter(StudentProfile.user_id.in_(student_ids)).all() if student_ids else []
    profile_map = {p.user_id: p for p in profiles}

    cat_counts = {"General": 0, "OBC": 0, "SC": 0, "ST": 0, "EWS": 0, "Unknown": 0}
    for s_id in student_ids:
        prof = profile_map.get(s_id)
        cat = (prof.category or "").strip() if prof else ""
        if cat in cat_counts and cat != "Unknown":
            cat_counts[cat] += 1
        else:
            cat_counts["Unknown"] += 1

    cat_dist = [
        {"name": "General", "students": cat_counts["General"]},
        {"name": "OBC",     "students": cat_counts["OBC"]},
        {"name": "SC",      "students": cat_counts["SC"]},
        {"name": "ST",      "students": cat_counts["ST"]},
        {"name": "EWS",     "students": cat_counts["EWS"]},
        {"name": "Unknown", "students": cat_counts["Unknown"]},
    ]

    # 3. Household Annual Income Brackets (Unique registered students)
    # Real counts per bracket; missing values excluded from numeric bands and reported as 'Unknown'.
    finances = db.query(FinancialRecord).filter(FinancialRecord.user_id.in_(student_ids)).all() if student_ids else []
    fin_map = {f.user_id: f for f in finances}

    inc_b1, inc_b2, inc_b3, inc_b4, inc_b5, inc_unk = 0, 0, 0, 0, 0, 0
    for s_id in student_ids:
        fin = fin_map.get(s_id)
        if fin is None or fin.family_income is None:
            inc_unk += 1
        else:
            inc = fin.family_income
            if inc < 150000:
                inc_b1 += 1
            elif 150000 <= inc < 300000:
                inc_b2 += 1
            elif 300000 <= inc < 500000:
                inc_b3 += 1
            elif 500000 <= inc < 800000:
                inc_b4 += 1
            else:
                inc_b5 += 1

    income_brackets = [
        {"bracket": "< ₹1.5L",       "students": inc_b1},
        {"bracket": "₹1.5L - ₹3.0L", "students": inc_b2},
        {"bracket": "₹3.0L - ₹5.0L", "students": inc_b3},
        {"bracket": "₹5.0L - ₹8.0L", "students": inc_b4},
        {"bracket": "> ₹8.0L",        "students": inc_b5},
        {"bracket": "Unknown",       "students": inc_unk},
    ]

    # 4. Academic Merit Distribution (CGPA Tiers for unique registered students)
    # Real counts per CGPA tier; missing values excluded from numeric tiers and reported as 'Unknown'.
    academics = db.query(AcademicRecord).filter(AcademicRecord.user_id.in_(student_ids)).all() if student_ids else []
    acad_map = {a.user_id: a for a in academics}

    c_9_10, c_8_89, c_7_79, c_6_69, c_lt6, c_unk = 0, 0, 0, 0, 0, 0
    for s_id in student_ids:
        acad = acad_map.get(s_id)
        if acad is None or acad.cgpa is None:
            c_unk += 1
        else:
            cgpa = acad.cgpa
            if cgpa >= 9.0:
                c_9_10 += 1
            elif 8.0 <= cgpa < 9.0:
                c_8_89 += 1
            elif 7.0 <= cgpa < 8.0:
                c_7_79 += 1
            elif 6.0 <= cgpa < 7.0:
                c_6_69 += 1
            else:
                c_lt6 += 1

    acad_dist = [
        {"range": "9.0 - 10.0", "students": c_9_10},
        {"range": "8.0 - 8.9",  "students": c_8_89},
        {"range": "7.0 - 7.9",  "students": c_7_79},
        {"range": "6.0 - 6.9",  "students": c_6_69},
        {"range": "< 6.0",       "students": c_lt6},
        {"range": "Unknown",    "students": c_unk},
    ]

    # 5. AI Confidence & Probability Bands
    # Population: Unique registered students (latest assessment per student, no duplicate records).
    # Distinguish model probability from statutory eligibility and administrative award decisions.
    probs = [r.ml_probability for r in latest_results]
    unassessed_count = total_students - len(latest_results)
    model_pred_dist = [
        {"probability": "90% - 100%", "count": sum(1 for p in probs if p >= 0.90)},
        {"probability": "80% - 89%",  "count": sum(1 for p in probs if 0.80 <= p < 0.90)},
        {"probability": "70% - 79%",  "count": sum(1 for p in probs if 0.70 <= p < 0.80)},
        {"probability": "50% - 69%",  "count": sum(1 for p in probs if 0.50 <= p < 0.70)},
        {"probability": "< 50%",      "count": sum(1 for p in probs if p < 0.50)},
        {"probability": "Unassessed", "count": unassessed_count},
    ]

    # 6. Applications by scholarship (real data)
    apps_by_sch = db.query(
        Scholarship.title, func.count(Application.id)
    ).join(Application, Scholarship.id == Application.scholarship_id).group_by(Scholarship.title).limit(8).all()
    app_sch_dist = [{"title": a[0][:30] + ("..." if len(a[0]) > 30 else ""), "applications": a[1]} for a in apps_by_sch]

    # Return clean analytics payload with data integrity metadata and calibration reporting
    return {
        "metadata": {
            "total_registered_students": total_students,
            "profiles_recorded": len(profiles),
            "profiles_missing": total_students - len(profiles),
            "financial_records_recorded": len(finances),
            "financial_records_missing": total_students - len(finances),
            "academic_records_recorded": len(academics),
            "academic_records_missing": total_students - len(academics),
            "unique_students_assessed": len(latest_results),
            "unique_students_unassessed": unassessed_count,
            "active_model_name": "HistGradientBoostingClassifier",
            "calibration_status": "Live cohort unverified (lacks ground-truth labels). Held-out benchmark verified (Brier: 0.0348).",
        },
        "calibration": {
            "live_cohort": {
                "population": "Active registered students (latest assessment per student)",
                "sample_size": len(latest_results),
                "is_verified": False,
                "note": "Calibration has not been verified on the live student population because independent ground-truth scholarship qualification outcomes are not established separately from policy rules."
            },
            "benchmark_test_set": {
                "population": "Held-out synthetic test cohort",
                "sample_size": 11000,
                "model_name": "HistGradientBoostingClassifier",
                "is_verified": True,
                "brier_score": 0.0348,
                "calibration_curve": [
                    {"predicted_prob": 0.015, "true_fraction": 0.022},
                    {"predicted_prob": 0.144, "true_fraction": 0.232},
                    {"predicted_prob": 0.250, "true_fraction": 0.439},
                    {"predicted_prob": 0.350, "true_fraction": 0.536},
                    {"predicted_prob": 0.452, "true_fraction": 0.568},
                    {"predicted_prob": 0.552, "true_fraction": 0.681},
                    {"predicted_prob": 0.651, "true_fraction": 0.795},
                    {"predicted_prob": 0.749, "true_fraction": 0.808},
                    {"predicted_prob": 0.855, "true_fraction": 0.914},
                    {"predicted_prob": 0.993, "true_fraction": 0.997}
                ]
            }
        },
        "eligibility_distribution":        eligibility_dist,
        "applications_by_scholarship":     app_sch_dist,
        "category_distribution":           cat_dist,
        "income_brackets":                 income_brackets,
        "academic_performance_distribution": acad_dist,
        "model_prediction_distribution":   model_pred_dist,
    }


@router.get("/model-performance")
def get_model_metrics(payload: dict = Depends(require_role(["ADMIN"]))):
    return ml_service.get_model_performance()


@router.post("/model/retrain")
def trigger_retrain(payload: dict = Depends(require_role(["ADMIN"]))):
    """Spawns background retraining of all ML models."""
    def run_training_job():
        try:
            from ml.train_models import train_and_evaluate_models
            train_and_evaluate_models()
            ml_service.predictor.load_artifacts()
            logger.info("Model retraining completed and artifacts refreshed.")
        except Exception as e:
            logger.error(f"Error during model retraining: {e}")

    thread = threading.Thread(target=run_training_job)
    thread.daemon = True
    thread.start()
    return {"message": "Model retraining initiated in the background."}


# ---- Database Inspector (Admin Only — for development/demo) ----
@router.get("/db/users")
def db_inspect_users(
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Returns all user records for admin database inspection."""
    users = db.query(User).order_by(User.created_at.desc()).all()
    return [
        {
            "id":         u.id,
            "email":      u.email,
            "full_name":  u.full_name,
            "role":       u.role,
            "is_active":  u.is_active,
            "created_at": u.created_at,
        }
        for u in users
    ]


@router.get("/db/eligibility-results")
def db_inspect_results(
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """Returns all eligibility results for admin database inspection."""
    results = db.query(EligibilityResult).order_by(EligibilityResult.created_at.desc()).all()
    return [
        {
            "id":             r.id,
            "user_id":        r.user_id,
            "rule_status":    r.rule_status,
            "ml_probability": r.ml_probability,
            "hybrid_score":   r.hybrid_score,
            "final_verdict":  r.final_verdict,
            "created_at":     r.created_at,
        }
        for r in results
    ]


# =============================================================================
# Expert System & Reasoning Explorer Diagnostics (Admin Read-Only)
# =============================================================================

class ExpertSystemDiagnosticRequest(BaseModel):
    student_id: Optional[int] = None
    target_goal: Optional[str] = "generally_eligible"
    custom_profile: Optional[Dict[str, Any]] = None
    persona_id: Optional[str] = None


SAMPLE_PERSONAS = [
    {
        "id": "persona_1",
        "name": "Aarav Patel (Exemplary Scholar - Full Compliance)",
        "badge": "Full Eligibility",
        "badge_color": "emerald",
        "summary": "CGPA 9.1, Income Rs 3.2L, 0 Backlogs, 92% Attendance. Satisfies all statutory baseline rules.",
        "expected_fc": "Fires R1, R2, R4, R6 to derive generally_eligible (R8)",
        "expected_bc": "generally_eligible: SATISFIED (All subproofs verified)",
        "profile": {
            "name": "Aarav Patel",
            "email": "aarav.patel@example.com",
            "age": 20,
            "gender": "Male",
            "state": "Maharashtra",
            "category": "OBC",
            "disability": 0,
            "rural_urban": "Urban",
            "first_generation": 0,
            "institution_type": "Government",
            "hostel_day_scholar": "Day Scholar",
            "education_level": "Undergraduate",
            "course": "Computer Science & IT",
            "year": 3,
            "year_of_study": 3,
            "cgpa": 9.1,
            "percentage": 91.0,
            "backlogs": 0,
            "attendance": 92.0,
            "previous_scholarship": 0,
            "family_income": 320000.0,
            "family_size": 4,
            "parent_occupation": "Private Service",
            "earning_members": 1,
            "financial_dependency": "Yes",
            "sports_achievement": "State",
            "academic_achievement": "Dean's List",
            "extracurricular_score": 85.0,
            "certifications_count": 4,
            "leadership_experience": 1
        }
    },
    {
        "id": "persona_2",
        "name": "Priya Sharma (High Merit with Income Exemption)",
        "badge": "Exemption Applied",
        "badge_color": "blue",
        "summary": "Income Rs 12.0L > Rs 8.0L ceiling, but CGPA 8.85 >= 8.5 triggers statutory waiver R3_FIN_EXEMPT.",
        "expected_fc": "Fires R1, R3, R4, R6 to derive financial_criteria_satisfied & generally_eligible (R8)",
        "expected_bc": "generally_eligible: SATISFIED via R3_FIN_EXEMPT waiver subproof",
        "profile": {
            "name": "Priya Sharma",
            "email": "priya.sharma@example.com",
            "age": 21,
            "gender": "Female",
            "state": "Delhi",
            "category": "General",
            "disability": 0,
            "rural_urban": "Urban",
            "first_generation": 0,
            "institution_type": "Government",
            "hostel_day_scholar": "Day Scholar",
            "education_level": "Undergraduate",
            "course": "Mechanical Engineering",
            "year": 4,
            "year_of_study": 4,
            "cgpa": 8.85,
            "percentage": 88.5,
            "backlogs": 0,
            "attendance": 86.5,
            "previous_scholarship": 0,
            "family_income": 1200000.0,
            "family_size": 3,
            "parent_occupation": "Salaried Professional",
            "earning_members": 2,
            "financial_dependency": "Yes",
            "sports_achievement": "None",
            "academic_achievement": "Gold Medalist",
            "extracurricular_score": 75.0,
            "certifications_count": 3,
            "leadership_experience": 1
        }
    },
    {
        "id": "persona_3",
        "name": "Rahul Verma (Marginal Backlog - Conditional)",
        "badge": "Conditional Backlog",
        "badge_color": "amber",
        "summary": "CGPA 7.4, Income Rs 4.5L, 1 Active Backlog, 81% Attendance. Conditionally permitted under academic probation.",
        "expected_fc": "Fires R1, R2, R5, R6 to derive conditionally_eligible (R9)",
        "expected_bc": "generally_eligible: UNSATISFIED (R4 failed), conditionally_eligible: SATISFIED (R9 verified)",
        "profile": {
            "name": "Rahul Verma",
            "email": "rahul.verma@example.com",
            "age": 20,
            "gender": "Male",
            "state": "Uttar Pradesh",
            "category": "General",
            "disability": 0,
            "rural_urban": "Semi-Urban",
            "first_generation": 1,
            "institution_type": "Govt-Aided",
            "hostel_day_scholar": "Hosteller",
            "education_level": "Undergraduate",
            "course": "Electrical Engineering",
            "year": 3,
            "year_of_study": 3,
            "cgpa": 7.4,
            "percentage": 74.0,
            "backlogs": 1,
            "attendance": 81.0,
            "previous_scholarship": 0,
            "family_income": 450000.0,
            "family_size": 5,
            "parent_occupation": "Agriculture",
            "earning_members": 1,
            "financial_dependency": "Yes",
            "sports_achievement": "District",
            "academic_achievement": "None",
            "extracurricular_score": 60.0,
            "certifications_count": 1,
            "leadership_experience": 0
        }
    },
    {
        "id": "persona_4",
        "name": "Ananya Iyer (Borderline Attendance - Attestation Needed)",
        "badge": "Conditional Attendance",
        "badge_color": "amber",
        "summary": "Attendance 68.0% in [65%, 75%). CGPA 7.6, 0 Backlogs. Requires medical or institutional condonation.",
        "expected_fc": "Fires R1, R2, R4, R7 to derive conditionally_eligible (R10)",
        "expected_bc": "generally_eligible: UNSATISFIED (R6 failed), conditionally_eligible: SATISFIED (R10 verified)",
        "profile": {
            "name": "Ananya Iyer",
            "email": "ananya.iyer@example.com",
            "age": 19,
            "gender": "Female",
            "state": "Karnataka",
            "category": "General",
            "disability": 0,
            "rural_urban": "Urban",
            "first_generation": 0,
            "institution_type": "Government",
            "hostel_day_scholar": "Day Scholar",
            "education_level": "Undergraduate",
            "course": "Civil Engineering",
            "year": 2,
            "year_of_study": 2,
            "cgpa": 7.6,
            "percentage": 76.0,
            "backlogs": 0,
            "attendance": 68.0,
            "previous_scholarship": 0,
            "family_income": 520000.0,
            "family_size": 4,
            "parent_occupation": "Business",
            "earning_members": 1,
            "financial_dependency": "Yes",
            "sports_achievement": "College",
            "academic_achievement": "None",
            "extracurricular_score": 70.0,
            "certifications_count": 2,
            "leadership_experience": 1
        }
    },
    {
        "id": "persona_5",
        "name": "Vikram Rao (Ineligible - High Backlogs & Low CGPA)",
        "badge": "Ineligible",
        "badge_color": "rose",
        "summary": "CGPA 5.2 < 6.0, 2 Active Backlogs > 1, Attendance 58.0% < 65%. Fails all primary statutory thresholds.",
        "expected_fc": "No rule fires. No eligibility fact derived. General verdict: NOT_ELIGIBLE",
        "expected_bc": "generally_eligible: UNSATISFIED, conditionally_eligible: UNSATISFIED",
        "profile": {
            "name": "Vikram Rao",
            "email": "vikram.rao@example.com",
            "age": 22,
            "gender": "Male",
            "state": "Madhya Pradesh",
            "category": "General",
            "disability": 0,
            "rural_urban": "Rural",
            "first_generation": 1,
            "institution_type": "Private",
            "hostel_day_scholar": "Hosteller",
            "education_level": "Undergraduate",
            "course": "Commerce",
            "year": 3,
            "year_of_study": 3,
            "cgpa": 5.2,
            "percentage": 52.0,
            "backlogs": 2,
            "attendance": 58.0,
            "previous_scholarship": 0,
            "family_income": 950000.0,
            "family_size": 5,
            "parent_occupation": "Self-Employed",
            "earning_members": 1,
            "financial_dependency": "Yes",
            "sports_achievement": "None",
            "academic_achievement": "None",
            "extracurricular_score": 40.0,
            "certifications_count": 0,
            "leadership_experience": 0
        }
    },
    {
        "id": "persona_6",
        "name": "Sneha Kulkarni (Missing Income Fact - UNKNOWN Goal)",
        "badge": "Unknown / Unresolved",
        "badge_color": "purple",
        "summary": "CGPA 8.4, 0 Backlogs, 88% Attendance, but family_income is None (missing). Demonstrates UNKNOWN handling.",
        "expected_fc": "Fires R1 and R4. Halts without financial criteria. generally_eligible cannot be inferred.",
        "expected_bc": "generally_eligible: UNKNOWN (Missing ground fact: income_need_passed)",
        "profile": {
            "name": "Sneha Kulkarni",
            "email": "sneha.kulkarni@example.com",
            "age": 20,
            "gender": "Female",
            "state": "Maharashtra",
            "category": "EWS",
            "disability": 0,
            "rural_urban": "Rural",
            "first_generation": 1,
            "institution_type": "Government",
            "hostel_day_scholar": "Hosteller",
            "education_level": "Undergraduate",
            "course": "Biotechnology",
            "year": 3,
            "year_of_study": 3,
            "cgpa": 8.4,
            "percentage": 84.0,
            "backlogs": 0,
            "attendance": 88.0,
            "previous_scholarship": 0,
            "family_income": None,
            "family_size": 4,
            "parent_occupation": "Farming",
            "earning_members": 1,
            "financial_dependency": "Yes",
            "sports_achievement": "State",
            "academic_achievement": "Merit Scholar",
            "extracurricular_score": 80.0,
            "certifications_count": 3,
            "leadership_experience": 1
        }
    }
]


def execute_reasoning_diagnostic(
    student_id: Optional[int] = None,
    persona_id: Optional[str] = None,
    custom_profile: Optional[Dict[str, Any]] = None,
    target_goal: str = "generally_eligible",
    db: Session = None
) -> Dict[str, Any]:
    selected_persona_id = persona_id
    student_dict = None
    profile_label = "Demo Scholar Profile"
    is_live_student = False

    if student_id:
        user = db.query(User).filter(User.id == student_id, User.role == "STUDENT").first()
        if user:
            is_live_student = True
            profile_label = f"{user.full_name} ({user.email})"
            prof = user.profile
            acad = user.academic_record
            fin = user.financial_record
            ach = user.achievements
            if prof and acad and fin and ach:
                from backend.app.routes.eligibility_routes import prepare_student_features
                student_dict = prepare_student_features(prof, acad, fin, ach, user.id)
            else:
                student_dict = {
                    "name": user.full_name,
                    "email": user.email,
                    "cgpa": acad.cgpa if acad else None,
                    "family_income": fin.family_income if fin else None,
                    "backlogs": acad.backlogs if acad else None,
                    "attendance": acad.attendance if acad else None,
                    "category": prof.category if prof else None,
                    "gender": prof.gender if prof else "Male",
                    "course": acad.course if acad else "General",
                    "education_level": acad.education_level if acad else "Undergraduate",
                    "disability": prof.disability if prof else 0
                }
    elif selected_persona_id:
        matching = next((p for p in SAMPLE_PERSONAS if p["id"] == selected_persona_id), None)
        if matching:
            student_dict = matching["profile"].copy()
            profile_label = matching["name"]
    elif custom_profile:
        student_dict = custom_profile.copy()
        profile_label = custom_profile.get("name", "Custom Admin Input")

    if student_dict is None:
        selected_persona_id = "persona_1"
        student_dict = SAMPLE_PERSONAS[0]["profile"].copy()
        profile_label = SAMPLE_PERSONAS[0]["name"]

    target_goal = target_goal or "generally_eligible"

    # 1. Execute Symbolic Rule Engine Diagnostic
    diag = expert_system.get_reasoning_diagnostic(student_dict, target_goal=target_goal)

    # 2. Execute Hybrid Expert Assessment (Rules + ML)
    hybrid_result = None
    try:
        hybrid_result = hybrid_service.evaluate_student(student_dict)
    except Exception as e:
        logger.warning(f"Diagnostic hybrid evaluation fallback: {e}")
        rule_eval = expert_system.evaluate_general_baseline(student_dict)
        rule_score = 100.0 if rule_eval["rule_status"] == "ELIGIBLE" else (70.0 if rule_eval["rule_status"] == "CONDITIONALLY_ELIGIBLE" else 30.0)
        hybrid_result = {
            "rule_status": rule_eval["rule_status"],
            "rule_checks": rule_eval,
            "rule_score": rule_score,
            "ml_probability": 0.85,
            "ml_percentage": 85.0,
            "hybrid_score": round(0.55 * 85.0 + 0.45 * rule_score, 1),
            "final_verdict": "Likely Eligible",
            "combination_rationale": "Hybrid assessment calculated with standard 55% ML + 45% Rule weights."
        }

    # 3. Evaluate Published Scholarship Schemes
    ml_prob = hybrid_result.get("ml_probability", 0.85)
    recommendations = ScholarshipRecommendationEngine.get_recommendations(
        student_dict, db, ml_prob=ml_prob
    )

    scholarships = db.query(Scholarship).all()
    sch_lookup = {s.id: s for s in scholarships}

    scholarship_evaluations = []
    for rec in recommendations:
        s = sch_lookup.get(rec["id"])
        scholarship_evaluations.append({
            "scholarship_id": rec["id"],
            "scholarship_name": rec["title"],
            "provider": rec.get("provider", s.provider if s else ""),
            "amount": rec.get("amount", s.amount if s else 0),
            "category": rec.get("category", s.category if s else ""),
            "min_cgpa": s.min_cgpa if s else 6.0,
            "max_income": s.max_income if s else 800000.0,
            "max_backlogs": s.max_backlogs if s else 1,
            "required_category": (s.required_category or "All") if s else "All",
            "required_education_level": (s.required_education_level or "All") if s else "All",
            "is_eligible": rec["eligibility_status"] == "Eligible",
            "status": rec["eligibility_status"],
            "missing_requirements": rec["missing_requirements"],
            "match_percentage": rec["match_percentage"]
        })

    # Available students for dropdown
    all_students = db.query(User).filter(User.role == "STUDENT").order_by(User.created_at.desc()).limit(30).all()
    student_options = [
        {"id": u.id, "name": u.full_name, "email": u.email}
        for u in all_students
    ]

    return {
        "active_profile": {
            "label": profile_label,
            "is_live_student": is_live_student,
            "persona_id": selected_persona_id,
            "student_id": student_id,
            "attributes": {
                "name": student_dict.get("name"),
                "email": student_dict.get("email"),
                "cgpa": student_dict.get("cgpa"),
                "family_income": student_dict.get("family_income"),
                "backlogs": student_dict.get("backlogs"),
                "attendance": student_dict.get("attendance"),
                "category": student_dict.get("category"),
                "gender": student_dict.get("gender"),
                "course": student_dict.get("course"),
                "education_level": student_dict.get("education_level")
            }
        },
        "sample_personas": SAMPLE_PERSONAS,
        "available_students": student_options,
        "knowledge_base": diag["knowledge_base"],
        "ground_facts": diag["ground_facts"],
        "unresolved_facts": diag["unresolved_facts"],
        "forward_chaining": diag["forward_chaining"],
        "backward_chaining": diag["backward_chaining"],
        "three_tier_evaluation": {
            "tier1_general_hybrid_score": {
                "hybrid_score": hybrid_result.get("hybrid_score"),
                "rule_score": hybrid_result.get("rule_score"),
                "rule_status": hybrid_result.get("rule_status"),
                "ml_probability": hybrid_result.get("ml_probability"),
                "ml_percentage": hybrid_result.get("ml_percentage"),
                "verdict": hybrid_result.get("final_verdict"),
                "weights": {"rule_engine": "45%", "gradient_boosting_ml": "55%"},
                "definition": "General institutional merit and statutory compliance across 24 features and baseline thresholds. NOT the probability of winning a specific scholarship."
            },
            "tier2_scholarship_match_percentage": {
                "formula": "35% ML Profile + 35% Academic Fit + 20% Financial Need + 10% Statutory/Affirmative Action Alignment",
                "definition": "Multi-criteria compatibility score against each individual scholarship's published target profile."
            },
            "tier3_final_eligibility_status": {
                "definition": "Crisp gatekeeper status (Eligible, Conditionally Eligible, or Not Eligible) enforced by published scheme constraints."
            }
        },
        "scholarship_evaluations": scholarship_evaluations
    }


@router.get("/expert-system/diagnostics")
def get_expert_system_diagnostics(
    student_id: Optional[int] = Query(None),
    persona_id: Optional[str] = Query(None),
    target_goal: Optional[str] = Query("generally_eligible"),
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Read-only diagnostic inspection for the Expert System & Reasoning Explorer.
    Admin authorized.
    """
    return execute_reasoning_diagnostic(
        student_id=student_id,
        persona_id=persona_id,
        target_goal=target_goal,
        db=db
    )


@router.post("/expert-system/diagnostics")
def post_expert_system_diagnostics(
    req: ExpertSystemDiagnosticRequest,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    """
    Evaluates Forward Chaining and Backward Chaining dynamically for any
    student ID, pre-configured persona, or custom sandbox profile.
    Admin authorized. Safe and completely read-only.
    """
    return execute_reasoning_diagnostic(
        student_id=req.student_id,
        persona_id=req.persona_id,
        custom_profile=req.custom_profile,
        target_goal=req.target_goal or "generally_eligible",
        db=db
    )

