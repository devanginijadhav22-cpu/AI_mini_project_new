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
from backend.app.routes.student_routes import calculate_completion

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/admin", tags=["Admin Operations"])
ml_service = MLService.get_instance()


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

    # Latest eligibility assessment for this student
    latest_eval = db.query(EligibilityResult).filter(
        EligibilityResult.user_id == app.user_id
    ).order_by(EligibilityResult.created_at.desc()).first()

    pos_factors = []
    neg_factors = []
    tips = []
    if latest_eval:
        try:
            pos_factors = json.loads(latest_eval.positive_factors_json) if latest_eval.positive_factors_json else []
        except Exception:
            pos_factors = []
        try:
            neg_factors = json.loads(latest_eval.negative_factors_json) if latest_eval.negative_factors_json else []
        except Exception:
            neg_factors = []
        try:
            tips = json.loads(latest_eval.improvement_tips_json) if latest_eval.improvement_tips_json else []
        except Exception:
            tips = []

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
            "rule_status": latest_eval.rule_status if latest_eval else "NOT_ASSESSED",
            "ml_probability": latest_eval.ml_probability if latest_eval else 0.0,
            "hybrid_score": latest_eval.hybrid_score if latest_eval else 0.0,
            "final_verdict": latest_eval.final_verdict if latest_eval else "Not Assessed",
            "positive_factors": pos_factors,
            "negative_factors": neg_factors,
            "improvement_tips": tips,
            "evaluated_at": latest_eval.created_at if latest_eval else None,
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
    # ---- Eligibility Distribution (real data) ----
    results = db.query(EligibilityResult).all()
    highly_eligible = sum(1 for r in results if r.hybrid_score >= 75)
    cond_eligible   = sum(1 for r in results if 50 <= r.hybrid_score < 75)
    not_eligible    = sum(1 for r in results if r.hybrid_score < 50)

    eligibility_dist = [
        {"name": "Highly Eligible (75+)", "count": highly_eligible, "fill": "#10B981"},
        {"name": "Conditionally Eligible (50-74)", "count": cond_eligible, "fill": "#F59E0B"},
        {"name": "Ineligible (<50)", "count": not_eligible, "fill": "#EF4444"}
    ]

    # ---- Category distribution (real data) ----
    categories = db.query(StudentProfile.category, func.count(StudentProfile.id)).group_by(StudentProfile.category).all()
    cat_dist = [{"name": c[0] or "Unknown", "students": c[1]} for c in categories] if categories else []

    # ---- Applications by scholarship (real data) ----
    apps_by_sch = db.query(
        Scholarship.title, func.count(Application.id)
    ).join(Application, Scholarship.id == Application.scholarship_id).group_by(Scholarship.title).limit(8).all()
    app_sch_dist = [{"title": a[0][:30] + ("..." if len(a[0]) > 30 else ""), "applications": a[1]} for a in apps_by_sch]

    # ---- Income Brackets (real data from financial_records) ----
    fin_records = db.query(FinancialRecord.family_income).all()
    incomes = [r[0] for r in fin_records if r[0] is not None]
    income_brackets = [
        {"bracket": "< ₹1.5L",       "students": sum(1 for i in incomes if i < 150000)},
        {"bracket": "₹1.5L - ₹3.0L", "students": sum(1 for i in incomes if 150000 <= i < 300000)},
        {"bracket": "₹3.0L - ₹5.0L", "students": sum(1 for i in incomes if 300000 <= i < 500000)},
        {"bracket": "₹5.0L - ₹8.0L", "students": sum(1 for i in incomes if 500000 <= i < 800000)},
        {"bracket": "> ₹8.0L",        "students": sum(1 for i in incomes if i >= 800000)},
    ]

    # ---- CGPA Distribution (real data) ----
    cgpa_records = db.query(AcademicRecord.cgpa).all()
    cgpas = [r[0] for r in cgpa_records if r[0] is not None]
    acad_dist = [
        {"range": "9.0 - 10.0", "students": sum(1 for c in cgpas if c >= 9.0)},
        {"range": "8.0 - 8.9",  "students": sum(1 for c in cgpas if 8.0 <= c < 9.0)},
        {"range": "7.0 - 7.9",  "students": sum(1 for c in cgpas if 7.0 <= c < 8.0)},
        {"range": "6.0 - 6.9",  "students": sum(1 for c in cgpas if 6.0 <= c < 7.0)},
        {"range": "< 6.0",       "students": sum(1 for c in cgpas if c < 6.0)},
    ]

    # ---- ML Probability Distribution (real data from eligibility_results) ----
    probs = [r.ml_probability for r in results]
    model_pred_dist = [
        {"probability": "90% - 100%", "count": sum(1 for p in probs if p >= 0.90)},
        {"probability": "80% - 89%",  "count": sum(1 for p in probs if 0.80 <= p < 0.90)},
        {"probability": "70% - 79%",  "count": sum(1 for p in probs if 0.70 <= p < 0.80)},
        {"probability": "50% - 69%",  "count": sum(1 for p in probs if 0.50 <= p < 0.70)},
        {"probability": "< 50%",      "count": sum(1 for p in probs if p < 0.50)},
    ]

    return {
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
