import asyncHandler from 'express-async-handler';
import Message from '../models/Message.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get messages between two users
// @route   GET /api/chat/messages/:userId
export const getMessages = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  const messages = await Message.find({
    $or: [
      { senderId: req.user._id, receiverId: userId },
      { senderId: userId, receiverId: req.user._id },
    ],
  }).sort({ createdAt: 1 });
  
  // Mark messages as delivered
  await Message.updateMany(
    { senderId: userId, receiverId: req.user._id, delivered: false },
    { delivered: true, deliveredAt: new Date() }
  );
  
  res.json(messages);
});

// @desc    Send text message
// @route   POST /api/chat/message
export const sendMessage = asyncHandler(async (req, res) => {
  const { receiverId, text, requestId } = req.body;
  
  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    text,
    requestId,
    messageType: 'text',
  });
  
  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar');
  
  res.status(201).json(populatedMessage);
});

// @desc    Send image message
// @route   POST /api/chat/send-image
export const sendImageMessage = asyncHandler(async (req, res) => {
  const { receiverId, requestId } = req.body;
  
  if (!req.file) {
    res.status(400);
    throw new Error('No image uploaded');
  }
  
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'chat_images',
    transformation: [{ width: 500, height: 500, crop: 'limit' }]
  });
  
  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    requestId,
    text: '📷 Sent an image',
    messageType: 'image',
    mediaUrl: result.secure_url,
    mediaPublicId: result.public_id,
    fileSize: req.file.size,
  });
  
  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar');
  
  res.status(201).json(populatedMessage);
});

// @desc    Send file message
// @route   POST /api/chat/send-file
export const sendFileMessage = asyncHandler(async (req, res) => {
  const { receiverId, requestId } = req.body;
  
  if (!req.file) {
    res.status(400);
    throw new Error('No file uploaded');
  }
  
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'chat_files',
    resource_type: 'auto',
  });
  
  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    requestId,
    text: `📎 Sent a file: ${req.file.originalname}`,
    messageType: 'file',
    mediaUrl: result.secure_url,
    mediaPublicId: result.public_id,
    fileName: req.file.originalname,
    fileSize: req.file.size,
  });
  
  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar');
  
  res.status(201).json(populatedMessage);
});

// @desc    Send voice message
// @route   POST /api/chat/send-voice
export const sendVoiceMessage = asyncHandler(async (req, res) => {
  const { receiverId, requestId, duration } = req.body;
  
  if (!req.file) {
    res.status(400);
    throw new Error('No voice recording uploaded');
  }
  
  const result = await cloudinary.uploader.upload(req.file.path, {
    folder: 'chat_voice',
    resource_type: 'auto',
  });
  
  const message = await Message.create({
    senderId: req.user._id,
    receiverId,
    requestId,
    text: '🎤 Sent a voice message',
    messageType: 'voice',
    mediaUrl: result.secure_url,
    mediaPublicId: result.public_id,
    duration: parseInt(duration) || 0,
    fileSize: req.file.size,
  });
  
  const populatedMessage = await Message.findById(message._id)
    .populate('senderId', 'name avatar')
    .populate('receiverId', 'name avatar');
  
  res.status(201).json(populatedMessage);
});

// @desc    Get conversations list
// @route   GET /api/chat/conversations
export const getConversations = asyncHandler(async (req, res) => {
  const messages = await Message.find({
    $or: [{ senderId: req.user._id }, { receiverId: req.user._id }],
  }).sort({ createdAt: -1 });
  
  const userIds = new Set();
  messages.forEach(msg => {
    if (msg.senderId.toString() !== req.user._id.toString()) {
      userIds.add(msg.senderId.toString());
    }
    if (msg.receiverId.toString() !== req.user._id.toString()) {
      userIds.add(msg.receiverId.toString());
    }
  });
  
  const users = await User.find({ _id: { $in: Array.from(userIds) } })
    .select('name avatar isOnline lastSeen');
  
  const conversations = users.map(user => {
    const userMessages = messages.filter(msg =>
      msg.senderId.toString() === user._id.toString() ||
      msg.receiverId.toString() === user._id.toString()
    );
    const lastMessage = userMessages[0];
    const unreadCount = messages.filter(msg =>
      msg.senderId.toString() === user._id.toString() &&
      msg.receiverId.toString() === req.user._id.toString() &&
      !msg.read
    ).length;
    
    return {
      user,
      lastMessage,
      unreadCount,
    };
  });
  
  res.json(conversations);
});

// @desc    Mark message as read
// @route   PUT /api/chat/message/:messageId/read
export const markAsRead = asyncHandler(async (req, res) => {
  const { messageId } = req.params;
  
  await Message.findByIdAndUpdate(messageId, {
    read: true,
    readAt: new Date(),
  });
  
  res.json({ message: 'Marked as read' });
});

// @desc    Mark all messages as read with a user
// @route   PUT /api/chat/mark-all-read/:userId
export const markAllAsRead = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  
  await Message.updateMany(
    { senderId: userId, receiverId: req.user._id, read: false },
    { read: true, readAt: new Date() }
  );
  
  res.json({ message: 'All messages marked as read' });
});

// @desc    Delete message
// @route   DELETE /api/chat/message/:messageId
export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await Message.findById(req.params.messageId);
  
  if (!message) {
    res.status(404);
    throw new Error('Message not found');
  }
  
  if (message.senderId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  // Delete media from cloudinary if exists
  if (message.mediaPublicId) {
    await cloudinary.uploader.destroy(message.mediaPublicId);
  }
  
  await message.deleteOne();
  res.json({ message: 'Message deleted' });
});