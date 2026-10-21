# Scholarship Eligibility Expert System
## Complete AI Mini Project Documentation & Academic Report

---

## 1. Project Abstract
Higher education scholarships are critical instruments for promoting educational equity, social mobility, and academic excellence. However, millions of eligible students fail to access available financial opportunities due to the fragmented nature of public schemes, intricate regulatory rules, and lack of transparency. 

The **Scholarship Eligibility Expert System** is a full-stack educational artificial intelligence platform designed to bridge this divide. It couples a **Symbolic Rule-Based Expert System** (for strict statutory validation such as income thresholds and backlog limits using Forward and Backward Chaining) with an **Ensemble Machine Learning Pipeline** (utilizing a Gradient Boosting Classifier benchmarked on 55,000 socioeconomic and academic profile records).

Furthermore, the system incorporates an **Explainable AI (XAI)** attribution module that explains *why* a student was assessed as eligible and provides concrete, actionable recommendations on *how* they can improve their eligibility score.

---

## 2. Problem Statement
1. **Scheme Fragmentation:** Scholarships offered by central ministries, state departments, and corporate CSR initiatives operate in silos with heterogeneous eligibility criteria.
2. **The "Black Box" Barrier:** Traditional algorithmic scoring often provides binary accept/reject verdicts without disclosing the underlying factors, demoralizing deserving applicants.
3. **Regulatory Non-Compliance:** Pure machine learning models can suffer from edge-case hallucinations or predict eligibility for applicants who violate hard statutory conditions (e.g. failing minimum income caps or exceeding active backlogs).
4. **Administrative Overhead:** Scholarship committees spend thousands of hours manually cross-verifying transcripts, certificates, and eligibility thresholds.

---

## 3. Objectives
- Develop an end-to-end web portal featuring dedicated **Student** and **Administrator** role-based workspaces.
- Construct a realistic, derived dataset of **55,000 student profiles** modeling higher education scholarship patterns without fabricating real individuals.
- Benchmark multiple machine learning algorithms: **Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting**.
- Engineer a **Hybrid Decision Synergy Engine** that weights statutory rule compliance (45%) alongside machine learning peer competitiveness (55%).
- Deliver **Explainable AI (XAI)** factor breakdowns: *"Why am I eligible?"* (Positive Drivers) and *"What can I improve?"* (Actionable Guidance).
- Build a multi-criteria **Recommendation Engine** that computes continuous match percentages ($0.0 - 100.0\%$), identifies missing criteria, and ranks opportunities by suitability.
- Guarantee **Demographic Neutrality & Fairness** by strictly excluding caste and social category from machine learning feature pipelines, predictions, general eligibility scoring, and merit ranking.

---

## 4. Existing System vs. Proposed System

| Parameter | Existing Traditional Portals | Proposed Hybrid Expert System |
| :--- | :--- | :--- |
| **Assessment Methodology** | Static manual form reading or basic filters. | **Hybrid:** Symbolic Rules + Gradient Boosting Machine Learning. |
| **Explainability** | Zero explanation; binary pass/fail message. | **Explainable AI:** Feature contribution decomposition & tips. |
| **Personalization** | Generalized listings sorted only by date. | **Dynamic Matching:** Continuous surplus scaling over criteria ($0.0 - 100.0\%$). |
| **Predictive Power** | Absent. | Evaluates merit against 55,000 benchmarked profiles. |
| **Auditing & Governance** | Manual paperwork verification. | Administrative dashboard with Confusion Matrices & 1-click retrain. |

---

## 5. System Architecture

```
                          [ Student / Admin Client Browser ]
                                          │
                            (React 19 / Vite / Tailwind)
                                          │
                                          ▼  [REST API / JWT Auth]
                             [ FastAPI Application Layer ]
                                          │
              ┌───────────────────────────┼───────────────────────────┐
              ▼                           ▼                           ▼
      [ Auth & RBAC ]            [ Hybrid Expert Engine ]     [ Operations & Docs ]
   (Bcrypt / JWT Bearer)                  │                  (Static File Vault)
                                          │
                    ┌─────────────────────┴─────────────────────┐
                    ▼                                           ▼
         [ Rule-Based Engine ]                       [ ML Inference Engine ]
     - Forward Chaining (Deduction)              - HistGradientBoosting (55k rows)
     - Backward Chaining (Goal Proof)            - 74 Encoders & Scalers
     - Income caps (≤ ₹8 Lakhs)                  - Pure Merit (No Category Features)
     - Backlog ceiling (≤ 1)                     - Multidimensional Probability
                    │                                           │
                    └─────────────────────┬─────────────────────┘
                                          │
                                          ▼
                               [ Explainable AI (XAI) ]
                             - Positive Factor Breakdown
                             - Actionable Improvement Tips
                                          │
                                          ▼
                         [ Recommendation Ranking Engine ]
                             - Multi-criteria match score
                             - Missing criteria detection & penalty capping
                                          │
                                          ▼
                         [ Relational Database (SQLAlchemy) ]
                           (SQLite / PostgreSQL Compatible)
```

---

## 6. Data Flow Diagrams (DFD)

### Level 0 DFD (Context Diagram)
```
[ Student Applicant ] ──( 1. Enters 4-Step Academic & Financial Profile )──> [ Scholarship Eligibility ]
[ Student Applicant ] <──( 2. Returns Hybrid Score, XAI Factors & Recs )─── [   Expert System   ]
                                                                                      │
[ Administrator ]     ──( 3. Configures Schemes & Triggers Retraining )─────> [   Core Platform   ]
[ Administrator ]     <──( 4. Real-time Applicant Analytics & ML Health )─── [                   ]
```

### Level 1 DFD (Process Decomposition)
1. **P1: Authentication & Token Issuance** - Validates credentials via salted bcrypt hashes, issues signed JWT with embedded user role.
2. **P2: Rule Validation Engine** - Applies crisp deterministic thresholds against income, attendance, CGPA, and backlogs via Forward Chaining and Backward Chaining.
3. **P3: ML Feature Transformation & Scoring** - Preprocesses 74 encoded numerical features (excluding category) and calculates eligibility probability via Gradient Boosting.
4. **P4: Hybrid Result & Explainability Synthesis** - Combines outputs into a unified 0–100 score (55% ML, 45% Rules) and extracts positive/negative impact factors.
5. **P5: Recommendation & Application Dispatch** - Ranks schemes using continuous surplus scaling and logs applications into the committee review pipeline.

---

## 7. Entity-Relationship (ER) Diagram

```
+------------------+         1:1         +------------------+
|      users       | ─────────────────── | student_profiles |
+------------------+                     +------------------+
| id (PK)          |                     | user_id (FK)     |
| email            |                     | age, gender      |
| password_hash    |                     | state, category  |
| full_name        |                     | disability       |
| role             |                     | rural_urban      |
+--------┬---------+                     +------------------+
         │ 1:1
         ├──────────────────────────────>+--------------------+
         │                               |  academic_records  |
         │                               +--------------------+
         │                               | user_id (FK)       |
         │                               | cgpa, backlogs     |
         │ 1:1                           | attendance, course |
         ├──────────────────────────────>+--------------------+
         │                               +--------------------+
         │                               | financial_records  |
         │                               +--------------------+
         │                               | user_id (FK)       |
         │ 1:1                           | family_income      |
         ├──────────────────────────────>+--------------------+
         │                               +--------------------+
         │                               |achievement_records |
         │                               +--------------------+
         │                               | user_id (FK)       |
         │ 1:N                           | sports, academic   |
         ├──────────────────────────────>+--------------------+
         │                               +--------------------+
         │                               |  eligibility_res   |
         │                               +--------------------+
         │                               | user_id (FK)       |
         │ 1:N                           | hybrid_score, XAI  |
         ├──────────────────────────────>+--------------------+
         │                               +--------------------+
         │                               | student_documents  |
         │                               +--------------------+
         │                               | user_id (FK)       |
         │ 1:N                           | verification_status|
         │                               +--------------------+
         ▼
+--------------------+       N:1         +--------------------+
|    applications    | <──────────────── |    scholarships    |
+--------------------+                   +--------------------+
| id (PK)            |                   | id (PK)            |
| user_id (FK)       |                   | title, provider    |
| scholarship_id (FK)|                   | amount, deadline   |
| status, applied_at |                   | min_cgpa, max_inc  |
| award_status       |                   | required_category  |
| disbursement_ref   |                   +--------------------+
+--------------------+
```

---

## 8. Machine Learning Pipeline & Benchmark Results

### Model Comparison Table (Test Set: 11,000 Stratified Holdout Samples)

| Algorithm | Accuracy | Precision | Recall | F1 Score | ROC-AUC | 5-Fold CV F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Baseline)** | 92.45% | 96.52% | 92.35% | 0.9439 | 0.9807 | $0.9434 \pm 0.0017$ |
| **Decision Tree Classifier** | 93.93% | 97.36% | 93.71% | 0.9550 | 0.9810 | $0.9584 \pm 0.0016$ |
| **Random Forest (Bagging)** | 93.96% | 98.20% | 92.93% | 0.9549 | 0.9879 | $0.9562 \pm 0.0020$ |
| **Gradient Boosting (Boosting)** ★ | **95.08%** | **97.82%** | **94.96%** | **0.9637** | **0.9922** | **$0.9643 \pm 0.0019$** |

★ **Selected Production Model:** `HistGradientBoostingClassifier` demonstrated the highest generalizability with an F1 score of **0.9637** and an ROC-AUC of **0.9922**.

### Confusion Matrix (Gradient Boosting Model on 11,000 Test Cases)
- **True Negatives (TN):** 3,275
- **False Positives (FP - Type I Error):** 160
- **False Negatives (FN - Type II Error):** 381
- **True Positives (TP):** 7,184

### Top Feature Importances
1. `backlogs` (35.80%) - Primary continuity filter.
2. `family_income` (23.56%) - Primary indicator for socioeconomic need.
3. `income_per_capita` (14.76%) - Measures per-member economic burden.
4. `cgpa` (5.65%) - Academic merit differentiator.
5. `academic_consistency` (5.61%) - Interaction between CGPA and institutional attendance.
6. `percentage` (4.53%) - Secondary academic performance metric.
7. `attendance` (1.74%) - Regularity compliance.

### Benchmark Evaluation Caveat & Calibration Status
- **Synthetic Benchmark:** Training and evaluation were conducted on a synthetic dataset of 55,000 records whose labels were generated deterministically by policy rules. Reported metrics measure the model's ability to reproduce these rules.
- **Brier Score:** On the 11,000 held-out test split, the active model achieves a Brier score loss of **0.0348**, confirming probability calibration against the synthetic benchmark.
- **Live Cohort Status:** Probability calibration has **not** been verified on live real-world student cohorts because independent ground-truth scholarship qualification outcomes do not exist separately from policy and administrative committee decisions.

---

## 9. Viva Voce Preparation Q&A

**Q1: What makes this a "Hybrid Expert System" rather than just a machine learning model?**  
*Answer:* A pure ML model is probabilistic and can predict that an applicant is eligible even if they violate a hard non-negotiable statutory rule (like exceeding maximum allowed income or having active backlogs). Conversely, a pure rule engine lacks adaptability and cannot evaluate peer competitiveness or subtle multivariate patterns. Our system fuses a deterministic **Rule Engine (45% weight)** with a **Gradient Boosting Classifier (55% weight)**, ensuring strict legal compliance alongside holistic merit evaluation.

**Q2: How does the system handle Explainable AI (XAI)?**  
*Answer:* The system implements a feature contribution decomposition engine that translates numerical thresholds and model feature importances into clear natural language explanations. It separates factors into positive contributors ("Why am I eligible?") such as high CGPA and low income, and actionable negative factors ("What can I improve?") such as clearing active backlogs or improving attendance above 75%.

**Q3: How were privacy and demographic fairness ensured in the ML pipeline?**  
*Answer:* Social category (caste) was strictly excluded from all 74 features of the machine learning pipeline, inference code, general rule engine baseline, and general merit ranking. In addition, counterfactual tests confirm 0.000 variance in predictions when altering category values. Social category is restricted exclusively to authorized statutory affirmative-action quota verification (where an applicant uploads a verified certificate for a reserved scheme) and admin census reporting.

**Q4: How does the recommendation system rank scholarships?**  
*Answer:* It calculates a composite match percentage bounded within $[0.0, 100.0]\%$:  
$$\text{Match} = (0.35 \times \text{ML\_Readiness}) + (0.35 \times \text{Academic\_Fit}) + (0.20 \times \text{Financial\_Fit}) + (0.10 \times \text{Statutory\_Fit}) - \text{Penalties}$$  
Academic fit employs continuous surplus scaling above minimum criteria rather than static step functions. If mandatory scheme requirements are unmet, the match percentage is capped at $\le 75.0\%$.

---

## 10. Conclusion & Future Scope
The Scholarship Eligibility Expert System provides a comprehensive solution for transparent, efficient educational grant distribution. By combining symbolic AI with ensemble learning and explainable interfaces, it eliminates administrative bottlenecks while providing students with actionable clarity.

**Future Scope:**
- Integration with National Academic Depository (NAD) and DigiLocker APIs for automated document verification.
- Multilingual conversational assistant for rural and regional applicants.
- Blockchain-based tamper-proof scholarship disbursal ledger.
