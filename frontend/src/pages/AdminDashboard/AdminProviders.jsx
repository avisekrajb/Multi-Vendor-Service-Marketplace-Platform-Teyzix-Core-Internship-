import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { 
  getUsers, 
  banUser, 
  deleteUserById, 
  updateUserById, 
  getUserById,
  getServicesByProvider,
  getRequestsByProvider,
  getReviewsForProvider
} from '../../services/api';
import Avatar from '../../components/Common/Avatar';
import Badge from '../../components/Common/Badge';
import Stars from '../../components/Common/Stars';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import toast from 'react-hot-toast';

const AdminProviders = () => {
  const { user: currentUser } = useAuth();
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    title: '',
    bio: '',
    skills: '',
  });
  const [providerDetails, setProviderDetails] = useState({
    provider: null,
    services: [],
    projects: [],
    reviews: [],
  });

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    setLoading(true);
    try {
      const response = await getUsers();
      const allProviders = response.data.filter(user => user.role === 'provider');
      setProviders(allProviders);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast.error('Failed to load providers');
    } finally {
      setLoading(false);
    }
  };

  const fetchProviderDetails = async (providerId) => {
    try {
      const response = await getUserById(providerId);
      const providerData = response.data;
      
      const [servicesRes, projectsRes, reviewsRes] = await Promise.all([
        getServicesByProvider(providerId).catch(() => ({ data: [] })),
        getRequestsByProvider(providerId).catch(() => ({ data: [] })),
        getReviewsForProvider(providerId).catch(() => ({ data: [] }))
      ]);
      
      setProviderDetails({
        provider: providerData,
        services: servicesRes.data || [],
        projects: projectsRes.data || [],
        reviews: reviewsRes.data || [],
      });
    } catch (error) {
      console.error('Error fetching provider details:', error);
      toast.error('Failed to load provider details');
    }
  };

  const handleViewDetails = async (provider) => {
    setSelectedProvider(provider);
    await fetchProviderDetails(provider._id);
    setShowDetailsModal(true);
  };

  const handleEditProvider = (provider) => {
    setSelectedProvider(provider);
    setEditForm({
      name: provider.name || '',
      email: provider.email || '',
      phone: provider.phone || '',
      title: provider.title || '',
      bio: provider.bio || '',
      skills: provider.skills?.join(', ') || '',
    });
    setShowEditModal(true);
  };

  const handleUpdateProvider = async () => {
    try {
      const updateData = {
        name: editForm.name,
        email: editForm.email,
        phone: editForm.phone,
        title: editForm.title,
        bio: editForm.bio,
        skills: editForm.skills,
      };
      
      await updateUserById(selectedProvider._id, updateData);
      toast.success('Provider updated successfully');
      fetchProviders();
      setShowEditModal(false);
      if (showDetailsModal) {
        await fetchProviderDetails(selectedProvider._id);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update provider');
    }
  };

  const handleBanProvider = async () => {
    try {
      await banUser(confirmAction.id);
      toast.success(confirmAction.currentBanned ? 'Provider unbanned' : 'Provider banned');
      fetchProviders();
      setConfirmAction(null);
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (error) {
      toast.error('Failed to update provider status');
    }
  };

  const handleDeleteProvider = async () => {
    try {
      await deleteUserById(confirmAction.id);
      toast.success('Provider deleted successfully');
      fetchProviders();
      setConfirmAction(null);
      if (showDetailsModal) {
        setShowDetailsModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete provider');
    }
  };

  const filteredProviders = providers.filter(provider => {
    if (search && !provider.name?.toLowerCase().includes(search.toLowerCase()) && 
        !provider.email?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    if (filterStatus === 'active' && provider.banned) return false;
    if (filterStatus === 'banned' && !provider.banned) return false;
    return true;
  });

  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Provider Management</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Manage all service providers on the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Providers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{providers.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xl">🔧</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Active Providers</p>
              <p className="text-2xl font-bold text-green-600">{providers.filter(p => !p.banned).length}</p>
            </div>
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xl">✅</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Banned Providers</p>
              <p className="text-2xl font-bold text-red-600">{providers.filter(p => p.banned).length}</p>
            </div>
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xl">🚫</span>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
              <p className="text-2xl font-bold text-emerald-600">
                रू {providers.reduce((sum, p) => sum + (p.totalEarnings || 0), 0).toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
              <span className="text-xl">💰</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search providers..."
              className="w-full sm:w-64 px-4 py-2 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
            <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
          >
            <option value="all">All Providers</option>
            <option value="active">Active Only</option>
            <option value="banned">Banned Only</option>
          </select>
        </div>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredProviders.length} of {providers.length} providers
        </div>
      </div>

      {/* Providers Grid */}
      {filteredProviders.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">🔧</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No providers found</h3>
          <p className="text-gray-500">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredProviders.map((provider, index) => (
            <div
              key={provider._id}
              className={`group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm border transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ${
                provider.banned 
                  ? 'border-red-200 dark:border-red-800 bg-red-50/30 dark:bg-red-900/10' 
                  : 'border-gray-100 dark:border-gray-700'
              }`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Cover Image Area */}
              <div className={`h-24 bg-gradient-to-r ${
                provider.banned 
                  ? 'from-red-400 to-red-600' 
                  : 'from-indigo-500 to-purple-600'
              }`} />
              
              {/* Avatar */}
              <div className="relative px-4">
                <div className="absolute -top-12 left-4">
                  <Avatar src={provider.avatar} name={provider.name} size={72} className="border-4 border-white dark:border-gray-800 shadow-lg" />
                </div>
                {provider.banned && (
                  <div className="absolute top-2 right-4">
                    <Badge label="Banned" color="#ef4444" />
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4 pt-14">
                <div className="mb-3">
                  <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate">{provider.name}</h3>
                  <p className="text-sm text-gray-500 truncate">{provider.email}</p>
                  {provider.title && (
                    <p className="text-xs text-indigo-600 dark:text-indigo-400 mt-1 truncate">{provider.title}</p>
                  )}
                </div>

                {/* Stats */}
                <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-gray-100 dark:border-gray-700 mb-3">
                  <div className="text-center">
                    <div className="text-lg font-bold text-indigo-600">{provider.completedProjects || 0}</div>
                    <div className="text-xs text-gray-500">Projects</div>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 text-lg font-bold text-yellow-500">
                      <span>⭐</span>
                      <span>{provider.rating?.toFixed(1) || '0.0'}</span>
                    </div>
                    <div className="text-xs text-gray-500">Rating</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-bold text-green-600 truncate">
                      रू {(provider.totalEarnings || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-gray-500">Earnings</div>
                  </div>
                </div>

                {/* Skills */}
                {provider.skills && provider.skills.length > 0 && (
                  <div className="mb-3">
                    <div className="flex flex-wrap gap-1.5">
                      {provider.skills.slice(0, 3).map(skill => (
                        <span key={skill} className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                          {skill}
                        </span>
                      ))}
                      {provider.skills.length > 3 && (
                        <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">
                          +{provider.skills.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(provider)}
                    className="flex-1 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-lg text-sm font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors"
                  >
                    View Details
                  </button>
                  <button
                    onClick={() => handleEditProvider(provider)}
                    className="px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => setConfirmAction({ 
                      type: provider.banned ? 'unban' : 'ban', 
                      id: provider._id, 
                      name: provider.name,
                      currentBanned: provider.banned 
                    })}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      provider.banned
                        ? 'bg-green-100 text-green-700 hover:bg-green-200'
                        : 'bg-red-100 text-red-700 hover:bg-red-200'
                    }`}
                  >
                    {provider.banned ? 'Unban' : 'Ban'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Provider Details Modal */}
      {showDetailsModal && providerDetails.provider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={(e) => e.target === e.currentTarget && setShowDetailsModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-6 pb-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Provider Details</h2>
              <button onClick={() => setShowDetailsModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Profile Header */}
              <div className="flex flex-col md:flex-row gap-6 items-start">
                <Avatar src={providerDetails.provider.avatar} name={providerDetails.provider.name} size={100} />
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-3 mb-2">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{providerDetails.provider.name}</h3>
                    {providerDetails.provider.banned && <Badge label="Banned" color="#ef4444" />}
                  </div>
                  <p className="text-gray-500">{providerDetails.provider.email}</p>
                  <p className="text-gray-500">📞 {providerDetails.provider.phone || 'N/A'}</p>
                  {providerDetails.provider.title && (
                    <p className="text-indigo-600 font-medium mt-2">{providerDetails.provider.title}</p>
                  )}
                  {providerDetails.provider.bio && (
                    <p className="text-gray-600 dark:text-gray-400 mt-3 text-sm leading-relaxed">{providerDetails.provider.bio}</p>
                  )}
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-indigo-600">{providerDetails.services.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Services</div>
                </div>
                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-green-600">{providerDetails.projects.length}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Projects</div>
                </div>
                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 rounded-xl p-4 text-center">
                  <div className="text-2xl font-bold text-yellow-600">{providerDetails.provider.rating?.toFixed(1) || '0.0'}⭐</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Rating</div>
                </div>
                <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-900/20 dark:to-emerald-800/20 rounded-xl p-4 text-center">
                  <div className="text-lg font-bold text-emerald-600">रू {(providerDetails.provider.totalEarnings || 0).toLocaleString()}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Earnings</div>
                </div>
              </div>

              {/* Skills Section */}
              {providerDetails.provider.skills?.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>🎯</span> Skills & Expertise
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {providerDetails.provider.skills.map(skill => (
                      <span key={skill} className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Services Section */}
              {providerDetails.services.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>🛍️</span> Services ({providerDetails.services.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {providerDetails.services.map(service => (
                      <div key={service._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 flex flex-wrap justify-between items-center gap-2">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">{service.title}</div>
                          <div className="text-sm text-gray-500">{service.category} • {formatPrice(service.price)}</div>
                        </div>
                        <Badge label={service.status} />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Projects Section */}
              {providerDetails.projects.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>📋</span> Projects ({providerDetails.projects.length})
                  </h4>
                  <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                    {providerDetails.projects.map(project => (
                      <div key={project._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex flex-wrap justify-between items-start gap-2">
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{project.title}</div>
                            <div className="text-sm text-gray-500">Customer: {project.customerId?.name || 'N/A'}</div>
                            <div className="text-sm font-medium text-indigo-600">{formatPrice(project.budget)}</div>
                          </div>
                          <Badge label={project.status} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews Section */}
              {providerDetails.reviews.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                    <span>⭐</span> Client Reviews ({providerDetails.reviews.length})
                  </h4>
                  <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                    {providerDetails.reviews.map(review => (
                      <div key={review._id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex flex-wrap justify-between items-start mb-2 gap-2">
                          <div className="font-medium text-gray-900 dark:text-white">{review.author}</div>
                          <Stars rating={review.rating} size={16} />
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                        <p className="text-xs text-gray-500 mt-2">{review.date}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    handleEditProvider(providerDetails.provider);
                  }}
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Edit Profile
                </button>
                <button
                  onClick={() => setConfirmAction({ 
                    type: providerDetails.provider.banned ? 'unban' : 'ban', 
                    id: providerDetails.provider._id, 
                    name: providerDetails.provider.name,
                    currentBanned: providerDetails.provider.banned 
                  })}
                  className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
                    providerDetails.provider.banned
                      ? 'bg-green-600 text-white hover:bg-green-700'
                      : 'bg-red-600 text-white hover:bg-red-700'
                  }`}
                >
                  {providerDetails.provider.banned ? 'Unban Provider' : 'Ban Provider'}
                </button>
                <button
                  onClick={() => setConfirmAction({ type: 'delete', id: providerDetails.provider._id, name: providerDetails.provider.name })}
                  className="px-5 py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Provider Modal */}
      {showEditModal && selectedProvider && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowEditModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Provider</h2>
              <button onClick={() => setShowEditModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Professional Title</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  placeholder="e.g., Full Stack Developer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
                <textarea
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="About the provider..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
                <input
                  type="text"
                  value={editForm.skills}
                  onChange={(e) => setEditForm({ ...editForm, skills: e.target.value })}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  placeholder="React, Node.js, Python"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUpdateProvider}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <ConfirmModal
          title={confirmAction.type === 'ban' ? 'Ban Provider' : confirmAction.type === 'unban' ? 'Unban Provider' : 'Delete Provider'}
          message={
            confirmAction.type === 'ban' 
              ? `Are you sure you want to ban "${confirmAction.name}"? They will not be able to access their account.`
              : confirmAction.type === 'unban'
              ? `Are you sure you want to unban "${confirmAction.name}"? They will regain access to their account.`
              : `Are you sure you want to delete "${confirmAction.name}"? This action cannot be undone and all their data will be permanently removed.`
          }
          onConfirm={
            confirmAction.type === 'delete' 
              ? handleDeleteProvider 
              : handleBanProvider
          }
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default AdminProviders;