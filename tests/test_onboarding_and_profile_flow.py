"""
Comprehensive End-to-End Test for Unified Student Onboarding, Profile Reuse,
History Preservation, and Admin Security Isolation.
"""

import requests
import json
import time

BASE = "http://127.0.0.1:8000/api"

def run_tests():
    print("=" * 70)
    print("RUNNING UNIFIED ONBOARDING & PROFILE FLOW TEST SUITE")
    print("=" * 70)
    ts = int(time.time())

    # -------------------------------------------------------------
    # Test 1: Newly registered student is flagged for onboarding
    # -------------------------------------------------------------
    print("\n[TEST 1] Newly Registered Student First-Time Onboarding Flag")
    new_email = f"new_student_{ts}@example.com"
    r = requests.post(f"{BASE}/auth/register", json={
        "email": new_email,
        "password": "password123",
        "full_name": "New Onboarding Scholar",
        "role": "STUDENT"
    })
    assert r.status_code == 200, f"Registration failed: {r.text}"
    reg_data = r.json()
    new_token = reg_data["access_token"]
    assert reg_data["profile_is_complete"] is False, "New student must have profile_is_complete=False"
    assert reg_data["profile_completion_percentage"] == 0, "New student must have profile_completion_percentage=0"
    print(f" PASS: Register response has profile_is_complete={reg_data['profile_is_complete']}, completion={reg_data['profile_completion_percentage']}%")

    # Verify /auth/me returns same persisted state
    r_me = requests.get(f"{BASE}/auth/me", headers={"Authorization": f"Bearer {new_token}"})
    assert r_me.status_code == 200
    me_data = r_me.json()
    assert me_data["profile_is_complete"] is False
    print(f" PASS: /auth/me reflects persisted profile_is_complete=False for new student")

    # Verify /eligibility/verify blocks incomplete student
    r_ver = requests.post(f"{BASE}/eligibility/verify", headers={"Authorization": f"Bearer {new_token}"})
    assert r_ver.status_code == 422
    assert r_ver.json()["detail"]["code"] == "PROFILE_INCOMPLETE"
    print(f" PASS: Assessment correctly blocked until profile is completed (code=PROFILE_INCOMPLETE)")

    # -------------------------------------------------------------
    # Test 2: Returning student with complete profile logs in directly
    # -------------------------------------------------------------
    print("\n[TEST 2] Returning Student with Complete Profile")
    r_login = requests.post(f"{BASE}/auth/login", json={
        "email": "student@scholarship.gov.in",
        "password": "student123"
    })
    assert r_login.status_code == 200
    demo_data = r_login.json()
    demo_token = demo_data["access_token"]
    assert demo_data["profile_is_complete"] is True, "Demo student must have profile_is_complete=True"
    assert demo_data["profile_completion_percentage"] == 100, "Demo student must have profile_completion_percentage=100"
    print(f" PASS: Login response for complete student has profile_is_complete=True, completion=100%")

    r_dash = requests.get(f"{BASE}/student/dashboard", headers={"Authorization": f"Bearer {demo_token}"})
    assert r_dash.status_code == 200
    dash_data = r_dash.json()
    assert dash_data["profile_is_complete"] is True
    print(f" PASS: Returning student dashboard accessible with profile_is_complete=True")

    # -------------------------------------------------------------
    # Test 3: Incomplete existing profile identifies missing fields
    # -------------------------------------------------------------
    print("\n[TEST 3] Incomplete Profile Directs to Missing Information")
    # Update new student with ONLY Personal info (25% complete)
    r_upd_partial = requests.put(f"{BASE}/student/profile", headers={"Authorization": f"Bearer {new_token}"}, json={
        "profile": {
            "age": 21,
            "gender": "Female",
            "state": "Maharashtra",
            "city": "Nagpur",
            "rural_urban": "Urban"
        }
    })
    assert r_upd_partial.status_code == 200
    partial_res = r_upd_partial.json()
    assert partial_res["profile_completion_percentage"] == 25
    assert partial_res["profile_is_complete"] is False
    assert "academic" in partial_res["missing_sections"]
    assert "financial" in partial_res["missing_sections"]
    assert "achievements" in partial_res["missing_sections"]
    print(f" PASS: Partial profile shows 25% completion; missing_sections={partial_res['missing_sections']}")

    r_prof = requests.get(f"{BASE}/student/profile", headers={"Authorization": f"Bearer {new_token}"})
    assert r_prof.status_code == 200
    prof_data = r_prof.json()
    assert prof_data["profile"]["city"] == "Nagpur"
    assert "cgpa" in prof_data["missing_fields"].get("academic", [])
    print(f" PASS: Saved field ('Nagpur') preserved; missing academic fields identified: {prof_data['missing_fields']['academic']}")

    # -------------------------------------------------------------
    # Test 4: Complete the remaining sections & verify profile reuse
    # -------------------------------------------------------------
    print("\n[TEST 4] Unified Onboarding Completion & Profile Reuse")
    r_upd_full = requests.put(f"{BASE}/student/profile", headers={"Authorization": f"Bearer {new_token}"}, json={
        "academics": {
            "education_level": "Undergraduate",
            "course": "Computer Science & IT",
            "year_of_study": 3,
            "cgpa": 8.75,
            "percentage": 83.0,
            "backlogs": 0,
            "attendance": 88.0,
            "previous_scholarship": 0
        },
        "financials": {
            "family_income": 220000.0,
            "family_size": 4,
            "parent_occupation": "Small Business / Retail",
            "earning_members": 1,
            "financial_dependency": "Both Parents"
        },
        "achievements": {
            "sports_achievement": "District",
            "academic_achievement": "None",
            "extracurricular_score": 7,
            "certifications_count": 2,
            "leadership_experience": True
        }
    })
    assert r_upd_full.status_code == 200
    full_res = r_upd_full.json()
    assert full_res["profile_completion_percentage"] == 100
    assert full_res["profile_is_complete"] is True
    assert len(full_res["missing_sections"]) == 0
    print(f" PASS: Profile successfully completed to 100% (missing_sections={full_res['missing_sections']})")

    # -------------------------------------------------------------
    # Test 5: Assessment execution using ML model and rule engine
    # -------------------------------------------------------------
    print("\n[TEST 5] Dual-Engine Assessment Execution")
    r_eval = requests.post(f"{BASE}/eligibility/verify", headers={"Authorization": f"Bearer {new_token}"})
    assert r_eval.status_code == 200
    eval_res = r_eval.json()
    assert "rule_status" in eval_res
    assert eval_res["rule_status"] in ["ELIGIBLE", "CONDITIONALLY_ELIGIBLE", "NOT_ELIGIBLE"]
    assert 0.0 <= eval_res["ml_probability"] <= 1.0
    assert eval_res["hybrid_score"] > 0
    assert eval_res["final_verdict"] in ["Highly Eligible", "Eligible", "Conditionally Eligible", "Not Eligible"]
    first_result_id = eval_res["id"]
    print(f" PASS: AI Assessment produced: Rule={eval_res['rule_status']}, ML Prob={eval_res['ml_probability']:.4f}, "
          f"Hybrid={eval_res['hybrid_score']}, Verdict='{eval_res['final_verdict']}', Recs={len(eval_res['top_recommendations'])}")

    # -------------------------------------------------------------
    # Test 6: Editing profile details does NOT erase historical assessments
    # -------------------------------------------------------------
    print("\n[TEST 6] History Preservation when Editing Profile Details")
    r_hist_before = requests.get(f"{BASE}/eligibility/history", headers={"Authorization": f"Bearer {new_token}"})
    assert r_hist_before.status_code == 200
    history_before = r_hist_before.json()
    count_before = len(history_before)
    assert count_before >= 1
    print(f" History count before profile update: {count_before}")

    # Now edit profile (e.g., increase CGPA to 9.10)
    r_edit = requests.put(f"{BASE}/student/profile", headers={"Authorization": f"Bearer {new_token}"}, json={
        "academics": {
            "cgpa": 9.10,
            "attendance": 92.0
        }
    })
    assert r_edit.status_code == 200

    # Verify historical assessment result remains intact
    r_hist_after = requests.get(f"{BASE}/eligibility/history", headers={"Authorization": f"Bearer {new_token}"})
    assert r_hist_after.status_code == 200
    history_after = r_hist_after.json()
    assert len(history_after) == count_before
    matching_orig = [h for h in history_after if h["id"] == first_result_id]
    assert len(matching_orig) == 1, "Original historical assessment must still exist"
    print(f" PASS: Historical assessment ID {first_result_id} preserved with score {matching_orig[0]['hybrid_score']}")

    # Re-evaluate with updated profile -> generates a NEW assessment record
    r_re_eval = requests.post(f"{BASE}/eligibility/verify", headers={"Authorization": f"Bearer {new_token}"})
    assert r_re_eval.status_code == 200
    new_result_id = r_re_eval.json()["id"]
    assert new_result_id != first_result_id

    r_hist_final = requests.get(f"{BASE}/eligibility/history", headers={"Authorization": f"Bearer {new_token}"})
    assert len(r_hist_final.json()) == count_before + 1
    print(f" PASS: Re-evaluation added a new record (ID={new_result_id}). Total history records: {len(r_hist_final.json())}")

    # -------------------------------------------------------------
    # Test 7: Admin security and role-based access isolation
    # -------------------------------------------------------------
    print("\n[TEST 7] Admin Login and Role-Based Route Isolation")
    r_admin_login = requests.post(f"{BASE}/auth/login", json={
        "email": "admin@scholarship.gov.in",
        "password": "admin123"
    })
    assert r_admin_login.status_code == 200
    admin_data = r_admin_login.json()
    admin_token = admin_data["access_token"]
    assert admin_data["role"] == "ADMIN"
    print(f" PASS: Admin authenticated successfully with role={admin_data['role']}")

    r_admin_dash = requests.get(f"{BASE}/admin/dashboard", headers={"Authorization": f"Bearer {admin_token}"})
    assert r_admin_dash.status_code == 200
    print(f" PASS: Admin dashboard accessible to ADMIN (total_students={r_admin_dash.json().get('total_students')})")

    # Security verification: Student MUST be blocked from admin endpoints
    r_unauthorized = requests.get(f"{BASE}/admin/dashboard", headers={"Authorization": f"Bearer {new_token}"})
    assert r_unauthorized.status_code in [401, 403], f"Student should be forbidden from admin dashboard, got {r_unauthorized.status_code}"
    print(f" PASS: Student token forbidden from accessing /admin/dashboard (Status {r_unauthorized.status_code})")

    # -------------------------------------------------------------
    # Test 8: General eligibility does NOT require caste/category
    # -------------------------------------------------------------
    print("\n[TEST 8] General Eligibility Does NOT Require Caste/Category")
    r_get_prof = requests.get(f"{BASE}/student/profile", headers={"Authorization": f"Bearer {new_token}"})
    curr_cat = r_get_prof.json()["profile"]["category"]
    assert curr_cat is None, "Student profile has NO caste/category stored"
    r_latest = requests.get(f"{BASE}/eligibility/latest", headers={"Authorization": f"Bearer {new_token}"})
    assert r_latest.status_code == 200
    latest_eval = r_latest.json()
    assert latest_eval["rule_status"] == "ELIGIBLE"
    assert latest_eval["hybrid_score"] >= 80.0
    print(f" PASS: Category is None, yet student is {latest_eval['rule_status']} with Hybrid Score {latest_eval['hybrid_score']}")

    print("\n" + "=" * 70)
    print("ALL 8 VERIFICATION TESTS PASSED SUCCESSFULLY!")
    print("=" * 70)

if __name__ == "__main__":
    run_tests()
