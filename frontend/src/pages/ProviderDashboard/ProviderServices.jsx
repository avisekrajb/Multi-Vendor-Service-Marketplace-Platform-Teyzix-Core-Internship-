import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyServices, createService, updateService, deleteService } from '../../services/api';
import ServiceForm from '../../components/Service/ServiceForm';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import toast from 'react-hot-toast';

const ProviderServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching services for user:', user?._id);
      const response = await getMyServices();
      console.log('Services response:', response.data);
      setServices(response.data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
      console.error('Error details:', error.response?.data);
      setError(error.response?.data?.message || 'Failed to load services');
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (formData) => {
    try {
      let response;
      if (editingService) {
        // For update, check if formData has image file
        if (formData instanceof FormData) {
          response = await updateService(editingService._id, formData);
        } else {
          response = await updateService(editingService._id, formData);
        }
        toast.success('Service updated successfully!');
      } else {
        // For create, always send as FormData if it has image
        response = await createService(formData);
        toast.success('Service created! Awaiting approval.');
      }
      fetchServices();
      setShowModal(false);
      setEditingService(null);
    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleDelete = async () => {
    try {
      await deleteService(deleteConfirm);
      toast.success('Service deleted successfully');
      fetchServices();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Delete error:', error);
      toast.error('Failed to delete service');
    }
  };

  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

  const getStatusBadge = (status) => {
    const statusConfig = {
      approved: { label: '✅ Approved', color: '#10b981', bg: '#10b98120' },
      pending: { label: '⏳ Pending Review', color: '#f59e0b', bg: '#f59e0b20' },
      rejected: { label: '❌ Rejected', color: '#ef4444', bg: '#ef444420' }
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: config.bg, color: config.color, border: `1px solid ${config.color}40` }}>
        {config.label}
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

  if (error) {
    return (
      <div className="text-center py-16">
        <div className="text-5xl mb-4">⚠️</div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Error Loading Services</h3>
        <p className="text-gray-500 mb-4">{error}</p>
        <button
          onClick={fetchServices}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Services</h1>
          <p className="text-gray-500 dark:text-gray-400">{services.length} services total</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            setShowModal(true);
          }}
          className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
        >
          + New Service
        </button>
      </div>

      {services.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">🛍️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No services yet</h3>
          <p className="text-gray-500">Create your first service listing</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Create Service
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {services.map((service) => (
            <div
              key={service._id}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-4"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 rounded-lg flex items-center justify-center text-2xl flex-shrink-0 overflow-hidden">
                {service.image ? (
                  <img 
                    src={service.image} 
                    alt={service.title} 
                    className="w-full h-full object-cover rounded-lg"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = service.icon || '💻';
                    }}
                  />
                ) : (
                  service.icon || '💻'
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 dark:text-white">{service.title}</div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {service.category} · {formatPrice(service.price)} · {service.delivery}
                </div>
                <div className="mt-1">{getStatusBadge(service.status)}</div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingService(service);
                    setShowModal(true);
                  }}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => setDeleteConfirm(service._id)}
                  className="px-3 py-1.5 text-sm bg-red-50 dark:bg-red-900/20 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <ServiceForm
          service={editingService}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingService(null);
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Service"
          message="Are you sure you want to delete this service? This action cannot be undone."
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default ProviderServices;