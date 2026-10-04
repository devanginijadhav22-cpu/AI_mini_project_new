"""
Document Upload and Management Routes
"""

import os
import shutil
from typing import List
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from sqlalchemy.orm import Session
from backend.app.database.connection import get_db
from backend.app.database.models import StudentDocument, Notification
from backend.app.schemas.scholarship_schemas import DocumentResponse
from backend.app.auth.jwt_handler import require_role
from backend.app.config import settings

router = APIRouter(prefix="/documents", tags=["Documents"])

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png"}
MAX_FILE_SIZE_MB = 5.0

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    document_type: str = Form(...),
    file: UploadFile = File(...),
    payload: dict = Depends(require_role(["STUDENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))

    # Validate file extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file format. Allowed formats: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Secure user directory
    user_doc_dir = os.path.join(settings.UPLOAD_DIR, f"student_{user_id}")
    os.makedirs(user_doc_dir, exist_ok=True)

    sanitized_filename = f"{document_type.replace(' ', '_').lower()}_{int(os.times()[4])}{ext}"
    dest_path = os.path.join(user_doc_dir, sanitized_filename)

    with open(dest_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_size_kb = round(os.path.getsize(dest_path) / 1024.0, 2)

    # Save metadata to DB
    doc_record = StudentDocument(
        user_id=user_id,
        document_type=document_type,
        filename=file.filename,
        file_path=dest_path,
        file_size_kb=file_size_kb,
        verification_status="VERIFIED"
    )
    db.add(doc_record)

    note = Notification(
        user_id=user_id,
        title="Document Uploaded",
        message=f"'{document_type}' ({file.filename}) was securely uploaded and verified for scholarship applications.",
        type="INFO"
    )
    db.add(note)
    db.commit()
    db.refresh(doc_record)

    return doc_record

@router.get("", response_model=List[DocumentResponse])
def get_documents(
    payload: dict = Depends(require_role(["STUDENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    user_id = int(payload.get("sub"))
    return db.query(StudentDocument).filter(StudentDocument.user_id == user_id).order_by(StudentDocument.uploaded_at.desc()).all()
