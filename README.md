# Scholarship Eligibility Expert System

> **Full-Stack AI Project** combining a **Symbolic Rule-Based Expert System** with **Gradient Boosting Machine Learning (55k+ dataset)** and **Explainable AI (XAI)**.

---

## 🌟 Key Features

1. **Dual-Engine AI Architecture:**
   - **Deterministic Rule Engine (45%):** Evaluates non-negotiable legal criteria (income caps, minimum CGPA, active backlogs, attendance, category eligibility).
   - **Gradient Boosting Classifier (55%):** Evaluates holistic multidimensional peer competitiveness trained on a realistic derived dataset of 55,000+ student profiles.
2. **Explainable AI (XAI):**
   - *"Why am I eligible?"* — Deconstructs positive drivers (academic excellence, need-based priority, diversity quotas).
   - *"What can I improve?"* — Delivers actionable guidance (e.g., clearing backlogs, attendance thresholds).
3. **Scholarship Recommendation Engine:**
   - Real-time match percentage calculation across national, state, and foundation schemes.
   - Missing criteria detection and instant 1-click application modal.
4. **Complete Role-Based Portals (18 Pages):**
   - **Student Portal:** 5-step guided assessment wizard, interactive dashboard, document vault with certificate uploads, and application tracker.
   - **Admin Console:** Live statistics, applicant review & status updates, scheme CRUD with criteria builder, Recharts demographics, and 1-click model retraining.
5. **Modern Academic SaaS Interface:**
   - Built with React 19 + Vite + Tailwind CSS + Lucide Icons + Recharts with a clean, professional aesthetic.

---

## 🚀 Quick Start (Windows)

### Option A: 1-Click Launchers
Simply double-click:
- `start_servers.bat` (Windows Command Prompt)
or run in PowerShell:
- `.\start_servers.ps1`

Both backend and frontend will start in separate terminal windows automatically.

---

### Option B: Manual Terminal Execution

#### 1. Backend Setup & Startup
In your first terminal (from project root):
```powershell
# Install backend Python dependencies
pip install -r backend/requirements.txt

# (Optional: Dataset and models are pre-trained and serialized in ml/models/)
# python ml/data/generate_dataset.py
# python -m ml.train_models

# Start FastAPI server
python -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload
```
The backend will run on `http://127.0.0.1:8000`.  
Interactive OpenAPI documentation is available at `http://127.0.0.1:8000/docs`.

#### 2. Frontend Setup & Startup
In a second terminal:
```powershell
cd frontend
$env:ComSpec = "C:\Windows\System32\cmd.exe"
npm install
npm run dev
```
The frontend will run on `http://localhost:5173`.

---

## 🔐 Default Demo Accounts

Both accounts have convenient **"Auto Fill"** buttons on their login screens:

| Role | Email | Password | Pre-configured Data |
| :--- | :--- | :--- | :--- |
| **Student** | `student@scholarship.gov.in` | `student123` | High-merit profile (CGPA 8.65, OBC category, ₹2.4L income) |
| **Admin** | `admin@scholarship.gov.in` | `admin123` | Full administrative oversight, analytics & model retraining |

---

## 📊 Machine Learning Model Benchmarks

Tested on a stratified holdout test split of **11,000 samples**:

| Model | Accuracy | Precision | Recall | F1 Score | ROC-AUC |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Logistic Regression** | 91.75% | 97.87% | 91.69% | 0.9468 | 0.9773 |
| **Decision Tree** | 92.63% | 98.29% | 92.40% | 0.9525 | 0.9707 |
| **Random Forest** | 93.25% | 98.50% | 93.00% | 0.9567 | 0.9802 |
| **Gradient Boosting (Selected)** | **94.28%** | **98.60%** | **94.20%** | **0.9635** | **0.9895** |

---

## 📁 Project Structure

```
AIMiniProject/
├── backend/
│   ├── app/
│   │   ├── auth/          # Password hashing & JWT handlers
│   │   ├── database/      # Normalized SQLAlchemy models & connection
│   │   ├── routes/        # Auth, Student, Eligibility, Scholarship, Admin APIs
│   │   ├── schemas/       # Pydantic validation schemas
│   │   ├── services/      # Rule Engine, ML Service, XAI, Recommendation Engine
│   │   ├── config.py      # App configurations & CORS
│   │   └── main.py        # FastAPI entrypoint & database seeding
│   ├── requirements.txt
│   └── scholarship_system.db  # Initialized SQLite database
├── frontend/
│   ├── src/
│   │   ├── components/    # Navbar, Sidebar, MetricCard, GaugeScore, Modals
│   │   ├── context/       # AuthContext
│   │   ├── pages/         # All 18 Application Pages
│   │   ├── services/      # Axios API client
│   │   ├── App.jsx        # Routing & Layouts
│   │   └── index.css      # Tailwind & custom typography
│   ├── package.json
│   └── tailwind.config.js
├── ml/
│   ├── data/              # 55,000+ realistic dataset generator
│   ├── models/            # Serialized models (.pkl) & benchmark metrics (.json)
│   ├── data_preprocessing.py
│   ├── feature_engineering.py
│   ├── train_models.py    # Multi-model benchmarking script
│   ├── predict.py         # Standalone predictor
│   └── explain_prediction.py  # XAI factor decomposition
├── docs/
│   └── College_Project_Report.md  # Comprehensive project report & Viva Q&A
├── start_servers.bat      # 1-click CMD launcher
└── start_servers.ps1      # 1-click PowerShell launcher
```

---

## 🎓 Academic Viva Highlights
- **Hybrid System Justification:** Combines deterministic legal criteria (Rules) with high-dimensional peer pattern recognition (ML).
- **Explainable AI (XAI):** Solves the "black-box" barrier by generating transparent positive and negative factors for students.
- **Data Leakage Prevention:** Only attributes knowable *prior* to a scholarship award were included in training features.
- **Fairness & Diversity:** Models realistic affirmative reservation categories, gender quotas (e.g. AICTE Pragati), and PwD concessions.
