import sqlite3
conn = sqlite3.connect('scholarship_system.db')
cursor = conn.cursor()

# Show student profiles with detailed data
print("=== STUDENT PROFILES ===")
cursor.execute("SELECT sp.user_id, u.email, sp.age, sp.gender, sp.state, sp.city, sp.category FROM student_profiles sp JOIN users u ON sp.user_id=u.id ORDER BY sp.user_id")
profs = cursor.fetchall()
for p in profs:
    print(f"  user_id={p[0]}, email={p[1]}, age={p[2]}, gender={p[3]}, state={p[4]}, city={p[5]}, category={p[6]}")

print("\n=== ACADEMIC RECORDS ===")
cursor.execute("SELECT ar.user_id, u.email, ar.cgpa, ar.course, ar.year_of_study, ar.attendance FROM academic_records ar JOIN users u ON ar.user_id=u.id ORDER BY ar.user_id")
acads = cursor.fetchall()
for a in acads:
    print(f"  user_id={a[0]}, email={a[1]}, cgpa={a[2]}, course={a[3]}, year={a[4]}, attendance={a[5]}")

print("\n=== FINANCIAL RECORDS ===")
cursor.execute("SELECT fr.user_id, u.email, fr.family_income, fr.family_size FROM financial_records fr JOIN users u ON fr.user_id=u.id ORDER BY fr.user_id")
fins = cursor.fetchall()
for f in fins:
    print(f"  user_id={f[0]}, email={f[1]}, income={f[2]}, family_size={f[3]}")

print("\n=== ACHIEVEMENT RECORDS ===")
cursor.execute("SELECT ar.user_id, u.email, ar.sports_achievement, ar.academic_achievement FROM achievement_records ar JOIN users u ON ar.user_id=u.id ORDER BY ar.user_id")
achs = cursor.fetchall()
for a in achs:
    print(f"  user_id={a[0]}, email={a[1]}, sports={a[2]}, academic={a[3]}")

conn.close()
