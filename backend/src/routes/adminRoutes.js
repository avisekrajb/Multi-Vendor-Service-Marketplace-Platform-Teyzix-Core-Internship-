import express from 'express';
import asyncHandler from 'express-async-handler';
import { 
  getDashboardStats, 
  getAdminLogs, 
  banUser,
  logAdminAction
} from '../controllers/adminController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import Request from '../models/Request.js';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Dispute from '../models/Dispute.js';
import Review from '../models/Review.js';
import AdminLog from '../models/AdminLog.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, adminOnly);

// ============ DASHBOARD ============
router.get('/dashboard', getDashboardStats);

// ============ USER MANAGEMENT ============
router.get('/users', asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password -refreshToken');
  res.json(users);
}));

router.get('/users/:userId', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId).select('-password -refreshToken');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
}));

router.put('/users/:userId/ban', banUser);

router.put('/users/:userId/role', asyncHandler(async (req, res) => {
  const { role } = req.body;
  const user = await User.findById(req.params.userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  const oldRole = user.role;
  user.role = role;
  await user.save();
  await logAdminAction(req.user._id, 'update_user_role', 'user', user._id, { oldRole, newRole: role }, req);
  res.json({ message: 'User role updated', user });
}));

router.delete('/users/:userId', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.userId);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot delete admin users');
  }
  
  // Delete user's avatar from Cloudinary if exists
  if (user.avatarPublicId) {
    try {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    } catch (err) {
      console.error('Error deleting avatar:', err);
    }
  }
  
  await user.deleteOne();
  await logAdminAction(req.user._id, 'delete_user', 'user', req.params.userId, { name: user.name }, req);
  res.json({ message: 'User deleted' });
}));

// ============ PROVIDER MANAGEMENT ============

// Get all providers
router.get('/providers', asyncHandler(async (req, res) => {
  const providers = await User.find({ role: 'provider' }).select('-password -refreshToken');
  res.json(providers);
}));

// Get provider details with services, projects, reviews
router.get('/providers/:id/details', asyncHandler(async (req, res) => {
  const provider = await User.findById(req.params.id).select('-password -refreshToken');
  if (!provider || provider.role !== 'provider') {
    res.status(404);
    throw new Error('Provider not found');
  }
  
  const services = await Service.find({ providerId: provider._id });
  const projects = await Request.find({ providerId: provider._id });
  const reviews = await Review.find({ providerId: provider._id });
  
  res.json({
    provider,
    services,
    projects,
    reviews
  });
}));

// Update provider (admin only)
router.put('/providers/:id', asyncHandler(async (req, res) => {
  const { name, email, phone, title, bio, skills } = req.body;
  const provider = await User.findById(req.params.id);
  
  if (!provider || provider.role !== 'provider') {
    res.status(404);
    throw new Error('Provider not found');
  }
  
  if (name) provider.name = name;
  if (email) provider.email = email;
  if (phone) provider.phone = phone;
  if (title) provider.title = title;
  if (bio) provider.bio = bio;
  if (skills) provider.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
  
  await provider.save();
  
  const providerResponse = provider.toObject();
  delete providerResponse.password;
  delete providerResponse.refreshToken;
  
  res.json(providerResponse);
}));

// ============ SERVICE MANAGEMENT ============
router.get('/services', asyncHandler(async (req, res) => {
  const services = await Service.find({})
    .populate('providerId', 'name email')
    .sort({ createdAt: -1 });
  res.json(services);
}));

router.get('/services/pending', asyncHandler(async (req, res) => {
  const services = await Service.find({ status: 'pending' })
    .populate('providerId', 'name email')
    .sort({ createdAt: -1 });
  res.json(services);
}));

router.get('/services/:serviceId', asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.serviceId)
    .populate('providerId', 'name email phone');
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  res.json(service);
}));

// ============ PROJECT/REQUEST MANAGEMENT ============
router.get('/requests', asyncHandler(async (req, res) => {
  const { status, providerId, customerId, startDate, endDate } = req.query;
  let query = {};
  
  if (status && status !== 'all') query.status = status;
  if (providerId) query.providerId = providerId;
  if (customerId) query.customerId = customerId;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  const requests = await Request.find(query)
    .populate('customerId', 'name email avatar')
    .populate('providerId', 'name email avatar')
    .populate('serviceId', 'title')
    .sort({ createdAt: -1 });
  res.json(requests);
}));

router.get('/requests/:requestId', asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.requestId)
    .populate('customerId', 'name email phone avatar')
    .populate('providerId', 'name email phone avatar')
    .populate('serviceId', 'title image price');
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  res.json(request);
}));

router.put('/requests/:requestId/status', asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body;
  const request = await Request.findById(req.params.requestId);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  const oldStatus = request.status;
  request.status = status;
  
  // Handle cancellation
  if (status === 'Cancelled' && cancellationReason) {
    request.cancellationReason = cancellationReason;
    request.cancelledAt = new Date();
    request.cancelledBy = req.user._id;
    request.progress = 0;
  }
  
  const statusProgress = {
    'Accepted': 15,
    'In Progress': 50,
    'Completed': 90,
    'Delivered': 100
  };
  if (statusProgress[status]) {
    request.progress = statusProgress[status];
  }
  
  request.activityLog.push({
    status,
    time: new Date().toLocaleString(),
    note: status === 'Cancelled' 
      ? `Admin cancelled project. Reason: ${cancellationReason || 'No reason provided'}`
      : `Admin changed status from ${oldStatus} to ${status}`
  });
  
  await request.save();
  await logAdminAction(req.user._id, 'update_request_status', 'request', request._id, { oldStatus, newStatus: status }, req);
  res.json({ message: 'Status updated', request });
}));

// ============ REVIEW MANAGEMENT ============
router.get('/reviews', asyncHandler(async (req, res) => {
  const reviews = await Review.find({})
    .populate('customerId', 'name email')
    .populate('providerId', 'name email')
    .populate('serviceId', 'title')
    .sort({ createdAt: -1 });
  res.json(reviews);
}));

router.delete('/reviews/:reviewId', asyncHandler(async (req, res) => {
  const review = await Review.findById(req.params.reviewId);
  if (!review) {
    res.status(404);
    throw new Error('Review not found');
  }
  await review.deleteOne();
  await logAdminAction(req.user._id, 'delete_review', 'review', review._id, { author: review.author }, req);
  res.json({ message: 'Review deleted' });
}));

// ============ DISPUTE MANAGEMENT ============
router.get('/disputes', asyncHandler(async (req, res) => {
  const { status } = req.query;
  let query = {};
  if (status && status !== 'all') query.status = status;
  
  const disputes = await Dispute.find(query)
    .populate('requestId', 'title budget status')
    .populate('raisedBy', 'name email')
    .sort({ createdAt: -1 });
  res.json(disputes);
}));

router.get('/disputes/:disputeId', asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.disputeId)
    .populate('requestId', 'title budget status requirements customerId providerId')
    .populate('raisedBy', 'name email')
    .populate('adminResponse.resolvedBy', 'name');
  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found');
  }
  res.json(dispute);
}));

router.put('/disputes/:disputeId/resolve', asyncHandler(async (req, res) => {
  const { status, resolution, adminMessage } = req.body;
  const dispute = await Dispute.findById(req.params.disputeId);
  
  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found');
  }
  
  dispute.status = status || 'resolved';
  dispute.adminResponse = {
    message: adminMessage,
    resolvedAt: new Date(),
    resolvedBy: req.user._id
  };
  if (resolution) dispute.resolution = resolution;
  
  await dispute.save();
  await logAdminAction(req.user._id, 'resolve_dispute', 'dispute', dispute._id, { resolution, status }, req);
  res.json({ message: 'Dispute resolved', dispute });
}));

// ============ LOGS ============
router.get('/logs', getAdminLogs);

router.get('/logs/user/:userId', asyncHandler(async (req, res) => {
  const logs = await AdminLog.find({ adminId: req.params.userId })
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(logs);
}));

// ============ STATISTICS ============
router.get('/stats/users', asyncHandler(async (req, res) => {
  const totalUsers = await User.countDocuments();
  const customers = await User.countDocuments({ role: 'customer' });
  const providers = await User.countDocuments({ role: 'provider' });
  const admins = await User.countDocuments({ role: 'admin' });
  const bannedUsers = await User.countDocuments({ banned: true });
  
  res.json({
    totalUsers,
    customers,
    providers,
    admins,
    bannedUsers
  });
}));

router.get('/stats/services', asyncHandler(async (req, res) => {
  const totalServices = await Service.countDocuments();
  const approved = await Service.countDocuments({ status: 'approved' });
  const pending = await Service.countDocuments({ status: 'pending' });
  const rejected = await Service.countDocuments({ status: 'rejected' });
  
  res.json({
    totalServices,
    approved,
    pending,
    rejected
  });
}));

router.get('/stats/revenue', asyncHandler(async (req, res) => {
  const deliveredRequests = await Request.find({ status: 'Delivered' });
  const totalRevenue = deliveredRequests.reduce((sum, r) => sum + (r.budget || 0), 0);
  const platformCommission = totalRevenue * 0.1;
  
  res.json({
    totalRevenue,
    platformCommission,
    projectCount: deliveredRequests.length
  });
}));

// ============ BULK ACTIONS ============
router.post('/bulk/ban-users', asyncHandler(async (req, res) => {
  const { userIds } = req.body;
  const result = await User.updateMany(
    { _id: { $in: userIds }, role: { $ne: 'admin' } },
    { banned: true }
  );
  await logAdminAction(req.user._id, 'bulk_ban_users', 'user', null, { count: result.modifiedCount }, req);
  res.json({ message: `${result.modifiedCount} users banned` });
}));

router.post('/bulk/delete-services', asyncHandler(async (req, res) => {
  const { serviceIds } = req.body;
  const result = await Service.deleteMany({ _id: { $in: serviceIds } });
  await logAdminAction(req.user._id, 'bulk_delete_services', 'service', null, { count: result.deletedCount }, req);
  res.json({ message: `${result.deletedCount} services deleted` });
}));

// ============ CLOUDINARY PHOTO MANAGEMENT ============

// Get all Cloudinary photos
router.get('/cloudinary/photos', asyncHandler(async (req, res) => {
  try {
    const result = await cloudinary.api.resources({
      type: 'upload',
      max_results: 100,
      resource_type: 'image'
    });
    
    res.json({
      success: true,
      resources: result.resources,
      total: result.total_count
    });
  } catch (error) {
    console.error('Cloudinary API Error:', error);
    res.status(500).json({ message: 'Failed to fetch Cloudinary photos' });
  }
}));

// Delete photo from Cloudinary
router.delete('/cloudinary/photo/:publicId', asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      await logAdminAction(req.user._id, 'delete_cloudinary_photo', 'photo', null, { publicId }, req);
      res.json({ success: true, message: 'Photo deleted successfully' });
    } else {
      res.status(404).json({ message: 'Photo not found' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete photo' });
  }
}));

// Get photos by folder
router.get('/cloudinary/folder/:folderName', asyncHandler(async (req, res) => {
  try {
    const { folderName } = req.params;
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: folderName,
      max_results: 100,
      resource_type: 'image'
    });
    
    res.json({
      success: true,
      resources: result.resources,
      folder: folderName
    });
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ message: 'Failed to fetch folder photos' });
  }
}));

// Get Cloudinary folders
router.get('/cloudinary/folders', asyncHandler(async (req, res) => {
  try {
    const result = await cloudinary.api.root_folders();
    res.json({
      success: true,
      folders: result.folders
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
}));

// ============ SEARCH ============
router.get('/search', asyncHandler(async (req, res) => {
  const { q, type } = req.query;
  
  if (!q || q.length < 2) {
    return res.json({ users: [], services: [], projects: [] });
  }
  
  const searchRegex = new RegExp(q, 'i');
  
  let users = [];
  let services = [];
  let projects = [];
  
  if (!type || type === 'users') {
    users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex }
      ]
    }).select('-password -refreshToken').limit(10);
  }
  
  if (!type || type === 'services') {
    services = await Service.find({
      title: searchRegex
    }).populate('providerId', 'name').limit(10);
  }
  
  if (!type || type === 'projects') {
    projects = await Request.find({
      title: searchRegex
    }).populate('customerId providerId', 'name').limit(10);
  }
  
  res.json({ users, services, projects });
}));

export default router;