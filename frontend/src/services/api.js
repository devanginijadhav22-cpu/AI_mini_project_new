import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  forgotPassword: (data) => api.post('/auth/forgot-password', data),
};

export const studentAPI = {
  getProfile: () => api.get('/student/profile'),
  updateProfile: (data) => api.put('/student/profile', data),
  getDashboard: () => api.get('/student/dashboard'),
};

export const eligibilityAPI = {
  checkEligibility: (payload) => api.post('/eligibility/check', payload),
  verify: () => api.post('/eligibility/verify'),             // verify from saved profile
  getLatestResult: () => api.get('/eligibility/latest'),
  getHistory: () => api.get('/eligibility/history'),
};

export const scholarshipAPI = {
  getAll: (params) => api.get('/scholarships', { params }),
  getById: (id) => api.get(`/scholarships/${id}`),
};

export const applicationAPI = {
  submit: (data) => api.post('/applications', data),
  getAll: () => api.get('/applications'),
  getRecommendations: () => api.get('/recommendations'),
};

export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/documents'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/mark-all-read'),
};

export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getStudents: () => api.get('/admin/students'),
  getApplications: () => api.get('/admin/applications'),
  updateApplicationStatus: (id, data) => api.put(`/admin/applications/${id}/status`, data),
  createScholarship: (data) => api.post('/admin/scholarships', data),
  updateScholarship: (id, data) => api.put(`/admin/scholarships/${id}`, data),
  deleteScholarship: (id) => api.delete(`/admin/scholarships/${id}`),
  getAnalytics: () => api.get('/admin/analytics'),
  getModelPerformance: () => api.get('/admin/model-performance'),
  retrainModel: () => api.post('/admin/model/retrain'),
};

export default api;
