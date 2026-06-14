import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============ SUPER ADMIN AUTH ============
export const superLogin = (data) => api.post('/super/login', data);

// ============ DASHBOARD ============
export const getSuperDashboard = () => api.get('/super/dashboard');

// ============ ADMIN MANAGEMENT ============
export const getSuperAdmins = () => api.get('/super/admins');
export const addSuperAdmin = (data) => api.post('/super/admins', data);
export const editSuperAdmin = (id, data) => api.put(`/super/admins/${id}`, data);
export const deleteSuperAdmin = (id) => api.delete(`/super/admins/${id}`);

// ============ PROVIDER MANAGEMENT ============
export const getSuperProviders = () => api.get('/super/providers');
export const getSuperProviderDetails = (id) => api.get(`/super/providers/${id}`);

// ============ USER MANAGEMENT ============
export const getSuperUsers = () => api.get('/super/users');
export const deleteSuperUser = (id) => api.delete(`/super/users/${id}`);

// ============ SERVICE MANAGEMENT ============
export const getSuperServices = () => api.get('/super/services');
export const deleteSuperService = (id) => api.delete(`/super/services/${id}`);

// ============ PROJECT MANAGEMENT ============
export const getSuperProjects = () => api.get('/super/projects');

// ============ LOGS ============
export const getSuperAdminLogs = () => api.get('/super/logs/admin');
export const getSuperSuperLogs = () => api.get('/super/logs/super');
export const getSuperAllLogs = () => api.get('/super/logs/all');
export const getSuperLogById = (id) => api.get(`/super/logs/${id}`);