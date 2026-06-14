import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import io from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [newMessages, setNewMessages] = useState([]);
  const { user } = useAuth();
  const socketRef = useRef(null);

  useEffect(() => {
    if (!user) return;

    const newSocket = io(process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', {
      withCredentials: true,
    });
    socketRef.current = newSocket;
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Socket connected');
      newSocket.emit('user-online', user._id);
    });

    newSocket.on('user-status-change', ({ userId, isOnline }) => {
      setOnlineUsers(prev => {
        const filtered = prev.filter(id => id !== userId);
        if (isOnline) return [...filtered, userId];
        return filtered;
      });
    });

    newSocket.on('new-message', (message) => {
      setNewMessages(prev => [...prev, message]);
    });

    newSocket.on('message-notification', (notification) => {
      // Show notification
      if (Notification.permission === 'granted') {
        new Notification('New Message', { body: notification.message });
      }
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user]);

  const sendMessage = (data) => {
    if (socket) {
      socket.emit('send-message', data);
    }
  };

  const joinChat = (userId, otherUserId) => {
    if (socket) {
      socket.emit('join-chat', { userId, otherUserId });
    }
  };

  const sendTyping = (receiverId, isTyping) => {
    if (socket) {
      socket.emit('typing', { receiverId, isTyping });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, newMessages, sendMessage, joinChat, sendTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);