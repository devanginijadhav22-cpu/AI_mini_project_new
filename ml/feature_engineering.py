"""
Feature Engineering and Column Definitions for Scholarship Eligibility
Author: AI Mini Project Team
"""

import numpy as np

CATEGORICAL_FEATURES = [
    "gender",
    "state",
    "category",
    "rural_urban",
    "education_level",
    "course",
    "institution_type",
    "parent_occupation",
    "financial_dependency",
    "sports_achievement",
    "academic_achievement"
]

NUMERICAL_FEATURES = [
    "age",
    "disability",
    "first_generation",
    "year",           # NOTE: DB stores as year_of_study, mapped to 'year' in prepare_student_features()
    "cgpa",
    "percentage",
    "backlogs",
    "attendance",
    "family_income",
    "family_size",
    "earning_members",
    "extracurricular_score",
    "previous_scholarship"
]

ALL_FEATURE_COLUMNS = CATEGORICAL_FEATURES + NUMERICAL_FEATURES
TARGET_COLUMN = "eligible"


def engineer_features(df):
    """
    Construct derived features while strictly avoiding data leakage.
    Only features known BEFORE the scholarship committee decision are used.
    Input DataFrame must have a 'year' column (not 'year_of_study').
    """
    df = df.copy()

    # 1. Income per family member (Per Capita Household Income)
    df["income_per_capita"] = df["family_income"] / np.maximum(df["family_size"], 1)

    # 2. Academic Merit Indicator (Normalized CGPA to 100% scale alignment)
    df["cgpa_percentage_ratio"] = df["percentage"] / np.maximum(df["cgpa"] * 9.5, 1.0)

    # 3. Dependency Ratio: family size divided by earning members
    df["dependency_ratio"] = df["family_size"] / np.maximum(df["earning_members"], 1)

    # 4. Academic-Attendance composite index
    df["academic_consistency"] = (df["cgpa"] / 10.0) * (df["attendance"] / 100.0)

    return df
