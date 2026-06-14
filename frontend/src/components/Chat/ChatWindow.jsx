import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { getMessages, sendMessage, sendImageMessage, sendFileMessage, sendVoiceMessage } from '../../services/api';
import Avatar from '../Common/Avatar';
import LoadingSpinner from '../Common/LoadingSpinner';
import VoiceRecorder from './VoiceRecorder';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

const ChatWindow = ({ recipient, onClose }) => {
  const { user } = useAuth();
  const { socket, sendTyping } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    
    if (socket) {
      socket.on('new-message', handleNewMessage);
      socket.on('user-typing', handleTyping);
      
      return () => {
        socket.off('new-message');
        socket.off('user-typing');
      };
    }
  }, [recipient?._id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const response = await getMessages(recipient._id);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleNewMessage = (message) => {
    if (message.senderId._id === recipient._id || message.receiverId._id === recipient._id) {
      setMessages(prev => [...prev, message]);
    }
  };

  const handleTyping = ({ userId, isTyping: typing }) => {
    if (userId === recipient._id) {
      setRecipientTyping(typing);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await sendMessage({
        receiverId: recipient._id,
        text: newMessage,
        requestId: null
      });
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: recipient._id,
          text: newMessage,
          requestId: null
        });
      }
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);
    formData.append('receiverId', recipient._id);
    
    try {
      const response = await sendImageMessage(formData);
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: recipient._id,
          text: '📷 Sent an image',
          requestId: null
        });
      }
      
      setMessages(prev => [...prev, response.data]);
      toast.success('Image sent');
    } catch (error) {
      console.error('Error sending image:', error);
      toast.error('Failed to send image');
    } finally {
      setUploading(false);
      if (imageInputRef.current) imageInputRef.current.value = '';
    }
  };

  const handleSendFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File must be less than 10MB');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('receiverId', recipient._id);
    
    try {
      const response = await sendFileMessage(formData);
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: recipient._id,
          text: `📎 Sent a file: ${file.name}`,
          requestId: null
        });
      }
      
      setMessages(prev => [...prev, response.data]);
      toast.success('File sent');
    } catch (error) {
      console.error('Error sending file:', error);
      toast.error('Failed to send file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSendVoice = async (audioBlob, duration) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('voice', audioBlob);
    formData.append('receiverId', recipient._id);
    formData.append('duration', duration);
    
    try {
      const response = await sendVoiceMessage(formData);
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: recipient._id,
          text: '🎤 Sent a voice message',
          requestId: null
        });
      }
      
      setMessages(prev => [...prev, response.data]);
      toast.success('Voice message sent');
    } catch (error) {
      console.error('Error sending voice:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  const handleTypingStart = () => {
    if (!isTyping) {
      setIsTyping(true);
      sendTyping(recipient._id, true);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      sendTyping(recipient._id, false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderMessage = (msg) => {
    const isSender = msg.senderId._id === user?._id;
    
    switch (msg.messageType) {
      case 'image':
        return (
          <div className={`max-w-[80%] ${isSender ? 'order-1' : 'order-2'}`}>
            <img 
              src={msg.mediaUrl} 
              alt="Sent image"
              className="rounded-xl max-w-full max-h-64 cursor-pointer object-cover"
              onClick={() => window.open(msg.mediaUrl, '_blank')}
            />
            <div className={`text-xs text-gray-500 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
        );
        
      case 'voice':
        return (
          <div className={`max-w-[80%] ${isSender ? 'order-1' : 'order-2'}`}>
            <audio controls className="w-48 h-10">
              <source src={msg.mediaUrl} type="audio/webm" />
            </audio>
            <div className={`text-xs text-gray-500 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
              {msg.duration ? `${Math.floor(msg.duration / 60)}:${(msg.duration % 60).toString().padStart(2, '0')}` : 'Voice message'} • {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
        );
        
      case 'file':
        return (
          <div className={`max-w-[80%] ${isSender ? 'order-1' : 'order-2'}`}>
            <a 
              href={msg.mediaUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <span className="text-2xl">📎</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{msg.fileName}</div>
                <div className="text-xs text-gray-500">{formatFileSize(msg.fileSize)}</div>
              </div>
              <span>⬇️</span>
            </a>
            <div className={`text-xs text-gray-500 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
              {new Date(msg.createdAt).toLocaleTimeString()}
            </div>
          </div>
        );
        
      default:
        return (
          <div className={`max-w-[70%] ${isSender ? 'order-1' : 'order-2'}`}>
            <div className={`px-4 py-2 rounded-2xl ${
              isSender
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
            }`}>
              <p className="text-sm break-words whitespace-pre-wrap">{msg.text}</p>
            </div>
            <div className={`text-xs text-gray-500 mt-1 ${isSender ? 'text-right' : 'text-left'}`}>
              {new Date(msg.createdAt).toLocaleTimeString()}
              {isSender && msg.read && <span className="ml-1 text-indigo-500">✓✓</span>}
              {isSender && !msg.read && <span className="ml-1 text-gray-400">✓</span>}
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <Avatar src={recipient?.avatar} name={recipient?.name} size={40} />
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">{recipient?.name}</h3>
            <div className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${recipient?.isOnline ? 'bg-green-500' : 'bg-gray-400'}`}></span>
              <span className="text-xs text-gray-500">
                {recipient?.isOnline ? 'Online' : `Last seen ${formatDistanceToNow(new Date(recipient?.lastSeen), { addSuffix: true })}`}
              </span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-10">
            No messages yet. Start the conversation!
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.senderId._id === user?._id ? 'justify-end' : 'justify-start'}`}>
              {renderMessage(msg)}
            </div>
          ))
        )}
        {recipientTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
              </div>
            </div>
          </div>
        )}
        {uploading && (
          <div className="flex justify-center">
            <div className="bg-gray-100 dark:bg-gray-700 rounded-full px-4 py-2 text-sm">
              Uploading media...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          {/* Image Upload Button */}
          <input
            type="file"
            ref={imageInputRef}
            accept="image/*"
            onChange={handleSendImage}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
            title="Send image"
          >
            📷
          </button>

          {/* File Upload Button */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleSendFile}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50"
            title="Send file"
          >
            📎
          </button>

          {/* Voice Recorder */}
          <VoiceRecorder onRecordingComplete={handleSendVoice} disabled={uploading} />

          {/* Text Input */}
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyUp={handleTypingStart}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            disabled={sending || uploading}
          />

          {/* Send Button */}
          <button
            type="submit"
            disabled={!newMessage.trim() || sending || uploading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            {sending ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;