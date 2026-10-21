import sqlite3
import pandas as pd

conn = sqlite3.connect('scholarship_system.db')

print('=== 1. REGISTERED STUDENTS ===')
c = conn.cursor()
c.execute("SELECT count(*) FROM users WHERE role = 'STUDENT'")
total_students = c.fetchone()[0]
print('Total registered students:', total_students)

print('\n=== 2. CATEGORY REPRESENTATION (1 per student) ===')
q_cat = """
SELECT 
    COALESCE(NULLIF(TRIM(p.category), ''), 'Unknown') as category_name,
    COUNT(u.id) as count
FROM users u
LEFT JOIN student_profiles p ON u.id = p.user_id
WHERE u.role = 'STUDENT'
GROUP BY category_name
ORDER BY count DESC
"""
df_cat = pd.read_sql_query(q_cat, conn)
print(df_cat)

print('\n=== 3. INCOME BRACKETS (1 per student, missing as Unknown) ===')
q_inc = """
SELECT 
    u.id,
    f.family_income
FROM users u
LEFT JOIN financial_records f ON u.id = f.user_id
WHERE u.role = 'STUDENT'
"""
df_inc = pd.read_sql_query(q_inc, conn)
print('Total rows:', len(df_inc))
valid_inc = df_inc['family_income'].dropna()
b1 = (valid_inc < 150000).sum()
b2 = ((valid_inc >= 150000) & (valid_inc < 300000)).sum()
b3 = ((valid_inc >= 300000) & (valid_inc < 500000)).sum()
b4 = ((valid_inc >= 500000) & (valid_inc < 800000)).sum()
b5 = (valid_inc >= 800000).sum()
b_unk = df_inc['family_income'].isna().sum()
print(f'<1.5L: {b1}, 1.5-3L: {b2}, 3-5L: {b3}, 5-8L: {b4}, >8L: {b5}, Unknown: {b_unk}')
print('Sum:', b1 + b2 + b3 + b4 + b5 + b_unk)

print('\n=== 4. CGPA TIERS (1 per student, missing as Unknown) ===')
q_acad = """
SELECT 
    u.id,
    a.cgpa
FROM users u
LEFT JOIN academic_records a ON u.id = a.user_id
WHERE u.role = 'STUDENT'
"""
df_acad = pd.read_sql_query(q_acad, conn)
valid_cgpa = df_acad['cgpa'].dropna()
c1 = (valid_cgpa >= 9.0).sum()
c2 = ((valid_cgpa >= 8.0) & (valid_cgpa < 9.0)).sum()
c3 = ((valid_cgpa >= 7.0) & (valid_cgpa < 8.0)).sum()
c4 = ((valid_cgpa >= 6.0) & (valid_cgpa < 7.0)).sum()
c5 = (valid_cgpa < 6.0).sum()
c_unk = df_acad['cgpa'].isna().sum()
print(f'9-10: {c1}, 8-8.9: {c2}, 7-7.9: {c3}, 6-6.9: {c4}, <6: {c5}, Unknown: {c_unk}')
print('Sum:', c1 + c2 + c3 + c4 + c5 + c_unk)

print('\n=== 5. MODEL PREDICTION PROBABILITY (Deduped latest assessment per student) ===')
q_latest_elig = """
WITH Ranked AS (
    SELECT 
        e.user_id,
        e.ml_probability,
        e.hybrid_score,
        e.rule_status,
        e.created_at,
        ROW_NUMBER() OVER(PARTITION BY e.user_id ORDER BY e.created_at DESC, e.id DESC) as rn
    FROM eligibility_results e
    JOIN users u ON e.user_id = u.id
    WHERE u.role = 'STUDENT'
)
SELECT user_id, ml_probability, hybrid_score, rule_status, created_at
FROM Ranked
WHERE rn = 1
"""
df_elig = pd.read_sql_query(q_latest_elig, conn)
print('Total unique students assessed:', len(df_elig))
probs = df_elig['ml_probability']
p1 = (probs >= 0.90).sum()
p2 = ((probs >= 0.80) & (probs < 0.90)).sum()
p3 = ((probs >= 0.70) & (probs < 0.80)).sum()
p4 = ((probs >= 0.50) & (probs < 0.70)).sum()
p5 = (probs < 0.50).sum()
p_not = total_students - len(df_elig)
print(f'90-100%: {p1}, 80-89%: {p2}, 70-79%: {p3}, 50-69%: {p4}, <50%: {p5}, Not Assessed: {p_not}')
print('Sum:', p1 + p2 + p3 + p4 + p5 + p_not)
