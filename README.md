# ScholarAI: Scholarship Eligibility Expert System

> **Full-Stack Academic Decision Support System** combining a **Deterministic Rule-Based Expert System (Forward & Backward Chaining)**, a **HistGradientBoosting Machine Learning Classifier (55,000 Benchmark Dataset)**, an **Explainable AI (XAI) Attribution Engine**, and an **End-to-End Administrative Review & Disbursement Workflow**.

---

## 📑 Table of Contents
1. [Project Overview](#-project-overview)
2. [Technology Stack](#-technology-stack)
3. [System Architecture](#-system-architecture)
4. [Database Setup & Data Models](#-database-setup--data-models)
5. [Machine Learning Pipeline](#-machine-learning-pipeline)
6. [Expert System: Experiment 9 (Forward & Backward Chaining)](#-expert-system-experiment-9-forward--backward-chaining)
7. [Distinction Between Scores & Eligibility Status](#-distinction-between-scores--eligibility-status)
8. [Scholarship Recommendation & Match Scoring Engine](#-scholarship-recommendation--match-scoring-engine)
9. [Student & Administrative Workflows](#-student--administrative-workflows)
10. [Admin Console, ML Models & Analytics Reports](#-admin-console-ml-models--analytics-reports)
11. [Repository Structure](#-repository-structure)
12. [API Route Specifications](#-api-route-specifications)
13. [Installation & Local Run Guide](#-installation--local-run-guide)
14. [Deployment Instructions](#-deployment-instructions)
15. [Default Demo Accounts](#-default-demo-accounts)
16. [Verification & Test Suite](#-verification--test-suite)
17. [Privacy, Fairness & Security Safeguards](#-privacy-fairness--security-safeguards)
18. [Academic Transparency & System Limitations](#-academic-transparency--system-limitations)

---

## 🌟 Project Overview

ScholarAI addresses transparency and access barriers in higher education funding. Rather than treating scholarship allocation as a black-box problem or relying solely on rigid database filters, ScholarAI implements a **dual-engine decision support architecture**:

1. **Deterministic Rule-Based Expert System (Symbolic AI):** Evaluates non-negotiable statutory and institutional criteria (minimum CGPA, annual family income ceilings, active backlogs, and minimum attendance) using classical **Forward Chaining** (data-driven deduction) and **Backward Chaining** (goal-driven recursive proof trees).
2. **Gradient Boosting Machine Learning Model (Empirical AI):** Evaluates multidimensional peer competitiveness benchmarked across 55,000 student profile records over 23 raw features, 4 engineered indices, and 74 one-hot encoded & scaled numerical features.
3. **Hybrid Decision Synergy & Explainable AI (XAI):** Combines statutory rule compliance (45%) with machine learning profile probability (55%) into a transparent 0–100 eligibility score, supplemented by human-readable positive drivers, negative factors, and actionable improvement tips.
4. **Recommendation & Administrative Lifecycle:** Ranks active schemes with continuous, differentiated match scores ($0.0 - 100.0\%$), supported by an administrative console for document verification, information requests, approval, award tracking, and official disbursement records.

---

## 🛠️ Technology Stack

### Frontend Client
- **Framework:** [React 19](https://react.dev/) (`^19.2.8`)
- **Build Tool:** [Vite 8](https://vite.dev/) (`^8.3.0`)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/) (`^3.4.19`), PostCSS, Autoprefixer
- **Routing:** [React Router v7](https://reactrouter.com/) (`^7.18.4`)
- **Data Visualization:** [Recharts](https://recharts.org/) (`^3.10.1`)
- **Icons:** [Lucide React](https://lucide.dev/) (`^1.48.0`)
- **HTTP Client:** [Axios](https://axios-http.com/) (`^1.20.0`) with JWT request interceptors
- **Linting:** [Oxlint](https://oxc.rs/) (`^1.81.0`)

### Backend Server
- **Framework:** [FastAPI](https://fastapi.tiangolo.com/) (`>=0.110.0`)
- **ASGI Server:** [Uvicorn](https://www.uvicorn.org/) (`>=0.28.0`)
- **Data Validation & Settings:** [Pydantic v2](https://docs.pydantic.dev/) (`>=2.6.0`) & `pydantic-settings` (`>=2.2.0`)
- **Database ORM:** [SQLAlchemy](https://www.sqlalchemy.org/) (`>=2.0.28`)
- **Database Engine:** [SQLite](https://www.sqlite.org/) (zero-config local persistence in `scholarship_system.db`)
- **Security & Authentication:** [Passlib](https://passlib.readthedocs.io/) (`>=1.7.4`) with Bcrypt (`>=4.0.1`), [PyJWT](https://pyjwt.readthedocs.io/) (`>=2.8.0`) (HS256)
- **File Uploads:** `python-multipart` (`>=0.0.9`), `aiofiles` (`>=23.2.1`)

### Machine Learning & Data Science
- **ML Framework:** [scikit-learn](https://scikit-learn.org/) (`>=1.4.0`)
- **Primary Production Classifier:** `HistGradientBoostingClassifier` (`ml/models/trained_model.pkl`)
- **Explainability Model:** `RandomForestClassifier` (`ml/models/rf_explainer_model.pkl`)
- **Model Serialization:** [Joblib](https://joblib.readthedocs.io/) (`>=1.3.2`)
- **Data Processing:** [Pandas](https://pandas.pydata.org/) (`>=2.2.0`), [NumPy](https://numpy.org/) (`>=1.26.0`)

---

## 🏛️ System Architecture

```mermaid
graph TD
    subgraph Client["React 19 + Vite Frontend (Tailwind CSS :5173)"]
        UI_Student["Student Portal<br/>(Wizard, Tracker, Vault, Recommendations)"]
        UI_Admin["Admin Console<br/>(Dossier Review, Doc Verification, Scheme CRUD, Analytics)"]
    end

    subgraph Gateway["FastAPI Application Layer (:8000)"]
        AUTH["JWT Auth & Security<br/>(/api/auth)"]
        STUDENT_API["Student Profile & Vault<br/>(/api/student, /api/documents)"]
        ELIG_API["Dual-Engine Eligibility<br/>(/api/eligibility, /api/recommendations)"]
        ADMIN_API["Admin Review & Analytics<br/>(/api/admin, /api/scholarships)"]
    end

    subgraph DualEngine["Dual-Engine Decision Core"]
        RE["Rule-Based Expert System<br/>(rule_engine.py)<br/>• Forward Chaining (Data-Driven)<br/>• Backward Chaining (Goal-Driven)"]
        ML["ML Inference Engine<br/>(ml_service.py, predict.py)<br/>• HistGradientBoostingClassifier<br/>• 74 Scaled & Encoded Features"]
        XAI["XAI Attribution Engine<br/>(explain_prediction.py)<br/>• Positive & Negative Drivers"]
        REC["Recommendation Engine<br/>(recommendation_service.py)<br/>• Continuous Surplus Scaling<br/>• Statutory Quota Alignment"]
    end

    subgraph Storage["Persistent Relational Layer (SQLite / SQLAlchemy)"]
        DB_USERS[(Users & Profiles)]
        DB_RECORDS[(Academic & Financials)]
        DB_SCHOLARSHIPS[(Scholarships & Criteria)]
        DB_APPS[(Applications & Audit Log)]
        DB_DOCS[(Document Vault Files)]
    end

    UI_Student -->|REST + Bearer JWT| Gateway
    UI_Admin -->|REST + Bearer JWT| Gateway

    Gateway --> AUTH
    AUTH --> DB_USERS

    Gateway --> ELIG_API
    ELIG_API --> DualEngine
    DualEngine --> DB_SCHOLARSHIPS

    Gateway --> STUDENT_API
    STUDENT_API --> DB_RECORDS
    STUDENT_API --> DB_DOCS

    Gateway --> ADMIN_API
    ADMIN_API --> DB_APPS
    ADMIN_API --> DB_SCHOLARSHIPS
```

---

## 🗄️ Database Setup & Data Models

Database tables are declared in [`backend/app/database/models.py`](file:///c:/Users/Rohan/Desktop/devagini/AI_mini_project_new/backend/app/database/models.py) and created automatically on application startup via `Base.metadata.create_all()` in the FastAPI lifespan handler. Initial administrative accounts, a demo student profile, and standard scholarship schemes are automatically seeded if not already present.

| Model / Table | Purpose & Key Attributes |
| :--- | :--- |
| **`User`** (`users`) | Base authentication identity: `email`, `password_hash`, `full_name`, `role` (`STUDENT` or `ADMIN`), `is_active`, `created_at`. |
| **`StudentProfile`** (`student_profiles`) | Socioeconomic and demographic profile: `age`, `gender`, `phone`, `state`, `city`, `category` (`General`, `OBC`, `SC`, `ST`, `EWS`), `disability`, `rural_urban`, `first_generation`, `institution_type`. |
| **`AcademicRecord`** (`academic_records`) | Institutional academic metrics: `education_level`, `course`, `year_of_study`, `cgpa`, `percentage`, `backlogs`, `attendance`, `previous_scholarship`. |
| **`FinancialRecord`** (`financial_records`) | Household financial indicators: `family_income`, `family_size`, `parent_occupation`, `earning_members`, `financial_dependency`. |
| **`AchievementRecord`** (`achievement_records`) | Extracurricular indicators: `sports_achievement`, `academic_achievement`, `extracurricular_score`, `certifications_count`, `leadership_experience`. |
| **`Scholarship`** (`scholarships`) | Available scholarship schemes: `title`, `provider`, `amount`, `deadline`, `category`, `min_cgpa`, `max_income`, `max_backlogs`, `min_attendance`, `required_category`, `required_courses`. |
| **`ScholarshipCriterion`** (`scholarship_criteria`) | Granular dynamic criteria constraints: `field_name`, `operator`, `threshold_value`, `is_mandatory`. |
| **`Application`** (`applications`) | Student application dossier: `status` (`PENDING`, `UNDER_REVIEW`, `NEEDS_INFORMATION`, `APPROVED`, `REJECTED`), `applied_at`, `score_at_application`, `match_score_at_application`, `remarks`, `decision_remarks`, `reviewer_id`, `award_status` (`NOT_AWARDED`, `AWARDED`, `DISBURSED`), `disbursement_reference`. |
| **`EligibilityResult`** (`eligibility_results`) | Timestamped assessment snapshot: `rule_status`, `ml_probability`, `hybrid_score`, `final_verdict`, `positive_factors_json`, `negative_factors_json`, `improvement_tips_json`. |
| **`StudentDocument`** (`student_documents`) | Uploaded verification proofs: `document_type`, `filename`, `file_path`, `file_size_kb`, `verification_status` (`PENDING`, `VERIFIED`, `NEEDS_CORRECTION`, `REJECTED`), `admin_remarks`. |
| **`Notification`** (`notifications`) | User notification dispatch: `title`, `message`, `type` (`SUCCESS`, `INFO`, `WARNING`), `is_read`. |
| **`ModelVersion`** (`model_versions`) | Machine learning model audit log: `version_name`, `model_type`, `accuracy`, `precision`, `recall`, `f1_score`, `roc_auc`, `is_active`. |

---

## 🤖 Machine Learning Pipeline

### 1. Benchmark Dataset & Label Generation
- **Synthetic Benchmark:** Generated by `ml/data/generate_dataset.py` to model AISHE higher education demographic distributions. Exactly **55,000 synthetic records** are stored in `ml/data/scholarship_dataset.csv`.
- **Label Generation:** Ground-truth training labels (`eligible`) are generated deterministically by applying policy criteria across the synthetic cohort. Model evaluation metrics measure how faithfully algorithms reproduce these policy rules over synthetic distributions.

### 2. Feature Schema & Engineering
- **Raw Features (23 Columns):**
  - *Categorical (10):* `gender`, `state`, `rural_urban`, `education_level`, `course`, `institution_type`, `parent_occupation`, `financial_dependency`, `sports_achievement`, `academic_achievement`.
  - *Numerical (13):* `age`, `disability`, `first_generation`, `year`, `cgpa`, `percentage`, `backlogs`, `attendance`, `family_income`, `family_size`, `earning_members`, `extracurricular_score`, `previous_scholarship`.
- **Engineered Indices (`ml/feature_engineering.py`):**
  1. $\text{Income Per Capita} = \frac{\text{family\_income}}{\max(\text{family\_size}, 1)}$
  2. $\text{CGPA to Percentage Ratio} = \frac{\text{percentage}}{\max(\text{cgpa} \times 9.5, 1.0)}$
  3. $\text{Dependency Ratio} = \frac{\text{family\_size}}{\max(\text{earning\_members}, 1)}$
  4. $\text{Academic Consistency} = \left(\frac{\text{cgpa}}{10.0}\right) \times \left(\frac{\text{attendance}}{100.0}\right)$
- **Pipeline Transformation:** A Scikit-Learn `ColumnTransformer` applies `StandardScaler` to numerical columns and `OneHotEncoder(handle_unknown="ignore")` to categorical features, producing **74 input features** (`ml/models/feature_names.pkl`).

### 3. Model Benchmark & Active Classifier
Trained using `ml/train_models.py` on an 80/20 stratified split (44,000 train / 11,000 test) with 5-fold cross-validation. The table below presents the verified metrics from `ml/models/model_metrics.json`:

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC | 5-Fold CV F1 |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression (Baseline)** | 92.45% | 96.52% | 92.35% | 0.9439 | 0.9807 | $0.9434 \pm 0.0017$ |
| **Decision Tree Classifier** | 93.93% | 97.36% | 93.71% | 0.9550 | 0.9810 | $0.9584 \pm 0.0016$ |
| **Random Forest (Bagging)** | 93.96% | 98.20% | 92.93% | 0.9549 | 0.9879 | $0.9562 \pm 0.0020$ |
| **Gradient Boosting (`HistGradientBoostingClassifier`)** ★ | **95.08%** | **97.82%** | **94.96%** | **0.9637** | **0.9922** | **$0.9643 \pm 0.0019$** |

★ **Production Model:** `HistGradientBoostingClassifier` serialized at [`ml/models/trained_model.pkl`](file:///c:/Users/Rohan/Desktop/devagini/AI_mini_project_new/ml/models/trained_model.pkl). Runtime feature attribution uses a companion model at [`ml/models/rf_explainer_model.pkl`](file:///c:/Users/Rohan/Desktop/devagini/AI_mini_project_new/ml/models/rf_explainer_model.pkl).

**Top Influential Features:**
1. `backlogs` (35.80%)
2. `family_income` (23.56%)
3. `income_per_capita` (14.76%)
4. `cgpa` (5.65%)
5. `academic_consistency` (5.61%)
6. `percentage` (4.53%)
7. `attendance` (1.74%)

### 4. Calibration & Verification Status
- **Synthetic Benchmark Test Split:** Evaluated on the 11,000 held-out test split, the model achieves a verified **Brier score loss of 0.0348** (mean squared difference between predicted probabilities and labels). All 10 probability bins contain samples ($N \ge 139$ per bin).
- **Live Student Cohort Status:** Probability calibration is declared **unverified** on live student cohorts because real-world ground-truth scholarship qualification outcomes do not exist separately from administrative committee decisions.

---

## 🧠 Expert System: Experiment 9 (Forward & Backward Chaining)

Implemented in [`backend/app/services/rule_engine.py`](file:///c:/Users/Rohan/Desktop/devagini/AI_mini_project_new/backend/app/services/rule_engine.py) to fulfill the requirements of **Academic Semester AI Experiment 9: Rule-Based Expert Systems**.

### 1. Knowledge Base & Symbolic Data Structures
- **`Fact`:** Symbolic representation of verified inputs (`INPUT`), derived knowledge (`INFERRED`), or targets (`HYPOTHESIS`) with states `TRUE`, `FALSE`, or `UNKNOWN`.
- **`Rule`:** Horn clause representing $\bigwedge \text{Antecedents} \implies \text{Consequent}$.
- **Core Production Rules:**
  - `R1_ACAD_MERIT`: `academic_merit_passed` (CGPA $\ge 6.0$) $\implies$ `academic_criteria_satisfied`
  - `R2_FIN_NEED`: `income_need_passed` (Income $\le$ ₹8,00,000) $\implies$ `financial_criteria_satisfied`
  - `R3_FIN_EXEMPT`: `income_exempt_applied` (Merit waiver: CGPA $\ge 8.5$) $\implies$ `financial_criteria_satisfied`
  - `R4_BACKLOG_CLEAN`: `backlog_norm_passed` (0 backlogs) $\implies$ `continuity_criteria_satisfied`
  - `R5_BACKLOG_COND`: `backlog_marginal_passed` (1 backlog) $\implies$ `continuity_conditional_satisfied`
  - `R6_ATTENDANCE_FULL`: `attendance_regularity_passed` (Attendance $\ge 75\%$) $\implies$ `attendance_criteria_satisfied`
  - `R7_ATTENDANCE_COND`: `attendance_borderline_passed` (Attendance $65\% - 74.9\%$) $\implies$ `attendance_conditional_satisfied`
  - `R8_FULL_ELIGIBILITY`: Academic $\land$ Financial $\land$ Continuity $\land$ Attendance $\implies$ `generally_eligible`
  - `R9_COND_ELIGIBILITY_BACKLOG`: Academic $\land$ Financial $\land$ Probationary Backlog $\land$ Attendance $\implies$ `conditionally_eligible`
  - `R10_COND_ELIGIBILITY_ATTENDANCE`: Academic $\land$ Financial $\land$ Continuity $\land$ Borderline Attendance $\implies$ `conditionally_eligible`
  - `R11_COND_ELIGIBILITY_BOTH`: Academic $\land$ Financial $\land$ Probationary Backlog $\land$ Borderline Attendance $\implies$ `conditionally_eligible`

### 2. Forward Chaining Engine (`ForwardChainingEngine.infer`)
- **Data-Driven Deduction:** Initiates with ground facts extracted from student input (`cgpa`, `family_income`, `backlogs`, `attendance`).
- **Inference Cycle:** Scans Horn clauses iteratively, fires eligible rules whose prerequisites are verified, and adds derived consequents to working memory until reaching a fixed point.
- **Trace Output:** Produces a structured derivation trace capturing the exact firing iteration, rule ID, and triggering antecedents.

### 3. Backward Chaining Engine (`BackwardChainingEngine.prove_goal`)
- **Goal-Driven Proof:** Starts with a query hypothesis (e.g. `goal = "generally_eligible"`).
- **Recursive Verification:** Explores rule trees concluding the target goal using depth-first search, verifying ground facts or deriving sub-proofs recursively.
- **Cycle Detection:** Maintains a `visited` set to avoid infinite loops and explicitly tracks `UNKNOWN` facts (missing profile sections) separately from `FALSE` criteria.

---

## ⚖️ Distinction Between Scores & Eligibility Status

| Metric / Term | Scale / Values | Primary Calculation / Origin | Purpose & Meaning |
| :--- | :---: | :--- | :--- |
| **ML Probability** | $0.0 - 1.0$ ($0\% - 100\%$) | Output of `HistGradientBoostingClassifier` over 74 features. | Measures algorithm confidence based on multidimensional training patterns. **Never guarantees eligibility or award.** |
| **Rule Compliance Score** | $0.0 - 100.0$ | Derived from `RuleBasedExpertSystem.evaluate_general_baseline`: 100.0 (Eligible), 70.0 (Conditional), or 0–45.0 (Fraction of rules passed). | Quantifies statutory compliance with mandatory institutional thresholds. |
| **General Hybrid Score** | $0.0 - 100.0$ | $(0.55 \times \text{ML Score}) + (0.45 \times \text{Rule Score})$. | Comprehensive institutional score shown on the student's eligibility card. |
| **Scholarship Match Score** | $0.0 - 100.0\%$ | Continuous surplus scaling: 35% ML Readiness + 35% Academic Fit + 20% Financial Need + 10% Statutory Fit. Capped at $\le 75.0\%$ if mandatory requirements are unmet. | Heuristic sorting score to rank available schemes by suitability. |
| **Scholarship-Specific Status** | `Eligible`, `Conditionally Eligible`, `Not Eligible` | Deterministic verification against a specific scheme's legal constraints (`min_cgpa`, `max_income`, `required_category`, `required_courses`). | Tells the applicant whether they satisfy non-negotiable statutory rules for that specific scheme. |
| **Administrative Decision** | `PENDING`, `UNDER_REVIEW`, `NEEDS_INFORMATION`, `APPROVED`, `REJECTED`, `AWARDED`, `DISBURSED` | Human review by authorized scholarship administrators in the admin console. | Official application status; only human administrators can approve applications or record awards and disbursements. |

---

## 🎯 Scholarship Recommendation & Match Scoring Engine

Implemented in [`backend/app/services/recommendation_service.py`](file:///c:/Users/Rohan/Desktop/devagini/AI_mini_project_new/backend/app/services/recommendation_service.py). Match scores reflect continuous scheme affinity bounded within $[0.0, 100.0]\%$.

### 1. Component Weighting Matrix
$$\text{Total Raw Match} = \text{Score}_{\text{ML}} + \text{Score}_{\text{Academic}} + \text{Score}_{\text{Financial}} + \text{Score}_{\text{Statutory}}$$

| Component | Weight | Mathematical Function | Description |
| :--- | :---: | :--- | :--- |
| **ML Readiness** | **35%** | $\text{ml\_prob} \times 35.0$ | Peer competitiveness across 23 profile dimensions. |
| **Academic Fit** | **35%** | • $\text{CGPA} \ge \text{min}: 20.0 + \left(\frac{\text{CGPA} - \text{min}}{10.0 - \text{min}}\right) \times 15.0$<br/>• $\text{CGPA} < \text{min}: \max\left(0, 20.0 - \left[\frac{\text{min} - \text{CGPA}}{\text{min}}\right] \times 40\right)$ | Continuous surplus scaling above published minimum threshold up to 10.0 CGPA; proportional deficit reduction below threshold. |
| **Financial Need** | **20%** | • $\text{Need Ratio} = \frac{\text{max\_income} - \text{income}}{\text{max\_income}}$<br/>• Merit Scheme: $15.0 + (\text{Need Ratio} \times 5.0)$<br/>• Need-Based Scheme: $10.0 + (\text{Need Ratio} \times 10.0)$<br/>• Excess Income: $\max(0, 10.0 - [\text{Excess Ratio} \times 25])$ | Differentiates schemes based on published income limits and stated scheme purpose. |
| **Statutory / Quota** | **10%** | • General (`All`): $10.0\text{ pts}$ (Zero Caste Bias)<br/>• Reserved: $10.0$ if category matched; $5.0$ if unspecified; $0.0$ if mismatched<br/>• Female / PwD: $10.0$ if matched, $0.0$ otherwise | Strict equality for general schemes; statutory criteria enforced only where legally mandated. |

### 2. Penalty & Eligibility Ceiling
$$\text{Final Match } \% = \begin{cases} \min(\max(\text{Total Raw Match}, 0.0), 100.0) & \text{if } |\text{Missing}| = 0 \\ \max(\min(\text{Total Raw Match} - [|\text{Missing}| \times 15.0], 75.0), 10.0) & \text{if } |\text{Missing}| > 0 \end{cases}$$

---

## 🔄 Student & Administrative Workflows

### 1. Student Onboarding & Profile Management
- **Profile Completion Tracking:** New registrations begin with an uncompleted profile (`calculate_completion` evaluates Personal, Academic, Financial, and Achievement sections).
- **Assessment Requirement:** Running AI verification (`POST /api/eligibility/verify`) requires 100% profile completion; missing sections return `HTTP 422 Unprocessable Entity` with a detailed list of missing sections.
- **Assessment History:** Profile modifications re-evaluate eligibility and record new timestamped rows in `eligibility_results` without deleting previous evaluations.

### 2. Document Vault
- **File Upload:** Students upload marksheets, income certificates, identity proofs, and category certificates via `POST /api/documents/upload` (stored in `backend/uploads/`).
- **Ownership Protection:** `GET /api/documents/{id}/download` validates that the requesting user owns the document (or holds an `ADMIN` role), returning `HTTP 403 Forbidden` on unauthorized attempts.

### 3. Application Submission & Administrative Review
- **Application Dossier Review:** Administrators inspect submitted applications, academic transcripts, family financials, and uploaded certificates via `/admin/applications`.
- **Document Verification:** Administrators review and update certificate statuses (`PENDING`, `VERIFIED`, `NEEDS_CORRECTION`, `REJECTED`) with audit remarks.
- **Review Pipeline:** Applications progress through defined states: `PENDING` $\to$ `UNDER_REVIEW` $\to$ `NEEDS_INFORMATION` (with student remarks) $\to$ `APPROVED` or `REJECTED`.
- **Award & Disbursement:** Approved applications can be officially marked `AWARDED` and `DISBURSED`, recording a formal disbursement reference (e.g. `PFMS-DBT-2026-NSP89412`).

---

## 📊 Admin Console, ML Models & Analytics Reports

### 1. Global Admin Dashboard (`/admin/dashboard`)
Displays aggregate statistics: registered students, active scholarship schemes, submitted applications, unique applicants, eligibility check totals, and application pipeline status breakdowns.

### 2. ML Model Performance Page (`/admin/models`)
- Real-time display of benchmarked metrics: Accuracy, Precision, Recall, F1 Score, ROC-AUC, 5-Fold Cross-Validation F1 mean and standard deviation.
- Confusion matrix and top 20 influential features.
- One-click asynchronous retraining trigger (`POST /api/admin/model/retrain`), running training in a daemon background thread.

### 3. System Analytics & Inclusivity Reports (`/admin/analytics`)
Provides demographic breakdowns and transparency metrics based on the live registered student population:
- **Population Baseline (Audited Census):** Evaluates exactly the **54 registered student accounts** (`User.role == 'STUDENT'`). Related records are linked via user ID dictionaries, guaranteeing that 1 student equals 1 record with zero multiplication from historical evaluations.
- **Deduplicated Latest Assessment:** Students who assessed eligibility multiple times are deduplicated using the documented ordering rule:
  ```python
  func.row_number().over(
      partition_by=EligibilityResult.user_id,
      order_by=[EligibilityResult.created_at.desc(), EligibilityResult.id.desc()]
  )
  ```
- **Category Representation:** Displays student counts across `General`, `OBC`, `SC`, `ST`, `EWS`, and `Unknown` (undeclared).
- **Household Income Brackets:** Real student counts in discrete brackets ($<\text{₹}1.5\text{L}$, $\text{₹}1.5\text{L}-\text{₹}3.0\text{L}$, $\text{₹}3.0\text{L}-\text{₹}5.0\text{L}$, $\text{₹}5.0\text{L}-\text{₹}8.0\text{L}$, $>\text{₹}8.0\text{L}$, and `Unknown`).
- **Academic Merit Distribution:** Exact CGPA tiers ($9.0-10.0$, $8.0-8.9$, $7.0-7.9$, $6.0-6.9$, $<6.0$, and `Unknown`).
- **AI Confidence Bands (49 Assessed Students):**
  - High Confidence ($\ge 90\%$): **43 students**
  - Middle Bands ($50\% - 89\%$): **0 students**
  - Low Confidence ($< 50\%$): **6 students**
  - Unassessed Students: **5 students**
  - Mutually exclusive boundaries covering $[0, 1]$ completely.
- **Model Calibration Report:**
  - *Live Cohort:* Marked **Unverified (Expected)** because independent ground-truth qualification outcomes are not available separately from policy decisions.
  - *Synthetic Benchmark Test Split:* Verified with a **Brier score of 0.0348** on 11,000 held-out samples and a complete 10-bin calibration curve.

---

## 📁 Repository Structure

```
AI_mini_project_new/
├── backend/
│   ├── app/
│   │   ├── auth/              # Password hashing (bcrypt) & JWT token handling
│   │   ├── database/          # SQLAlchemy connection & normalized ORM models
│   │   ├── routes/            # FastAPI route modules (8 functional groups)
│   │   ├── schemas/           # Pydantic request/response validation schemas
│   │   ├── services/          # Rule Engine, ML Service, XAI, Recommendation Engine
│   │   ├── config.py          # Application settings, CORS, and paths
│   │   └── main.py            # FastAPI entrypoint, lifespan seeding & routers
│   ├── requirements.txt       # Python dependencies
│   └── uploads/               # Document Vault storage
├── frontend/
│   ├── src/
│   │   ├── components/        # Navbar, Sidebar, Modals, MetricCards, ErrorBoundary
│   │   ├── context/           # AuthContext (JWT session state & role guards)
│   │   ├── pages/             # All React application pages
│   │   ├── services/          # Axios API client (api.js) with interceptors
│   │   ├── App.jsx            # React Router v7 routes & layout wrappers
│   │   └── index.css          # Tailwind CSS styles & typography tokens
│   ├── package.json           # Frontend dependencies (React 19, Vite 8, Lucide, Recharts)
│   ├── README.md              # Frontend-specific documentation
│   └── vite.config.js         # Vite build configuration
├── ml/
│   ├── data/
│   │   ├── generate_dataset.py       # 55,000 synthetic profile generator
│   │   └── scholarship_dataset.csv   # Pre-generated 55k dataset (no category column)
│   ├── models/
│   │   ├── trained_model.pkl         # Production HistGradientBoostingClassifier
│   │   ├── rf_explainer_model.pkl    # Explainability Random Forest model
│   │   ├── preprocessor.pkl          # ColumnTransformer pipeline
│   │   ├── feature_names.pkl         # 74 feature names list
│   │   └── model_metrics.json        # Benchmark evaluation metrics
│   ├── data_preprocessing.py # Preprocessing & column transformer pipeline
│   ├── feature_engineering.py # Feature lists & 4 derived indices
│   ├── train_models.py        # 4-model benchmark & cross-validation trainer
│   ├── predict.py             # Inference class with input sanitization
│   └── explain_prediction.py  # XAI factor attribution engine
├── tests/                     # Automated test suites
│   ├── test_admin_application_review_workflow.py
│   ├── test_analytics_reliability.py
│   ├── test_caste_independent_eligibility.py
│   ├── test_onboarding_and_profile_flow.py
│   ├── test_recommendation_match_calculation.py
│   ├── test_recommendations_application_status_sync.py
│   ├── test_review_security_and_resilience.py
│   └── test_statutory_flow.py
├── test_api.py                # End-to-end API smoke test suite
├── scholarship_system.db      # SQLite database
├── start_servers.bat          # 1-click launcher for Windows CMD
└── start_servers.ps1          # 1-click launcher for PowerShell
```

---

## 🔌 API Route Specifications

| Route Prefix | Router Module | Primary Endpoints | Access Control |
| :--- | :--- | :--- | :--- |
| `/api/auth` | `auth_routes.py` | `POST /register`, `POST /login`, `GET /me` | Public / Authenticated |
| `/api/student` | `student_routes.py` | `GET /profile`, `PUT /profile`, `GET /dashboard`, `GET /vault` | Student Only |
| `/api/eligibility` | `eligibility_routes.py` | `POST /verify`, `GET /latest`, `GET /history` | Student / Admin |
| `/api/recommendations` | `application_routes.py` | `GET /recommendations` | Student Only |
| `/api/applications` | `application_routes.py` | `POST /applications`, `GET /applications`, `GET /applications/{id}` | Student / Admin |
| `/api/documents` | `document_routes.py` | `POST /upload`, `GET /`, `GET /{id}/download`, `DELETE /{id}` | Student (Owner) / Admin |
| `/api/scholarships` | `scholarship_routes.py` | `GET /`, `GET /{id}`, `POST /`, `PUT /{id}`, `DELETE /{id}` | Public (Read) / Admin (CRUD) |
| `/api/admin` | `admin_routes.py` | `GET /dashboard`, `GET /students`, `GET /applications`, `GET /applications/{id}`, `PUT /applications/{id}/review`, `PUT /applications/{id}/disburse`, `PUT /documents/{id}/verify`, `GET /analytics`, `GET /model-performance`, `POST /model/retrain` | Admin Only (`require_role(["ADMIN"])`) |

---

## 🛠️ Installation & Local Run Guide

### 1. Prerequisites
- **Python:** 3.10 to 3.14 (Python 3.14 tested)
- **Node.js:** v18.0.0 or later (Node v24 / npm 11 tested)
- **Operating System:** Windows 10/11, macOS, or Linux

### 2. Environment Setup

```powershell
# Clone the repository
git clone https://github.com/your-username/AI_mini_project_new.git
cd AI_mini_project_new

# Create and activate Python virtual environment
py -m venv venv
.\venv\Scripts\Activate.ps1   # On Linux/macOS: source venv/bin/activate

# Install backend dependencies
pip install -r backend/requirements.txt

# Install frontend dependencies
cd frontend
npm install
cd ..
```

### 3. Launch Application

#### Option A: Quick Launchers (Windows)
Double-click `start_servers.bat` or run:
```powershell
.\start_servers.ps1
```

#### Option B: Manual Execution

**Terminal 1 — Backend:**
```powershell
py -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
*API running at `http://127.0.0.1:8000` | OpenAPI Docs at `http://127.0.0.1:8000/docs`*

**Terminal 2 — Frontend:**
```powershell
cd frontend
npm run dev
```
*Web App running at `http://localhost:5173`*

---

## 🚀 Deployment Instructions

### 1. Frontend Production Build
To create an optimized production bundle:
```powershell
cd frontend
npm run build
```
Vite outputs minified static assets to `frontend/dist/`. Serve these static files using any standard production web server (such as Nginx, Caddy, or AWS S3/CloudFront). Configure the server to route requests starting with `/api` to the backend server.

### 2. Backend Production Execution
Run FastAPI using Uvicorn with multiple worker processes behind a reverse proxy:
```bash
uvicorn backend.app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

### 3. Environment Variables for Production
Set the following environment variables:
- `SECRET_KEY`: A strong, random secret string for signing JWT tokens.
- `DATABASE_URL`: Database connection string (`sqlite:///./scholarship_system.db` or PostgreSQL `postgresql://user:password@host:5432/dbname`).
- `ACCESS_TOKEN_EXPIRE_MINUTES`: JWT session duration (e.g. `1440` for 24 hours).
- `ALLOWED_ORIGINS`: Comma-separated list of allowed production domains for CORS.

---

## 🔐 Default Demo Accounts

The login interface provides **"Auto Fill"** demo buttons for instant access:

| Role | Email | Password | Pre-Configured State |
| :--- | :--- | :--- | :--- |
| **Demo Student** | `student@scholarship.gov.in` | `student123` | Completed profile (CGPA: 8.65, Income: ₹2.4L, OBC category, Pune, Maharashtra) |
| **Administrator** | `admin@scholarship.gov.in` | `admin123` | Full access to dossiers, certificate verification, retraining, and analytics |

---

## 🧪 Verification & Test Suite

The test suite exercises all backend and frontend components. All tests pass with zero failures:

| Test File / Command | Scope & Verified Functionality | Status |
| :--- | :--- | :---: |
| `py -m unittest tests/test_analytics_reliability.py` | Population census baseline (54 registered students), deduction of 'Unknown' categories, discrete income brackets, CGPA tiers, latest assessment deduplication, and calibration transparency. | **PASSED** (6 tests, 0.053s) |
| `py tests/test_caste_independent_eligibility.py` | 74-feature schema purity, 0.000 counterfactual ML variance across caste labels, Forward & Backward Chaining derivation, and ranking invariance. | **PASSED** (7 tests) |
| `py tests/test_recommendation_match_calculation.py` | Continuous surplus scaling, CGPA scaling, income scaling, boundedness $[0, 100]$, and missing requirement capping ($\le 75\%$). | **PASSED** (7 tests) |
| `py tests/test_admin_application_review_workflow.py` | Application review states (`PENDING` $\to$ `UNDER_REVIEW` $\to$ `NEEDS_INFORMATION` $\to$ `APPROVED`), audit remarks, and disbursement reference recording. | **PASSED** |
| `py tests/test_statutory_flow.py` | Uncategorized student onboarding, conditional statutory flag, certificate vault upload, and admin review approval. | **PASSED** |
| `py tests/test_onboarding_and_profile_flow.py` | New student onboarding flags, missing section tracking, and historical assessment retention. | **PASSED** |
| `py tests/test_recommendations_application_status_sync.py` | Live synchronization between student application status and recommendation action buttons. | **PASSED** |
| `py tests/test_review_security_and_resilience.py` | Unauthorized access blocking (401/403) and invalid application ID handling (404/422). | **PASSED** |
| `py test_api.py` | Demo Student/Admin authentication, dashboard counts, profile completion check, and AI verification. | **PASSED** |
| `cd frontend && npm run lint` | Oxlint analysis across 36 files. | **0 ERRORS** (50 warnings) |
| `cd frontend && npm run build` | Vite production build bundling and minification. | **PASSED** (16.06s) |

---

## 🛡️ Privacy, Fairness & Security Safeguards

1. **Category Exclusion from General Evaluation:** Social category (caste) is completely excluded from the 74 machine learning features, prediction inputs (`predict_single` sanitizes input), the general rule engine baseline, and general merit ranking.
2. **Authorized Affirmative-Action Handling:** Social category is evaluated only for explicitly restricted government schemes (e.g. SC/ST/OBC schemes) and requires uploaded certificate verification in the Document Vault.
3. **Role-Based Access Control (RBAC):** Endpoints require valid JWT Bearer tokens and verify user roles (`ADMIN` or `STUDENT`).
4. **Tenant & Document Isolation:** Document downloads (`/api/documents/{id}/download`) and profile updates strictly verify account ownership.
5. **Human-in-the-Loop Governance:** AI probability scores and match percentages serve exclusively as decision support. Final decisions, status transitions, and disbursement records are made by human administrators.
6. **Assessment History Retention:** Updating a student profile creates a new timestamped row in `eligibility_results` without deleting previous evaluation history.

---

## ⚠️ Academic Transparency & System Limitations

1. **Synthetic Benchmark Dataset:** Training and test datasets in `scholarship_dataset.csv` are derived from rule-based simulation and AISHE statistical patterns. High benchmark metrics (95.08% accuracy, 0.9637 F1) reflect performance against these rule-generated labels.
2. **Live Cohort Calibration Status:** Probability calibration has not been evaluated on live students because independent ground-truth scholarship qualification outcomes do not exist separately from policy and administrative committee decisions.
3. **Payment Gateway Disconnect:** The disbursement workflow records genuine audit references (e.g. `PFMS-DBT-2026-NSP89412`) for administrative tracking, but does not execute financial transactions through external banking or PFMS APIs.
4. **Manual Document Verification:** Document authenticity is verified through human inspection in the Document Vault rather than automated DigiLocker or UIDAI API integrations.

---

## 📜 License & Academic Evaluation

Developed as an **Artificial Intelligence Mini Project** demonstrating:
- **Experiment 9:** Symbolic Rule-Based Expert Systems (Forward & Backward Chaining).
- **Machine Learning Integration:** Gradient Boosting Classifier with Data Preprocessing & Leakage Prevention.
- **Explainable AI (XAI):** Transparent Factor Attribution & Decision Support.
- **Full-Stack Engineering:** FastAPI, React 19, Tailwind CSS, and SQLite.

*Licensed under the MIT License — Suitable for university evaluation and academic review.*
