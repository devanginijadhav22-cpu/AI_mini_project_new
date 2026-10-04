"""
Model Training and Multi-Algorithm Benchmarking
Algorithms compared:
1. Logistic Regression (Baseline with balanced weights)
2. Decision Tree Classifier
3. Random Forest Classifier (Bagging Ensemble)
4. Gradient Boosting Classifier (Boosting Ensemble)

Evaluates on Accuracy, Precision, Recall, F1 Score, ROC-AUC, and Confusion Matrix.
Saves the top-performing model and comprehensive metrics JSON.
"""

import os
import json
import time
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, HistGradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    roc_auc_score, confusion_matrix
)
from sklearn.model_selection import cross_val_score, StratifiedKFold
import joblib

from ml.data_preprocessing import prepare_train_test_data, MODELS_DIR

def train_and_evaluate_models():
    print("=" * 70)
    print("STEP 1: PREPARING DATA & FEATURE PIPELINES (55,000 RECORDS)")
    print("=" * 70)
    
    start_time = time.time()
    X_train, X_test, y_train, y_test, preprocessor, feature_names = prepare_train_test_data()
    print(f"Data split: Train={X_train.shape[0]} samples, Test={X_test.shape[1]} features.")
    
    models = {
        "Logistic Regression": LogisticRegression(
            max_iter=1000, class_weight="balanced", random_state=42
        ),
        "Decision Tree": DecisionTreeClassifier(
            max_depth=10, min_samples_split=20, class_weight="balanced", random_state=42
        ),
        "Random Forest": RandomForestClassifier(
            n_estimators=100, max_depth=14, min_samples_split=15, 
            class_weight="balanced", random_state=42, n_jobs=-1
        ),
        "Gradient Boosting": HistGradientBoostingClassifier(
            max_iter=100, max_depth=10, min_samples_leaf=20, 
            class_weight="balanced", random_state=42
        )
    }
    
    results = {}
    best_model_name = None
    best_f1 = -1.0
    best_model_obj = None
    
    cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)
    
    print("\n" + "=" * 70)
    print("STEP 2: TRAINING & BENCHMARKING MULTIPLE ML ALGORITHMS")
    print("=" * 70)
    
    for name, clf in models.items():
        print(f"\n--- Training {name} ---")
        t0 = time.time()
        clf.fit(X_train, y_train)
        fit_time = round(time.time() - t0, 3)
        
        # Test Set Predictions
        y_pred = clf.predict(X_test)
        if hasattr(clf, "predict_proba"):
            y_proba = clf.predict_proba(X_test)[:, 1]
        else:
            y_proba = clf.decision_function(X_test)
            
        # Metrics
        acc = float(accuracy_score(y_test, y_pred))
        prec = float(precision_score(y_test, y_pred, zero_division=0))
        rec = float(recall_score(y_test, y_pred, zero_division=0))
        f1 = float(f1_score(y_test, y_pred, zero_division=0))
        roc = float(roc_auc_score(y_test, y_proba))
        
        # 5-fold cross validation score (subset for fast execution if needed, or full train)
        print("  Running 5-fold stratified cross validation...")
        cv_scores = cross_val_score(clf, X_train[:15000], y_train[:15000], cv=cv, scoring="f1")
        cv_mean = float(cv_scores.mean())
        cv_std = float(cv_scores.std())
        
        # Confusion matrix
        cm = confusion_matrix(y_test, y_pred).tolist() # [[TN, FP], [FN, TP]]
        
        results[name] = {
            "name": name,
            "accuracy": round(acc, 4),
            "precision": round(prec, 4),
            "recall": round(rec, 4),
            "f1_score": round(f1, 4),
            "roc_auc": round(roc, 4),
            "cv_f1_mean": round(cv_mean, 4),
            "cv_f1_std": round(cv_std, 4),
            "confusion_matrix": cm,
            "training_time_seconds": fit_time
        }
        
        print(f"  Accuracy:  {acc:.4f} | Precision: {prec:.4f} | Recall: {rec:.4f} | F1: {f1:.4f} | ROC-AUC: {roc:.4f}")
        print(f"  5-Fold CV F1: {cv_mean:.4f} (+/- {cv_std:.4f}) | Training Time: {fit_time}s")
        print(f"  Confusion Matrix: {cm}")
        
        # Select best model based on F1 Score & ROC-AUC
        if f1 > best_f1:
            best_f1 = f1
            best_model_name = name
            best_model_obj = clf

    print("\n" + "=" * 70)
    print("STEP 3: EXTRACTING FEATURE IMPORTANCE & COMPARISON TABLE")
    print("=" * 70)
    
    # Feature Importance for Tree/Ensemble model
    feature_importance_list = []
    if hasattr(best_model_obj, "feature_importances_"):
        importances = best_model_obj.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices[:20]: # Top 20 features
            feature_importance_list.append({
                "feature": feature_names[idx],
                "importance": round(float(importances[idx]), 4)
            })
    else:
        # Fallback for models without direct feature_importances_ attribute (e.g. HistGradientBoosting)
        # Use permutation importance or random forest equivalent
        rf_ref = models["Random Forest"]
        importances = rf_ref.feature_importances_
        sorted_indices = np.argsort(importances)[::-1]
        for idx in sorted_indices[:20]:
            feature_importance_list.append({
                "feature": feature_names[idx],
                "importance": round(float(importances[idx]), 4)
            })
            
    print("\nTop 10 Most Influential Features:")
    for item in feature_importance_list[:10]:
        print(f"  - {item['feature']:<30}: {item['importance']:.4f}")

    print(f"\nWinning Model Selected: {best_model_name} (F1 Score: {best_f1:.4f})")
    
    # Serialization
    print("\n" + "=" * 70)
    print("STEP 4: SAVING MODEL ARTIFACTS AND BENCHMARK RESULTS")
    print("=" * 70)
    
    os.makedirs(MODELS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, "trained_model.pkl")
    rf_explainer_path = os.path.join(MODELS_DIR, "rf_explainer_model.pkl")
    metrics_path = os.path.join(MODELS_DIR, "model_metrics.json")
    
    joblib.dump(best_model_obj, model_path)
    joblib.dump(models["Random Forest"], rf_explainer_path) # Useful for fast feature attribution
    
    export_payload = {
        "best_model": best_model_name,
        "selected_metric": "F1 Score",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "models_benchmarked": results,
        "feature_importance": feature_importance_list,
        "total_records": len(X_train) + len(X_test),
        "test_size": len(X_test),
        "num_features": len(feature_names)
    }
    
    with open(metrics_path, "w") as f:
        json.dump(export_payload, f, indent=2)
        
    print(f"Artifacts successfully saved to {MODELS_DIR}:")
    print(f"  - {model_path}")
    print(f"  - {rf_explainer_path}")
    print(f"  - {metrics_path}")
    print(f"Total pipeline execution time: {round(time.time() - start_time, 2)}s")

if __name__ == "__main__":
    train_and_evaluate_models()
