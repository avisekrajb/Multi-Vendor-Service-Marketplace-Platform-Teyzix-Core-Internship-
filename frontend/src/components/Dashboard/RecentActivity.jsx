import React from 'react';
import { Link } from 'react-router-dom';
import Avatar from '../Common/Avatar';
import { formatDistanceToNow } from 'date-fns';

const RecentActivity = ({ activities, title = 'Recent Activity', viewAllLink }) => {
  const getActivityIcon = (type) => {
    const icons = {
      project_created: '📋',
      project_completed: '✅',
      project_accepted: '🤝',
      review_received: '⭐',
      payment_received: '💰',
      service_created: '🛍️',
      service_approved: '✅',
      message_received: '💬'
    };
    return icons[type] || '📝';
  };

  const getActivityColor = (type) => {
    const colors = {
      project_created: 'text-blue-500',
      project_completed: 'text-green-500',
      project_accepted: 'text-purple-500',
      review_received: 'text-yellow-500',
      payment_received: 'text-emerald-500',
      service_created: 'text-indigo-500',
      service_approved: 'text-green-500',
      message_received: 'text-cyan-500'
    };
    return colors[type] || 'text-gray-500';
  };

  if (activities.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 text-center">
        <div className="text-4xl mb-2">📭</div>
        <p className="text-gray-500">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {viewAllLink && (
          <Link to={viewAllLink} className="text-sm text-indigo-600 hover:text-indigo-700">
            View all →
          </Link>
        )}
      </div>
      <div className="divide-y divide-gray-100 dark:divide-gray-700">
        {activities.slice(0, 5).map((activity, idx) => (
          <div key={idx} className="p-4 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className={`text-2xl ${getActivityColor(activity.type)}`}>
              {getActivityIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {activity.message}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-gray-500 mt-1">{activity.details}</p>
                  )}
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </span>
              </div>
              {activity.user && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar src={activity.user.avatar} name={activity.user.name} size={20} />
                  <span className="text-xs text-gray-500">{activity.user.name}</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default RecentActivity;