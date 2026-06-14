import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Navbar from './Navbar';
import Footer from './Footer';
import DashboardSidebar from './DashboardSidebar';

const Layout = ({ children, darkMode, setDarkMode }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Define dashboard routes exactly
  const DASHBOARD_ROUTES = [
    '/customer/dashboard',
    '/customer/projects',
    '/customer/messages',
    '/customer/reviews',
    '/customer/profile',
    '/provider/dashboard',
    '/provider/services',
    '/provider/projects',
    '/provider/messages',
    '/provider/reviews',
    '/provider/profile',
    '/admin/dashboard',
    '/admin/users',
    '/admin/services',
    '/admin/projects',
    '/admin/disputes',
    '/admin/reports',
    '/admin/logs'
  ];

  // Check if current path is exactly a dashboard route
  const isDashboardRoute = DASHBOARD_ROUTES.includes(location.pathname);

  // If user is logged in AND on a dashboard route - show dashboard layout with sidebar
  if (user && isDashboardRoute) {
    return (
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Sidebar */}
        <DashboardSidebar 
          isOpen={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
          darkMode={darkMode}
          setDarkMode={setDarkMode}
        />
        
        {/* Main Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Mobile Header - only visible on mobile */}
          <div className="lg:hidden bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
            >
              ☰
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-lg">⚡</span>
              </div>
              <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                TEYZIX
              </span>
            </div>
            <div className="w-10" />
          </div>
          
          {/* Content */}
          <main className="flex-1 overflow-y-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    );
  }

  // Public layout with navbar and footer for all other pages (including /providers, /services, /home, etc.)
  return (
    <>
      <Navbar darkMode={darkMode} setDarkMode={setDarkMode} />
      <main className="pt-16 min-h-screen">
        {children}
      </main>
      <Footer />
    </>
  );
};

export default Layout;