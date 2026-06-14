import mongoose from 'mongoose';

const disputeSchema = new mongoose.Schema({
  requestId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Request',
    required: true,
  },
  raisedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  reason: {
    type: String,
    required: true,
    enum: ['Work not delivered on time', 'Poor quality work', 'Provider unresponsive', 'Requirements not met', 'Payment dispute', 'Other']
  },
  description: {
    type: String,
    required: true,
  },
  attachments: [{
    url: String,
    publicId: String,
    name: String,
    fileType: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['open', 'under_review', 'resolved', 'closed'],
    default: 'open'
  },
  adminResponse: {
    message: String,
    resolvedAt: Date,
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  resolution: {
    type: String,
    enum: ['customer_won', 'provider_won', 'partial_refund', 'completed', null],
    default: null
  },
  resolutionAmount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.model('Dispute', disputeSchema);