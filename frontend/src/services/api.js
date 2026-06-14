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

// Response interceptor for token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        originalRequest.headers.Authorization = `Bearer ${response.data.accessToken}`;
        return api(originalRequest);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/home';
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

// ============ AUTH ============
export const register = (data) => api.post('/auth/register', data);
export const login = (data) => api.post('/auth/login', data);
export const logout = () => api.post('/auth/logout');
export const forgotPassword = (email) => api.post('/auth/forgot-password', { email });
export const verifyOtp = (email, otp) => api.post('/auth/verify-otp', { email, otp });
export const resetPassword = (email, newPassword) => api.post('/auth/reset-password', { email, newPassword });
export const changePassword = (currentPassword, newPassword) => api.post('/auth/change-password', { currentPassword, newPassword });

// ============ USERS ============
export const getProfile = () => api.get('/users/profile');

// IMPORTANT FIX: Update profile with FormData support
export const updateProfile = (data) => {
  if (data instanceof FormData) {
    return api.put('/users/profile', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.put('/users/profile', data);
};

export const getProviders = () => api.get('/users/providers');
export const getProviderById = (id) => api.get(`/users/provider/${id}`);
export const getUsers = () => api.get('/users');
export const banUser = (userId) => api.put(`/users/${userId}/ban`);

// User management functions
export const getUserById = (id) => api.get(`/users/${id}`);
export const updateUserById = (id, data) => api.put(`/users/${id}`, data);
export const deleteUserById = (id) => api.delete(`/users/${id}`);

// ============ SERVICES ============
export const getServices = (params) => api.get('/services', { params });
export const getServiceById = (id) => api.get(`/services/${id}`);

// Create service with FormData support
export const createService = (data) => {
  if (data instanceof FormData) {
    return api.post('/services', data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.post('/services', data);
};

// Update service with FormData support
export const updateService = (id, data) => {
  if (data instanceof FormData) {
    return api.put(`/services/${id}`, data, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  }
  return api.put(`/services/${id}`, data);
};

export const deleteService = (id) => api.delete(`/services/${id}`);
export const getMyServices = () => api.get('/services/my-services');
export const approveService = (id) => api.put(`/services/${id}/approve`);
export const rejectService = (id) => api.put(`/services/${id}/reject`);
export const getAllServicesForAdmin = () => api.get('/services/admin/all');

// Get services by provider
export const getServicesByProvider = (providerId) => api.get(`/services/provider/${providerId}`);

// ============ REQUESTS ============
export const createRequest = (data) => api.post('/requests', data);
export const getMyRequests = () => api.get('/requests/my-requests');
export const getRequestById = (id) => api.get(`/requests/${id}`);
export const updateRequestStatus = (id, status, cancellationReason) => 
  api.put(`/requests/${id}/status`, { status, cancellationReason });
export const addRequestAttachments = (id, files) => {
  const formData = new FormData();
  files.forEach(file => formData.append('attachments', file));
  return api.post(`/requests/${id}/attachments`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

// Get requests by provider
export const getRequestsByProvider = (providerId) => api.get(`/requests/provider/${providerId}`);

// ============ REVIEWS ============
export const createReview = (data) => api.post('/reviews', data);
export const getReviews = () => api.get('/reviews');
export const getMyReviews = () => api.get('/reviews/my-reviews');
export const getReviewsForProvider = (providerId) => api.get(`/reviews/provider/${providerId}`);
export const getLatestReviews = () => api.get('/reviews/latest');
export const updateReview = (id, data) => api.put(`/reviews/${id}`, data);
export const deleteReview = (id) => api.delete(`/reviews/${id}`);
export const respondToReview = (id, response) => api.post(`/reviews/${id}/respond`, { response });

// ============ CHAT ============
export const getConversations = () => api.get('/chat/conversations');
export const getMessages = (userId) => api.get(`/chat/messages/${userId}`);
export const sendMessage = (data) => api.post('/chat/message', data);
export const markMessageRead = (messageId) => api.put(`/chat/message/${messageId}/read`);
export const sendImageMessage = (formData) => api.post('/chat/send-image', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const sendFileMessage = (formData) => api.post('/chat/send-file', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const sendVoiceMessage = (formData) => api.post('/chat/send-voice', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
});
export const markAllMessagesRead = (userId) => api.put(`/chat/mark-all-read/${userId}`);
export const deleteMessage = (messageId) => api.delete(`/chat/message/${messageId}`);

// ============ DISPUTES ============
export const createDispute = (data) => api.post('/disputes', data);
export const getDisputes = () => api.get('/disputes');
export const getMyDisputes = () => api.get('/disputes/my-disputes');
export const getDisputeById = (id) => api.get(`/disputes/${id}`);
export const updateDisputeStatus = (id, data) => api.put(`/disputes/${id}/status`, data);
export const deleteDispute = (id) => api.delete(`/disputes/${id}`);
export const getDisputeStats = () => api.get('/disputes/stats');

// ============ NOTIFICATIONS ============
export const getNotifications = () => api.get('/notifications');
export const markNotificationRead = (id) => api.put(`/notifications/${id}/read`);
export const markAllNotificationsRead = () => api.put('/notifications/read-all');

// ============ ADMIN ============
export const getAdminStats = () => api.get('/admin/dashboard');
export const getAdminLogs = () => api.get('/admin/logs');

// ============ ADMIN ADDITIONAL ============
export const getAllRequests = () => api.get('/admin/requests');
export const getAllUsers = () => api.get('/admin/users');
export const getAllServicesAdmin = () => api.get('/admin/services');
export const getAllReviewsAdmin = () => api.get('/admin/reviews');
export const getAllDisputesAdmin = () => api.get('/admin/disputes');
export const updateRequestStatusAdmin = (id, status, cancellationReason) => 
  api.put(`/admin/requests/${id}/status`, { status, cancellationReason });
export const deleteReviewAdmin = (id) => api.delete(`/admin/reviews/${id}`);
export const resolveDispute = (id, data) => api.put(`/admin/disputes/${id}/resolve`, data);
export const updateUserRole = (userId, role) => api.put(`/admin/users/${userId}/role`, { role });
export const deleteUserAdmin = (userId) => api.delete(`/admin/users/${userId}`);
export const bulkBanUsers = (userIds) => api.post('/admin/bulk/ban-users', { userIds });
export const bulkDeleteServices = (serviceIds) => api.post('/admin/bulk/delete-services', { serviceIds });
export const getAdminStatsUsers = () => api.get('/admin/stats/users');
export const getAdminStatsServices = () => api.get('/admin/stats/services');
export const getAdminStatsRevenue = () => api.get('/admin/stats/revenue');

// ============ PROVIDER MANAGEMENT (ADMIN) ============
export const getProvidersAdmin = () => api.get('/admin/providers');
export const getProviderDetailsAdmin = (id) => api.get(`/admin/providers/${id}/details`);
export const updateProviderAdmin = (id, data) => api.put(`/admin/providers/${id}`, data);

// ============ REPORTS ============
export const generateReport = (data) => api.post('/reports/generate', data);
export const getReports = () => api.get('/reports');

// ============ SUPER ADMIN ============
export const superLogin = (data) => api.post('/super/login', data);
export const getSuperDashboard = () => api.get('/super/dashboard');
export const getSuperAdmins = () => api.get('/super/admins');
export const addSuperAdmin = (data) => api.post('/super/admins', data);
export const editSuperAdmin = (id, data) => api.put(`/super/admins/${id}`, data);
export const deleteSuperAdmin = (id) => api.delete(`/super/admins/${id}`);
export const getSuperProviders = () => api.get('/super/providers');
export const getSuperProviderDetails = (id) => api.get(`/super/providers/${id}`);
export const getSuperUsers = () => api.get('/super/users');
export const deleteSuperUser = (id) => api.delete(`/super/users/${id}`);
export const getSuperServices = () => api.get('/super/services');
export const deleteSuperService = (id) => api.delete(`/super/services/${id}`);
export const getSuperProjects = () => api.get('/super/projects');
export const getSuperAdminLogs = () => api.get('/super/logs/admin');
export const getSuperSuperLogs = () => api.get('/super/logs/super');
export const getSuperAllLogs = () => api.get('/super/logs/all');
export const getSuperLogById = (id) => api.get(`/super/logs/${id}`);

export default api;