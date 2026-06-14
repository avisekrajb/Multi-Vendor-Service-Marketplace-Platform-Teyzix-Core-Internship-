import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  generatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  type: {
    type: String,
    enum: ['users', 'services', 'requests', 'reviews', 'revenue', 'disputes'],
    required: true,
  },
  format: {
    type: String,
    enum: ['csv', 'json', 'excel'],
    default: 'csv',
  },
  filters: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
  data: {
    type: mongoose.Schema.Types.Mixed,
    required: true,
  },
  generatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true,
});

export default mongoose.model('Report', reportSchema);