import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAllRequests, updateRequestStatusAdmin, getUsers } from '../../services/api';
import Badge from '../../components/Common/Badge';
import Avatar from '../../components/Common/Avatar';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import ProjectDetailModal from '../../components/Modals/ProjectDetailModal';
import { REQUEST_STATUS_FLOW, STATUS_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const AdminProjects = () => {
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancellationModal, setShowCancellationModal] = useState(false);
  const [cancellingProject, setCancellingProject] = useState(null);
  const [selectedProvider, setSelectedProvider] = useState('all');
  const [selectedCustomer, setSelectedCustomer] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  // Statuses that cannot be edited after certain point
  const nonEditableStatuses = ['Delivered', 'Cancelled', 'Completed'];
  const finalStatuses = ['Delivered', 'Cancelled'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [projectsRes, usersRes] = await Promise.all([
        getAllRequests(),
        getUsers()
      ]);
      setProjects(projectsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      await updateRequestStatusAdmin(id, newStatus);
      toast.success(`Project status updated to ${newStatus}`);
      fetchData();
      setStatusConfirm(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleCancelProject = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a reason for cancellation');
      return;
    }

    try {
      await updateRequestStatusAdmin(cancellingProject._id, 'Cancelled', { cancellationReason });
      toast.success('Project cancelled successfully');
      fetchData();
      setShowCancellationModal(false);
      setCancellingProject(null);
      setCancellationReason('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to cancel project');
    }
  };

  const isEditable = (status) => {
    return !nonEditableStatuses.includes(status);
  };

  const formatPrice = (price) => `रू ${Number(price || 0).toLocaleString('ne-NP')}`;

  // Filter projects
  const filteredProjects = projects.filter(project => {
    if (filter !== 'all' && project.status !== filter) return false;
    if (search && !project.title?.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedProvider !== 'all' && project.providerId?._id !== selectedProvider) return false;
    if (selectedCustomer !== 'all' && project.customerId?._id !== selectedCustomer) return false;
    if (dateRange.start && new Date(project.createdAt) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(project.createdAt) > new Date(dateRange.end)) return false;
    return true;
  });

  const providers = users.filter(u => u.role === 'provider');
  const customers = users.filter(u => u.role === 'customer');

  // Statistics
  const stats = {
    total: projects.length,
    pending: projects.filter(p => p.status === 'Pending').length,
    inProgress: projects.filter(p => p.status === 'In Progress').length,
    completed: projects.filter(p => p.status === 'Completed').length,
    delivered: projects.filter(p => p.status === 'Delivered').length,
    cancelled: projects.filter(p => p.status === 'Cancelled').length,
    totalRevenue: projects.filter(p => p.status === 'Delivered').reduce((sum, p) => sum + (p.budget || 0), 0)
  };

  // Get available next statuses based on current status
  const getAvailableStatuses = (currentStatus) => {
    if (finalStatuses.includes(currentStatus)) {
      return [];
    }
    
    const statusFlow = {
      'Pending': ['Accepted', 'Cancelled'],
      'Accepted': ['In Progress', 'Cancelled'],
      'In Progress': ['Completed', 'Cancelled'],
      'Completed': ['Delivered', 'Cancelled'],
      'Delivered': [],
      'Cancelled': []
    };
    
    return statusFlow[currentStatus] || [];
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Project Management</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Projects</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          <div className="text-xs text-gray-500">Pending</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.inProgress}</div>
          <div className="text-xs text-gray-500">In Progress</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
          <div className="text-xs text-gray-500">Completed</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.delivered}</div>
          <div className="text-xs text-gray-500">Delivered</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{stats.cancelled}</div>
          <div className="text-xs text-gray-500">Cancelled</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-lg font-bold text-indigo-600">{formatPrice(stats.totalRevenue)}</div>
          <div className="text-xs text-gray-500">Total Revenue</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          />
          <select
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">All Providers</option>
            {providers.map(p => (
              <option key={p._id} value={p._id}>{p.name || 'Unknown'}</option>
            ))}
          </select>
          <select
            value={selectedCustomer}
            onChange={(e) => setSelectedCustomer(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">All Customers</option>
            {customers.map(c => (
              <option key={c._id} value={c._id}>{c.name || 'Unknown'}</option>
            ))}
          </select>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            placeholder="Start Date"
          />
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            placeholder="End Date"
          />
        </div>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'Pending', 'Accepted', 'In Progress', 'Completed', 'Delivered', 'Cancelled'].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {status === 'all' ? 'All' : status}
            <span className="ml-1 text-xs">
              ({projects.filter(p => status === 'all' || p.status === status).length})
            </span>
          </button>
        ))}
      </div>

      {/* Projects Table */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Budget</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProjects.map(project => {
                  const availableStatuses = getAvailableStatuses(project.status);
                  const isCancelled = project.status === 'Cancelled';
                  const isDelivered = project.status === 'Delivered';
                  
                  return (
                    <tr key={project._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{project.title || 'Untitled'}</div>
                        <div className="text-xs text-gray-500">ID: {project._id?.slice(-8) || 'N/A'}</div>
                        {project.cancellationReason && (
                          <div className="text-xs text-red-500 mt-1">
                            Cancelled: {project.cancellationReason}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={project.customerId?.avatar} name={project.customerId?.name || 'Unknown'} size={28} />
                          <span className="text-sm">{project.customerId?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={project.providerId?.avatar} name={project.providerId?.name || 'Unknown'} size={28} />
                          <span className="text-sm">{project.providerId?.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-indigo-600">{formatPrice(project.budget)}</span>
                      </td>
                      <td className="px-4 py-3">
                        <Badge label={project.status || 'Unknown'} color={STATUS_COLORS[project.status]} />
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {project.createdAt ? new Date(project.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => setSelectedProject(project)}
                            className="text-indigo-600 hover:text-indigo-700 text-sm px-2 py-1 rounded"
                          >
                            View
                          </button>
                          
                          {/* Cancel Button - Available for non-final statuses */}
                          {!isCancelled && !isDelivered && (
                            <button
                              onClick={() => {
                                setCancellingProject(project);
                                setShowCancellationModal(true);
                              }}
                              className="text-red-600 hover:text-red-700 text-sm px-2 py-1 rounded"
                            >
                              Cancel
                            </button>
                          )}
                          
                          {/* Status Update Dropdown - Only for editable statuses */}
                          {availableStatuses.length > 0 && !isDelivered && !isCancelled && (
                            <select
                              onChange={(e) => {
                                if (e.target.value === 'Cancelled') {
                                  setCancellingProject(project);
                                  setShowCancellationModal(true);
                                } else {
                                  setStatusConfirm({ 
                                    id: project._id, 
                                    status: e.target.value, 
                                    title: project.title || 'Project' 
                                  });
                                }
                              }}
                              value=""
                              className="text-sm border border-gray-300 dark:border-gray-600 rounded px-2 py-1 bg-white dark:bg-gray-700"
                            >
                              <option value="">Change Status</option>
                              {availableStatuses.filter(s => s !== 'Cancelled').map(s => (
                                <option key={s} value={s}>{s}</option>
                              ))}
                              <option value="Cancelled" className="text-red-600">Cancel Project</option>
                            </select>
                          )}
                          
                          {/* Show message for delivered/cancelled projects */}
                          {(isDelivered || isCancelled) && (
                            <span className="text-xs text-gray-400 italic">
                              {isDelivered ? '✓ Delivered - Cannot edit' : '✗ Cancelled - Cannot edit'}
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Project Detail Modal */}
      {selectedProject && (
        <ProjectDetailModal
          request={selectedProject}
          onClose={() => setSelectedProject(null)}
          onUpdate={fetchData}
        />
      )}

      {/* Status Change Confirmation Modal */}
      {statusConfirm && (
        <ConfirmModal
          title="Update Project Status"
          message={`Are you sure you want to change "${statusConfirm.title}" status to ${statusConfirm.status}?`}
          onConfirm={() => handleStatusUpdate(statusConfirm.id, statusConfirm.status)}
          onCancel={() => setStatusConfirm(null)}
        />
      )}

      {/* Cancellation Modal with Reason */}
      {showCancellationModal && cancellingProject && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowCancellationModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 animate-slideUp">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Cancel Project</h2>
              <button onClick={() => setShowCancellationModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{cancellingProject.title}</p>
              <p className="text-xs text-gray-500 mt-1">Project ID: {cancellingProject._id?.slice(-8)}</p>
              <p className="text-xs text-gray-500">Budget: {formatPrice(cancellingProject.budget)}</p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <textarea
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                placeholder="Please provide a detailed reason for cancelling this project..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                This reason will be visible to both the customer and provider.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancellationModal(false)}
                className="flex-1 px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Go Back
              </button>
              <button
                onClick={handleCancelProject}
                className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminProjects;