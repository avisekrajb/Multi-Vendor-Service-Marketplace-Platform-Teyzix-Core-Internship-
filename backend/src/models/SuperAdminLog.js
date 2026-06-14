import mongoose from 'mongoose';

const superAdminLogSchema = new mongoose.Schema({
  superAdminId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SuperAdmin',
    required: true,
  },
  action: {
    type: String,
    required: true,
  },
  targetType: {
    type: String,
    enum: ['admin', 'user', 'provider', 'service', 'project', 'review', 'dispute'],
  },
  targetId: {
    type: mongoose.Schema.Types.ObjectId,
  },
  targetEmail: {
    type: String,
  },
  targetName: {
    type: String,
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
  },
  ipAddress: String,
  userAgent: String,
  status: {
    type: String,
    enum: ['success', 'failed'],
    default: 'success',
  },
}, {
  timestamps: true,
});

export default mongoose.model('SuperAdminLog', superAdminLogSchema);