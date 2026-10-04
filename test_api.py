"""
End-to-End API Integration Test
Tests: Login, Dashboard, Profile, and Eligibility Verify endpoints
"""

import requests
import json
import sys

BASE = "http://127.0.0.1:8000/api/v1"

def test_login(email, password, label):
    r = requests.post(f"{BASE}/auth/login", json={"email": email, "password": password})
    if r.status_code == 200:
        data = r.json()
        token = data["access_token"]
        print(f"✓ [{label}] Login OK. role={data['role']}, user_id={data['user_id']}")
        return token
    else:
        print(f"✗ [{label}] Login FAILED: {r.status_code} {r.text}")
        return None

def test_dashboard(token, label):
    r = requests.get(f"{BASE}/student/dashboard", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        data = r.json()
        print(f"✓ [{label}] Dashboard OK: completion={data.get('profile_completion')}%, "
              f"is_complete={data.get('profile_is_complete')}, "
              f"eligible_count={data.get('eligible_scholarships_count')}, "
              f"latest_score={data.get('latest_score')}")
        return data
    else:
        print(f"✗ [{label}] Dashboard FAILED: {r.status_code} {r.text}")
        return None

def test_profile(token, label):
    r = requests.get(f"{BASE}/student/profile", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        data = r.json()
        completion = data.get("profile_completion_percentage")
        is_complete = data.get("profile_is_complete")
        profile = data.get("profile", {})
        acad = data.get("academics", {})
        print(f"✓ [{label}] Profile OK: completion={completion}%, complete={is_complete}")
        print(f"   profile.state={profile.get('state')}, profile.age={profile.get('age')}, profile.category={profile.get('category')}")
        print(f"   academics.cgpa={acad.get('cgpa')}, academics.course={acad.get('course')}")
        return data, completion
    else:
        print(f"✗ [{label}] Profile FAILED: {r.status_code} {r.text}")
        return None, 0

def test_ai_verify(token, label):
    r = requests.post(f"{BASE}/eligibility/verify", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        data = r.json()
        print(f"✓ [{label}] AI Verify OK!")
        print(f"   rule_status={data.get('rule_status')}")
        print(f"   ml_probability={data.get('ml_probability')}")
        print(f"   hybrid_score={data.get('hybrid_score')}")
        print(f"   final_verdict={data.get('final_verdict')}")
        print(f"   recommendations={len(data.get('top_recommendations', []))}")
        return data
    elif r.status_code == 422:
        detail = r.json().get("detail", {})
        print(f"✗ [{label}] AI Verify BLOCKED: {detail.get('code')} - completion={detail.get('completion_percentage')}%")
        print(f"   This is expected if the profile is incomplete")
        return None
    else:
        print(f"✗ [{label}] AI Verify ERROR: {r.status_code} {r.text}")
        return None

def test_admin_dashboard(token, label):
    r = requests.get(f"{BASE}/admin/dashboard", headers={"Authorization": f"Bearer {token}"})
    if r.status_code == 200:
        data = r.json()
        print(f"✓ [{label}] Admin Dashboard OK: students={data.get('total_students')}, "
              f"scholarships={data.get('total_scholarships')}, "
              f"avg_score={data.get('average_eligibility_score')}")
        return data
    else:
        print(f"✗ [{label}] Admin Dashboard FAILED: {r.status_code} {r.text}")
        return None

print("=" * 60)
print("SCHOLARSHIP ELIGIBILITY SYSTEM — API INTEGRATION TESTS")
print("=" * 60)

# ---- DEMO STUDENT TESTS ----
print("\n--- DEMO STUDENT (student@scholarship.gov.in) ---")
demo_token = test_login("student@scholarship.gov.in", "student123", "DEMO")
if demo_token:
    dash_data = test_dashboard(demo_token, "DEMO DASHBOARD")
    prof_data, completion = test_profile(demo_token, "DEMO PROFILE")
    if completion == 100:
        test_ai_verify(demo_token, "DEMO AI VERIFY")
    else:
        print(f"  → Profile is only {completion}% complete, skipping AI verify")

# ---- REAL USER TESTS ----
print("\n--- REAL USER (rohan.singh@vit.edu.in) ---")
real_token = test_login("rohan.singh@vit.edu.in", "student123", "ROHAN")
if real_token:
    dash_data = test_dashboard(real_token, "ROHAN DASHBOARD")
    prof_data, completion = test_profile(real_token, "ROHAN PROFILE")
    if completion == 100:
        print("  → WARNING: Rohan's profile is complete but should not be (demo data was cleaned)")
        test_ai_verify(real_token, "ROHAN AI VERIFY")
    else:
        print(f"  ✓ Profile correctly shows {completion}% (new user, profile not yet filled)")
        test_ai_verify(real_token, "ROHAN AI VERIFY (should block)")

# ---- ADMIN TESTS ----
print("\n--- ADMIN (admin@scholarship.gov.in) ---")
admin_token = test_login("admin@scholarship.gov.in", "admin123", "ADMIN")
if admin_token:
    test_admin_dashboard(admin_token, "ADMIN DASHBOARD")

print("\n" + "=" * 60)
print("TESTS COMPLETE")
print("=" * 60)
