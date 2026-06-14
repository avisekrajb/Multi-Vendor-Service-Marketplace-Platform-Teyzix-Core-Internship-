import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
  },
  text: {
    type: String,
    default: '',
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'voice', 'file'],
    default: 'text',
  },
  mediaUrl: {
    type: String,
    default: '',
  },
  mediaPublicId: {
    type: String,
    default: '',
  },
  fileSize: {
    type: Number,
    default: 0,
  },
  fileName: {
    type: String,
    default: '',
  },
  duration: {
    type: Number, // For voice messages in seconds
    default: 0,
  },
  read: {
    type: Boolean,
    default: false,
  },
  readAt: Date,
  delivered: {
    type: Boolean,
    default: false,
  },
  deliveredAt: Date,
}, {
  timestamps: true,
});

export default mongoose.model('Message', messageSchema);