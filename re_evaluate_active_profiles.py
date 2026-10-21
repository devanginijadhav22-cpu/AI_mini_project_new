"""
Safe Active Student Profile Re-Evaluation Script
Executes Phase 7: Re-evaluates active student profiles under the new caste-independent standard.
Preserves existing historical assessments as immutable audit snapshots.
"""

import sys
import os
import json
import logging
from datetime import datetime

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from backend.app.database.connection import SessionLocal
from backend.app.database.models import (
    User, StudentProfile, AcademicRecord, FinancialRecord,
    AchievementRecord, EligibilityResult
)
from backend.app.services.hybrid_expert_service import HybridExpertService
from backend.app.routes.eligibility_routes import prepare_student_features

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("re_evaluation")

def run_safe_reevaluation():
    db = SessionLocal()
    hybrid_service = HybridExpertService()
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "total_active_students": 0,
        "processed": [],
        "skipped": [],
        "failed": []
    }

    try:
        active_students = db.query(User).filter(
            User.role == "STUDENT",
            User.is_active == True
        ).all()
        
        report["total_active_students"] = len(active_students)
        logger.info(f"Found {len(active_students)} active student users.")

        for student in active_students:
            uid = student.id
            profile = db.query(StudentProfile).filter(StudentProfile.user_id == uid).first()
            academics = db.query(AcademicRecord).filter(AcademicRecord.user_id == uid).first()
            financials = db.query(FinancialRecord).filter(FinancialRecord.user_id == uid).first()
            achievements = db.query(AchievementRecord).filter(AchievementRecord.user_id == uid).first()

            # Validate completeness
            if not profile or not academics or not financials:
                logger.info(f"Student ID {uid}: Skipped (profile incomplete).")
                report["skipped"].append({
                    "user_id": uid,
                    "reason": "Incomplete profile: Missing profile, academic, or financial records"
                })
                continue

            if academics.cgpa is None or academics.attendance is None or financials.family_income is None:
                logger.info(f"Student ID {uid}: Skipped (missing required academic or financial fields).")
                report["skipped"].append({
                    "user_id": uid,
                    "reason": "Missing required scoring fields (CGPA, attendance, or family income)"
                })
                continue

            # Build student dictionary using verified inputs
            student_dict = prepare_student_features(profile, academics, financials, achievements, uid)
            
            # Fetch latest previous evaluation for audit comparison
            prev_result = db.query(EligibilityResult).filter(
                EligibilityResult.user_id == uid
            ).order_by(EligibilityResult.created_at.desc()).first()

            # Execute Hybrid Evaluation (with Experiment 9 Forward/Backward Chaining + retrained ML)
            eval_res = hybrid_service.evaluate_student(student_dict)

            # Store as a NEW immutable historical record
            new_record = EligibilityResult(
                user_id=uid,
                rule_status=eval_res["rule_status"],
                ml_probability=eval_res["ml_probability"],
                hybrid_score=eval_res["hybrid_score"],
                final_verdict=eval_res["final_verdict"],
                positive_factors_json=json.dumps(eval_res["positive_factors"]),
                negative_factors_json=json.dumps(eval_res["negative_factors"]),
                improvement_tips_json=json.dumps(eval_res["improvement_tips"]),
                created_at=datetime.utcnow()
            )
            db.add(new_record)
            db.flush()

            prev_score = prev_result.hybrid_score if prev_result else None
            prev_verdict = prev_result.final_verdict if prev_result else "None"
            logger.info(
                f"Student ID {uid} Successfully Evaluated: "
                f"Previous ({prev_score}, {prev_verdict}) -> New ({eval_res['hybrid_score']}, {eval_res['final_verdict']})"
            )

            report["processed"].append({
                "user_id": uid,
                "previous_hybrid_score": prev_score,
                "new_hybrid_score": eval_res["hybrid_score"],
                "new_ml_probability": eval_res["ml_probability"],
                "new_rule_score": eval_res["rule_score"],
                "new_final_verdict": eval_res["final_verdict"],
                "rule_status": eval_res["rule_status"],
                "new_result_id": new_record.id
            })

        db.commit()
        logger.info("Transaction committed successfully.")

    except Exception as e:
        db.rollback()
        logger.error(f"Re-evaluation failed with error: {e}", exc_info=True)
        report["failed"].append({"error": str(e)})
    finally:
        db.close()

    return report

if __name__ == "__main__":
    report = run_safe_reevaluation()
    print("\n" + "=" * 60)
    print("ACTIVE PROFILES RE-EVALUATION REPORT")
    print("=" * 60)
    print(f"Total Active Students: {report['total_active_students']}")
    print(f"Processed: {len(report['processed'])}")
    print(f"Skipped:   {len(report['skipped'])}")
    print(f"Failed:    {len(report['failed'])}")
    for p in report["processed"]:
        print(f"  User {p['user_id']}: Score={p['new_hybrid_score']}, Verdict='{p['new_final_verdict']}', Rule={p['rule_status']}")
    for s in report["skipped"]:
        print(f"  User {s['user_id']}: {s['reason']}")
