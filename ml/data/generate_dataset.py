"""
Synthetic Scholarship Eligibility Dataset Generator
Author: AI Mini Project Team
Description: Generates 55,000+ realistic, derived student records modeled after 
Indian National and State Scholarship schemes (e.g., NSP Merit-cum-Means, Post-Matric,
Pragati, and Central Sector Scheme).

DISCLAIMER: This dataset is DERIVED/SYNTHETIC and generated specifically for training 
and validating machine learning models in academic/educational environments. 
It does not contain real personal data of actual scholarship recipients.
"""

import numpy as np
import pandas as pd
import os

def generate_scholarship_dataset(num_records=55000, random_seed=42):
    np.random.seed(random_seed)
    
    # 1. Demographics
    student_ids = [f"STU{100000 + i}" for i in range(num_records)]
    
    # Age distribution: 17 to 26 (typical college students)
    age = np.random.choice(
        np.arange(17, 27),
        size=num_records,
        p=[0.05, 0.20, 0.25, 0.22, 0.13, 0.08, 0.04, 0.015, 0.01, 0.005]
    )
    
    # Gender: Male, Female, Other
    gender = np.random.choice(["Female", "Male", "Other"], size=num_records, p=[0.48, 0.50, 0.02])
    
    # States across India
    states = [
        "Maharashtra", "Uttar Pradesh", "Karnataka", "Tamil Nadu", 
        "Delhi", "West Bengal", "Gujarat", "Rajasthan", "Kerala", 
        "Telangana", "Andhra Pradesh", "Madhya Pradesh", "Bihar", "Punjab"
    ]
    state_weights = [0.12, 0.14, 0.09, 0.08, 0.06, 0.07, 0.07, 0.06, 0.05, 0.06, 0.06, 0.06, 0.05, 0.03]
    state = np.random.choice(states, size=num_records, p=state_weights)
    
    # Reservation / Social Categories
    categories = ["General", "OBC", "SC", "ST", "EWS"]
    category_weights = [0.30, 0.35, 0.16, 0.09, 0.10]
    category = np.random.choice(categories, size=num_records, p=category_weights)
    
    # Disability Status: ~3.5% with disability
    disability = np.random.choice([0, 1], size=num_records, p=[0.965, 0.035])
    
    # Rural vs Urban
    rural_urban = np.random.choice(["Rural", "Semi-Urban", "Urban"], size=num_records, p=[0.42, 0.33, 0.25])
    
    # First-generation college student (~38%)
    first_generation = np.random.choice([0, 1], size=num_records, p=[0.62, 0.38])
    
    # 2. Education & Academics
    education_levels = ["Undergraduate", "Postgraduate", "Diploma", "Doctorate"]
    education_level = np.random.choice(education_levels, size=num_records, p=[0.68, 0.22, 0.07, 0.03])
    
    courses = [
        "Computer Science & IT", "Mechanical Engineering", "Electrical Engineering", 
        "Civil Engineering", "Electronics & Comm", "Medicine / MBBS", 
        "Pharmacy", "B.Sc Science", "B.Com / Finance", "B.A. Arts & Humanities", 
        "Law (LLB)", "Management (BBA/MBA)"
    ]
    course = np.random.choice(courses, size=num_records)
    
    # Year of Study: 1, 2, 3, 4
    year = np.random.choice([1, 2, 3, 4], size=num_records, p=[0.32, 0.28, 0.24, 0.16])
    
    # CGPA: Beta distribution scaled to 4.0 - 10.0
    raw_cgpa = np.random.beta(a=5, b=2, size=num_records)
    cgpa = np.round(4.5 + (raw_cgpa * 5.4), 2)
    cgpa = np.clip(cgpa, 4.0, 10.0)
    
    # Percentage derived roughly from CGPA with realistic deviation
    percentage = np.round(cgpa * 9.5 + np.random.normal(0, 2.5, size=num_records), 1)
    percentage = np.clip(percentage, 40.0, 99.5)
    
    # Backlogs (Active or historical)
    backlogs = np.random.choice([0, 1, 2, 3, 4], size=num_records, p=[0.72, 0.16, 0.07, 0.03, 0.02])
    
    # Attendance Percentage: 60% to 100%
    attendance = np.round(np.random.beta(6, 2, size=num_records) * 35 + 65, 1)
    attendance = np.clip(attendance, 50.0, 100.0)
    
    # Institution Type
    institution_type = np.random.choice(["Government", "Govt-Aided", "Private"], size=num_records, p=[0.45, 0.30, 0.25])
    
    # 3. Socioeconomic & Financials
    # Family Annual Income: Lognormal distribution reflecting realistic income brackets
    # Median ~2.8 Lakhs, tail up to 15 Lakhs
    income_log = np.random.lognormal(mean=12.4, sigma=0.75, size=num_records)
    family_income = np.round(np.clip(income_log, 45000, 1500000), -3) # Rounded to nearest thousand
    
    # Family Size: 2 to 8
    family_size = np.random.choice([2, 3, 4, 5, 6, 7, 8], size=num_records, p=[0.05, 0.18, 0.38, 0.24, 0.10, 0.03, 0.02])
    
    # Parent Occupation
    parent_occupations = [
        "Daily Wage Worker / Laborer", "Farmer / Agriculture", 
        "Small Business / Retail", "Private Sector Employee", 
        "Government Service", "Artisan / Self-Employed", "Retired / Unemployed"
    ]
    parent_occupation = np.random.choice(
        parent_occupations, 
        size=num_records, 
        p=[0.22, 0.26, 0.18, 0.16, 0.08, 0.06, 0.04]
    )
    
    # Earning members in family
    earning_members = np.random.choice([1, 2, 3], size=num_records, p=[0.72, 0.24, 0.04])
    
    # Financial Dependency: Single Parent, Both Parents, Guardian, Self-supported
    financial_dependency = np.random.choice(
        ["Both Parents", "Single Mother", "Single Father", "Guardian", "Self-Supported"],
        size=num_records,
        p=[0.75, 0.12, 0.07, 0.04, 0.02]
    )
    
    # 4. Achievements & Additional Attributes
    sports_achievement = np.random.choice(["None", "District", "State", "National"], size=num_records, p=[0.78, 0.13, 0.06, 0.03])
    academic_achievement = np.random.choice(["None", "School/College Topper", "Olympiad/Merit", "Research/Published"], size=num_records, p=[0.80, 0.12, 0.06, 0.02])
    extracurricular_score = np.random.randint(1, 11, size=num_records) # Scale 1 to 10
    previous_scholarship = np.random.choice([0, 1], size=num_records, p=[0.82, 0.18])
    
    # 5. Composite Socioeconomic & Academic Eligibility Score Calculation
    # This reflects real scholarship assessment committees:
    # High Merit (CGPA), Low Family Income, Reservation/Underrepresented, Disability, Achievements
    
    academic_score = (cgpa / 10.0) * 40.0 # Up to 40 pts
    
    # Income Need Score: Up to 35 pts (Lower income = higher points)
    # Income < 1.5 Lakhs -> 35 pts; 1.5L-3L -> 28 pts; 3L-6L -> 18 pts; 6L-8L -> 8 pts; >8L -> 0 pts
    income_score = np.where(family_income <= 150000, 35.0,
                    np.where(family_income <= 300000, 27.0,
                    np.where(family_income <= 500000, 18.0,
                    np.where(family_income <= 800000, 8.0, 0.0))))
    
    # Social Inclusivity & Equity Score: Up to 15 pts
    category_score = np.where(np.isin(category, ["SC", "ST"]), 12.0,
                     np.where(category == "OBC", 7.0,
                     np.where(category == "EWS", 9.0, 2.0)))
    
    disability_bonus = np.where(disability == 1, 8.0, 0.0)
    rural_bonus = np.where(rural_urban == "Rural", 4.0, np.where(rural_urban == "Semi-Urban", 2.0, 0.0))
    first_gen_bonus = np.where(first_generation == 1, 4.0, 0.0)
    
    # Achievement Bonus: Up to 10 pts
    sports_bonus = np.where(sports_achievement == "National", 6.0,
                   np.where(sports_achievement == "State", 4.0,
                   np.where(sports_achievement == "District", 2.0, 0.0)))
                   
    academic_bonus = np.where(academic_achievement == "Research/Published", 6.0,
                     np.where(academic_achievement == "Olympiad/Merit", 4.0,
                     np.where(academic_achievement == "School/College Topper", 3.0, 0.0)))
    
    backlog_penalty = backlogs * 6.0
    
    composite_raw = (
        academic_score + 
        income_score + 
        category_score + 
        disability_bonus + 
        rural_bonus + 
        first_gen_bonus + 
        sports_bonus + 
        academic_bonus - 
        backlog_penalty
    )
    
    # Committee subjectivity / realistic real-world variance: N(0, 3.5)
    noise = np.random.normal(0, 3.5, size=num_records)
    total_score = composite_raw + noise
    
    # Hard qualification thresholds:
    # Must have family_income <= 800,000 for standard need-based scholarships OR CGPA >= 8.5 for merit-only
    # Backlogs <= 2
    mandatory_met = ((family_income <= 800000) | (cgpa >= 8.5)) & (backlogs <= 2) & (attendance >= 65.0)
    
    # Target Eligibility Label: 1 if score >= 54 and mandatory baseline met, else 0
    eligible = np.where((total_score >= 54.0) & mandatory_met, 1, 0)
    
    # Create DataFrame
    df = pd.DataFrame({
        "student_id": student_ids,
        "age": age,
        "gender": gender,
        "state": state,
        "category": category,
        "disability": disability,
        "rural_urban": rural_urban,
        "first_generation": first_generation,
        "education_level": education_level,
        "course": course,
        "year": year,
        "cgpa": cgpa,
        "percentage": percentage,
        "backlogs": backlogs,
        "attendance": attendance,
        "institution_type": institution_type,
        "family_income": family_income,
        "family_size": family_size,
        "parent_occupation": parent_occupation,
        "earning_members": earning_members,
        "financial_dependency": financial_dependency,
        "sports_achievement": sports_achievement,
        "academic_achievement": academic_achievement,
        "extracurricular_score": extracurricular_score,
        "previous_scholarship": previous_scholarship,
        "eligible": eligible
    })
    
    return df

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "scholarship_dataset.csv")
    print("Generating 55,000 realistic derived scholarship records...")
    df = generate_scholarship_dataset(num_records=55000, random_seed=42)
    df.to_csv(out_path, index=False)
    print(f"Dataset successfully created at: {out_path}")
    print(f"Total Rows: {len(df)}")
    print(f"Eligibility Distribution:\n{df['eligible'].value_counts(normalize=True).round(3)}")
