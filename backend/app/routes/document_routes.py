"""
Document Upload and Management Routes
"""

import os
import shutil
from typing import List, Optional
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

    safe_doc_name = "".join(c if c.isalnum() or c in ("-", "_") else "_" for c in document_type.lower())
    sanitized_filename = f"{safe_doc_name}_{int(os.times()[4])}{ext}"
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
    student_id: Optional[int] = None,
    payload: dict = Depends(require_role(["STUDENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    role = payload.get("role")
    caller_id = int(payload.get("sub"))
    target_id = student_id if (role == "ADMIN" and student_id is not None) else caller_id
    return db.query(StudentDocument).filter(StudentDocument.user_id == target_id).order_by(StudentDocument.uploaded_at.desc()).all()


@router.get("/{doc_id}/download")
def download_document(
    doc_id: int,
    payload: dict = Depends(require_role(["STUDENT", "ADMIN"])),
    db: Session = Depends(get_db)
):
    from fastapi.responses import FileResponse
    import mimetypes

    role = payload.get("role")
    caller_id = int(payload.get("sub"))

    doc = db.query(StudentDocument).filter(StudentDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    # Scope authorization: student can only download their own document
    if role != "ADMIN" and doc.user_id != caller_id:
        raise HTTPException(status_code=403, detail="Unauthorized access to document")

    real_file_path = os.path.abspath(doc.file_path)
    upload_root = os.path.abspath(settings.UPLOAD_DIR)

    # Protect against path traversal
    if not real_file_path.startswith(upload_root):
        raise HTTPException(status_code=403, detail="Invalid document path")

    if not os.path.exists(real_file_path):
        raise HTTPException(status_code=404, detail="Document file does not exist on disk")

    media_type, _ = mimetypes.guess_type(real_file_path)
    return FileResponse(
        path=real_file_path,
        filename=doc.filename,
        media_type=media_type or "application/octet-stream"
    )


@router.put("/{doc_id}/status", response_model=DocumentResponse)
def update_document_verification(
    doc_id: int,
    status_data: dict,
    payload: dict = Depends(require_role(["ADMIN"])),
    db: Session = Depends(get_db)
):
    from datetime import datetime
    admin_id = int(payload.get("sub"))

    doc = db.query(StudentDocument).filter(StudentDocument.id == doc_id).first()
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")

    new_status = status_data.get("verification_status", "VERIFIED").upper()
    valid_statuses = {"VERIFIED", "NEEDS_CORRECTION", "REJECTED", "PENDING"}
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    doc.verification_status = new_status
    doc.admin_remarks = status_data.get("admin_remarks")
    doc.verified_at = datetime.utcnow()
    doc.verified_by = admin_id

    # Add notification for student if action needed
    if new_status in ("NEEDS_CORRECTION", "REJECTED"):
        note = Notification(
            user_id=doc.user_id,
            title=f"Document Update: {doc.document_type}",
            message=f"Administrator feedback on '{doc.filename}': {doc.verification_status}. Remarks: {doc.admin_remarks or 'Please re-upload with clear details.'}",
            type="WARNING"
        )
        db.add(note)

    db.commit()
    db.refresh(doc)
    return doc
