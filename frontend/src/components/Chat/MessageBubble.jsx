import React from 'react';
import { format } from 'date-fns';

const MessageBubble = ({ message, isSender, showAvatar, avatarUrl, senderName }) => {
  const isRead = message.read;
  const createdAt = new Date(message.createdAt);
  const timeStr = format(createdAt, 'h:mm a');
  const dateStr = format(createdAt, 'MMM d, yyyy');

  return (
    <div className={`flex ${isSender ? 'justify-end' : 'justify-start'} mb-4`}>
      {!isSender && showAvatar && (
        <div className="flex-shrink-0 mr-2">
          <img src={avatarUrl} alt={senderName} className="w-8 h-8 rounded-full object-cover" />
        </div>
      )}
      <div className={`max-w-[70%] ${isSender ? 'order-1' : 'order-2'}`}>
        {!isSender && !showAvatar && (
          <div className="text-xs text-gray-500 mb-1 ml-2">{senderName}</div>
        )}
        <div className={`relative px-4 py-2 rounded-2xl ${
          isSender
            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
        }`}>
          <p className="text-sm break-words whitespace-pre-wrap">{message.text}</p>
        </div>
        <div className={`flex items-center gap-1 mt-1 text-xs text-gray-400 ${isSender ? 'justify-end' : 'justify-start'}`}>
          <span>{timeStr}</span>
          {isSender && (
            <span className="ml-1">
              {isRead ? (
                <span className="text-indigo-500">✓✓</span>
              ) : (
                <span className="text-gray-400">✓</span>
              )}
            </span>
          )}
        </div>
      </div>
      {isSender && showAvatar && (
        <div className="flex-shrink-0 ml-2">
          <img src={avatarUrl} alt="You" className="w-8 h-8 rounded-full object-cover" />
        </div>
      )}
    </div>
  );
};

export default MessageBubble;