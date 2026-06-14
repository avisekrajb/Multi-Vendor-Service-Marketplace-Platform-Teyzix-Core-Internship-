import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getAdminLogs, getUsers } from '../../services/api';
import Avatar from '../../components/Common/Avatar';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const AdminLogs = () => {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedAdmin, setSelectedAdmin] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [logsRes, usersRes] = await Promise.all([
        getAdminLogs(),
        getUsers()
      ]);
      setLogs(logsRes.data || []);
      setUsers(usersRes.data || []);
    } catch (error) {
      console.error('Error fetching logs:', error);
      toast.error('Failed to load activity logs');
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (action) => {
    const icons = {
      'ban_user': '🚫',
      'unban_user': '✅',
      'approve_service': '✅',
      'reject_service': '❌',
      'delete_service': '🗑️',
      'update_service': '✏️',
      'update_request': '📋',
      'resolve_dispute': '⚖️',
      'login': '🔑',
      'logout': '🚪',
      'create_user': '👤',
      'delete_user': '🗑️'
    };
    return icons[action] || '📝';
  };

  const getActionColor = (action) => {
    if (action?.includes('ban')) return 'text-red-600';
    if (action?.includes('approve')) return 'text-green-600';
    if (action?.includes('reject')) return 'text-red-600';
    if (action?.includes('delete')) return 'text-red-600';
    if (action?.includes('update')) return 'text-blue-600';
    return 'text-gray-600';
  };

  const filteredLogs = logs.filter(log => {
    if (filter !== 'all' && log.targetType !== filter) return false;
    if (search && !log.action?.toLowerCase().includes(search.toLowerCase())) return false;
    if (selectedAdmin !== 'all' && log.adminId?._id !== selectedAdmin) return false;
    if (dateRange.start && new Date(log.createdAt) < new Date(dateRange.start)) return false;
    if (dateRange.end && new Date(log.createdAt) > new Date(dateRange.end)) return false;
    return true;
  });

  const admins = users.filter(u => u.role === 'admin');

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Admin Activity Logs</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Track all admin actions on the platform</p>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{logs.length}</div>
          <div className="text-xs text-gray-500">Total Actions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{logs.filter(l => l.action?.includes('approve')).length}</div>
          <div className="text-xs text-gray-500">Approvals</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-red-600">{logs.filter(l => l.action?.includes('ban') || l.action?.includes('delete')).length}</div>
          <div className="text-xs text-gray-500">Restrictions</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{logs.filter(l => l.action?.includes('update')).length}</div>
          <div className="text-xs text-gray-500">Updates</div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search actions..."
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">All Targets</option>
            <option value="user">Users</option>
            <option value="service">Services</option>
            <option value="request">Projects</option>
            <option value="review">Reviews</option>
            <option value="dispute">Disputes</option>
          </select>
          <select
            value={selectedAdmin}
            onChange={(e) => setSelectedAdmin(e.target.value)}
            className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
          >
            <option value="all">All Admins</option>
            {admins.map(admin => (
              <option key={admin._id} value={admin._id}>{admin.name || 'Unknown'}</option>
            ))}
          </select>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              placeholder="From"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              placeholder="To"
            />
          </div>
        </div>
      </div>

      {/* Logs Table */}
      {filteredLogs.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">📋</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No logs found</h3>
          <p className="text-gray-500">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Admin</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Target ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">IP Address</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredLogs.map(log => (
                  <tr key={log._id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString() : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Avatar src={log.adminId?.avatar} name={log.adminId?.name || 'Unknown'} size={28} />
                        <div>
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{log.adminId?.name || 'Unknown'}</div>
                          <div className="text-xs text-gray-500">{log.adminId?.email || 'No email'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={getActionColor(log.action)}>{getActionIcon(log.action)}</span>
                        <span className="text-sm capitalize">{log.action?.replace(/_/g, ' ') || 'Unknown'}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm capitalize text-gray-600 dark:text-gray-400">
                        {log.targetType || 'N/A'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500">
                        {log.targetId ? log.targetId.slice(-8) : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono text-gray-500">{log.ipAddress || '—'}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm text-gray-500">
                        {log.details ? JSON.stringify(log.details).slice(0, 50) : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminLogs;