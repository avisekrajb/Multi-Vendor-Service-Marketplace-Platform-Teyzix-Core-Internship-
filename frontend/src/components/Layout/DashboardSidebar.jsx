import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Avatar from '../Common/Avatar';

const DashboardSidebar = ({ isOpen, onClose, darkMode, setDarkMode }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const getNavItems = () => {
    if (!user) return [];
    
    if (user.role === 'admin') {
      return [
        { path: '/admin/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/admin/users', icon: '👥', label: 'Users' },
        { path: '/admin/providers', icon: '🔧', label: 'Providers' },
        { path: '/admin/services', icon: '🛍️', label: 'Services' },
        { path: '/admin/projects', icon: '📋', label: 'Projects' },
        { path: '/admin/disputes', icon: '⚖️', label: 'Disputes' },
        { path: '/admin/reports', icon: '📊', label: 'Reports' },
        { path: '/admin/logs', icon: '📝', label: 'Logs' },
      ];
    }
    
    if (user.role === 'provider') {
      return [
        { path: '/provider/dashboard', icon: '📊', label: 'Dashboard' },
        { path: '/provider/services', icon: '🛍️', label: 'My Services' },
        { path: '/provider/projects', icon: '📋', label: 'Projects' },
        { path: '/provider/messages', icon: '💬', label: 'Messages' },
        { path: '/provider/reviews', icon: '⭐', label: 'Reviews' },
        { path: '/provider/profile', icon: '👤', label: 'Profile' },
      ];
    }
    
    // Customer
    return [
      { path: '/customer/dashboard', icon: '📊', label: 'Dashboard' },
      { path: '/customer/projects', icon: '📋', label: 'My Projects' },
      { path: '/customer/messages', icon: '💬', label: 'Messages' },
      { path: '/customer/reviews', icon: '⭐', label: 'Reviews' },
      { path: '/customer/profile', icon: '👤', label: 'Profile' },
    ];
  };

  const navItems = getNavItems();

  const handleLogout = async () => {
    await logout();
    navigate('/home');
    onClose();
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-lg">⚡</span>
          </div>
          <span className="font-bold text-xl bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            TEYZIX
          </span>
        </div>
      </div>

      {/* User Profile */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Avatar src={user?.avatar} name={user?.name} size={48} />
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white truncate">{user?.name}</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{user?.role}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {navItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            onClick={onClose}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl mb-1 transition-all ${
              isActive(item.path)
                ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400'
                : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        {/* Back to Site Button */}
        <button
          onClick={() => {
            navigate('/home');
            onClose();
          }}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
        >
          <span className="text-xl">🌐</span>
          <span className="font-medium">Back to Site</span>
        </button>

        {/* Dark Mode Toggle */}
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <span className="text-xl">{darkMode ? '☀️' : '🌙'}</span>
          <span className="font-medium">{darkMode ? 'Light Mode' : 'Dark Mode'}</span>
        </button>

        {/* Sign Out Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar - always visible on large screens */}
      <div className="hidden lg:block w-72 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0 overflow-y-auto">
        {sidebarContent}
      </div>

      {/* Mobile Sidebar - slide in overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        {/* Sidebar */}
        <div className="relative w-72 h-full bg-white dark:bg-gray-800 shadow-xl overflow-y-auto">
          {sidebarContent}
        </div>
      </div>
    </>
  );
};

export default DashboardSidebar;