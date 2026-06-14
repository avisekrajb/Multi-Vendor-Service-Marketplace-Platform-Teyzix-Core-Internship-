import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getDisputes, updateDisputeStatus } from '../../services/api';
import Badge from '../../components/Common/Badge';
import Avatar from '../../components/Common/Avatar';
import toast from 'react-hot-toast';

const AdminDisputes = () => {
  const { user } = useAuth();
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState(null);
  const [resolution, setResolution] = useState('');
  const [resolutionType, setResolutionType] = useState('');
  const [resolutionAmount, setResolutionAmount] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchDisputes();
  }, []);

  const fetchDisputes = async () => {
    setLoading(true);
    try {
      const response = await getDisputes();
      setDisputes(response.data || []);
    } catch (error) {
      console.error('Error fetching disputes:', error);
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  const handleResolveDispute = async () => {
    if (!resolution.trim()) {
      toast.error('Please provide resolution details');
      return;
    }
    
    if (!resolutionType) {
      toast.error('Please select a resolution type');
      return;
    }
    
    try {
      await updateDisputeStatus(selectedDispute._id, {
        status: 'resolved',
        resolution: resolutionType,
        adminMessage: resolution,
        resolutionAmount: resolutionAmount ? parseInt(resolutionAmount) : 0
      });
      toast.success('Dispute resolved successfully');
      fetchDisputes();
      setSelectedDispute(null);
      setResolution('');
      setResolutionType('');
      setResolutionAmount('');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute');
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      open: { label: '🟡 Open', color: '#f59e0b', bg: '#f59e0b20' },
      under_review: { label: '🔵 Under Review', color: '#3b82f6', bg: '#3b82f620' },
      resolved: { label: '🟢 Resolved', color: '#10b981', bg: '#10b98120' },
      closed: { label: '⚫ Closed', color: '#6b7280', bg: '#6b728020' }
    };
    const c = config[status] || config.open;
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-xs font-semibold"
        style={{ backgroundColor: c.bg, color: c.color, border: `1px solid ${c.color}40` }}>
        {c.label}
      </span>
    );
  };

  const filteredDisputes = disputes.filter(dispute => {
    if (filter !== 'all' && dispute.status !== filter) return false;
    if (search && !dispute.reason?.toLowerCase().includes(search.toLowerCase()) &&
        !dispute.description?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  const stats = {
    total: disputes.length,
    open: disputes.filter(d => d.status === 'open').length,
    underReview: disputes.filter(d => d.status === 'under_review').length,
    resolved: disputes.filter(d => d.status === 'resolved').length
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Dispute Management</h1>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-indigo-600">{stats.total}</div>
          <div className="text-xs text-gray-500">Total Disputes</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-yellow-600">{stats.open}</div>
          <div className="text-xs text-gray-500">Open</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.underReview}</div>
          <div className="text-xs text-gray-500">Under Review</div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-3 text-center">
          <div className="text-2xl font-bold text-green-600">{stats.resolved}</div>
          <div className="text-xs text-gray-500">Resolved</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search disputes..."
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
        />
        <div className="flex gap-2">
          {['all', 'open', 'under_review', 'resolved'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300'
              }`}
            >
              {status === 'all' ? 'All' : status.replace('_', ' ')}
              <span className="ml-1 text-xs">
                ({disputes.filter(d => status === 'all' || d.status === status).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Disputes List */}
      {filteredDisputes.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">⚖️</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No disputes found</h3>
          <p className="text-gray-500">All disputes have been resolved</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredDisputes.map(dispute => (
            <div key={dispute._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3 flex-wrap gap-2">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">
                    Dispute for: {dispute.requestId?.title || 'Unknown Project'}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Raised by: {dispute.raisedBy?.name} • {new Date(dispute.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {getStatusBadge(dispute.status)}
              </div>

              <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <p className="text-sm font-medium text-red-700 dark:text-red-300">Reason: {dispute.reason}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{dispute.description}</p>
              </div>

              {dispute.attachments && dispute.attachments.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-500">Attachments:</p>
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {dispute.attachments.map((file, idx) => (
                      <a key={idx} href={file.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:text-indigo-700">
                        📎 {file.name || `Attachment ${idx + 1}`}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Details */}
              <div className="mb-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-xs font-medium text-gray-500 mb-1">Project Details:</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <span className="text-gray-600">Budget:</span>
                  <span className="font-semibold">रू {dispute.requestId?.budget?.toLocaleString()}</span>
                  <span className="text-gray-600">Deadline:</span>
                  <span>{dispute.requestId?.deadline}</span>
                  <span className="text-gray-600">Status:</span>
                  <span>{dispute.requestId?.status}</span>
                </div>
              </div>

              {dispute.status === 'open' && (
                <button
                  onClick={() => setSelectedDispute(dispute)}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
                >
                  Review & Resolve
                </button>
              )}

              {dispute.adminResponse && (
                <div className="mt-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs font-semibold text-green-600 mb-1">Admin Resolution:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{dispute.adminResponse.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Resolved by {dispute.adminResponse.resolvedBy?.name} on {new Date(dispute.adminResponse.resolvedAt).toLocaleDateString()}
                  </p>
                  {dispute.resolution && (
                    <p className="text-xs font-medium text-green-600 mt-1">
                      Resolution: {dispute.resolution.replace('_', ' ')}
                      {dispute.resolutionAmount > 0 && ` - रू ${dispute.resolutionAmount.toLocaleString()}`}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Resolution Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setSelectedDispute(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Resolve Dispute</h2>
                <button onClick={() => setSelectedDispute(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <p className="text-sm font-medium">Project: {selectedDispute.requestId?.title}</p>
                <p className="text-sm">Budget: रू {selectedDispute.requestId?.budget?.toLocaleString()}</p>
                <p className="text-sm">Reason: {selectedDispute.reason}</p>
                <p className="text-sm mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded">{selectedDispute.description}</p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution Type</label>
                <select
                  value={resolutionType}
                  onChange={(e) => setResolutionType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                >
                  <option value="">Select resolution type</option>
                  <option value="customer_won">🏆 Customer Won - Full Refund</option>
                  <option value="provider_won">🏆 Provider Won - Payment Released</option>
                  <option value="partial_refund">🔄 Partial Refund (50/50)</option>
                  <option value="completed">✅ Project Completed - Payment Released</option>
                </select>
              </div>

              {resolutionType === 'partial_refund' && (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Refund Amount (रू)</label>
                  <input
                    type="number"
                    value={resolutionAmount}
                    onChange={(e) => setResolutionAmount(e.target.value)}
                    placeholder="Enter refund amount"
                    className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  />
                  <p className="text-xs text-gray-500 mt-1">Max refund: रू {Math.floor(selectedDispute.requestId?.budget / 2).toLocaleString()}</p>
                </div>
              )}

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Resolution Details</label>
                <textarea
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                  placeholder="Explain the resolution decision..."
                />
              </div>

              <button
                onClick={handleResolveDispute}
                className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors"
              >
                Resolve Dispute
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDisputes;