import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { getConversations, getMessages, sendMessage, sendImageMessage, sendFileMessage, sendVoiceMessage, markAllMessagesRead, getMyRequests } from '../../services/api';
import Avatar from '../../components/Common/Avatar';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import VoiceRecorder from '../../components/Chat/VoiceRecorder';
import Badge from '../../components/Common/Badge';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

// Helper function to safely format date
const safeFormatDistanceToNow = (date) => {
  if (!date) return 'Unknown';
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return 'Unknown';
    return formatDistanceToNow(dateObj, { addSuffix: true });
  } catch (error) {
    return 'Unknown';
  }
};

const ProviderMessages = () => {
  const { user } = useAuth();
  const { socket, sendTyping } = useSocket();
  const [conversations, setConversations] = useState([]);
  const [projects, setProjects] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [recipientTyping, setRecipientTyping] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const fileInputRef = React.useRef(null);
  const imageInputRef = React.useRef(null);
  const messagesEndRef = React.useRef(null);
  const typingTimeoutRef = React.useRef(null);

  useEffect(() => {
    fetchData();
    
    if (socket) {
      socket.on('new-message', handleNewMessage);
      socket.on('user-typing', handleTyping);
      socket.on('message-read', handleMessageRead);
      
      return () => {
        socket.off('new-message');
        socket.off('user-typing');
        socket.off('message-read');
      };
    }
  }, []);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat.user._id);
      markAsRead(selectedChat.user._id);
    }
  }, [selectedChat]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get provider's projects
      const projectsRes = await getMyRequests();
      const providerProjects = projectsRes.data || [];
      setProjects(providerProjects);
      
      // Get unique customers from projects (only those who hired the provider)
      const uniqueCustomers = new Map();
      providerProjects.forEach(project => {
        if (project.customerId && !uniqueCustomers.has(project.customerId._id)) {
          uniqueCustomers.set(project.customerId._id, {
            user: project.customerId,
            project: {
              id: project._id,
              title: project.title,
              status: project.status,
              budget: project.budget
            },
            lastMessage: null,
            unreadCount: 0,
            lastMessageTime: null
          });
        }
      });
      
      // Get existing conversations to add last message info
      try {
        const convRes = await getConversations();
        const existingConvs = convRes.data || [];
        existingConvs.forEach(conv => {
          if (uniqueCustomers.has(conv.user._id)) {
            uniqueCustomers.set(conv.user._id, {
              ...uniqueCustomers.get(conv.user._id),
              lastMessage: conv.lastMessage,
              unreadCount: conv.unreadCount || 0,
              lastMessageTime: conv.lastMessage?.createdAt
            });
          }
        });
      } catch (err) {
        console.log('No existing conversations');
      }
      
      // Sort conversations by last message time (most recent first)
      const conversationList = Array.from(uniqueCustomers.values());
      conversationList.sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
      
      setConversations(conversationList);
      
      if (conversationList.length > 0 && !selectedChat) {
        setSelectedChat(conversationList[0]);
        setSelectedProject(conversationList[0].project);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await getMessages(userId);
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markAsRead = async (userId) => {
    try {
      await markAllMessagesRead(userId);
      setConversations(prev => prev.map(conv => 
        conv.user._id === userId ? { ...conv, unreadCount: 0 } : conv
      ));
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleNewMessage = (message) => {
    // Update messages if in current chat
    if (selectedChat && message.senderId._id === selectedChat.user._id) {
      setMessages(prev => [...prev, message]);
      markAsRead(selectedChat.user._id);
    }
    // Update conversation list
    fetchData();
  };

  const handleTyping = ({ userId, isTyping: typing }) => {
    if (selectedChat && userId === selectedChat.user._id) {
      setRecipientTyping(typing);
    }
  };

  const handleMessageRead = ({ messageId, userId }) => {
    if (selectedChat && userId === selectedChat.user._id) {
      setMessages(prev => prev.map(msg => 
        msg._id === messageId ? { ...msg, read: true, readAt: new Date() } : msg
      ));
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await sendMessage({
        receiverId: selectedChat.user._id,
        text: newMessage,
        requestId: selectedProject?.id
      });
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: selectedChat.user._id,
          text: newMessage,
          requestId: selectedProject?.id
        });
      }
      
      setMessages(prev => [...prev, response.data]);
      setNewMessage('');
      fetchData();
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
    formData.append('receiverId', selectedChat.user._id);
    formData.append('requestId', selectedProject?.id);
    
    try {
      const response = await sendImageMessage(formData);
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: selectedChat.user._id,
          text: '📷 Sent an image',
          requestId: selectedProject?.id
        });
      }
      
      setMessages(prev => [...prev, response.data]);
      toast.success('Image sent');
      fetchData();
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
    formData.append('receiverId', selectedChat.user._id);
    formData.append('requestId', selectedProject?.id);
    
    try {
      const response = await sendFileMessage(formData);
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: selectedChat.user._id,
          text: `📎 Sent a file: ${file.name}`,
          requestId: selectedProject?.id
        });
      }
      
      setMessages(prev => [...prev, response.data]);
      toast.success('File sent');
      fetchData();
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
    formData.append('receiverId', selectedChat.user._id);
    formData.append('requestId', selectedProject?.id);
    formData.append('duration', duration);
    
    try {
      const response = await sendVoiceMessage(formData);
      
      if (socket) {
        socket.emit('send-message', {
          receiverId: selectedChat.user._id,
          text: '🎤 Sent a voice message',
          requestId: selectedProject?.id
        });
      }
      
      setMessages(prev => [...prev, response.data]);
      toast.success('Voice message sent');
      fetchData();
    } catch (error) {
      console.error('Error sending voice:', error);
      toast.error('Failed to send voice message');
    } finally {
      setUploading(false);
    }
  };

  const handleTypingStart = () => {
    if (!isTyping && selectedChat) {
      setIsTyping(true);
      sendTyping(selectedChat.user._id, true);
    }
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      if (selectedChat) sendTyping(selectedChat.user._id, false);
    }, 1000);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

  const getStatusColor = (status) => {
    const colors = {
      'Pending': '#f59e0b',
      'Accepted': '#3b82f6',
      'In Progress': '#8b5cf6',
      'Completed': '#10b981',
      'Delivered': '#06b6d4'
    };
    return colors[status] || '#6b7280';
  };

  const filteredConversations = conversations.filter(conv =>
    conv.user?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatMessageTime = (date) => {
    if (!date) return '';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
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
              {formatMessageTime(msg.createdAt)}
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
              {msg.duration ? `${Math.floor(msg.duration / 60)}:${(msg.duration % 60).toString().padStart(2, '0')}` : 'Voice message'} • {formatMessageTime(msg.createdAt)}
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
              {formatMessageTime(msg.createdAt)}
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
              {formatMessageTime(msg.createdAt)}
              {isSender && msg.read && <span className="ml-1 text-indigo-500">✓✓</span>}
              {isSender && !msg.read && <span className="ml-1 text-gray-400">✓</span>}
            </div>
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-120px)]">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Messages</h1>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 h-full flex overflow-hidden">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-gray-200 dark:border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="🔍 Search conversations..."
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-2">💬</div>
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Messages from customers will appear here after they hire you</p>
              </div>
            ) : (
              filteredConversations.map(conv => (
                <button
                  key={conv.user._id}
                  onClick={() => {
                    setSelectedChat(conv);
                    setSelectedProject(conv.project);
                    setShowProjectSelector(false);
                  }}
                  className={`w-full p-4 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left ${
                    selectedChat?.user._id === conv.user._id 
                      ? 'bg-indigo-50 dark:bg-indigo-900/20 border-l-4 border-indigo-500' 
                      : ''
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <Avatar src={conv.user.avatar} name={conv.user.name} size={48} />
                    <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                      conv.user.isOnline ? 'bg-green-500' : 'bg-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <h4 className="font-semibold text-gray-900 dark:text-white truncate">
                        {conv.user.name}
                      </h4>
                      {conv.lastMessage && conv.lastMessage.createdAt && (
                        <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                          {safeFormatDistanceToNow(conv.lastMessage.createdAt)}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      Project: {conv.project?.title}
                    </p>
                    {conv.lastMessage && (
                      <p className="text-sm text-gray-500 truncate mt-0.5">
                        {conv.lastMessage.senderId?._id === user?._id ? 'You: ' : ''}
                        {conv.lastMessage.messageType === 'image' ? '📷 Image' :
                         conv.lastMessage.messageType === 'voice' ? '🎤 Voice message' :
                         conv.lastMessage.messageType === 'file' ? '📎 File' :
                         conv.lastMessage.text}
                      </p>
                    )}
                  </div>
                  {conv.unreadCount > 0 && (
                    <span className="w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center flex-shrink-0">
                      {conv.unreadCount}
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        {selectedChat ? (
          <div className="flex-1 flex flex-col">
            {/* Chat Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar src={selectedChat.user.avatar} name={selectedChat.user.name} size={40} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{selectedChat.user.name}</h3>
                    <div className="flex items-center gap-1">
                      <span className={`w-2 h-2 rounded-full ${selectedChat.user.isOnline ? 'bg-green-500' : 'bg-gray-400'}`} />
                      <span className="text-xs text-gray-500">
                        {selectedChat.user.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setShowProjectSelector(!showProjectSelector)}
                  className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-200 transition-colors flex items-center gap-2"
                >
                  <span>📋</span>
                  <span className="max-w-[200px] truncate">{selectedProject?.title}</span>
                  <span>▼</span>
                </button>
              </div>
              
              {/* Project Selector Dropdown */}
              {showProjectSelector && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <p className="text-xs font-semibold text-gray-500 mb-2">Projects with {selectedChat.user.name}</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {projects.filter(p => p.customerId?._id === selectedChat.user._id).map(project => (
                      <button
                        key={project._id}
                        onClick={() => {
                          setSelectedProject(project);
                          setShowProjectSelector(false);
                        }}
                        className={`w-full p-2 rounded-lg text-left transition-colors ${
                          selectedProject?.id === project._id
                            ? 'bg-indigo-100 dark:bg-indigo-900/30 border border-indigo-300'
                            : 'hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        <div className="font-medium text-sm">{project.title}</div>
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-xs text-gray-500">{formatPrice(project.budget)}</span>
                          <Badge label={project.status} color={getStatusColor(project.status)} />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 mt-10">
                  No messages yet. Start the conversation about "{selectedProject?.title}"!
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

            {/* Project Info Bar */}
            {selectedProject && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 flex justify-between items-center">
                <span>💬 Chatting about: <strong>{selectedProject.title}</strong></span>
                <span className={`flex items-center gap-1`}>
                  <span className={`w-2 h-2 rounded-full`} style={{ backgroundColor: getStatusColor(selectedProject.status) }} />
                  Status: {selectedProject.status}
                </span>
              </div>
            )}

            {/* Input Area */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2">
                {/* Image Upload */}
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

                {/* File Upload */}
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
                  placeholder={`Message ${selectedChat.user.name} about "${selectedProject?.title}"...`}
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
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <div className="text-5xl mb-3">💬</div>
              <p>Select a conversation to start messaging</p>
              <p className="text-sm mt-2">You can only message customers who have hired you</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderMessages;