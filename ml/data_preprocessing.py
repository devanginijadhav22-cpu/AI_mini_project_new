"""
Data Preprocessing Pipeline for Scholarship Eligibility
Author: AI Mini Project Team
"""

import os
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import StandardScaler, OneHotEncoder
import joblib

from ml.feature_engineering import (
    CATEGORICAL_FEATURES,
    NUMERICAL_FEATURES,
    ALL_FEATURE_COLUMNS,
    TARGET_COLUMN,
    engineer_features
)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "data", "scholarship_dataset.csv")
MODELS_DIR = os.path.join(BASE_DIR, "models")

def load_and_clean_data(filepath=DATA_PATH):
    """
    Loads dataset, handles missing values, removes duplicates,
    and applies feature engineering.
    """
    if not os.path.exists(filepath):
        raise FileNotFoundError(f"Dataset not found at {filepath}. Run generate_dataset.py first.")
        
    df = pd.read_csv(filepath)
    
    # 1. Deduplication
    initial_rows = len(df)
    df = df.drop_duplicates(subset=["student_id"])
    
    # 2. Missing value handling (Defensive check)
    # Numerical: Median imputation
    for num_col in NUMERICAL_FEATURES:
        if num_col in df.columns and df[num_col].isnull().any():
            df[num_col] = df[num_col].fillna(df[num_col].median())
            
    # Categorical: Mode imputation
    for cat_col in CATEGORICAL_FEATURES:
        if cat_col in df.columns and df[cat_col].isnull().any():
            df[cat_col] = df[cat_col].fillna(df[cat_col].mode()[0])
            
    # 3. Outlier check & reasonable capping
    df["cgpa"] = np.clip(df["cgpa"], 0.0, 10.0)
    df["percentage"] = np.clip(df["percentage"], 0.0, 100.0)
    df["attendance"] = np.clip(df["attendance"], 0.0, 100.0)
    df["family_income"] = np.clip(df["family_income"], 10000, 5000000)
    
    # 4. Feature engineering
    df = engineer_features(df)
    
    return df

def get_preprocessor():
    """
    Returns a ColumnTransformer for categorical OneHotEncoding and numerical Scaling.
    """
    # Extended numerical features from feature engineering
    extended_numerical = NUMERICAL_FEATURES + [
        "income_per_capita",
        "cgpa_percentage_ratio",
        "dependency_ratio",
        "academic_consistency"
    ]
    
    preprocessor = ColumnTransformer(
        transformers=[
            ("num", StandardScaler(), extended_numerical),
            ("cat", OneHotEncoder(handle_unknown="ignore", sparse_output=False), CATEGORICAL_FEATURES)
        ],
        remainder="drop"
    )
    return preprocessor, extended_numerical

def prepare_train_test_data(test_size=0.2, random_state=42):
    """
    Splits data with stratification to maintain class balance.
    """
    df = load_and_clean_data()
    
    y = df[TARGET_COLUMN].values
    engineered_cols = [
        "income_per_capita",
        "cgpa_percentage_ratio",
        "dependency_ratio",
        "academic_consistency"
    ]
    feature_cols = [c for c in (ALL_FEATURE_COLUMNS + engineered_cols) if c in df.columns]
    X_raw = df[feature_cols]
    
    X_train_raw, X_test_raw, y_train, y_test = train_test_split(
        X_raw, y, test_size=test_size, random_state=random_state, stratify=y
    )
    
    preprocessor, ext_numerical = get_preprocessor()
    X_train = preprocessor.fit_transform(X_train_raw)
    X_test = preprocessor.transform(X_test_raw)
    
    # Save the fitted preprocessor
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(preprocessor, os.path.join(MODELS_DIR, "preprocessor.pkl"))
    
    # Extract feature names after one-hot encoding
    cat_encoder = preprocessor.named_transformers_["cat"]
    cat_feature_names = list(cat_encoder.get_feature_names_out(CATEGORICAL_FEATURES))
    feature_names = ext_numerical + cat_feature_names
    joblib.dump(feature_names, os.path.join(MODELS_DIR, "feature_names.pkl"))
    
    return X_train, X_test, y_train, y_test, preprocessor, feature_names
