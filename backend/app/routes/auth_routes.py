"""
Authentication API Endpoints
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.database.models import (
    User, Notification, StudentProfile, AcademicRecord, FinancialRecord, AchievementRecord
)
from backend.app.schemas.auth_schemas import (
    UserRegister, UserLogin, Token, UserResponse, PasswordReset
)
from backend.app.auth.security import get_password_hash, verify_password
from backend.app.auth.jwt_handler import create_access_token, get_current_user_payload
from backend.app.routes.student_routes import calculate_completion

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/auth", tags=["Authentication"])


def _get_user_profile_status(user: User, db: Session):
    """Calculates profile completeness directly from DB records."""
    if user.role != "STUDENT":
        return True, 100
    profile = db.query(StudentProfile).filter(StudentProfile.user_id == user.id).first()
    academics = db.query(AcademicRecord).filter(AcademicRecord.user_id == user.id).first()
    financials = db.query(FinancialRecord).filter(FinancialRecord.user_id == user.id).first()
    achievements = db.query(AchievementRecord).filter(AchievementRecord.user_id == user.id).first()
    completion = calculate_completion(profile, academics, financials, achievements)
    return (completion == 100), completion


@router.post("/register", response_model=Token)
def register(user_in: UserRegister, db: Session = Depends(get_db)):
    # Check if email already exists
    existing = db.query(User).filter(User.email == user_in.email.lower()).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Create user record
    user = User(
        email=user_in.email.lower(),
        password_hash=get_password_hash(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role.upper() if user_in.role else "STUDENT"
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    logger.info(f"[REGISTER] New user created: id={user.id}, email={user.email}, role={user.role}")

    # Add welcome notification for students
    if user.role == "STUDENT":
        welcome_note = Notification(
            user_id=user.id,
            title="Welcome to the Scholarship Portal!",
            message=(
                "Your account has been created successfully. "
                "Please complete your profile to unlock AI eligibility verification "
                "and discover scholarships you qualify for."
            ),
            type="INFO"
        )
        db.add(welcome_note)
        db.commit()

    token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
    token = create_access_token(token_data)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "profile_is_complete": False,
        "profile_completion_percentage": 0,
    }


@router.post("/login", response_model=Token)
def login(login_in: UserLogin, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_in.email.lower()).first()
    if not user or not verify_password(login_in.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password."
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact administrator."
        )

    logger.info(f"[LOGIN] user_id={user.id}, email={user.email}, role={user.role}")

    token_data = {"sub": str(user.id), "email": user.email, "role": user.role}
    token = create_access_token(token_data)
    is_complete, completion = _get_user_profile_status(user, db)

    return {
        "access_token": token,
        "token_type": "bearer",
        "user_id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "profile_is_complete": is_complete,
        "profile_completion_percentage": completion,
    }


@router.get("/me", response_model=UserResponse)
def get_current_user(payload: dict = Depends(get_current_user_payload), db: Session = Depends(get_db)):
    user_id = int(payload.get("sub"))
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    is_complete, completion = _get_user_profile_status(user, db)
    return {
        "id": user.id,
        "email": user.email,
        "full_name": user.full_name,
        "role": user.role,
        "is_active": user.is_active,
        "created_at": user.created_at,
        "profile_is_complete": is_complete,
        "profile_completion_percentage": completion,
    }


@router.post("/forgot-password")
def forgot_password(reset_in: PasswordReset, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == reset_in.email.lower()).first()
    if not user:
        raise HTTPException(status_code=404, detail="No account registered with this email address.")

    user.password_hash = get_password_hash(reset_in.new_password)
    db.commit()
    return {"message": "Password has been successfully updated. You can now log in."}
