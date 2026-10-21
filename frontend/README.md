# ScholarAI Frontend: React + Vite Web Client

Modern, responsive web interface for the **ScholarAI: Scholarship Eligibility Expert System**, providing role-based portals for student applicants and system administrators.

---

## 🛠️ Technology Stack

- **Framework:** [React 19](https://react.dev/) (`^19.2.8`)
- **Build Tool:** [Vite 8](https://vite.dev/) (`^8.3.0`)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/) (`^3.4.19`) with Autoprefixer and PostCSS
- **Routing:** [React Router v7](https://reactrouter.com/) (`^7.18.4`)
- **Data Visualization:** [Recharts](https://recharts.org/) (`^3.10.1`) for responsive demographic and performance analytics
- **Icons:** [Lucide React](https://lucide.dev/) (`^1.48.0`)
- **HTTP Client:** [Axios](https://axios-http.com/) (`^1.20.0`) with JWT request interceptors
- **Linter:** [Oxlint](https://oxc.rs/) (`^1.81.0`) for fast code analysis

---

## 🧭 Page Routes & Portal Architecture

### Public Routes
- `/`: Landing page highlighting platform architecture, features, and dual-engine workflow
- `/login`: Role-based authentication supporting email/password and 1-click demo login buttons
- `/register`: Student registration initializing an empty student profile

### Student Portal (Protected: `STUDENT` Role)
- `/student/dashboard`: Application tracker, saved assessment overview, and quick actions
- `/student/profile`: 4-step comprehensive profile manager (Personal, Academic, Financial, Achievements)
- `/student/eligibility`: AI dual-engine assessment trigger, hybrid score display, and XAI factor breakdown
- `/student/recommendations`: Personalized scholarship recommendation list ranked by continuous match score
- `/student/applications`: Live status tracker for submitted scholarship applications
- `/student/documents`: Document Vault for uploading, downloading, and inspecting verification statuses
- `/student/notifications`: Real-time system notifications and review updates

### Admin Portal (Protected: `ADMIN` Role)
- `/admin/dashboard`: Global census counts, application pipeline stages, and quick shortcuts
- `/admin/students`: Complete student directory with profile completion gauges and eligibility verdicts
- `/admin/applications`: Applicant dossier review, document verification, and status updates
- `/admin/scholarships`: Scholarship scheme CRUD and criteria configuration interface
- `/admin/analytics`: System Analytics & Inclusivity Reports (demographics, income tiers, CGPA distribution, model probability bands, and calibration curve)
- `/admin/models`: Live machine learning performance metrics, confusion matrices, and retrain trigger

---

## ⚙️ Environment Configuration

By default, the frontend connects to the backend at `http://127.0.0.1:8000/api`. To customize the API endpoint, create or edit `.env` in this directory:

```env
VITE_API_URL=http://127.0.0.1:8000/api
```

---

## 🚀 Development & Build Commands

All commands should be executed from within the `frontend/` directory:

```powershell
# 1. Install dependencies
npm install

# 2. Launch Vite development server (http://localhost:5173)
npm run dev

# 3. Run fast Oxlint static analysis
npm run lint

# 4. Generate production build bundle (into dist/)
npm run build

# 5. Preview local production bundle
npm run preview
```

---

## 🔒 Authentication & API Interception

The frontend communicates with the backend via a centralized Axios instance configured in `src/services/api.js`:
- An Axios request interceptor automatically attaches `Authorization: Bearer <token>` from `localStorage`.
- Role guards in `src/context/AuthContext.jsx` protect private student and admin routes against unauthorized navigation.
