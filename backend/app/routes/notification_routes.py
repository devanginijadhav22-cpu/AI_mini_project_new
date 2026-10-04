"""
User Notifications Routes
"""

from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.database.models import Notification
from backend.app.schemas.scholarship_schemas import NotificationResponse
from backend.app.auth.jwt_handler import get_current_user_payload

router = APIRouter(prefix="/notifications", tags=["Notifications"])

@router.get("", response_model=List[NotificationResponse])
def get_notifications(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))
    return db.query(Notification).filter(
        Notification.user_id == user_id
    ).order_by(Notification.created_at.desc()).limit(30).all()

@router.put("/{notification_id}/read")
def mark_read(
    notification_id: int,
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))
    note = db.query(Notification).filter(
        Notification.id == notification_id,
        Notification.user_id == user_id
    ).first()
    if not note:
        raise HTTPException(status_code=404, detail="Notification not found")
        
    note.is_read = True
    db.commit()
    return {"message": "Notification marked as read"}

@router.put("/mark-all-read")
def mark_all_read(
    payload: dict = Depends(get_current_user_payload),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))
    db.query(Notification).filter(
        Notification.user_id == user_id,
        Notification.is_read == False
    ).update({"is_read": True})
    db.commit()
    return {"message": "All notifications marked as read"}
