import requests
import json

BASE_URL = "http://127.0.0.1:8000"

# 1. Login as admin
admin_login = requests.post(f"{BASE_URL}/api/auth/login", json={"email": "admin@scholarship.gov.in", "password": "admin123"})
admin_token = admin_login.json()["access_token"]
admin_headers = {"Authorization": f"Bearer {admin_token}"}

# Get admin applications list
admin_apps = requests.get(f"{BASE_URL}/api/admin/applications", headers=admin_headers).json()
print(f"Total admin applications: {len(admin_apps)}")

# Pick 3 different applications from different students
test_apps = []
seen_students = set()
for a in admin_apps:
    if a["student_id"] not in seen_students:
        seen_students.add(a["student_id"])
        test_apps.append(a)
    if len(test_apps) == 3:
        break

print(f"Selected {len(test_apps)} applications for verification:")

# We also need student tokens to check the Student Recommendations page
# In our test DB, student password is usually Password123! or StudentPassword123!
for app in test_apps:
    app_id = app["id"]
    student_id = app["student_id"]
    student_email = app["student_email"]
    sch_id = app["scholarship_id"]
    
    # Admin detail
    detail = requests.get(f"{BASE_URL}/api/admin/applications/{app_id}", headers=admin_headers).json()
    
    # Try student login
    student_token = None
    for pw in ["password123", "student123", "StudentPassword123!", "Password123!", "TestPassword123!"]:
        res = requests.post(f"{BASE_URL}/api/auth/login", json={"email": student_email, "password": pw})
        if res.status_code == 200:
            student_token = res.json()["access_token"]
            break
            
    student_recs = []
    student_match = None
    if student_token:
        s_headers = {"Authorization": f"Bearer {student_token}"}
        recs = requests.get(f"{BASE_URL}/api/recommendations", headers=s_headers).json()
        target_rec = next((r for r in recs if r["id"] == sch_id), None)
        if target_rec:
            student_match = target_rec["match_percentage"]
    
    print("=" * 60)
    print(f"Application ID: {app_id} (Student: {student_email}, Scholarship ID: {sch_id})")
    print(f"1. Admin Applications Table:")
    print(f"   - Stored General AI Score (score_at_application): {app['score_at_application']}%")
    print(f"   - Match Score (match_score): {app['match_score']}%")
    print(f"   - Associated Eligibility Result ID: {app['eligibility_result_id']}")
    print(f"2. Admin Application Detail Dossier:")
    print(f"   - application.score_at_application: {detail['application']['score_at_application']}%")
    print(f"   - eligibility_assessment.hybrid_score: {detail['eligibility_assessment']['hybrid_score']}%")
    print(f"   - eligibility_assessment.id: {detail['eligibility_assessment'].get('id')}")
    print(f"   - application.match_score: {detail['application']['match_score']}%")
    print(f"   - scholarship.match_percentage: {detail['scholarship']['match_percentage']}%")
    print(f"3. Student Recommendations Page:")
    print(f"   - Student Rec match_percentage for Scheme #{sch_id}: {student_match}%")
    
    # Verifications:
    table_score = app['score_at_application']
    detail_app_score = detail['application']['score_at_application']
    detail_assessment_score = detail['eligibility_assessment']['hybrid_score']
    
    assert table_score == detail_app_score == detail_assessment_score, (
        f"Mismatch in general score! Table: {table_score}, Detail App: {detail_app_score}, Assessment: {detail_assessment_score}"
    )
    print("   >>> PASS: General AI/Hybrid Eligibility Score matches identically across Table, Detail App, and Assessment!")
    
    if student_match is not None:
        assert app['match_score'] == detail['application']['match_score'] == detail['scholarship']['match_percentage'] == student_match, (
            f"Mismatch in scholarship match score! Table: {app['match_score']}, Detail App: {detail['application']['match_score']}, Student Rec: {student_match}"
        )
        print("   >>> PASS: Scholarship Match score matches identically between Admin Table, Dossier, and Student Recommendations!")
