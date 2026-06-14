import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

// Flag to prevent multiple refresh requests
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor - add token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    
    if (error.response?.status === 401 && !originalRequest.url?.includes('/auth/refresh-token') && !originalRequest.url?.includes('/super/login')) {
      originalRequest._retry = true;
      
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }
      
      isRefreshing = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!refreshToken) {
        isRefreshing = false;
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/home';
        return Promise.reject(error);
      }
      
      try {
        const response = await axios.post(`${API_URL}/auth/refresh-token`, { refreshToken });
        const { accessToken, refreshToken: newRefreshToken } = response.data;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', newRefreshToken);
        
        processQueue(null, accessToken);
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/home';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }
    
    return Promise.reject(error);
  }
);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = () => {
      try {
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');
        
        console.log('Loading user from localStorage:', storedUser);
        
        if (storedUser && token) {
          const parsedUser = JSON.parse(storedUser);
          console.log('Parsed user with avatar:', parsedUser.avatar);
          setUser(parsedUser);
        }
      } catch (e) {
        console.error('Failed to parse user:', e);
        localStorage.removeItem('user');
      } finally {
        setLoading(false);
      }
    };
    
    loadUser();
  }, []);

  // Regular user login
  const login = useCallback(async (email, password) => {
    try {
      const response = await apiClient.post('/auth/login', { email, password });
      const { user: userData, accessToken, refreshToken } = response.data;
      
      console.log('Login response user data:', userData);
      console.log('Avatar URL from login:', userData.avatar);
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.name?.split(' ')[0]}! 👋`);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Login error:', error);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Super Admin login
  const superLogin = useCallback(async (email, password) => {
    try {
      const response = await axios.post(`${API_URL}/super/login`, { email, password });
      const { user: userData, accessToken, refreshToken } = response.data;
      
      console.log('Super Admin login response:', userData);
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      toast.success(`Welcome Super Admin, ${userData.name}! 👑`);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Super Admin login error:', error);
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Google Login (for redirect OAuth flow)
  const googleLogin = useCallback(async (accessToken, refreshToken, userData) => {
    try {
      console.log('Google login - saving user data:', userData);
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      toast.success(`Welcome${userData.name ? ' ' + userData.name.split(' ')[0] : ''}! 👋`);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google login error:', error);
      toast.error('Google login failed');
      return { success: false, error: 'Google login failed' };
    }
  }, []);

  // Google Token Login (for frontend Google SDK)
  const googleTokenLogin = useCallback(async (googleData) => {
    try {
      const response = await apiClient.post('/auth/google/token', googleData);
      const { user: userData, accessToken, refreshToken } = response.data;
      
      console.log('Google token login response:', userData);
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(userData));
      
      setUser(userData);
      toast.success(`Welcome${userData.name ? ' ' + userData.name.split(' ')[0] : ''}! 👋`);
      return { success: true, user: userData };
    } catch (error) {
      console.error('Google token login error:', error);
      const message = error.response?.data?.message || 'Google login failed';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Register user
  const register = useCallback(async (userData) => {
    try {
      const formData = new FormData();
      formData.append('name', userData.name);
      formData.append('email', userData.email);
      formData.append('phone', userData.phone);
      formData.append('password', userData.password);
      formData.append('role', userData.role);
      
      if (userData.avatar) {
        formData.append('avatar', userData.avatar);
      }
      
      const response = await apiClient.post('/auth/register', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      const { user: newUser, accessToken, refreshToken } = response.data;
      
      console.log('Registration response user data:', newUser);
      console.log('Avatar URL from registration:', newUser.avatar);
      
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('user', JSON.stringify(newUser));
      
      setUser(newUser);
      
      toast.success('Account created successfully! 🎉');
      return { success: true, user: newUser };
    } catch (error) {
      console.error('Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      return { success: false, error: message };
    }
  }, []);

  // Logout user
  const logout = useCallback(async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        await apiClient.post('/auth/logout', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
      toast.success('Logged out successfully');
    }
  }, []);

  // Update user profile (called after profile update)
  const updateUser = useCallback((updatedUser) => {
    console.log('Updating user in context:', updatedUser);
    console.log('New avatar URL:', updatedUser.avatar);
    
    // Get current user to preserve any fields not in updatedUser
    const currentUser = user || {};
    const mergedUser = { ...currentUser, ...updatedUser };
    
    setUser(mergedUser);
    
    // Save to localStorage
    localStorage.setItem('user', JSON.stringify(mergedUser));
    
    // Verify localStorage was updated
    const savedUser = localStorage.getItem('user');
    console.log('Verified saved user in localStorage:', savedUser);
    
    toast.success('Profile updated successfully!');
  }, [user]);

  // Refresh user data from backend
  const refreshUser = useCallback(async () => {
    try {
      const response = await apiClient.get('/users/profile');
      const freshUser = response.data;
      
      console.log('Refreshed user from backend:', freshUser);
      console.log('Refreshed avatar URL:', freshUser.avatar);
      
      setUser(freshUser);
      localStorage.setItem('user', JSON.stringify(freshUser));
      
      return freshUser;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      return null;
    }
  }, []);

  // Get user role helper
  const getUserRole = useCallback(() => {
    return user?.role || null;
  }, [user]);

  // Check if user is authenticated
  const isAuthenticated = useCallback(() => {
    return !!user && !!localStorage.getItem('accessToken');
  }, [user]);

  // Check if user has specific role
  const hasRole = useCallback((role) => {
    return user?.role === role;
  }, [user]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      superLogin,
      googleLogin,
      googleTokenLogin,
      register, 
      logout, 
      updateUser,
      refreshUser,
      getUserRole,
      isAuthenticated,
      hasRole,
      apiClient
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;