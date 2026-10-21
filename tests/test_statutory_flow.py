import requests
import json
import os
import sys

BASE = "http://127.0.0.1:8000/api"

def run_statutory_flow_test():
    print("=== Testing Statutory Scholarship Flow for New Student without Stored Category ===")

    # 1. Register a fresh new student with unique email
    import time
    ts = int(time.time())
    email = f"new_obc_{ts}@example.com"
    password = "password123"
    full_name = f"Aarav Patel {ts}"
    reg_res = requests.post(f"{BASE}/auth/register", json={
        "full_name": full_name,
        "email": email,
        "password": password,
        "role": "STUDENT"
    })
    assert reg_res.status_code in (200, 201), f"Registration failed: {reg_res.text}"
    token = reg_res.json()["access_token"]
    print(f"[OK] Registered new test student ({email}).")

    headers = {"Authorization": f"Bearer {token}"}

    # Step 1: Complete general profile WITHOUT entering category
    profile_data = {
        "profile": {
            "age": 21,
            "gender": "Male",
            "phone": "9876543210",
            "state": "Maharashtra",
            "city": "Pune",
            # NOTE: NO category provided!
            "disability": 0,
            "rural_urban": "Urban",
            "first_generation": 0,
            "institution_type": "Government",
            "hostel_day_scholar": "Day Scholar"
        },
        "academics": {
            "education_level": "Undergraduate",
            "course": "Computer Science & IT",
            "year_of_study": 3,
            "cgpa": 8.2,
            "percentage": 78.0,
            "backlogs": 0,
            "attendance": 85.0,
            "previous_scholarship": 0
        },
        "financials": {
            "family_income": 200000.0,
            "family_size": 4,
            "parent_occupation": "Farmer / Agriculture",
            "earning_members": 1,
            "financial_dependency": "Both Parents"
        },
        "achievements": {
            "sports_achievement": "None",
            "academic_achievement": "None",
            "extracurricular_score": 6,
            "certifications_count": 2,
            "leadership_experience": False
        }
    }

    up_res = requests.put(f"{BASE}/student/profile", json=profile_data, headers=headers)
    assert up_res.status_code == 200, f"Profile update failed: {up_res.text}"

    get_prof = requests.get(f"{BASE}/student/profile", headers=headers).json()
    print(f"Profile Completion: {get_prof['profile_completion_percentage']}%, Complete: {get_prof['profile_is_complete']}")
    print(f"Stored Category in Profile: {get_prof['profile'].get('category')}")
    assert get_prof["profile_is_complete"] is True, "Profile must be complete without category!"
    assert get_prof["profile"].get("category") is None, "Category should not be stored in general profile!"

    # Step 2: Complete the general AI eligibility assessment without category
    verify_res = requests.post(f"{BASE}/eligibility/verify", headers=headers)
    assert verify_res.status_code == 200, f"AI verification failed: {verify_res.text}"
    ai_data = verify_res.json()
    print(f"General AI Assessment: Rule={ai_data['rule_status']}, ML Prob={ai_data['ml_probability']:.4f}, Hybrid Score={ai_data['hybrid_score']}, Verdict='{ai_data['final_verdict']}'")

    # Step 3: Select an OBC-restricted scholarship and submit required application documents
    # Find OBC scholarship
    sch_res = requests.get(f"{BASE}/scholarships")
    scholarships = sch_res.json()
    obc_sch = next((s for s in scholarships if s.get("required_category") == "OBC"), None)
    assert obc_sch is not None, "Could not find scholarship with required_category == 'OBC'!"
    print(f"Selected OBC-restricted scholarship: ID={obc_sch['id']}, Title='{obc_sch['title']}', Required Documents: {obc_sch['required_documents']}")

    # Check recommendations endpoint for this student
    recs_res = requests.get(f"{BASE}/recommendations", headers=headers)
    assert recs_res.status_code == 200, f"Recommendations failed: {recs_res.text}"
    recs = recs_res.json()
    obc_rec = next((r for r in recs if r["id"] == obc_sch["id"]), None)
    print(f"OBC scholarship in student's recommendations list: Found={obc_rec is not None}")
    if obc_rec:
        print(f"   Match: {obc_rec['match_percentage']}%, Status: {obc_rec['eligibility_status']}, Missing: {obc_rec['missing_requirements']}")

    # Submit statutory certificate to Document Vault
    doc_content = b"%PDF-1.4 Mock OBC Caste Certificate Content for Aarav Patel"
    files = {"file": ("caste_certificate_obc.pdf", doc_content, "application/pdf")}
    data = {"document_type": "Caste / Category Certificate"}
    doc_res = requests.post(f"{BASE}/documents/upload", files=files, data=data, headers=headers)
    assert doc_res.status_code == 200, f"Document upload failed: {doc_res.text}"
    uploaded_doc = doc_res.json()
    print(f"Uploaded Document: ID={uploaded_doc['id']}, Type='{uploaded_doc['document_type']}', File='{uploaded_doc['filename']}'")

    # Step 4: Submit the application for administrative review
    # Check if application can be submitted without being blocked
    app_payload = {
        "scholarship_id": obc_sch["id"],
        "remarks": "Applying under OBC statutory quota. Caste certificate uploaded in Document Vault."
    }
    app_res = requests.post(f"{BASE}/applications", json=app_payload, headers=headers)
    if app_res.status_code == 400 and "already applied" in app_res.text:
        print("Application already submitted previously. Fetching existing...")
        my_apps = requests.get(f"{BASE}/applications", headers=headers).json()
        app_data = next(a for a in my_apps if a["scholarship_id"] == obc_sch["id"])
    else:
        assert app_res.status_code == 200, f"Application submission failed: {app_res.text}"
        app_data = app_res.json()

    print(f"Application Submitted Successfully: ID={app_data['id']}, Status='{app_data['status']}', Score={app_data['score_at_application']}")
    assert app_data["status"] == "PENDING", f"Application status must be PENDING, got: {app_data['status']}"

    # Step 5: Have an administrator verify the submitted certificate and make the appropriate decision
    admin_login = requests.post(f"{BASE}/auth/login", json={"email": "admin@scholarship.gov.in", "password": "admin123"})
    assert admin_login.status_code == 200, "Admin login failed!"
    admin_token = admin_login.json()["access_token"]
    admin_headers = {"Authorization": f"Bearer {admin_token}"}

    # Admin reviews all applications
    admin_apps_res = requests.get(f"{BASE}/admin/applications", headers=admin_headers)
    assert admin_apps_res.status_code == 200, f"Admin get applications failed: {admin_apps_res.text}"
    admin_apps = admin_apps_res.json()
    target_app = next((a for a in admin_apps if a["id"] == app_data["id"]), None)
    assert target_app is not None, f"Application {app_data['id']} not found in admin applications list!"
    print(f"Admin located Application ID {target_app['id']} for '{target_app['student_name']}' - Status: {target_app['status']}")
    assert target_app.get("required_category") == "OBC", f"Application must indicate required category OBC, got: {target_app.get('required_category')}"

    # Admin inspects student's submitted statutory documents
    admin_docs_res = requests.get(f"{BASE}/documents?student_id={target_app['student_id']}", headers=admin_headers)
    assert admin_docs_res.status_code == 200, f"Admin get documents failed: {admin_docs_res.text}"
    admin_docs = admin_docs_res.json()
    caste_doc = next((d for d in admin_docs if "Caste" in d["document_type"]), None)
    assert caste_doc is not None, "Admin must be able to inspect submitted Caste Certificate"
    print(f"Admin inspected certificate: ID={caste_doc['id']}, File='{caste_doc['filename']}', Status='{caste_doc['verification_status']}'")

    # Admin verifies the student's submitted certificate and approves application
    decision_res = requests.put(
        f"{BASE}/admin/applications/{app_data['id']}/status",
        json={
            "status": "APPROVED",
            "remarks": "OBC Caste Certificate verified against state issuing authority registry. Statutory criteria satisfied."
        },
        headers=admin_headers
    )
    assert decision_res.status_code == 200, f"Admin decision failed: {decision_res.text}"
    print(f"Admin Decision: {decision_res.json()['message']}")

    # Verify student sees updated status
    student_apps = requests.get(f"{BASE}/applications", headers=headers).json()
    updated_app = next(a for a in student_apps if a["id"] == app_data["id"])
    print(f"Student Application Status: {updated_app['status']}, Remarks: '{updated_app['remarks']}'")
    assert updated_app["status"] == "APPROVED"

    print("\nALL 5 STEPS OF TASK 1 VERIFIED END-TO-END!")

if __name__ == "__main__":
    run_statutory_flow_test()
