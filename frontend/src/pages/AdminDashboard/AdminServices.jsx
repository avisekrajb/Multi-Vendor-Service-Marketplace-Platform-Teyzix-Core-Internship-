import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllServicesForAdmin, approveService, rejectService, deleteService } from '../../services/api';
import Avatar from '../../components/Common/Avatar';
import Badge from '../../components/Common/Badge';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import toast from 'react-hot-toast';

const AdminServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedService, setSelectedService] = useState(null);
  const [confirmAction, setConfirmAction] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  // FIX: Use getAllServicesForAdmin to see all services (including pending)
  const fetchServices = async () => {
    setLoading(true);
    try {
      const response = await getAllServicesForAdmin();
      setServices(response.data || []);
      console.log('Fetched services:', response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await approveService(id);
      toast.success('Service approved successfully');
      fetchServices();
      setConfirmAction(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to approve service');
    }
  };

  const handleReject = async (id) => {
    try {
      await rejectService(id);
      toast.success('Service rejected');
      fetchServices();
      setConfirmAction(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to reject service');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteService(id);
      toast.success('Service deleted');
      fetchServices();
      setConfirmAction(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete service');
    }
  };

  const filteredServices = services.filter(service => {
    if (filter !== 'all' && service.status !== filter) return false;
    if (search && !service.title.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

  const getStatusBadge = (status) => {
    const config = {
      approved: { label: '✅ Approved', color: '#10b981', bg: '#10b98120' },
      pending: { label: '⏳ Pending', color: '#f59e0b', bg: '#f59e0b20' },
      rejected: { label: '❌ Rejected', color: '#ef4444', bg: '#ef444420' }
    };
    const c = config[status] || config.pending;
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.color}40` }}>
        {c.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Service Management</h1>
          <p className="text-gray-500 dark:text-gray-400">
            {services.filter(s => s.status === 'pending').length} pending approvals | Total: {services.length} services
          </p>
        </div>
        
        {/* Search */}
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services..."
          className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white w-64"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 font-medium transition-colors ${
              filter === status
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            <span className="ml-1 text-xs">
              ({services.filter(s => status === 'all' || s.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Services List */}
      {filteredServices.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">🛍️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No services found</h3>
          <p className="text-gray-500">Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredServices.map(service => (
            <div
              key={service._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex gap-4">
                {/* Service Image */}
                <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center text-3xl flex-shrink-0 overflow-hidden">
                  {service.image ? (
                    <img src={service.image} alt={service.title} className="w-full h-full object-cover rounded-lg" />
                  ) : (
                    <span className="text-3xl">{service.icon || '💻'}</span>
                  )}
                </div>

                {/* Service Info */}
                <div className="flex-1">
                  <div className="flex justify-between items-start flex-wrap gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{service.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">
                        Provider: {service.providerId?.name || 'Unknown'} • {service.category}
                      </p>
                    </div>
                    {getStatusBadge(service.status)}
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                    {service.description}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-3 text-sm">
                    <span className="text-indigo-600 font-semibold">{formatPrice(service.price)}</span>
                    <span className="text-gray-500">⏱️ {service.delivery}</span>
                    <span className="text-gray-500">⭐ {service.rating?.toFixed(1) || '0.0'} ({service.reviewCount || 0})</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 mt-4">
                    {service.status === 'pending' && (
                      <>
                        <button
                          onClick={() => setConfirmAction({ type: 'approve', id: service._id, title: service.title })}
                          className="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                        >
                          ✅ Approve
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: 'reject', id: service._id, title: service.title })}
                          className="px-4 py-1.5 bg-red-100 text-red-700 rounded-lg text-sm hover:bg-red-200 transition-colors"
                        >
                          ❌ Reject
                        </button>
                      </>
                    )}
                    {service.status === 'rejected' && (
                      <button
                        onClick={() => setConfirmAction({ type: 'approve', id: service._id, title: service.title })}
                        className="px-4 py-1.5 bg-green-100 text-green-700 rounded-lg text-sm hover:bg-green-200 transition-colors"
                      >
                        🔄 Re-approve
                      </button>
                    )}
                    <button
                      onClick={() => setConfirmAction({ type: 'delete', id: service._id, title: service.title })}
                      className="px-4 py-1.5 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors"
                    >
                      🗑️ Delete
                    </button>
                    <button
                      onClick={() => setSelectedService(service)}
                      className="px-4 py-1.5 bg-indigo-100 text-indigo-700 rounded-lg text-sm hover:bg-indigo-200 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Service Detail Modal */}
      {selectedService && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setSelectedService(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Service Details</h2>
                <button onClick={() => setSelectedService(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="w-32 h-32 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl flex items-center justify-center text-5xl overflow-hidden">
                    {selectedService.image ? (
                      <img src={selectedService.image} alt={selectedService.title} className="w-full h-full object-cover rounded-xl" />
                    ) : (
                      selectedService.icon || '💻'
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">{selectedService.title}</h3>
                    <p className="text-sm text-gray-500">Provider: {selectedService.providerId?.name || 'Unknown'}</p>
                    <p className="text-sm text-gray-500">Provider Email: {selectedService.providerId?.email || 'N/A'}</p>
                    <p className="text-sm text-gray-500">Category: {selectedService.category}</p>
                    <p className="text-indigo-600 font-bold text-xl mt-2">{formatPrice(selectedService.price)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Description</h4>
                  <p className="text-gray-600 dark:text-gray-400 whitespace-pre-wrap">{selectedService.description}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Delivery Time</h4>
                  <p className="text-gray-600">{selectedService.delivery}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Rating & Reviews</h4>
                  <p className="text-gray-600">⭐ {selectedService.rating?.toFixed(1) || '0.0'} ({selectedService.reviewCount || 0} reviews)</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Status</h4>
                  <div>{getStatusBadge(selectedService.status)}</div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Created At</h4>
                  <p className="text-gray-600">{new Date(selectedService.createdAt).toLocaleString()}</p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Last Updated</h4>
                  <p className="text-gray-600">{new Date(selectedService.updatedAt).toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Action Modal */}
      {confirmAction && (
        <ConfirmModal
          title={`${confirmAction.type === 'approve' ? 'Approve' : confirmAction.type === 'reject' ? 'Reject' : 'Delete'} Service`}
          message={`Are you sure you want to ${confirmAction.type} "${confirmAction.title}"? ${confirmAction.type === 'delete' ? 'This action cannot be undone.' : ''}`}
          onConfirm={() => {
            if (confirmAction.type === 'approve') handleApprove(confirmAction.id);
            else if (confirmAction.type === 'reject') handleReject(confirmAction.id);
            else handleDelete(confirmAction.id);
          }}
          onCancel={() => setConfirmAction(null)}
        />
      )}
    </div>
  );
};

export default AdminServices;