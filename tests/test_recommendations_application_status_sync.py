"""
Test Suite: Synchronized Recommendations with Real Application & Award Statuses
Tests that the recommendations API and student cards accurately reflect:
1. Not Applied (Apply action available)
2. Pending (Application Submitted, no duplicate Apply)
3. Under Review (Committee Under Review status)
4. Needs Information (Action Required with committee remarks)
5. Approved (Scholarship Awarded)
6. Disbursed (Genuine DBT disbursement status and reference, distinct from Awarded)
7. Rejected (Application Rejected with decision remarks)
8. Student isolation (Student A does not see Student B's applications)
9. Reapplication prevention (duplicate applications blocked with HTTP 400)
"""

import sys, os
sys.path.insert(0, os.path.abspath('.'))
import requests
import json
import time

BASE_URL = 'http://127.0.0.1:8000/api'

def run_tests():
    print("======================================================================")
    print("TEST SUITE: RECOMMENDATIONS & LIVE APPLICATION STATUS SYNCHRONIZATION")
    print("======================================================================")

    # 1. Admin login
    admin_login = requests.post(f"{BASE_URL}/auth/login", json={'email': 'admin@scholarship.gov.in', 'password': 'admin123'})
    assert admin_login.status_code == 200, f"Admin login failed: {admin_login.text}"
    admin_token = admin_login.json()['access_token']
    admin_headers = {'Authorization': f'Bearer {admin_token}'}
    print("[PASS] 1. Admin authenticated.")

    # 2. Register fresh Student A
    ts = int(time.time() * 1000)
    student_a_email = f"student_a_{ts}@example.com"
    reg_a = requests.post(f"{BASE_URL}/auth/register", json={
        'full_name': f'Student Alpha {ts}',
        'email': student_a_email,
        'password': 'password123',
        'role': 'STUDENT'
    }).json()
    token_a = reg_a['access_token']
    user_a_id = reg_a['user_id']
    headers_a = {'Authorization': f'Bearer {token_a}'}
    print(f"[PASS] 2. Registered Student A (ID: {user_a_id})")

    # Fill profile for Student A
    requests.put(f"{BASE_URL}/student/profile", json={
        "profile": {
            "age": 20, "gender": "Female", "phone": "9812345678", "state": "Maharashtra", "city": "Nagpur",
            "disability": 0, "rural_urban": "Urban", "first_generation": 1, "institution_type": "Government",
            "hostel_day_scholar": "Day Scholar", "category": "OBC"
        },
        "academics": {
            "education_level": "Undergraduate", "course": "Computer Science & IT", "year_of_study": 2,
            "cgpa": 8.8, "percentage": 84.0, "backlogs": 0, "attendance": 88.0, "previous_scholarship": 0
        },
        "financials": {
            "family_income": 200000.0, "family_size": 4, "parent_occupation": "Private Sector",
            "earning_members": 1, "financial_dependency": "Both Parents"
        },
        "achievements": {
            "sports_achievement": "District", "academic_achievement": "School/College Topper",
            "extracurricular_score": 8, "certifications_count": 3, "leadership_experience": True
        }
    }, headers=headers_a)
    requests.post(f"{BASE_URL}/eligibility/verify", headers=headers_a)

    # 3. Register fresh Student B (for isolation test)
    student_b_email = f"student_b_{ts}@example.com"
    reg_b = requests.post(f"{BASE_URL}/auth/register", json={
        'full_name': f'Student Beta {ts}',
        'email': student_b_email,
        'password': 'password123',
        'role': 'STUDENT'
    }).json()
    token_b = reg_b['access_token']
    user_b_id = reg_b['user_id']
    headers_b = {'Authorization': f'Bearer {token_b}'}
    print(f"[PASS] 3. Registered Student B (ID: {user_b_id})")

    requests.put(f"{BASE_URL}/student/profile", json={
        "profile": {
            "age": 21, "gender": "Male", "phone": "9812345679", "state": "Karnataka", "city": "Bangalore",
            "disability": 0, "rural_urban": "Urban", "first_generation": 0, "institution_type": "Private",
            "hostel_day_scholar": "Hosteller", "category": "General"
        },
        "academics": {
            "education_level": "Undergraduate", "course": "Mechanical Engineering", "year_of_study": 3,
            "cgpa": 7.5, "percentage": 72.0, "backlogs": 0, "attendance": 80.0, "previous_scholarship": 0
        },
        "financials": {
            "family_income": 400000.0, "family_size": 4, "parent_occupation": "Business",
            "earning_members": 2, "financial_dependency": "Both Parents"
        },
        "achievements": {
            "sports_achievement": "None", "academic_achievement": "None",
            "extracurricular_score": 5, "certifications_count": 1, "leadership_experience": False
        }
    }, headers=headers_b)
    requests.post(f"{BASE_URL}/eligibility/verify", headers=headers_b)

    # 4. Check Initial Recommendations for Student A (All should be NOT APPLIED)
    recs_a_initial = requests.get(f"{BASE_URL}/recommendations", headers=headers_a).json()
    assert len(recs_a_initial) > 0, "Recommendations should not be empty"
    for r in recs_a_initial:
        assert r.get('application_status') is None, f"Scholarship {r['id']} should have None application_status"
    print(f"[PASS] 4. Initially, all {len(recs_a_initial)} recommendations for Student A show 'Not Applied'.")

    # 5. Student A submits application for Scholarship #1
    sch_1_id = recs_a_initial[0]['id']
    sch_1_title = recs_a_initial[0]['title']
    app_res = requests.post(f"{BASE_URL}/applications", json={'scholarship_id': sch_1_id, 'remarks': 'First application'}, headers=headers_a).json()
    app_1_id = app_res['id']
    print(f"[PASS] 5. Student A applied for Scholarship #{sch_1_id} '{sch_1_title}' -> Application ID #{app_1_id}")

    # 6. Verify duplicate application is blocked with HTTP 400
    dup_res = requests.post(f"{BASE_URL}/applications", json={'scholarship_id': sch_1_id}, headers=headers_a)
    assert dup_res.status_code == 400, f"Expected 400 Bad Request, got {dup_res.status_code}"
    print(f"[PASS] 6. Duplicate application correctly rejected with HTTP 400: '{dup_res.json()['detail']}'")

    # 7. Check Recommendations for Student A: Scholarship #1 must now be PENDING
    recs_a_after_apply = requests.get(f"{BASE_URL}/recommendations", headers=headers_a).json()
    sch_1_rec = next(r for r in recs_a_after_apply if r['id'] == sch_1_id)
    assert sch_1_rec['application_status'] == 'PENDING', f"Expected PENDING, got {sch_1_rec['application_status']}"
    assert sch_1_rec['application_id'] == app_1_id
    print(f"[PASS] 7. Recommendations now reflects PENDING / Applied status for Scholarship #{sch_1_id}")

    # 8. Check Student Isolation: Student B must NOT see Student A's application!
    recs_b = requests.get(f"{BASE_URL}/recommendations", headers=headers_b).json()
    sch_1_rec_b = next((r for r in recs_b if r['id'] == sch_1_id), None)
    if sch_1_rec_b:
        assert sch_1_rec_b.get('application_status') is None, "Student B should not see Student A's application!"
    print(f"[PASS] 8. Student Isolation verified: Student B sees Scholarship #{sch_1_id} as Not Applied.")

    # 9. Admin moves Application #1 to UNDER_REVIEW
    res_ur = requests.put(f"{BASE_URL}/admin/applications/{app_1_id}/status", json={
        'status': 'UNDER_REVIEW'
    }, headers=admin_headers)
    assert res_ur.status_code == 200, f"Status update failed: {res_ur.text}"

    recs_a_under_review = requests.get(f"{BASE_URL}/recommendations", headers=headers_a).json()
    sch_1_ur = next(r for r in recs_a_under_review if r['id'] == sch_1_id)
    assert sch_1_ur['application_status'] == 'UNDER_REVIEW'
    print(f"[PASS] 9. Recommendations synchronized to UNDER_REVIEW after admin status change.")

    # 10. Admin moves Application #1 to NEEDS_INFORMATION with remarks
    committee_remark = "Please provide updated mark sheet with official college seal."
    res_ni = requests.put(f"{BASE_URL}/admin/applications/{app_1_id}/status", json={
        'status': 'NEEDS_INFORMATION',
        'remarks': committee_remark
    }, headers=admin_headers)
    assert res_ni.status_code == 200

    recs_a_needs_info = requests.get(f"{BASE_URL}/recommendations", headers=headers_a).json()
    sch_1_ni = next(r for r in recs_a_needs_info if r['id'] == sch_1_id)
    assert sch_1_ni['application_status'] == 'NEEDS_INFORMATION'
    assert sch_1_ni['decision_remarks'] == committee_remark
    print(f"[PASS] 10. Recommendations synchronized to NEEDS_INFORMATION (Action Required) with remarks: '{sch_1_ni['decision_remarks']}'")

    # 11. Admin APPROVES Application #1 (Award Confirmed)
    approval_remark = "Merit criteria fully verified and statutory quota satisfied."
    res_app = requests.put(f"{BASE_URL}/admin/applications/{app_1_id}/status", json={
        'status': 'APPROVED',
        'remarks': approval_remark
    }, headers=admin_headers)
    assert res_app.status_code == 200

    recs_a_approved = requests.get(f"{BASE_URL}/recommendations", headers=headers_a).json()
    sch_1_app = next(r for r in recs_a_approved if r['id'] == sch_1_id)
    assert sch_1_app['application_status'] == 'APPROVED'
    assert sch_1_app['award_status'] == 'AWARDED'
    print(f"[PASS] 11. Recommendations synchronized to APPROVED / Scholarship Awarded (Award Status: {sch_1_app['award_status']}).")

    # 12. Admin records genuine DISBURSEMENT
    dbt_ref = f"PFMS-DBT-{ts}-REC"
    res_disb = requests.post(f"{BASE_URL}/admin/applications/{app_1_id}/disburse", json={
        'disbursement_reference': dbt_ref,
        'disbursement_notes': 'Bank credit transferred via DBT gateway'
    }, headers=admin_headers)
    assert res_disb.status_code == 200

    recs_a_disbursed = requests.get(f"{BASE_URL}/recommendations", headers=headers_a).json()
    sch_1_disb = next(r for r in recs_a_disbursed if r['id'] == sch_1_id)
    assert sch_1_disb['application_status'] == 'APPROVED'
    assert sch_1_disb['award_status'] == 'DISBURSED'
    assert sch_1_disb['disbursement_reference'] == dbt_ref
    print(f"[PASS] 12. Recommendations reflects genuine DISBURSED status separate from approval (Ref: {dbt_ref}).")

    # 13. Student A applies for a second scholarship and admin REJECTS it
    sch_2 = next(r for r in recs_a_initial if r['id'] != sch_1_id)
    sch_2_id = sch_2['id']
    app_2_res = requests.post(f"{BASE_URL}/applications", json={'scholarship_id': sch_2_id}, headers=headers_a).json()
    app_2_id = app_2_res['id']
    print(f"[PASS] 13a. Student A submitted second application #{app_2_id} for Scholarship #{sch_2_id}")

    rejection_reason = "Annual income exceeds scheme threshold for this reserved fund."
    res_rej = requests.put(f"{BASE_URL}/admin/applications/{app_2_id}/status", json={
        'status': 'REJECTED',
        'remarks': rejection_reason
    }, headers=admin_headers)
    assert res_rej.status_code == 200

    recs_a_rejected = requests.get(f"{BASE_URL}/recommendations", headers=headers_a).json()
    sch_2_rej = next(r for r in recs_a_rejected if r['id'] == sch_2_id)
    assert sch_2_rej['application_status'] == 'REJECTED'
    assert sch_2_rej['decision_remarks'] == rejection_reason
    print(f"[PASS] 13b. Recommendations synchronized to REJECTED with committee rationale: '{sch_2_rej['decision_remarks']}'")

    print("======================================================================")
    print("ALL RECOMMENDATION STATUS & LIFECYCLE SYNCHRONIZATION TESTS PASSED!")
    print("======================================================================")

if __name__ == '__main__':
    run_tests()
