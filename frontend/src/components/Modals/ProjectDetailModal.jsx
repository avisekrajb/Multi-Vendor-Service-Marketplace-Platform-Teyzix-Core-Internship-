import React from 'react';
import Badge from '../Common/Badge';
import { STATUS_COLORS } from '../../utils/constants';

const ProjectDetailModal = ({ request, onClose, onUpdate }) => {
  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Project Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
          </div>

          {/* Project Info */}
          <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 mb-5">
            <h3 className="font-semibold text-gray-900 dark:text-white text-lg mb-2">{request.title}</h3>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>💰 {formatPrice(request.budget)}</span>
              <span>📅 Deadline: {request.deadline}</span>
              <span>📆 Created: {request.created}</span>
            </div>
            <div className="mt-3">
              <Badge label={request.status} color={STATUS_COLORS[request.status]} />
            </div>
          </div>

          {/* Requirements */}
          <div className="mb-5">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Requirements</h4>
            <p className="text-gray-600 dark:text-gray-400">{request.requirements}</p>
          </div>

          {/* Progress */}
          {request.progress > 0 && (
            <div className="mb-5">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold">Progress</span>
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

          {/* Attachments */}
          {request.attachments && request.attachments.length > 0 && (
            <div className="mb-5">
              <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Attachments</h4>
              <div className="space-y-2">
                {request.attachments.map((file, idx) => (
                  <a
                    key={idx}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700 text-sm"
                  >
                    📎 {file.name}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Activity Log</h4>
            <div className="relative pl-6 space-y-4">
              <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-300 dark:bg-gray-600" />
              {(request.activityLog || []).map((log, idx) => (
                <div key={idx} className="relative">
                  <div 
                    className="absolute -left-6 top-1 w-3 h-3 rounded-full"
                    style={{ backgroundColor: STATUS_COLORS[log.status] || '#6366f1' }}
                  />
                  <div className="text-sm font-semibold text-gray-900 dark:text-white">{log.status}</div>
                  <div className="text-xs text-gray-500">{log.time}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">{log.note}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailModal;