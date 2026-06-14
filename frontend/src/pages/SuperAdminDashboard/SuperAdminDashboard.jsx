import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getSuperDashboard,
  getSuperAdmins,
  getSuperProviders,
  getSuperUsers,
  getSuperServices,
  getSuperProjects,
  getSuperAllLogs,
  getSuperLogById,
  addSuperAdmin,
  editSuperAdmin,
  deleteSuperAdmin,
  deleteSuperUser,
  deleteSuperService,
} from '../../services/superApi';
import StatsCard from '../../components/Dashboard/StatsCard';
import Badge from '../../components/Common/Badge';
import Avatar from '../../components/Common/Avatar';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import toast from 'react-hot-toast';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({});
  const [admins, setAdmins] = useState([]);
  const [providers, setProviders] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [projects, setProjects] = useState([]);
  const [logs, setLogs] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showAddAdminModal, setShowAddAdminModal] = useState(false);
  const [showEditAdminModal, setShowEditAdminModal] = useState(false);
  const [showLogModal, setShowLogModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [adminForm, setAdminForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [logDetails, setLogDetails] = useState(null);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      switch (activeTab) {
        case 'overview':
          const dashboardRes = await getSuperDashboard();
          setStats(dashboardRes.data.stats);
          break;
        case 'admins':
          const adminsRes = await getSuperAdmins();
          setAdmins(adminsRes.data);
          break;
        case 'providers':
          const providersRes = await getSuperProviders();
          setProviders(providersRes.data);
          break;
        case 'users':
          const usersRes = await getSuperUsers();
          setUsers(usersRes.data);
          break;
        case 'services':
          const servicesRes = await getSuperServices();
          setServices(servicesRes.data);
          break;
        case 'projects':
          const projectsRes = await getSuperProjects();
          setProjects(projectsRes.data);
          break;
        case 'logs':
          const logsRes = await getSuperAllLogs();
          setLogs(logsRes.data);
          break;
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleViewLog = async (logId) => {
    try {
      const response = await getSuperLogById(logId);
      setLogDetails(response.data);
      setShowLogModal(true);
    } catch (error) {
      toast.error('Failed to load log details');
    }
  };

  const handleAddAdmin = async () => {
    if (!adminForm.name || !adminForm.email || !adminForm.password) {
      toast.error('Please fill all required fields');
      return;
    }
    try {
      await addSuperAdmin(adminForm);
      toast.success('Admin added successfully');
      setShowAddAdminModal(false);
      setAdminForm({ name: '', email: '', phone: '', password: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add admin');
    }
  };

  const handleEditAdmin = async () => {
    try {
      await editSuperAdmin(selectedAdmin._id, adminForm);
      toast.success('Admin updated successfully');
      setShowEditAdminModal(false);
      setSelectedAdmin(null);
      setAdminForm({ name: '', email: '', phone: '', password: '' });
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update admin');
    }
  };

  const handleDelete = async () => {
    try {
      if (confirmDelete.type === 'admin') {
        await deleteSuperAdmin(confirmDelete.id);
        toast.success('Admin deleted successfully');
      } else if (confirmDelete.type === 'user') {
        await deleteSuperUser(confirmDelete.id);
        toast.success('User deleted successfully');
      } else if (confirmDelete.type === 'service') {
        await deleteSuperService(confirmDelete.id);
        toast.success('Service deleted successfully');
      }
      setConfirmDelete(null);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const statCards = [
    { icon: '👥', label: 'Total Users', value: stats.totalUsers || 0, color: '#6366f1' },
    { icon: '🔧', label: 'Providers', value: stats.totalProviders || 0, color: '#8b5cf6' },
    { icon: '👑', label: 'Admins', value: stats.totalAdmins || 0, color: '#ef4444' },
    { icon: '🛍️', label: 'Services', value: stats.totalServices || 0, color: '#10b981' },
    { icon: '📋', label: 'Projects', value: stats.totalProjects || 0, color: '#f59e0b' },
    { icon: '⭐', label: 'Reviews', value: stats.totalReviews || 0, color: '#ec4899' },
    { icon: '⚖️', label: 'Disputes', value: stats.totalDisputes || 0, color: '#ef4444' },
    { icon: '💰', label: 'Revenue', value: `रू ${(stats.totalRevenue || 0).toLocaleString()}`, color: '#06b6d4' },
  ];

  const tabs = [
    { key: 'overview', label: '📊 Overview' },
    { key: 'admins', label: '👑 Admins' },
    { key: 'providers', label: '🔧 Providers' },
    { key: 'users', label: '👥 Users' },
    { key: 'services', label: '🛍️ Services' },
    { key: 'projects', label: '📋 Projects' },
    { key: 'logs', label: '📝 Logs' },
  ];

  if (loading && activeTab !== 'overview') {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Super Admin Dashboard</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome, {user?.name}</p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
            {statCards.map(stat => (
              <StatsCard key={stat.label} {...stat} />
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Pending Actions</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span>⏳ Pending Services</span>
                  <Badge label={stats.pendingServices || 0} color="#f59e0b" />
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span>⚖️ Open Disputes</span>
                  <Badge label={stats.pendingDisputes || 0} color="#ef4444" />
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>⚡ Active Projects</span>
                  <Badge label={stats.activeProjects || 0} color="#10b981" />
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Platform Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span>Total Platform Revenue</span>
                  <span className="font-bold text-indigo-600">रू {(stats.totalRevenue || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span>Average Project Value</span>
                  <span className="font-bold">
                    रू {stats.totalProjects ? Math.round(stats.totalRevenue / stats.totalProjects).toLocaleString() : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span>Success Rate</span>
                  <span className="font-bold text-green-600">
                    {stats.totalProjects ? Math.round((stats.totalProjects - (stats.pendingDisputes || 0)) / stats.totalProjects * 100) : 100}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Admins Tab */}
      {activeTab === 'admins' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">System Administrators</h2>
            <button
              onClick={() => setShowAddAdminModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
            >
              + Add Admin
            </button>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {admins.map(admin => (
                    <tr key={admin._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={admin.avatar} name={admin.name} size={32} />
                          <span className="font-medium">{admin.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{admin.email}</td>
                      <td className="px-4 py-3 text-sm">{admin.phone || 'N/A'}</td>
                      <td className="px-4 py-3">
                        <Badge label="Active" color="#10b981" />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              setSelectedAdmin(admin);
                              setAdminForm({ name: admin.name, email: admin.email, phone: admin.phone || '', password: '' });
                              setShowEditAdminModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-700 text-sm"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDelete({ type: 'admin', id: admin._id, name: admin.name })}
                            className="text-red-600 hover:text-red-700 text-sm"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Providers Tab */}
      {activeTab === 'providers' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Service Providers</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Projects</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Earnings</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {providers.map(provider => (
                    <tr key={provider._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={provider.avatar} name={provider.name} size={32} />
                          <span className="font-medium">{provider.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{provider.email}</td>
                      <td className="px-4 py-3 text-sm">{provider.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="flex items-center gap-1">
                          <span>⭐</span>
                          <span>{provider.rating?.toFixed(1) || '0.0'}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{provider.completedProjects || 0}</td>
                      <td className="px-4 py-3 text-sm">रू {(provider.totalEarnings || 0).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {provider.banned ? (
                          <Badge label="Banned" color="#ef4444" />
                        ) : (
                          <Badge label="Active" color="#10b981" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Customers</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Joined</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {users.map(userItem => (
                    <tr key={userItem._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Avatar src={userItem.avatar} name={userItem.name} size={32} />
                          <span className="font-medium">{userItem.name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{userItem.email}</td>
                      <td className="px-4 py-3 text-sm">{userItem.phone || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{new Date(userItem.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        {userItem.banned ? (
                          <Badge label="Banned" color="#ef4444" />
                        ) : (
                          <Badge label="Active" color="#10b981" />
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmDelete({ type: 'user', id: userItem._id, name: userItem.name })}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Services Tab */}
      {activeTab === 'services' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Services</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Service</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {services.map(service => (
                    <tr key={service._id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                            {service.icon || '💻'}
                          </div>
                          <span className="font-medium">{service.title}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm">{service.providerId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{service.category}</td>
                      <td className="px-4 py-3 text-sm">रू {service.price?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        {service.status === 'approved' && <Badge label="Approved" color="#10b981" />}
                        {service.status === 'pending' && <Badge label="Pending" color="#f59e0b" />}
                        {service.status === 'rejected' && <Badge label="Rejected" color="#ef4444" />}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setConfirmDelete({ type: 'service', id: service._id, name: service.title })}
                          className="text-red-600 hover:text-red-700 text-sm"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Projects Tab */}
      {activeTab === 'projects' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">All Projects</h2>
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
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {projects.map(project => (
                    <tr key={project._id}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-gray-900 dark:text-white">{project.title}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{project.customerId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">{project.providerId?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-sm">रू {project.budget?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <Badge label={project.status} />
                      </td>
                      <td className="px-4 py-3 text-sm">{new Date(project.createdAt).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Activity Logs</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin/Super Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map(log => (
                    <tr key={log._id}>
                      <td className="px-4 py-3 text-sm">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <div>
                          <div className="font-medium">{log.adminId?.name || log.superAdminId?.name}</div>
                          <div className="text-xs text-gray-500">{log.adminId?.email || log.superAdminId?.email}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{log.action?.replace(/_/g, ' ')}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="capitalize">{log.targetType || 'N/A'}</span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {log.targetName || (log.details ? JSON.stringify(log.details).slice(0, 50) : '—')}
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleViewLog(log._id)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Admin Modal */}
      {showAddAdminModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowAddAdminModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Add New Admin</h2>
              <button onClick={() => setShowAddAdminModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={adminForm.name}
                onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <input
                type="email"
                placeholder="Email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={adminForm.phone}
                onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <input
                type="password"
                placeholder="Password"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleAddAdmin}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Add Admin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Admin Modal */}
      {showEditAdminModal && selectedAdmin && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowEditAdminModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Admin</h2>
              <button onClick={() => setShowEditAdminModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Full Name"
                value={adminForm.name}
                onChange={(e) => setAdminForm({ ...adminForm, name: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <input
                type="email"
                placeholder="Email"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <input
                type="tel"
                placeholder="Phone"
                value={adminForm.phone}
                onChange={(e) => setAdminForm({ ...adminForm, phone: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <input
                type="password"
                placeholder="New Password (leave blank to keep current)"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              />
              <button
                onClick={handleEditAdmin}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Log Details Modal */}
      {showLogModal && logDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setShowLogModal(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Log Details</h2>
              <button onClick={() => setShowLogModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Time:</span>
                <span>{new Date(logDetails.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Admin:</span>
                <span>{logDetails.adminId?.name || logDetails.superAdminId?.name}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Email:</span>
                <span>{logDetails.adminId?.email || logDetails.superAdminId?.email}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Action:</span>
                <span className="capitalize">{logDetails.action?.replace(/_/g, ' ')}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Target Type:</span>
                <span className="capitalize">{logDetails.targetType || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Target ID:</span>
                <span className="text-sm">{logDetails.targetId || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">Target Name:</span>
                <span>{logDetails.targetName || 'N/A'}</span>
              </div>
              <div className="py-2">
                <span className="font-medium">Details:</span>
                <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm overflow-x-auto">
                  {JSON.stringify(logDetails.details, null, 2)}
                </pre>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span className="font-medium">IP Address:</span>
                <span>{logDetails.ipAddress || 'N/A'}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="font-medium">User Agent:</span>
                <span className="text-sm">{logDetails.userAgent || 'N/A'}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {confirmDelete && (
        <ConfirmModal
          title="Confirm Delete"
          message={`Are you sure you want to delete ${confirmDelete.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setConfirmDelete(null)}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;