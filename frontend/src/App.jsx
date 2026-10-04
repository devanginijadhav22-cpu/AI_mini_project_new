import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminLoginPage from './pages/AdminLoginPage';
import StudentDashboard from './pages/StudentDashboard';
import StudentProfile from './pages/StudentProfile';
import EligibilityAssessment from './pages/EligibilityAssessment';
import EligibilityResult from './pages/EligibilityResult';
import ScholarshipRecommendations from './pages/ScholarshipRecommendations';
import ScholarshipDetails from './pages/ScholarshipDetails';
import ApplicationTracking from './pages/ApplicationTracking';
import NotificationsPage from './pages/NotificationsPage';
import AdminDashboard from './pages/AdminDashboard';
import StudentManagement from './pages/StudentManagement';
import ScholarshipManagement from './pages/ScholarshipManagement';
import AnalyticsPage from './pages/AnalyticsPage';
import MLModelPerformance from './pages/MLModelPerformance';
import SettingsPage from './pages/SettingsPage';

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/login', '/register', '/admin-login'].includes(location.pathname);
  const isLandingPage = location.pathname === '/';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <Navbar />
      <div className="flex-1 flex">
        {user && !isAuthPage && !isLandingPage && <Sidebar />}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${!user || isAuthPage || isLandingPage ? 'max-w-7xl mx-auto w-full' : ''}`}>
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            {/* Public Pages */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />

            {/* Student Protected Routes */}
            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/profile"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <StudentProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/assessment"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <EligibilityAssessment />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/results"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <EligibilityResult />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/scholarships"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <ScholarshipRecommendations />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/scholarships/:id"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <ScholarshipDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/applications"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <ApplicationTracking />
                </ProtectedRoute>
              }
            />
            <Route
              path="/student/notifications"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />

            {/* Admin Protected Routes */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/students"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <StudentManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/scholarships"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <ScholarshipManagement />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/analytics"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <AnalyticsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/models"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <MLModelPerformance />
                </ProtectedRoute>
              }
            />

            {/* Common Protected Route */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute allowedRoles={['STUDENT', 'ADMIN']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />

            {/* Catch-all Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppLayout>
      </Router>
    </AuthProvider>
  );
}

export default App;
