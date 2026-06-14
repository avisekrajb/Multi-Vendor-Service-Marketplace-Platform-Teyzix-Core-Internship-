import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminStats } from '../../services/api';
import StatsCard from '../../components/Dashboard/StatsCard';
import { REQUEST_STATUS_FLOW, STATUS_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);

  useEffect(() => { 
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await getAdminStats();
      setStats(response.data.stats);
      setRecentUsers(response.data.recentUsers || []);
      setRecentRequests(response.data.recentRequests || []);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { icon: '👥', label: 'Total Users', value: stats?.totalUsers || 0, color: '#6366f1' },
    { icon: '🛍️', label: 'Total Services', value: stats?.totalServices || 0, color: '#8b5cf6' },
    { icon: '📋', label: 'Total Projects', value: stats?.totalRequests || 0, color: '#3b82f6' },
    { icon: '💰', label: 'Platform Revenue', value: `रू ${(stats?.totalRevenue || 0).toLocaleString()}`, color: '#10b981' },
    { icon: '⏳', label: 'Pending Services', value: stats?.pendingServices || 0, color: '#f59e0b' },
    { icon: '⚖️', label: 'Open Disputes', value: stats?.pendingDisputes || 0, color: '#ef4444' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back, {user?.name}!</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map(stat => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Users</h3>
          <div className="space-y-3">
            {recentUsers.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent users</p>
            ) : (
              recentUsers.map(user => (
                <div key={user._id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{user.name}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <span className="text-xs text-gray-400">{new Date(user.createdAt).toLocaleDateString()}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recent Projects</h3>
          <div className="space-y-3">
            {recentRequests.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No recent projects</p>
            ) : (
              recentRequests.map(request => (
                <div key={request._id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{request.title}</p>
                    <p className="text-xs text-gray-500">
                      {request.customerId?.name} → {request.providerId?.name}
                    </p>
                  </div>
                  <span 
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: `${STATUS_COLORS[request.status]}20`, color: STATUS_COLORS[request.status] }}
                  >
                    {request.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Status Distribution */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Project Status Distribution</h3>
          <div className="space-y-3">
            {REQUEST_STATUS_FLOW.map(status => {
              const count = stats?.statusCounts?.[status] || 0;
              const percentage = stats?.totalRequests ? (count / stats.totalRequests) * 100 : 0;
              return (
                <div key={status}>
                  <div className="flex justify-between text-sm mb-1">
                    <span style={{ color: STATUS_COLORS[status] }}>{status}</span>
                    <span className="text-gray-500">{count}</span>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${percentage}%`, backgroundColor: STATUS_COLORS[status] }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <a href="/admin/users" className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center hover:bg-indigo-100 transition-colors">
              <div className="text-2xl mb-1">👥</div>
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Manage Users</p>
            </a>
            <a href="/admin/services" className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center hover:bg-purple-100 transition-colors">
              <div className="text-2xl mb-1">🛍️</div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Review Services</p>
            </a>
            <a href="/admin/disputes" className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center hover:bg-orange-100 transition-colors">
              <div className="text-2xl mb-1">⚖️</div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Resolve Disputes</p>
            </a>
            <a href="/admin/reports" className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center hover:bg-green-100 transition-colors">
              <div className="text-2xl mb-1">📊</div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Generate Reports</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;