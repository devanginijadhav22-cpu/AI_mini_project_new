import os
import sys
import sqlite3
import numpy as np
import pandas as pd
import joblib

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from ml.data_preprocessing import prepare_train_test_data, MODELS_DIR
from sklearn.metrics import brier_score_loss

def run_verification():
    conn = sqlite3.connect('scholarship_system.db')
    cursor = conn.cursor()

    print("=" * 80)
    print("CHECK 1: UNIQUE STUDENTS AND JOIN MULTIPLICATION")
    print("=" * 80)
    cursor.execute("SELECT count(*) FROM users WHERE role = 'STUDENT'")
    total_students = cursor.fetchone()[0]
    print(f"Total student accounts: {total_students}")

    cursor.execute("SELECT id, email, full_name FROM users WHERE role = 'STUDENT'")
    students = cursor.fetchall()
    student_ids = [s[0] for s in students]
    print(f"Unique student IDs count: {len(set(student_ids))}")

    # Inspect related table counts
    cursor.execute("SELECT count(*) FROM student_profiles")
    total_profiles = cursor.fetchone()[0]
    cursor.execute("SELECT user_id, count(*) FROM student_profiles GROUP BY user_id HAVING count(*) > 1")
    dup_profiles = cursor.fetchall()
    print(f"Student profiles count: {total_profiles}, duplicate user_ids: {dup_profiles}")

    cursor.execute("SELECT count(*) FROM financial_records")
    total_finances = cursor.fetchone()[0]
    cursor.execute("SELECT user_id, count(*) FROM financial_records GROUP BY user_id HAVING count(*) > 1")
    dup_finances = cursor.fetchall()
    print(f"Financial records count: {total_finances}, duplicate user_ids: {dup_finances}")

    cursor.execute("SELECT count(*) FROM academic_records")
    total_academics = cursor.fetchone()[0]
    cursor.execute("SELECT user_id, count(*) FROM academic_records GROUP BY user_id HAVING count(*) > 1")
    dup_academics = cursor.fetchall()
    print(f"Academic records count: {total_academics}, duplicate user_ids: {dup_academics}")

    cursor.execute("SELECT count(*) FROM eligibility_results")
    total_elig = cursor.fetchone()[0]
    cursor.execute("SELECT user_id, count(*) FROM eligibility_results GROUP BY user_id HAVING count(*) > 1")
    dup_elig = cursor.fetchall()
    print(f"Eligibility results count: {total_elig}, duplicate user_ids: {len(dup_elig)} users have multiple results")
    for u_id, cnt in dup_elig[:5]:
        print(f"   User {u_id} has {cnt} eligibility assessment records")

    cursor.execute("SELECT count(*) FROM applications")
    total_apps = cursor.fetchone()[0]
    cursor.execute("SELECT user_id, count(*) FROM applications GROUP BY user_id HAVING count(*) > 1")
    dup_apps = cursor.fetchall()
    print(f"Applications count: {total_apps}, duplicate user_ids: {len(dup_apps)} users have multiple applications")

    print("\n" + "=" * 80)
    print("CHECK 2: LATEST ASSESSMENT SELECTION ORDERING RULE")
    print("=" * 80)
    # Check ordering rule on eligibility_results
    q_ranked = """
    WITH Ranked AS (
        SELECT 
            id,
            user_id,
            ml_probability,
            hybrid_score,
            rule_status,
            created_at,
            ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY created_at DESC, id DESC) as rn
        FROM eligibility_results
    )
    SELECT id, user_id, ml_probability, hybrid_score, rule_status, created_at, rn
    FROM Ranked
    WHERE user_id IN (SELECT user_id FROM eligibility_results GROUP BY user_id HAVING count(*) > 1)
    ORDER BY user_id, rn
    """
    df_ranked_multi = pd.read_sql_query(q_ranked, conn)
    print(f"Multi-assessment records preview (showing ordering by created_at DESC, id DESC):")
    print(df_ranked_multi.head(10))

    # Validate that rn=1 always has created_at >= any other rn for same user_id
    for uid, grp in df_ranked_multi.groupby('user_id'):
        top_row = grp[grp['rn'] == 1].iloc[0]
        for _, other_row in grp[grp['rn'] > 1].iterrows():
            assert (top_row['created_at'] > other_row['created_at']) or (
                top_row['created_at'] == other_row['created_at'] and top_row['id'] > other_row['id']
            ), f"Ordering violation for user {uid}"
    print("Ordering rule verified: created_at DESC with id DESC tiebreaker strictly picks the newest assessment.")

    print("\n" + "=" * 80)
    print("CHECK 3: PROBABILITY BANDS OF THE 49 ASSESSED STUDENTS")
    print("=" * 80)
    q_latest = """
    WITH Ranked AS (
        SELECT 
            user_id,
            ml_probability,
            hybrid_score,
            ROW_NUMBER() OVER(PARTITION BY user_id ORDER BY created_at DESC, id DESC) as rn
        FROM eligibility_results
        WHERE user_id IN (SELECT id FROM users WHERE role = 'STUDENT')
    )
    SELECT user_id, ml_probability, hybrid_score
    FROM Ranked
    WHERE rn = 1
    """
    df_latest = pd.read_sql_query(q_latest, conn)
    print(f"Total assessed students: {len(df_latest)}")
    probs = df_latest['ml_probability'].values
    
    high_conf = [p for p in probs if p >= 0.90]
    band_80_89 = [p for p in probs if 0.80 <= p < 0.90]
    band_70_79 = [p for p in probs if 0.70 <= p < 0.80]
    band_50_69 = [p for p in probs if 0.50 <= p < 0.70]
    low_conf = [p for p in probs if p < 0.50]
    middle_band = [p for p in probs if 0.50 <= p < 0.90]
    unassessed = total_students - len(df_latest)

    print(f"High-confidence (>= 0.90, i.e. 90%-100%): {len(high_conf)}")
    print(f"Band 80%-89% (0.80 <= p < 0.90): {len(band_80_89)}")
    print(f"Band 70%-79% (0.70 <= p < 0.80): {len(band_70_79)}")
    print(f"Band 50%-69% (0.50 <= p < 0.70): {len(band_50_69)}")
    print(f"Middle-band aggregate (0.50 <= p < 0.90): {len(middle_band)}")
    print(f"Low-confidence (< 0.50, i.e. < 50%): {len(low_conf)}")
    print(f"Unassessed students: {unassessed}")
    print(f"Total partition sum: {len(high_conf) + len(middle_band) + len(low_conf)} assessed + {unassessed} unassessed = {len(probs) + unassessed}")

    print("\nDistribution summary of assessed probabilities:")
    print(f"Min probability: {probs.min():.4f}, Max probability: {probs.max():.4f}")
    print(f"Values in low-confidence (<0.50): {np.sort(low_conf)}")
    print(f"Values in high-confidence (>=0.90): summary - min {np.min(high_conf):.4f}, max {np.max(high_conf):.4f}, count {len(high_conf)}")

    print("\n" + "=" * 80)
    print("CHECK 4: CALIBRATION CALCULATIONS & BRIER SCORE ON HELD-OUT TEST BENCHMARK")
    print("=" * 80)
    print("Loading held-out test split (11,000 samples)...")
    X_train, X_test, y_train, y_test, preprocessor, feature_names = prepare_train_test_data()
    print(f"X_test shape: {X_test.shape}, y_test shape: {y_test.shape}")

    model_path = os.path.join(MODELS_DIR, "trained_model.pkl")
    model = joblib.load(model_path)
    print(f"Loaded model: {type(model).__name__}")

    y_proba = model.predict_proba(X_test)[:, 1]

    # Recompute Brier score
    brier = float(brier_score_loss(y_test, y_proba))
    manual_brier = float(np.mean((y_proba - y_test) ** 2))
    print(f"Calculated Brier Score Loss: {brier:.6f} (Manual mean squared error: {manual_brier:.6f})")
    print(f"Reported in admin_routes.py: 0.0348")
    print(f"Match: {abs(brier - 0.0348) < 0.001}")

    # 10-bin calibration table
    print("\n10-Bin Calibration Table Analysis:")
    # Standard 10 uniform bins: [0.0, 0.1), [0.1, 0.2), ..., [0.9, 1.0]
    bins = np.linspace(0.0, 1.0, 11)
    bin_results = []
    
    for i in range(10):
        bin_lower = bins[i]
        bin_upper = bins[i + 1]
        if i == 9: # Include 1.0 in the last bin
            idx = np.where((y_proba >= bin_lower) & (y_proba <= bin_upper))[0]
        else:
            idx = np.where((y_proba >= bin_lower) & (y_proba < bin_upper))[0]
        
        n_samples = len(idx)
        if n_samples > 0:
            mean_pred = float(np.mean(y_proba[idx]))
            true_frac = float(np.mean(y_test[idx]))
            abs_err = abs(mean_pred - true_frac)
        else:
            mean_pred = None
            true_frac = None
            abs_err = None

        bin_results.append({
            "bin": i + 1,
            "boundary": f"[{bin_lower:.1f}, {bin_upper:.1f}{']' if i == 9 else ')'}",
            "samples": n_samples,
            "mean_pred": mean_pred,
            "true_frac": true_frac,
            "abs_err": abs_err
        })

    df_calib = pd.DataFrame(bin_results)
    print(df_calib.to_string(index=False))

    print("\n" + "=" * 80)
    print("CHECK 6: PRIVACY AND FAIRNESS AUDIT (CATEGORY EXCLUSION)")
    print("=" * 80)
    print(f"Total features: {len(feature_names)}")
    category_features = [f for f in feature_names if 'category' in f.lower() or 'caste' in f.lower()]
    print(f"Features containing 'category' or 'caste': {category_features}")
    assert len(category_features) == 0, "Fairness violation: category found in ML features!"

if __name__ == '__main__':
    run_verification()
