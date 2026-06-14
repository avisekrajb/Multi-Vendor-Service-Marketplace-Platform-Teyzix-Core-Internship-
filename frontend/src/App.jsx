import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { SocketProvider } from './contexts/SocketContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/Common/ProtectedRoute';

// Pages
import HomePage from './pages/HomePage';
import ServicesPage from './pages/ServicesPage';
import ServiceDetailsPage from './pages/ServiceDetailsPage';
import ProvidersPage from './pages/ProvidersPage';
import HowItWorksPage from './pages/HowItWorksPage';
import TermsPage from './pages/TermsPage';
import PrivacyPage from './pages/PrivacyPage';
import CloudinaryPhotos from './pages/CloudinaryPhotos';
import GoogleCallback from './pages/GoogleCallback';

// Customer Pages
import CustomerDashboard from './pages/CustomerDashboard/CustomerDashboard';
import CustomerProjects from './pages/CustomerDashboard/CustomerProjects';
import CustomerProfile from './pages/CustomerDashboard/CustomerProfile';
import CustomerMessages from './pages/CustomerDashboard/CustomerMessages';
import CustomerReviews from './pages/CustomerDashboard/CustomerReviews';

// Provider Pages
import ProviderDashboard from './pages/ProviderDashboard/ProviderDashboard';
import ProviderServices from './pages/ProviderDashboard/ProviderServices';
import ProviderProjects from './pages/ProviderDashboard/ProviderProjects';
import ProviderProfile from './pages/ProviderDashboard/ProviderProfile';
import ProviderMessages from './pages/ProviderDashboard/ProviderMessages';
import ProviderReviews from './pages/ProviderDashboard/ProviderReviews';

// Admin Pages
import AdminDashboard from './pages/AdminDashboard/AdminDashboard';
import AdminUsers from './pages/AdminDashboard/AdminUsers';
import AdminServices from './pages/AdminDashboard/AdminServices';
import AdminProjects from './pages/AdminDashboard/AdminProjects';
import AdminDisputes from './pages/AdminDashboard/AdminDisputes';
import AdminReports from './pages/AdminDashboard/AdminReports';
import AdminLogs from './pages/AdminDashboard/AdminLogs';
import AdminProviders from './pages/AdminDashboard/AdminProviders';

// Super Admin Pages
import SuperAdminDashboard from './pages/SuperAdminDashboard/SuperAdminDashboard';

function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('darkMode', darkMode);
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <AuthProvider>
      <SocketProvider>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
          <Layout darkMode={darkMode} setDarkMode={setDarkMode}>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Navigate to="/home" />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/services" element={<ServicesPage />} />
              <Route path="/service/:id" element={<ServiceDetailsPage />} />
              <Route path="/providers" element={<ProvidersPage />} />
              <Route path="/works" element={<HowItWorksPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              
              {/* Google OAuth Callback Route */}
              <Route path="/auth/google/callback" element={<GoogleCallback />} />
              
              {/* Cloudinary Photos - Admin only (protected by component) */}
              <Route path="/allphotos" element={<CloudinaryPhotos />} />
              
              {/* Customer Routes */}
              <Route path="/customer/dashboard" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerDashboard />
                </ProtectedRoute>
              } />
              <Route path="/customer/projects" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerProjects />
                </ProtectedRoute>
              } />
              <Route path="/customer/profile" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerProfile />
                </ProtectedRoute>
              } />
              <Route path="/customer/messages" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerMessages />
                </ProtectedRoute>
              } />
              <Route path="/customer/reviews" element={
                <ProtectedRoute allowedRoles={['customer']}>
                  <CustomerReviews />
                </ProtectedRoute>
              } />
              
              {/* Provider Routes */}
              <Route path="/provider/dashboard" element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderDashboard />
                </ProtectedRoute>
              } />
              <Route path="/provider/services" element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderServices />
                </ProtectedRoute>
              } />
              <Route path="/provider/projects" element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderProjects />
                </ProtectedRoute>
              } />
              <Route path="/provider/profile" element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderProfile />
                </ProtectedRoute>
              } />
              <Route path="/provider/messages" element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderMessages />
                </ProtectedRoute>
              } />
              <Route path="/provider/reviews" element={
                <ProtectedRoute allowedRoles={['provider']}>
                  <ProviderReviews />
                </ProtectedRoute>
              } />
              
              {/* Admin Routes */}
              <Route path="/admin/dashboard" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDashboard />
                </ProtectedRoute>
              } />
              <Route path="/admin/users" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminUsers />
                </ProtectedRoute>
              } />
              <Route path="/admin/services" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminServices />
                </ProtectedRoute>
              } />
              <Route path="/admin/projects" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProjects />
                </ProtectedRoute>
              } />
              <Route path="/admin/disputes" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminDisputes />
                </ProtectedRoute>
              } />
              <Route path="/admin/reports" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminReports />
                </ProtectedRoute>
              } />
              <Route path="/admin/logs" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminLogs />
                </ProtectedRoute>
              } />
              <Route path="/admin/providers" element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AdminProviders />
                </ProtectedRoute>
              } />
              
              {/* Super Admin Routes */}
              <Route path="/superadmin/dashboard" element={
                <ProtectedRoute allowedRoles={['superadmin']}>
                  <SuperAdminDashboard />
                </ProtectedRoute>
              } />
              
              {/* 404 Page - Catch all unmatched routes */}
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Layout>
          <Toaster 
            position="bottom-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: '#363636',
                color: '#fff',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#fff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

// Simple 404 Page Component
const NotFoundPage = () => (
  <div className="flex flex-col items-center justify-center h-screen text-center">
    <div className="text-6xl mb-4">🔍</div>
    <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">404</h1>
    <p className="text-gray-600 dark:text-gray-400 mb-6">Page not found</p>
    <a href="/home" className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
      Go Home
    </a>
  </div>
);

export default App;