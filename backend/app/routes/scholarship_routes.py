"""
Scholarship Exploration and Details Routes
"""

from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import or_
from backend.app.database.connection import get_db
from backend.app.database.models import Scholarship
from backend.app.schemas.scholarship_schemas import ScholarshipResponse

router = APIRouter(prefix="/scholarships", tags=["Scholarships"])

@router.get("", response_model=List[ScholarshipResponse])
def get_scholarships(
    search: Optional[str] = None,
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(Scholarship).filter(Scholarship.is_active == True)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                Scholarship.title.ilike(search_filter),
                Scholarship.provider.ilike(search_filter),
                Scholarship.description.ilike(search_filter)
            )
        )

    if category and category != "All":
        query = query.filter(Scholarship.category == category)

    return query.order_by(Scholarship.amount.desc()).all()

@router.get("/{scholarship_id}", response_model=ScholarshipResponse)
def get_scholarship(scholarship_id: int, db: Session = Depends(get_db)):
    scholarship = db.query(Scholarship).filter(Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
    return scholarship
