import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyRequests, getMyReviews } from '../../services/api';
import StatsCard from '../../components/Dashboard/StatsCard';
import Badge from '../../components/Common/Badge';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [requestsRes, reviewsRes] = await Promise.all([
          getMyRequests(),
          getMyReviews().catch(() => ({ data: [] })) // Handle 404 gracefully
        ]);
        setRequests(requestsRes.data || []);
        setReviews(reviewsRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const activeRequests = requests.filter(r => !['Delivered', 'Completed'].includes(r.status));
  const deliveredRequests = requests.filter(r => r.status === 'Delivered');
  const totalSpent = requests.reduce((sum, r) => sum + (r.budget || 0), 0);

  const stats = [
    { icon: '📋', label: 'Total Requests', value: requests.length, color: '#6366f1' },
    { icon: '⚡', label: 'Active', value: activeRequests.length, color: '#8b5cf6' },
    { icon: '✅', label: 'Delivered', value: deliveredRequests.length, color: '#10b981' },
    { icon: '💰', label: 'Total Spent', value: `रू ${totalSpent.toLocaleString()}`, color: '#f59e0b' },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            👋
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-indigo-100">{user?.email} · Customer Account</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map(stat => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      {/* Active Projects */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Projects</h2>
        {activeRequests.length === 0 ? (
          <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="text-4xl mb-3">📋</div>
            <p className="text-gray-500">No active requests</p>
            <Link to="/services" className="inline-block mt-3 text-indigo-600 hover:text-indigo-700">
              Browse Services →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {activeRequests.map(request => (
              <div key={request._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                  <Badge label={request.status} />
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {request.requirements}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-3">
                  <span>💰 {request.budget?.toLocaleString()}</span>
                  <span>📅 {request.deadline}</span>
                  <span>📆 {request.created}</span>
                </div>
                <Link to={`/customer/projects/${request._id}`} className="text-sm text-indigo-600 hover:text-indigo-700">
                  View Details →
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerDashboard;