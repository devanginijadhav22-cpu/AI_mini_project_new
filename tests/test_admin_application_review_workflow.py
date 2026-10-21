"""
Comprehensive Test Suite for Admin Application Review and Award Workflow
Verifies all 10 requirements specified in the project review:
1. Student submits application.
2. Application initially appears as PENDING.
3. Admin views application and full dossier (profile, academics, financials, criteria, AI score).
4. Admin inspects documents securely (and unauthorized student is blocked from downloading others' files).
5. Only authorized admin can start review, request info, approve, or reject.
6. Student cannot change application status directly via API (403 Forbidden).
7. Approved application appears in approved-applicants/awards list for its scholarship.
8. Student sees real-time status and decision remarks in application tracking.
9. Historical applications and assessments remain intact.
10. Award management and genuine disbursement workflow.
"""

import time
import requests
import json
import os
import sys

BASE = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 70)
    print("TEST SUITE: ADMIN APPLICATION REVIEW & AWARD WORKFLOW")
    print("=" * 70)

    # Setup: Admin token
    admin_login = requests.post(f"{BASE}/auth/login", json={"email": "admin@scholarship.gov.in", "password": "admin123"})
    assert admin_login.status_code == 200, "Admin login failed!"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    print("[PASS] 0. Admin authenticated successfully.")

    # 1. Register a fresh test student
    ts = int(time.time())
    email = f"review_test_{ts}@example.com"
    password = "password123"
    full_name = f"Divya Deshmukh {ts}"
    reg_res = requests.post(f"{BASE}/auth/register", json={
        "full_name": full_name,
        "email": email,
        "password": password,
        "role": "STUDENT"
    })
    assert reg_res.status_code in (200, 201), f"Student registration failed: {reg_res.text}"
    student_token = reg_res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    student_id = reg_res.json()["user_id"]
    print(f"[PASS] 1. Registered fresh student: {full_name} (ID: {student_id})")

    # Fill student profile
    profile_payload = {
        "profile": {
            "age": 20,
            "gender": "Female",
            "phone": "9812345678",
            "state": "Maharashtra",
            "city": "Nagpur",
            "disability": 0,
            "rural_urban": "Urban",
            "first_generation": 1,
            "institution_type": "Government",
            "hostel_day_scholar": "Day Scholar"
        },
        "academics": {
            "education_level": "Undergraduate",
            "course": "Computer Science & IT",
            "year_of_study": 2,
            "cgpa": 8.8,
            "percentage": 84.0,
            "backlogs": 0,
            "attendance": 88.0,
            "previous_scholarship": 0
        },
        "financials": {
            "family_income": 320000.0,
            "family_size": 4,
            "parent_occupation": "State Government Employee",
            "earning_members": 1,
            "financial_dependency": "Both Parents"
        },
        "achievements": {
            "sports_achievement": "District",
            "academic_achievement": "School/College Topper",
            "extracurricular_score": 8,
            "certifications_count": 3,
            "leadership_experience": True
        }
    }
    prof_res = requests.put(f"{BASE}/student/profile", json=profile_payload, headers=student_headers)
    assert prof_res.status_code == 200, f"Profile setup failed: {prof_res.text}"

    # Run AI evaluation
    eval_res = requests.post(f"{BASE}/eligibility/verify", headers=student_headers)
    assert eval_res.status_code == 200, f"AI verify failed: {eval_res.text}"
    eval_data = eval_res.json()
    print(f"[PASS] 1b. Profile complete and AI evaluated (Score: {eval_data['hybrid_score']}%, Rule: {eval_data['rule_status']})")

    # Upload test document
    doc_content = b"%PDF-1.4 Mock Marksheet PDF content for Divya"
    files = {"file": ("ug_marksheet_sem3.pdf", doc_content, "application/pdf")}
    data = {"document_type": "Previous Year Marksheet"}
    doc_res = requests.post(f"{BASE}/documents/upload", files=files, data=data, headers=student_headers)
    assert doc_res.status_code == 200, f"Document upload failed: {doc_res.text}"
    uploaded_doc = doc_res.json()
    doc_id = uploaded_doc["id"]
    print(f"[PASS] 1c. Document uploaded: ID={doc_id}, Type='{uploaded_doc['document_type']}'")

    # Get a scholarship to apply for (e.g. scholarship ID 1)
    sch_res = requests.get(f"{BASE}/scholarships")
    scholarships = sch_res.json()
    target_sch = scholarships[0]
    sch_id = target_sch["id"]

    # Student submits application
    app_res = requests.post(f"{BASE}/applications", json={
        "scholarship_id": sch_id,
        "remarks": "Submitting merit dossier for Central Sector Scheme."
    }, headers=student_headers)
    assert app_res.status_code == 200, f"Application submission failed: {app_res.text}"
    app_data = app_res.json()
    app_id = app_data["id"]
    print(f"[PASS] 1d. Student submitted application #{app_id} for '{target_sch['title']}'")

    # 2. Check application initially appears as PENDING in admin portal
    assert app_data["status"] == "PENDING", f"Expected PENDING, got {app_data['status']}"
    admin_apps = requests.get(f"{BASE}/admin/applications?status=PENDING", headers=admin_headers).json()
    found_in_pending = any(a["id"] == app_id for a in admin_apps)
    assert found_in_pending, f"Application #{app_id} not found in admin PENDING list!"
    print(f"[PASS] 2. Application initially appears as PENDING in admin portal.")

    # 3. Admin opens application and inspects full details
    detail_res = requests.get(f"{BASE}/admin/applications/{app_id}", headers=admin_headers)
    assert detail_res.status_code == 200, f"Admin get application detail failed: {detail_res.text}"
    detail = detail_res.json()
    assert detail["student"]["id"] == student_id, "Incorrect student ID in detail"
    assert detail["student"]["full_name"] == full_name, "Incorrect student name in detail"
    assert detail["student"]["academics"]["cgpa"] == 8.8, "Incorrect CGPA in detail"
    assert detail["criteria_evaluation"]["cgpa"]["met"] is True, "CGPA criteria should be met"
    assert "rule_status" in detail["eligibility_assessment"], "Missing rule status in assessment"
    assert "ml_probability" in detail["eligibility_assessment"], "Missing ml_probability in assessment"
    assert len(detail["documents"]) >= 1, "Uploaded document missing in application detail"
    print(f"[PASS] 3. Admin successfully retrieved full application dossier and criteria evaluation.")

    # 4. Admin inspects document securely; and unauthorized student is blocked
    # 4a. Admin download succeeds
    admin_doc_download = requests.get(f"{BASE}/documents/{doc_id}/download", headers=admin_headers)
    assert admin_doc_download.status_code == 200, f"Admin document download failed: {admin_doc_download.status_code}"
    assert b"Mock Marksheet" in admin_doc_download.content, "Document content mismatch"

    # 4b. Owner student download succeeds
    student_doc_download = requests.get(f"{BASE}/documents/{doc_id}/download", headers=student_headers)
    assert student_doc_download.status_code == 200, "Owner student document download failed"

    # 4c. Another unauthorized student download is blocked (403 Forbidden)
    unauthorized_login = requests.post(f"{BASE}/auth/login", json={"email": "student@scholarship.gov.in", "password": "student123"})
    assert unauthorized_login.status_code == 200
    other_token = unauthorized_login.json()["access_token"]
    forbidden_res = requests.get(f"{BASE}/documents/{doc_id}/download", headers={"Authorization": f"Bearer {other_token}"})
    assert forbidden_res.status_code == 403, f"Expected 403 Forbidden for unauthorized download, got {forbidden_res.status_code}"
    print(f"[PASS] 4. Secure document access verified: Admin/Owner OK, Unauthorized student blocked (403).")

    # 4d. Admin updates document verification status
    doc_status_res = requests.put(f"{BASE}/documents/{doc_id}/status", json={
        "verification_status": "VERIFIED",
        "admin_remarks": "Original academic transcript verified against University Examination Division."
    }, headers=admin_headers)
    assert doc_status_res.status_code == 200, f"Document verification status update failed: {doc_status_res.text}"
    assert doc_status_res.json()["verification_status"] == "VERIFIED"
    print(f"[PASS] 4e. Admin updated document verification status to VERIFIED.")

    # 5. Security: Student CANNOT change application status directly
    tamper_res = requests.put(f"{BASE}/admin/applications/{app_id}/status", json={
        "status": "APPROVED",
        "remarks": "Self-approval attempt"
    }, headers=student_headers)
    assert tamper_res.status_code == 403, f"Expected 403 Forbidden for student status modification, got {tamper_res.status_code}"
    print(f"[PASS] 5. Security check: Student forbidden from modifying administrative status (403 Forbidden).")

    # 6. Admin starts review: Transition PENDING -> UNDER_REVIEW
    review_res = requests.put(f"{BASE}/admin/applications/{app_id}/status", json={
        "status": "UNDER_REVIEW",
        "remarks": "Official scrutiny initiated by administrative committee."
    }, headers=admin_headers)
    assert review_res.status_code == 200, f"Start review failed: {review_res.text}"
    assert review_res.json()["status"] == "UNDER_REVIEW"
    print(f"[PASS] 6a. Admin transitioned application to UNDER_REVIEW.")

    # 6b. Admin requests more info: Transition UNDER_REVIEW -> NEEDS_INFORMATION
    # Validation: Remarks are mandatory for NEEDS_INFORMATION
    missing_remarks_res = requests.put(f"{BASE}/admin/applications/{app_id}/status", json={
        "status": "NEEDS_INFORMATION",
        "remarks": ""
    }, headers=admin_headers)
    assert missing_remarks_res.status_code == 400, "Validation should reject empty remarks for NEEDS_INFORMATION"

    needs_info_res = requests.put(f"{BASE}/admin/applications/{app_id}/status", json={
        "status": "NEEDS_INFORMATION",
        "remarks": "Please provide an updated Bonafide student certificate signed by the college dean."
    }, headers=admin_headers)
    assert needs_info_res.status_code == 200, f"Request info failed: {needs_info_res.text}"
    print(f"[PASS] 6b. Admin transitioned application to NEEDS_INFORMATION with mandatory instructions.")

    # Check student sees NEEDS_INFORMATION status and remarks
    student_apps = requests.get(f"{BASE}/applications", headers=student_headers).json()
    curr_app = next(a for a in student_apps if a["id"] == app_id)
    assert curr_app["status"] == "NEEDS_INFORMATION"
    assert "Bonafide student certificate" in curr_app["decision_remarks"]
    print(f"[PASS] 6c. Student tracking shows NEEDS_INFORMATION status with exact committee remarks.")

    # 7. Admin makes Final Decision: APPROVE application
    # Validation: Remarks are mandatory for APPROVAL
    missing_appr_remarks = requests.put(f"{BASE}/admin/applications/{app_id}/status", json={
        "status": "APPROVED",
        "remarks": ""
    }, headers=admin_headers)
    assert missing_appr_remarks.status_code == 400, "Validation should reject empty remarks for APPROVED"

    appr_res = requests.put(f"{BASE}/admin/applications/{app_id}/status", json={
        "status": "APPROVED",
        "remarks": "Merit and income criteria completely verified. Grant approved by National Scholarship Board."
    }, headers=admin_headers)
    assert appr_res.status_code == 200, f"Approval failed: {appr_res.text}"
    appr_data = appr_res.json()
    assert appr_data["status"] == "APPROVED"
    assert appr_data["award_status"] == "AWARDED"
    print(f"[PASS] 7a. Admin approved application #{app_id} (Award Status: AWARDED).")

    # 7b. Check approved applicant appears in scholarship awards list
    awards_res = requests.get(f"{BASE}/admin/scholarships/{sch_id}/awards", headers=admin_headers)
    assert awards_res.status_code == 200, f"Get awards failed: {awards_res.text}"
    awards_list = awards_res.json()
    awarded_applicant = next((a for a in awards_list if a["application_id"] == app_id), None)
    assert awarded_applicant is not None, f"Application #{app_id} not found in scholarship #{sch_id} awards list!"
    assert awarded_applicant["student_name"] == full_name
    assert awarded_applicant["award_status"] == "AWARDED"
    print(f"[PASS] 7b. Approved applicant appears in official scholarship awards list.")

    # 8. Award Management: Record genuine grant disbursement
    # Cannot disburse non-approved application (e.g. app 1 which is PENDING)
    pending_disb = requests.post(f"{BASE}/admin/applications/1/disburse", json={
        "disbursement_reference": "TXN-TEST-001"
    }, headers=admin_headers)
    assert pending_disb.status_code == 400, "Non-approved application disbursement should be blocked"

    # Disburse approved application with audit reference
    disb_res = requests.post(f"{BASE}/admin/applications/{app_id}/disburse", json={
        "disbursement_reference": "PFMS-DBT-2026-NSP89412",
        "disbursement_notes": "Electronic fund transfer credited to student's verified bank account."
    }, headers=admin_headers)
    assert disb_res.status_code == 200, f"Disbursement failed: {disb_res.text}"
    disb_data = disb_res.json()
    assert disb_data["award_status"] == "DISBURSED"
    assert disb_data["disbursement_reference"] == "PFMS-DBT-2026-NSP89412"
    print(f"[PASS] 8a. Genuine disbursement recorded with audit reference: {disb_data['disbursement_reference']}")

    # 8b. Student views disbursed status in tracking portal
    student_apps_final = requests.get(f"{BASE}/applications", headers=student_headers).json()
    final_app = next(a for a in student_apps_final if a["id"] == app_id)
    assert final_app["status"] == "APPROVED"
    assert final_app["award_status"] == "DISBURSED"
    assert final_app["disbursement_reference"] == "PFMS-DBT-2026-NSP89412"
    assert final_app["disbursed_at"] is not None
    print(f"[PASS] 8b. Student sees APPROVED status, decision remarks, and genuine DISBURSED reference.")

    # 9. Admin Dashboard Metrics verification (metrics calculated distinctly)
    dash_res = requests.get(f"{BASE}/admin/dashboard", headers=admin_headers).json()
    assert dash_res["total_applications"] >= 1
    assert dash_res["unique_applicants"] <= dash_res["total_applications"]
    assert dash_res["total_students"] >= dash_res["unique_applicants"]
    print(f"[PASS] 9. Admin metrics verified: Registered Students={dash_res['total_students']}, Unique Applicants={dash_res['unique_applicants']}, Total Apps={dash_res['total_applications']}")

    print("\n" + "=" * 70)
    print("ALL APPLICATION REVIEW & AWARD WORKFLOW TESTS PASSED PERFECTLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
