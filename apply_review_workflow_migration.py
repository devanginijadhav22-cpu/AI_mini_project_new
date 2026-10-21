"""
Safe Database Migration for Application Review & Award Workflow
Adds necessary columns to 'applications' and 'student_documents' tables.
Preserves all existing data without data loss.
"""

import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), "scholarship_system.db")

def migrate():
    print(f"Connecting to database: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Get existing columns in applications
    cursor.execute("PRAGMA table_info(applications)")
    app_cols = [row[1] for row in cursor.fetchall()]
    print("Existing applications columns:", app_cols)

    app_new_cols = [
        ("decision_remarks", "TEXT"),
        ("reviewer_id", "INTEGER"),
        ("reviewed_at", "DATETIME"),
        ("award_status", "VARCHAR(30) DEFAULT 'NOT_AWARDED'"),
        ("disbursed_at", "DATETIME"),
        ("disbursement_reference", "VARCHAR(100)"),
        ("disbursement_notes", "TEXT"),
    ]

    for col_name, col_type in app_new_cols:
        if col_name not in app_cols:
            print(f"Adding column '{col_name}' to applications...")
            cursor.execute(f"ALTER TABLE applications ADD COLUMN {col_name} {col_type}")
        else:
            print(f"Column '{col_name}' already exists in applications.")

    # Update award_status for existing approved applications
    cursor.execute("UPDATE applications SET award_status = 'AWARDED' WHERE status = 'APPROVED' AND (award_status IS NULL OR award_status = 'NOT_AWARDED')")

    # Get existing columns in student_documents
    cursor.execute("PRAGMA table_info(student_documents)")
    doc_cols = [row[1] for row in cursor.fetchall()]
    print("Existing student_documents columns:", doc_cols)

    doc_new_cols = [
        ("admin_remarks", "VARCHAR(255)"),
        ("verified_at", "DATETIME"),
        ("verified_by", "INTEGER"),
    ]

    for col_name, col_type in doc_new_cols:
        if col_name not in doc_cols:
            print(f"Adding column '{col_name}' to student_documents...")
            cursor.execute(f"ALTER TABLE student_documents ADD COLUMN {col_name} {col_type}")
        else:
            print(f"Column '{col_name}' already exists in student_documents.")

    conn.commit()
    conn.close()
    print("Migration completed successfully.")

if __name__ == "__main__":
    migrate()
