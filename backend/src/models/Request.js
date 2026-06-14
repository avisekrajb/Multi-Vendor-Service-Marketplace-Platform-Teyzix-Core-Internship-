import mongoose from 'mongoose';
import { REQUEST_STATUS } from '../constants/status.js';

const activityLogSchema = new mongoose.Schema({
  status: String,
  time: String,
  note: String,
}, { _id: false });

const requestSchema = new mongoose.Schema({
  customerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  status: {
    type: String,
    enum: [...Object.values(REQUEST_STATUS), 'Cancelled'],
    default: REQUEST_STATUS.PENDING,
  },
  budget: {
    type: Number,
    required: true,
  },
  deadline: {
    type: String,
    required: true,
  },
  requirements: {
    type: String,
    required: true,
  },
  created: {
    type: String,
    default: () => new Date().toISOString().split('T')[0],
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100,
  },
  activityLog: [activityLogSchema],
  attachments: [{
    url: String,
    publicId: String,
    name: String,
    uploadedAt: Date,
  }],
  cancellationReason: {
    type: String,
    default: null,
  },
  cancelledAt: {
    type: Date,
    default: null,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Request', requestSchema);