import Message from '../models/Message.js';
import User from '../models/User.js';

export const setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);
    
    socket.on('user-online', async (userId) => {
      socket.userId = userId;
      await User.findByIdAndUpdate(userId, { isOnline: true, lastSeen: new Date() });
      socket.join(`user:${userId}`);
      io.emit('user-status-change', { userId, isOnline: true });
    });
    
    socket.on('join-chat', (data) => {
      const { userId, otherUserId } = data;
      const room = [userId, otherUserId].sort().join('-');
      socket.join(room);
      socket.room = room;
    });
    
    socket.on('send-message', async (data) => {
      const { receiverId, text, requestId } = data;
      
      const message = await Message.create({
        senderId: socket.userId,
        receiverId,
        text,
        requestId,
      });
      
      const populatedMessage = await Message.findById(message._id)
        .populate('senderId', 'name avatar')
        .populate('receiverId', 'name avatar');
      
      const room = [socket.userId, receiverId].sort().join('-');
      io.to(room).emit('new-message', populatedMessage);
      
      io.to(`user:${receiverId}`).emit('message-notification', {
        from: socket.userId,
        message: text,
      });
    });
    
    socket.on('typing', (data) => {
      const { receiverId, isTyping } = data;
      const room = [socket.userId, receiverId].sort().join('-');
      socket.to(room).emit('user-typing', {
        userId: socket.userId,
        isTyping,
      });
    });
    
    socket.on('disconnect', async () => {
      if (socket.userId) {
        await User.findByIdAndUpdate(socket.userId, { isOnline: false, lastSeen: new Date() });
        io.emit('user-status-change', { userId: socket.userId, isOnline: false });
      }
      console.log('User disconnected:', socket.id);
    });
  });
};