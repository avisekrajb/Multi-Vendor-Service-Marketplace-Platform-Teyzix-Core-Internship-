import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyRequests, updateRequestStatus } from '../../services/api';
import Badge from '../../components/Common/Badge';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import ProjectDetailModal from '../../components/Modals/ProjectDetailModal';
import { REQUEST_STATUS, REQUEST_STATUS_FLOW, STATUS_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const ProviderProjects = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusConfirm, setStatusConfirm] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getMyRequests();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching requests:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (requestId, newStatus) => {
    try {
      await updateRequestStatus(requestId, newStatus);
      toast.success(`Project marked as ${newStatus}`);
      fetchRequests();
      setStatusConfirm(null);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const getNextStatus = (currentStatus) => {
    const index = REQUEST_STATUS_FLOW.indexOf(currentStatus);
    if (index < REQUEST_STATUS_FLOW.length - 1) {
      return REQUEST_STATUS_FLOW[index + 1];
    }
    return null;
  };

  const filteredRequests = filter === 'All' 
    ? requests 
    : requests.filter(r => r.status === filter);

  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Projects</h1>
        <p className="text-gray-500 dark:text-gray-400">{requests.length} total projects</p>
      </div>

      {/* Status Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['All', ...REQUEST_STATUS_FLOW].map(status => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              filter === status
                ? 'bg-indigo-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
            }`}
          >
            {status}
            {status !== 'All' && (
              <span className="ml-1 text-xs">
                ({requests.filter(r => r.status === status).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Projects List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="text-5xl mb-4">📁</div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No projects found</h3>
            <p className="text-gray-500">Projects will appear here when customers request your services</p>
          </div>
        ) : (
          filteredRequests.map(request => {
            const nextStatus = getNextStatus(request.status);
            return (
              <div
                key={request._id}
                className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-sm text-gray-500">Customer: {request.customerId?.name}</span>
                    </div>
                  </div>
                  <Badge label={request.status} color={STATUS_COLORS[request.status]} />
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                  {request.requirements}
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-gray-500 mb-4">
                  <span>💰 {formatPrice(request.budget)}</span>
                  <span>📅 Deadline: {request.deadline}</span>
                  <span>📆 Created: {request.created}</span>
                </div>

                {request.progress > 0 && (
                  <div className="mb-4">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{request.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full transition-all" 
                        style={{ width: `${request.progress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    View Details
                  </button>
                  {nextStatus && (
                    <button
                      onClick={() => setStatusConfirm({ id: request._id, status: nextStatus, title: request.title })}
                      className="px-4 py-2 text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 rounded-lg hover:bg-indigo-200 transition-colors"
                    >
                      Mark as {nextStatus} →
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Project Detail Modal */}
      {selectedRequest && (
        <ProjectDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          onUpdate={fetchRequests}
        />
      )}

      {/* Status Update Confirm */}
      {statusConfirm && (
        <ConfirmModal
          title="Update Status"
          message={`Are you sure you want to mark "${statusConfirm.title}" as ${statusConfirm.status}?`}
          onConfirm={() => handleStatusUpdate(statusConfirm.id, statusConfirm.status)}
          onCancel={() => setStatusConfirm(null)}
        />
      )}
    </div>
  );
};

export default ProviderProjects;