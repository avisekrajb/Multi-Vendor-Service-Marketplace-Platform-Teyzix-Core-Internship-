import React from 'react';
import Avatar from '../Common/Avatar';
import { formatDistanceToNow } from 'date-fns';

const ChatList = ({ conversations, selectedChat, onSelectChat, loading }) => {
  if (loading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <div className="text-4xl mb-2">💬</div>
        <p className="text-sm">No conversations yet</p>
        <p className="text-xs mt-1">Start chatting with providers or customers</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {conversations.map(conv => {
        const isSelected = selectedChat?.user?._id === conv.user?._id;
        const lastMessage = conv.lastMessage;
        const unreadCount = conv.unreadCount || 0;
        
        return (
          <button
            key={conv.user?._id}
            onClick={() => onSelectChat(conv)}
            className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
              isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''
            }`}
          >
            <div className="relative flex-shrink-0">
              <Avatar src={conv.user?.avatar} name={conv.user?.name} size={48} />
              <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                conv.user?.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-baseline">
                <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                  {conv.user?.name}
                </h4>
                {lastMessage && (
                  <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                    {formatDistanceToNow(new Date(lastMessage.createdAt), { addSuffix: true })}
                  </span>
                )}
              </div>
              {lastMessage && (
                <p className="text-sm text-gray-500 truncate">{lastMessage.text}</p>
              )}
            </div>
            {unreadCount > 0 && (
              <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                {unreadCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ChatList;