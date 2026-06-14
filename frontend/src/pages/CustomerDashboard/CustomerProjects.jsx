import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyRequests } from '../../services/api';
import Badge from '../../components/Common/Badge';
import ProjectDetailModal from '../../components/Modals/ProjectDetailModal';
import { STATUS_COLORS } from '../../utils/constants';
import toast from 'react-hot-toast';

const CustomerProjects = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('active');
  const [selectedRequest, setSelectedRequest] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await getMyRequests();
      setRequests(response.data || []);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  const activeRequests = requests.filter(r => !['Delivered', 'Completed'].includes(r.status));
  const completedRequests = requests.filter(r => ['Delivered', 'Completed'].includes(r.status));

  const displayedRequests = filter === 'active' ? activeRequests : completedRequests;

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Projects</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Track and manage your project requests</p>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'active'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Active ({activeRequests.length})
        </button>
        <button
          onClick={() => setFilter('completed')}
          className={`px-4 py-2 font-medium transition-colors ${
            filter === 'completed'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Completed ({completedRequests.length})
        </button>
      </div>

      {/* Projects List */}
      {displayedRequests.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">{filter === 'active' ? '📋' : '✅'}</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {filter === 'active' ? 'No active projects' : 'No completed projects yet'}
          </h3>
          <p className="text-gray-500">
            {filter === 'active' 
              ? 'Browse services to start a new project'
              : 'Completed projects will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedRequests.map(request => (
            <div
              key={request._id}
              onClick={() => setSelectedRequest(request)}
              className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition-all"
            >
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{request.title}</h3>
                  <p className="text-sm text-gray-500 mt-1">Provider: {request.providerId?.name}</p>
                </div>
                <Badge label={request.status} color={STATUS_COLORS[request.status]} />
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                {request.requirements}
              </p>

              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                <span>💰 {formatPrice(request.budget)}</span>
                <span>📅 Deadline: {request.deadline}</span>
                <span>📆 Created: {request.created}</span>
              </div>

              {request.progress > 0 && (
                <div className="mt-3">
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
            </div>
          ))}
        </div>
      )}

      {selectedRequest && (
        <ProjectDetailModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </div>
  );
};

export default CustomerProjects;