"""
Main FastAPI Application Entrypoint
Scholarship Eligibility Expert System
"""

import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.config import settings
from backend.app.database.connection import engine, Base, SessionLocal
from backend.app.database.models import (
    User, StudentProfile, AcademicRecord, FinancialRecord, AchievementRecord,
    Scholarship, EligibilityResult, Notification
)
from backend.app.auth.security import get_password_hash
from backend.app.routes import (
    auth_routes, student_routes, eligibility_routes,
    scholarship_routes, application_routes, document_routes,
    notification_routes, admin_routes
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S"
)
logger = logging.getLogger(__name__)


def seed_initial_data():
    """
    Seeds demo accounts and scholarships ONLY if they don't already exist.
    NEVER drops or recreates existing records.
    New registrations are completely independent and unaffected.
    """
    db = SessionLocal()
    try:
        # ---- 1. Admin Account (create-if-not-exists) ----
        admin_user = db.query(User).filter(User.email == "admin@scholarship.gov.in").first()
        if not admin_user:
            admin_user = User(
                email="admin@scholarship.gov.in",
                password_hash=get_password_hash("admin123"),
                full_name="National Scholarship Administrator",
                role="ADMIN",
                is_active=True
            )
            db.add(admin_user)
            db.commit()
            logger.info("Seed: Admin account created (admin@scholarship.gov.in / admin123)")

        # ---- 2. Demo Student Account (create-if-not-exists) ----
        demo_student = db.query(User).filter(User.email == "student@scholarship.gov.in").first()
        if not demo_student:
            demo_student = User(
                email="student@scholarship.gov.in",
                password_hash=get_password_hash("student123"),
                full_name="Aarav Sharma",
                role="STUDENT",
                is_active=True
            )
            db.add(demo_student)
            db.commit()
            db.refresh(demo_student)

            # Create complete profile for demo student only
            profile = StudentProfile(
                user_id=demo_student.id,
                age=20,
                gender="Male",
                phone="+91 98765 43210",
                state="Maharashtra",
                city="Pune",
                category="OBC",
                disability=0,
                rural_urban="Semi-Urban",
                first_generation=1,
                institution_type="Government",
                hostel_day_scholar="Hosteller"
            )
            academics = AcademicRecord(
                user_id=demo_student.id,
                education_level="Undergraduate",
                course="Computer Science & IT",
                year_of_study=3,
                cgpa=8.65,
                percentage=82.4,
                backlogs=0,
                attendance=89.0,
                previous_scholarship=0
            )
            financials = FinancialRecord(
                user_id=demo_student.id,
                family_income=240000.0,
                family_size=4,
                parent_occupation="Farmer / Agriculture",
                earning_members=1,
                financial_dependency="Both Parents"
            )
            achievements = AchievementRecord(
                user_id=demo_student.id,
                sports_achievement="District",
                academic_achievement="School/College Topper",
                extracurricular_score=8,
                certifications_count=3,
                leadership_experience=True
            )
            welcome_note = Notification(
                user_id=demo_student.id,
                title="Demo Profile Pre-configured",
                message="Your demo student profile is fully configured for presentation. Click 'Run AI Eligibility Verification' to see the full pipeline in action.",
                type="SUCCESS"
            )
            db.add_all([profile, academics, financials, achievements, welcome_note])
            db.commit()
            logger.info("Seed: Demo student created (student@scholarship.gov.in / student123)")

        # ---- 3. Scholarships (create-if-none-exist) ----
        existing_sch_count = db.query(Scholarship).count()
        if existing_sch_count == 0:
            sample_scholarships = [
                Scholarship(
                    title="Central Sector Scheme for College and University Students",
                    provider="Ministry of Education, Govt. of India",
                    description="Provides financial assistance to meritorious students from low-income families to meet day-to-day educational expenses while pursuing higher studies.",
                    amount=20000.0,
                    deadline="30 November 2026",
                    category="Merit-cum-Means",
                    min_cgpa=7.5,
                    max_income=450000.0,
                    max_backlogs=0,
                    min_attendance=75.0,
                    required_category="All",
                    required_education_level="Undergraduate",
                    required_courses="All",
                    required_documents="Income Certificate, 12th Marksheet, Aadhaar Card, Bank Passbook"
                ),
                Scholarship(
                    title="Pragati Scholarship for Female STEM Scholars",
                    provider="AICTE (All India Council for Technical Education)",
                    description="Special initiative aimed at empowering female students pursuing technical degree and diploma courses in recognized AICTE institutions.",
                    amount=50000.0,
                    deadline="15 December 2026",
                    category="Girl Child & STEM",
                    min_cgpa=6.5,
                    max_income=800000.0,
                    max_backlogs=1,
                    min_attendance=70.0,
                    required_category="Female",
                    required_education_level="Undergraduate",
                    required_courses="Computer Science & IT, Mechanical Engineering, Electrical Engineering, Civil Engineering",
                    required_documents="Bonafide Certificate, Income Certificate, Category Certificate, Fee Receipt"
                ),
                Scholarship(
                    title="Post-Matric Scholarship Scheme for Minorities & Reserved Categories",
                    provider="Ministry of Social Justice and Empowerment",
                    description="Covers maintenance allowances and compulsory non-refundable fees for eligible SC, ST, and OBC candidates in accredited institutions.",
                    amount=35000.0,
                    deadline="20 November 2026",
                    category="Category Specific",
                    min_cgpa=6.0,
                    max_income=250000.0,
                    max_backlogs=1,
                    min_attendance=65.0,
                    required_category="OBC",
                    required_education_level="All",
                    required_courses="All",
                    required_documents="Caste Certificate, Income Certificate, Previous Year Marksheet, Ration Card"
                ),
                Scholarship(
                    title="Reliance Foundation Undergraduate Scholarship",
                    provider="Reliance Foundation",
                    description="Prestigious competitive fellowship supporting first-year undergraduate students with leadership potential, innovation mindset, and academic excellence.",
                    amount=200000.0,
                    deadline="10 January 2027",
                    category="Merit",
                    min_cgpa=8.5,
                    max_income=1500000.0,
                    max_backlogs=0,
                    min_attendance=80.0,
                    required_category="All",
                    required_education_level="Undergraduate",
                    required_courses="All",
                    required_documents="Entrance Exam Rank Card, Academic Transcripts, Letter of Recommendation, Statement of Purpose"
                ),
                Scholarship(
                    title="HDFC Badhte Kadam Need-Based Educational Grant",
                    provider="HDFC Bank CSR Parivartan",
                    description="Special aid program designed to support students facing acute family crisis, single-parent dependency, or low household income to prevent academic dropout.",
                    amount=40000.0,
                    deadline="28 February 2027",
                    category="Need-Based",
                    min_cgpa=6.0,
                    max_income=300000.0,
                    max_backlogs=1,
                    min_attendance=70.0,
                    required_category="All",
                    required_education_level="All",
                    required_courses="All",
                    required_documents="Income Proof (ITR / Tehsildar Certificate), Admission Letter, Electricity Bill"
                ),
                Scholarship(
                    title="National Fellowship for Students with Disabilities (PwD)",
                    provider="Department of Empowerment of Persons with Disabilities",
                    description="Dedicated grant for scholars with verified 40%+ physical or sensory disability pursuing undergraduate or postgraduate programs.",
                    amount=60000.0,
                    deadline="15 March 2027",
                    category="Disability / PwD",
                    min_cgpa=5.5,
                    max_income=800000.0,
                    max_backlogs=2,
                    min_attendance=65.0,
                    required_category="All",
                    required_education_level="All",
                    required_courses="All",
                    required_documents="UDID / Disability Certificate, Marksheets, Bonafide Certificate"
                ),
                Scholarship(
                    title="Sitaram Jindal Foundation Rural & Semi-Urban Merit Scholarship",
                    provider="Sitaram Jindal Charitable Trust",
                    description="Provides recurring monthly stipends for students residing in rural communities pursuing polytechnic, degree, or professional healthcare streams.",
                    amount=25000.0,
                    deadline="30 April 2027",
                    category="Rural Upliftment",
                    min_cgpa=7.0,
                    max_income=400000.0,
                    max_backlogs=0,
                    min_attendance=75.0,
                    required_category="All",
                    required_education_level="All",
                    required_courses="All",
                    required_documents="Rural Residence Certificate, Parent Income Certificate, College Principal Recommendation"
                ),
                Scholarship(
                    title="INSPIRE Scholarship for Higher Science Education (SHE)",
                    provider="Department of Science & Technology (DST)",
                    description="Offered to top 1% meritorious students pursuing natural and basic science degrees (B.Sc / M.Sc / BS-MS) to encourage research careers.",
                    amount=80000.0,
                    deadline="31 December 2026",
                    category="Merit",
                    min_cgpa=8.8,
                    max_income=1200000.0,
                    max_backlogs=0,
                    min_attendance=85.0,
                    required_category="All",
                    required_education_level="Undergraduate",
                    required_courses="B.Sc Science",
                    required_documents="Top 1% Board Cut-off Certificate, Course Registration, Research Project Plan"
                )
            ]
            db.add_all(sample_scholarships)
            db.commit()
            logger.info(f"Seed: {len(sample_scholarships)} scholarships added.")

    except Exception as e:
        logger.error(f"Seed error: {e}")
        db.rollback()
    finally:
        db.close()


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create DB tables (create-if-not-exists — safe to run repeatedly)
    Base.metadata.create_all(bind=engine)
    seed_initial_data()
    logger.info("Scholarship Eligibility Expert System — Backend started.")
    yield


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Full-stack AI-powered Scholarship Eligibility & Recommendation Platform combining Rule-Based Expert Systems with Machine Learning and Explainable AI.",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static file serving for uploaded documents
if os.path.exists(settings.UPLOAD_DIR):
    app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")

# Include Routers
app.include_router(auth_routes.router, prefix=settings.API_V1_STR)
app.include_router(student_routes.router, prefix=settings.API_V1_STR)
app.include_router(eligibility_routes.router, prefix=settings.API_V1_STR)
app.include_router(scholarship_routes.router, prefix=settings.API_V1_STR)
app.include_router(application_routes.router, prefix=settings.API_V1_STR)
app.include_router(document_routes.router, prefix=settings.API_V1_STR)
app.include_router(notification_routes.router, prefix=settings.API_V1_STR)
app.include_router(admin_routes.router, prefix=settings.API_V1_STR)


@app.get("/")
def root():
    return {
        "project": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "api_v1": settings.API_V1_STR
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host="127.0.0.1", port=8000, reload=True)
