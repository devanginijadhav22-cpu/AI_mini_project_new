import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
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

// Component that redirects authenticated users to their dashboard, otherwise renders public auth child
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin/dashboard' : '/student/dashboard'} replace />;
  }

  return children;
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const isAuthPage = ['/', '/login', '/register', '/admin-login'].includes(location.pathname);

  return (
    <div className="min-h-screen flex flex-col bg-[#fafafa] text-zinc-900">
      <Navbar />
      <div className="flex-1 flex">
        {user && !isAuthPage && <Sidebar />}
        <main className={`flex-1 p-4 sm:p-6 lg:p-8 ${!user || isAuthPage ? 'max-w-7xl mx-auto w-full' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <AppLayout>
          <Routes>
            {/* Public Entry & Authentication Routes */}
            <Route
              path="/"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/login"
              element={
                <PublicRoute>
                  <LoginPage />
                </PublicRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicRoute>
                  <RegisterPage />
                </PublicRoute>
              }
            />
            <Route
              path="/admin-login"
              element={
                <PublicRoute>
                  <AdminLoginPage />
                </PublicRoute>
              }
            />

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
