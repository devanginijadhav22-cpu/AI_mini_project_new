"""
Admin Management, Analytics, and Model Monitoring Routes
"""

import json
import threading
import logging
from typing import List, Dict, Any
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import func
from backend.app.database.connection import get_db
from backend.app.database.models import (
    User, StudentProfile, AcademicRecord, FinancialRecord, AchievementRecord,
    Scholarship, Application, EligibilityResult, Notification
)
from backend.app.schemas.scholarship_schemas import ScholarshipCreate, ScholarshipResponse
from backend.app.schemas.admin_schemas import (
    AdminDashboardStats, AnalyticsData, ModelPerformanceData,
    StudentSummary, ApplicationAdminView, StatusUpdateRequest
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

    # Count students who have run at least one eligibility check
    total_eligibility_checks = db.query(EligibilityResult).count()

    # Count unique students who have a result marked ELIGIBLE or CONDITIONALLY_ELIGIBLE
    eligible_count = db.query(EligibilityResult).filter(
        EligibilityResult.rule_status.in_(["ELIGIBLE", "CONDITIONALLY_ELIGIBLE"])
    ).count()

    avg_score = db.query(func.avg(EligibilityResult.hybrid_score)).scalar() or 0.0

    pending_apps  = db.query(Application).filter(Application.status.in_(["PENDING", "UNDER_REVIEW"])).count()
    approved_apps = db.query(Application).filter(Application.status == "APPROVED").count()

    return {
        "total_students":            total_students,
        "total_scholarships":        total_scholarships,
        "total_applications":        total_applications,
        "eligible_students_count":   eligible_count,
        "average_eligibility_score": round(float(avg_score), 1),
        "pending_applications":      pending_apps,
        "approved_applications":     approved_apps,
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


@router.get("/applications")
def get_all_applications(
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    apps = db.query(Application).order_by(Application.applied_at.desc()).all()
    results = []
    for a in apps:
        s = a.scholarship
        u = a.user
        results.append({
            "id":                  a.id,
            "student_id":          u.id if u else 0,
            "student_name":        u.full_name if u else "Unknown",
            "student_email":       u.email if u else "N/A",
            "scholarship_id":      s.id if s else 0,
            "scholarship_title":   s.title if s else "Unknown",
            "amount":              s.amount if s else 0.0,
            "status":              a.status,
            "applied_at":          a.applied_at,
            "score_at_application": a.score_at_application,
            "required_category":   s.required_category if s else "All",
            "remarks":             a.remarks
        })
    return results


@router.put("/applications/{app_id}/status")
def update_application_status(
    app_id: int,
    status_in: StatusUpdateRequest,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    app = db.query(Application).filter(Application.id == app_id).first()
    if not app:
        raise HTTPException(status_code=404, detail="Application not found")

    app.status = status_in.status.upper()
    if status_in.remarks:
        app.remarks = status_in.remarks

    note = Notification(
        user_id=app.user_id,
        title=f"Application {app.status.capitalize()}",
        message=f"Your application for '{app.scholarship.title}' status: {app.status}. {status_in.remarks or 'Reviewed by committee.'}",
        type="SUCCESS" if app.status == "APPROVED" else ("WARNING" if app.status == "REJECTED" else "INFO")
    )
    db.add(note)
    db.commit()
    return {"message": f"Application status updated to {app.status}"}


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
