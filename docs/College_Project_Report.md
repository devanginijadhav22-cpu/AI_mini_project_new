# Scholarship Eligibility Expert System
## Complete AI Mini Project Documentation & Academic Report

---

## 1. Project Abstract
Higher education scholarships are critical instruments for promoting educational equity, social mobility, and academic excellence. However, millions of eligible students fail to access available financial opportunities due to the fragmented nature of public schemes, intricate regulatory rules, and lack of transparency. 

The **Scholarship Eligibility Expert System** is a full-stack, enterprise-grade educational artificial intelligence platform designed to bridge this divide. It couples a **Symbolic Rule-Based Expert System** (for strict statutory validation such as income thresholds and backlog limits) with an **Ensemble Machine Learning Pipeline** (utilizing a Gradient Boosting Classifier benchmarked on 55,000+ socioeconomic and academic records). 

Furthermore, the system incorporates an **Explainable AI (XAI)** decomposition module that explains *why* a student was assessed as eligible and provides concrete, actionable recommendations on *how* they can improve their eligibility score.

---

## 2. Problem Statement
1. **Scheme Fragmentation:** Scholarships offered by central ministries, state departments, and corporate CSR initiatives operate in silos with heterogeneous eligibility criteria.
2. **The "Black Box" Barrier:** Traditional algorithmic scoring often provides binary accept/reject verdicts without disclosing the underlying factors, demoralizing deserving applicants.
3. **Regulatory Non-Compliance:** Pure machine learning models can suffer from edge-case hallucinations or predict eligibility for applicants who violate hard statutory conditions (e.g. failing minimum income caps or exceeding active backlogs).
4. **Administrative Overhead:** Scholarship committees spend thousands of hours manually cross-verifying transcripts, certificates, and eligibility thresholds.

---

## 3. Objectives
- Develop an end-to-end web portal featuring dedicated **Student** and **Administrator** role-based workspaces.
- Construct a realistic, derived dataset of **55,000+ student profiles** modeling national scholarship schemes without fabricating real individuals.
- Benchmark multiple machine learning algorithms: **Logistic Regression, Decision Tree, Random Forest, and Gradient Boosting**.
- Engineer a **Hybrid Decision Synergy Engine** that weights statutory rule compliance (45%) alongside machine learning peer competitiveness (55%).
- Deliver **Explainable AI (XAI)** factor breakdowns: *"Why am I eligible?"* (Positive Drivers) and *"What can I improve?"* (Actionable Guidance).
- Build a multi-criteria **Recommendation Engine** that computes match percentages, identifies missing criteria, and ranks opportunities by deadline and relevance.

---

## 4. Existing System vs. Proposed System

| Parameter | Existing Traditional Portals | Proposed Hybrid Expert System |
| :--- | :--- | :--- |
| **Assessment Methodology** | Static manual form reading or basic filters. | **Hybrid:** Symbolic Rules + Gradient Boosting Machine Learning. |
| **Explainability** | Zero explanation; binary pass/fail message. | **Explainable AI:** Feature contribution decomposition & tips. |
| **Personalization** | Generalized listings sorted only by date. | **Dynamic Matching:** Ranks by student-specific multidimensional fit. |
| **Predictive Power** | Absent. | Evaluates merit against 55,000+ benchmarked profiles. |
| **Auditing & Governance** | Manual paperwork verification. | Administrative dashboard with Confusion Matrices & 1-click retrain. |

---

## 5. System Architecture

```
                          [ Student / Admin Client Browser ]
                                          │
                            (React 18 / Vite / Tailwind)
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
     - Mandatory statutory limits                - Gradient Boosting (55k rows)
     - Income caps (≤ ₹8 Lakhs)                  - Preprocessor / Scaler / Encoders
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
                             - Missing criteria detection
                                          │
                                          ▼
                         [ Relational Database (SQLAlchemy) ]
                           (SQLite / PostgreSQL Compatible)
```

---

## 6. Data Flow Diagrams (DFD)

### Level 0 DFD (Context Diagram)
```
[ Student Applicant ] ──( 1. Enters 5-Step Academic & Financial Profile )──> [ Scholarship Eligibility ]
[ Student Applicant ] <──( 2. Returns Hybrid Score, XAI Factors & Recs )─── [   Expert System   ]
                                                                                      │
[ Administrator ]     ──( 3. Configures Schemes & Triggers Retraining )─────> [   Core Platform   ]
[ Administrator ]     <──( 4. Real-time Applicant Analytics & ML Health )─── [                   ]
```

### Level 1 DFD (Process Decomposition)
1. **P1: Authentication & Token Issuance** - Validates credentials via salted bcrypt hashes, issues signed JWT with embedded user role.
2. **P2: Rule Validation Engine** - Applies crisp deterministic thresholds against income, attendance, CGPA, and backlogs.
3. **P3: ML Feature Transformation & Scoring** - Preprocesses 79 encoded features and calculates eligibility probability via Gradient Boosting.
4. **P4: Hybrid Result & Explainability Synthesis** - Combines outputs into a unified 0–100 score and extracts positive/negative impact factors.
5. **P5: Recommendation & Application Dispatch** - Ranks schemes and logs applications into review pipeline.

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
         │ 1:N                           | family_income      |
         ├──────────────────────────────>+--------------------+
         │                               +--------------------+
         │                               |  eligibility_res   |
         │ 1:N                           +--------------------+
         │                               | user_id (FK)       |
         │                               | hybrid_score, XAI  |
         │                               +--------------------+
         │
         ▼
+--------------------+       N:1         +--------------------+
|    applications    | <──────────────── |    scholarships    |
+--------------------+                   +--------------------+
| id (PK)            |                   | id (PK)            |
| user_id (FK)       |                   | title, provider    |
| scholarship_id (FK)|                   | amount, deadline   |
| status, applied_at |                   | min_cgpa, max_inc  |
+--------------------+                   +--------------------+
```

---

## 8. Machine Learning Pipeline & Benchmark Results

### Model Comparison Table (Test Set: 11,000 Stratified Holdout Samples)

| Algorithm | Accuracy | Precision | Recall | F1 Score | ROC-AUC | 5-Fold CV F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Baseline)** | 91.75% | 97.87% | 91.69% | 0.9468 | 0.9773 | 0.9456 ± 0.0028 |
| **Decision Tree Classifier** | 92.63% | 98.29% | 92.40% | 0.9525 | 0.9707 | 0.9438 ± 0.0036 |
| **Random Forest (Bagging)** | 93.25% | 98.50% | 93.00% | 0.9567 | 0.9802 | 0.9523 ± 0.0032 |
| **Gradient Boosting (Boosting)** ★ | **94.28%** | **98.60%** | **94.20%** | **0.9635** | **0.9895** | **0.9610 ± 0.0017** |

★ **Selected Production Model:** Gradient Boosting Classifier demonstrated the highest generalizability with an F1 score of **0.9635** and an exceptional ROC-AUC of **0.9895**.

### Confusion Matrix (Gradient Boosting Model on 11,000 Test Cases)
- **True Negatives (TN):** 2,074
- **False Positives (FP - Type I Error):** 118
- **False Negatives (FN - Type II Error):** 511
- **True Positives (TP):** 8,297
- **Model Sensitivity (Recall):** 94.2%
- **Model Specificity:** 94.6%

### Top Feature Importances
1. `family_income` (31.74%) - Primary indicator for need-based subsidy qualification.
2. `backlogs` (23.78%) - Primary continuity filter.
3. `income_per_capita` (22.36%) - Measures per-member economic burden.
4. `cgpa` (2.53%) - Key academic merit differentiator.
5. `percentage` (2.27%) - Secondary merit verification.
6. `category_General` (2.14%) - Quota differential indicator.
7. `academic_consistency` (2.01%) - Composite interaction between CGPA and institutional attendance.

---

## 9. Viva Voce Preparation Q&A

**Q1: What makes this a "Hybrid Expert System" rather than just a machine learning model?**  
*Answer:* A pure ML model is probabilistic and can occasionally predict that an applicant is eligible even if they violate a hard non-negotiable statutory rule (like exceeding maximum allowed income or having too many backlogs). Conversely, a pure rule engine lacks adaptability and cannot evaluate subtle peer competitiveness or complex multivariate patterns. Our system fuses a deterministic **Rule Engine (45% weight)** with a **Gradient Boosting Classifier (55% weight)**, ensuring strict legal compliance alongside holistic merit evaluation.

**Q2: How does the system handle Explainable AI (XAI)?**  
*Answer:* The system implements a feature contribution decomposition engine that translates numerical thresholds and model feature importances into clear natural language explanations. It separates factors into positive contributors ("Why am I eligible?") such as high CGPA and low income, and actionable negative factors ("What can I improve?") such as clearing active backlogs or improving attendance above 75%.

**Q3: How was data leakage prevented during ML training?**  
*Answer:* All features used in training (`cgpa`, `family_income`, `category`, `attendance`, `backlogs`) represent information that exists strictly **prior** to any scholarship decision. Post-decision attributes (like grant sanction dates, disbursal IDs, or committee approval notes) were strictly excluded from the training matrix.

**Q4: How does the recommendation system rank scholarships?**  
*Answer:* It calculates a composite match percentage:  
$$\text{Match} = (0.50 \times \text{ML\_Probability}) + (0.25 \times \text{Academic\_Fit}) + (0.15 \times \text{Financial\_Fit}) + (0.10 \times \text{Category\_Fit}) - \text{Penalties for Unmet Criteria}$$  
This guarantees scholarships are sorted by individual suitability rather than generic listing dates.

---

## 10. Conclusion & Future Scope
The Scholarship Eligibility Expert System provides a comprehensive solution for transparent, efficient educational grant distribution. By combining symbolic AI with ensemble learning and explainable interfaces, it eliminates administrative bottlenecks while providing students with actionable clarity.

**Future Scope:**
- Integration with National Academic Depository (NAD) and DigiLocker APIs for instant automated document verification.
- Multilingual conversational voice assistant for rural applicants.
- Blockchain-based tamper-proof scholarship disbursal ledger.
