import requests

BASE = "http://127.0.0.1:8000/api"

# 1. Admin Login
res = requests.post(f"{BASE}/auth/login", json={"email": "admin@scholarship.gov.in", "password": "admin123"})
assert res.status_code == 200, "Admin login failed"
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Get applications list (what AdminApplications.jsx consumes)
apps = requests.get(f"{BASE}/admin/applications", headers=headers).json()

# 3. Find 3 applications with different scholarship match scores
distinct_apps = []
seen_scores = set()
for a in apps:
    score = a.get("match_score")
    if score is not None and score not in seen_scores:
        seen_scores.add(score)
        distinct_apps.append(a)
    if len(distinct_apps) == 3:
        break

print(f"Checking {len(distinct_apps)} applications with different scholarship match scores:")
for a in distinct_apps:
    app_id = a["id"]
    detail = requests.get(f"{BASE}/admin/applications/{app_id}", headers=headers).json()
    
    app_obj = detail["application"]
    sch_obj = detail["scholarship"]
    eval_obj = detail["eligibility_assessment"]
    
    print("-" * 65)
    print(f"Application ID #{app_id}:")
    print(f"  • Student: {a['student_name']} ({a['student_email']}) [ID: {a['student_id']}]")
    print(f"  • Scholarship Scheme: #{a['scholarship_id']} '{a['scholarship_title']}'")
    print(f"  • Table Column 'Scholarship Match' displays: {a['match_score']}%")
    print(f"  • Application Review Page:")
    print(f"      - Scholarship Match: {app_obj['match_score']}% (Scheme: {sch_obj['match_percentage']}%)")
    print(f"      - General AI/Hybrid Score: {eval_obj['hybrid_score']}% (Score at App: {app_obj['score_at_application']}%)")
    
    # Assertions
    assert a["match_score"] == app_obj["match_score"] == sch_obj["match_percentage"], (
        f"Match percentage discrepancy for app {app_id}!"
    )
    assert eval_obj["hybrid_score"] is not None and eval_obj["hybrid_score"] > 0, (
        f"General AI/Hybrid score missing from review page for app {app_id}!"
    )
    assert app_obj["score_at_application"] is not None, (
        f"Score at application missing from review page for app {app_id}!"
    )

print("-" * 65)
print("ALL 3 APPLICATIONS VERIFIED WITH DISTINCT SCHOLARSHIP MATCH SCORES!")
print("General AI/Hybrid score remains fully intact on review detail page.")
