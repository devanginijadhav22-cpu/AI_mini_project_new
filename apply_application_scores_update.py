"""
Migration: Add eligibility_result_id and match_score_at_application to applications table.
Populates existing applications with exact assessment linkage and scholarship match scores.
"""
import sqlite3
import datetime
from backend.app.database.connection import SessionLocal
from backend.app.database.models import Application, EligibilityResult, Scholarship, User
from backend.app.services.recommendation_service import ScholarshipRecommendationEngine

def migrate():
    # 1. Add columns to SQLite database if not present
    conn = sqlite3.connect("scholarship_system.db")
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(applications)")
    cols = [col[1] for col in cursor.fetchall()]

    if "eligibility_result_id" not in cols:
        print("Adding column 'eligibility_result_id' to applications table...")
        cursor.execute("ALTER TABLE applications ADD COLUMN eligibility_result_id INTEGER REFERENCES eligibility_results(id)")
    
    if "match_score_at_application" not in cols:
        print("Adding column 'match_score_at_application' to applications table...")
        cursor.execute("ALTER TABLE applications ADD COLUMN match_score_at_application FLOAT")

    conn.commit()
    conn.close()

    # 2. Backfill existing applications with accurate assessment links and match scores
    db = SessionLocal()
    try:
        apps = db.query(Application).all()
        print(f"Backfilling {len(apps)} applications...")

        for a in apps:
            student = a.user
            sch = a.scholarship
            if not student or not sch:
                continue

            # Find the assessment associated with this application
            eval_res = db.query(EligibilityResult).filter(
                EligibilityResult.user_id == a.user_id,
                EligibilityResult.created_at <= a.applied_at
            ).order_by(EligibilityResult.created_at.desc()).first()

            if not eval_res:
                eval_res = db.query(EligibilityResult).filter(
                    EligibilityResult.user_id == a.user_id
                ).order_by(EligibilityResult.created_at.desc()).first()

            if eval_res and not a.eligibility_result_id:
                a.eligibility_result_id = eval_res.id
                # Ensure score_at_application holds this saved assessment's hybrid score
                if a.score_at_application == 0.0 or a.score_at_application is None:
                    a.score_at_application = eval_res.hybrid_score

            # Compute scholarship match score at application
            if a.match_score_at_application is None:
                prof = student.profile
                acad = student.academic_record
                fin = student.financial_record
                student_dict = {
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
                ml_p = eval_res.ml_probability if eval_res else 0.85
                recs = ScholarshipRecommendationEngine.get_recommendations(student_dict, db, ml_prob=ml_p)
                target = next((r for r in recs if r["id"] == sch.id), None)
                if target:
                    a.match_score_at_application = target["match_percentage"]

        db.commit()
        print("Backfill completed successfully.")
    finally:
        db.close()

if __name__ == "__main__":
    migrate()
