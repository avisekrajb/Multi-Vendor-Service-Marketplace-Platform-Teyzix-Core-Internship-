import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getMyServices, getMyRequests, getReviewsForProvider } from '../../services/api';
import StatsCard from '../../components/Dashboard/StatsCard';
import Badge from '../../components/Common/Badge';
import Stars from '../../components/Common/Stars';
import { STATUS_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const ProviderDashboard = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [requests, setRequests] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [servicesRes, requestsRes, reviewsRes] = await Promise.all([
        getMyServices().catch(err => ({ data: [] })),
        getMyRequests().catch(err => ({ data: [] })),
        getReviewsForProvider(user?._id).catch(err => ({ data: [] }))
      ]);
      setServices(servicesRes.data || []);
      setRequests(requestsRes.data || []);
      setReviews(reviewsRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  const activeProjects = requests.filter(r => !['Delivered', 'Completed'].includes(r.status));
  const pendingServices = services.filter(s => s.status === 'pending');
  const approvedServices = services.filter(s => s.status === 'approved');
  const rejectedServices = services.filter(s => s.status === 'rejected');
  const completedProjects = requests.filter(r => ['Delivered', 'Completed'].includes(r.status));
  const totalEarnings = completedProjects.reduce((sum, r) => sum + (r.budget || 0), 0);
  const averageRating = reviews.length 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : '0.0';

  const stats = [
    { icon: '💰', label: 'Total Earnings', value: `रू ${totalEarnings.toLocaleString()}`, color: '#10b981' },
    { icon: '⚡', label: 'Active Projects', value: activeProjects.length, color: '#6366f1' },
    { icon: '⏳', label: 'Pending Services', value: pendingServices.length, color: '#f59e0b' },
    { icon: '⭐', label: 'Avg Rating', value: averageRating, color: '#f59e0b' },
    { icon: '✅', label: 'Approved Services', value: approvedServices.length, color: '#10b981' },
    { icon: '🛍️', label: 'Total Services', value: services.length, color: '#8b5cf6' },
  ];

  const recentProjects = requests.slice(-5).reverse();
  const recentReviews = reviews.slice(-3).reverse();

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center text-2xl">
            👋
          </div>
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {user?.name?.split(' ')[0]}!</h1>
            <p className="text-indigo-100 mt-1">{user?.email} · Provider Account</p>
            {pendingServices.length > 0 && (
              <p className="text-sm bg-white/20 inline-block px-3 py-1 rounded-full mt-2">
                📝 {pendingServices.length} service{pendingServices.length !== 1 ? 's are' : ' is'} pending approval
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map(stat => (
          <StatsCard key={stat.label} {...stat} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Services Summary */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">My Services</h3>
            <Link to="/provider/services" className="text-sm text-indigo-600 hover:text-indigo-700">
              Manage →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-gray-600">Total Services</span>
              <span className="font-semibold">{services.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-green-600">✅ Approved</span>
              <span className="font-semibold text-green-600">{approvedServices.length}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
              <span className="text-yellow-600">⏳ Pending</span>
              <span className="font-semibold text-yellow-600">{pendingServices.length}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-red-600">❌ Rejected</span>
              <span className="font-semibold text-red-600">{rejectedServices.length}</span>
            </div>
          </div>
        </div>

        {/* Recent Projects */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Projects</h3>
            <Link to="/provider/projects" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No projects yet</p>
            ) : (
              recentProjects.map(project => (
                <div key={project._id} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{project.title}</p>
                    <p className="text-xs text-gray-500">Customer: {project.customerId?.name}</p>
                  </div>
                  <Badge label={project.status} color={STATUS_COLORS[project.status]} />
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Reviews</h3>
            <Link to="/provider/reviews" className="text-sm text-indigo-600 hover:text-indigo-700">
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {recentReviews.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reviews yet</p>
            ) : (
              recentReviews.map(review => (
                <div key={review._id} className="py-2 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{review.author}</p>
                      <Stars rating={review.rating} size={12} />
                    </div>
                    <span className="text-xs text-gray-500">{review.date}</span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                    {review.comment}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/provider/services" className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg text-center hover:bg-indigo-100 transition-colors">
              <div className="text-2xl mb-1">➕</div>
              <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Add New Service</p>
            </Link>
            <Link to="/provider/profile" className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg text-center hover:bg-purple-100 transition-colors">
              <div className="text-2xl mb-1">✏️</div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Edit Profile</p>
            </Link>
            <Link to="/provider/messages" className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg text-center hover:bg-green-100 transition-colors">
              <div className="text-2xl mb-1">💬</div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">View Messages</p>
            </Link>
            <Link to="/provider/projects" className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg text-center hover:bg-orange-100 transition-colors">
              <div className="text-2xl mb-1">📋</div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">View Projects</p>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderDashboard;