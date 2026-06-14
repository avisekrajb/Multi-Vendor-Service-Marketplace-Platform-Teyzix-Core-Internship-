import mongoose from 'mongoose';
import { SERVICE_STATUS } from '../constants/status.js';

const serviceSchema = new mongoose.Schema({
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  category: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  delivery: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: '💻',
  },
  image: {
    type: String,
    default: '',
  },
  imagePublicId: {
    type: String,
    default: '',
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  status: {
    type: String,
    enum: [SERVICE_STATUS.PENDING, SERVICE_STATUS.APPROVED, SERVICE_STATUS.REJECTED],
    default: SERVICE_STATUS.PENDING,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Service', serviceSchema);