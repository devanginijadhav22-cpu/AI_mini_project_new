import sys, os
sys.path.insert(0, os.path.abspath('.'))
import urllib.request
import urllib.error
import json
from backend.app.auth.jwt_handler import create_access_token

BASE_URL = 'http://127.0.0.1:8000/api'

# 1. Admin Token
admin_token = create_access_token({'sub': 'admin@scholarship.gov.in', 'role': 'ADMIN'})
admin_headers = {'Authorization': f'Bearer {admin_token}'}

# 2. Student Token
student_token = create_access_token({'sub': 'student@scholarship.gov.in', 'role': 'STUDENT'})
student_headers = {'Authorization': f'Bearer {student_token}'}

def test_admin_applications_detail():
    print('=== 1. Test Admin Fetching Multiple Applications ===')
    for app_id in [1, 2, 3]:
        req = urllib.request.Request(f'{BASE_URL}/admin/applications/{app_id}', headers=admin_headers)
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            student_name = data['student']['full_name']
            score = data['eligibility_assessment']['hybrid_score']
            criteria_met = data['criteria_evaluation']['all_criteria_met']
            print(f'[PASS] App #{app_id}: Student="{student_name}", Score={score}%, CriteriaMet={criteria_met}')

    print('\n=== 2. Test Invalid / Nonexistent IDs ===')
    # Nonexistent ID 9999
    try:
        req = urllib.request.Request(f'{BASE_URL}/admin/applications/9999', headers=admin_headers)
        urllib.request.urlopen(req)
        assert False, "9999 should return 404"
    except urllib.error.HTTPError as e:
        assert e.code == 404
        print(f'[PASS] Nonexistent app #9999 returned HTTP {e.code} Not Found')

    # Invalid ID 'xyz'
    try:
        req = urllib.request.Request(f'{BASE_URL}/admin/applications/xyz', headers=admin_headers)
        urllib.request.urlopen(req)
        assert False, "xyz should return 422"
    except urllib.error.HTTPError as e:
        assert e.code == 422
        print(f'[PASS] Invalid ID "xyz" returned HTTP {e.code} Unprocessable Entity')

    print('\n=== 3. Security Check: Block Student & Guest Access ===')
    # Unauthenticated
    try:
        req = urllib.request.Request(f'{BASE_URL}/admin/applications/1')
        urllib.request.urlopen(req)
        assert False, "Guest should return 401 or 403"
    except urllib.error.HTTPError as e:
        assert e.code in [401, 403]
        print(f'[PASS] Guest blocked with HTTP {e.code}')

    # Student user
    try:
        req = urllib.request.Request(f'{BASE_URL}/admin/applications/1', headers=student_headers)
        urllib.request.urlopen(req)
        assert False, "Student should return 403"
    except urllib.error.HTTPError as e:
        assert e.code == 403
        print(f'[PASS] Student access blocked with HTTP {e.code} Forbidden')

if __name__ == '__main__':
    test_admin_applications_detail()
    print('\nALL ADMIN APPLICATION DETAIL SECURITY & RESILIENCE TESTS PASSED!')
