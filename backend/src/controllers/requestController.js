import asyncHandler from 'express-async-handler';
import Request from '../models/Request.js';
import Service from '../models/Service.js';
import User from '../models/User.js';
import { sendStatusChangeEmail } from '../config/email.js';
import { REQUEST_STATUS, REQUEST_STATUS_FLOW } from '../constants/status.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Create a new request
// @route   POST /api/requests
export const createRequest = asyncHandler(async (req, res) => {
  const { serviceId, requirements, budget, deadline } = req.body;
  
  const service = await Service.findById(serviceId);
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  
  const request = await Request.create({
    customerId: req.user._id,
    providerId: service.providerId,
    serviceId,
    title: service.title,
    requirements,
    budget,
    deadline,
    activityLog: [{
      status: REQUEST_STATUS.PENDING,
      time: new Date().toLocaleString(),
      note: 'Request submitted by customer',
    }],
  });
  
  res.status(201).json(request);
});

// @desc    Get my requests (as customer or provider)
// @route   GET /api/requests/my-requests
export const getMyRequests = asyncHandler(async (req, res) => {
  const query = req.user.role === 'provider'
    ? { providerId: req.user._id }
    : { customerId: req.user._id };
  
  const requests = await Request.find(query)
    .populate('customerId', 'name avatar')
    .populate('providerId', 'name avatar')
    .populate('serviceId', 'title image icon')
    .sort({ createdAt: -1 });
  
  res.json(requests);
});

// @desc    Get request by ID
// @route   GET /api/requests/:id
export const getRequestById = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id)
    .populate('customerId', 'name email avatar phone')
    .populate('providerId', 'name email avatar phone title')
    .populate('serviceId', 'title image icon price delivery');
  
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  if (request.customerId._id.toString() !== req.user._id.toString() &&
      request.providerId._id.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  res.json(request);
});

// @desc    Get requests by provider ID (PUBLIC - no authentication required)
// @route   GET /api/requests/provider/:providerId
export const getRequestsByProvider = asyncHandler(async (req, res) => {
  const requests = await Request.find({ providerId: req.params.providerId })
    .populate('customerId', 'name email avatar')
    .populate('serviceId', 'title')
    .sort({ createdAt: -1 });
  
  res.json(requests);
});

// @desc    Update request status
// @route   PUT /api/requests/:id/status
export const updateRequestStatus = asyncHandler(async (req, res) => {
  const { status, cancellationReason } = req.body;
  const request = await Request.findById(req.params.id);
  
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  // Check authorization
  if (request.providerId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  // Prevent editing delivered or cancelled projects
  if (request.status === 'Delivered') {
    res.status(400);
    throw new Error('Cannot change status of delivered project');
  }
  
  if (request.status === 'Cancelled') {
    res.status(400);
    throw new Error('Cannot change status of cancelled project');
  }
  
  const oldStatus = request.status;
  request.status = status;
  
  // Handle cancellation
  if (status === 'Cancelled') {
    if (!cancellationReason) {
      res.status(400);
      throw new Error('Cancellation reason is required');
    }
    request.cancellationReason = cancellationReason;
    request.cancelledAt = new Date();
    request.cancelledBy = req.user._id;
    request.progress = 0;
  }
  
  const statusProgress = {
    [REQUEST_STATUS.ACCEPTED]: 15,
    [REQUEST_STATUS.IN_PROGRESS]: 50,
    [REQUEST_STATUS.COMPLETED]: 90,
    [REQUEST_STATUS.DELIVERED]: 100,
  };
  
  if (statusProgress[status]) {
    request.progress = statusProgress[status];
  }
  
  const statusNotes = {
    [REQUEST_STATUS.ACCEPTED]: 'Provider accepted the request',
    [REQUEST_STATUS.IN_PROGRESS]: 'Work has started',
    [REQUEST_STATUS.COMPLETED]: 'Work completed, pending delivery',
    [REQUEST_STATUS.DELIVERED]: 'Files/work delivered to client',
    'Cancelled': `Project cancelled. Reason: ${cancellationReason || 'No reason provided'}`
  };
  
  request.activityLog.push({
    status,
    time: new Date().toLocaleString(),
    note: statusNotes[status] || `Status changed to ${status}`,
  });
  
  await request.save();
  
  // Send email notifications
  const customer = await User.findById(request.customerId);
  const provider = await User.findById(request.providerId);
  
  if (customer) {
    await sendStatusChangeEmail(customer.email, customer.name, request.title, oldStatus, status);
  }
  if (provider && provider._id.toString() !== customer._id.toString()) {
    await sendStatusChangeEmail(provider.email, provider.name, request.title, oldStatus, status);
  }
  
  // Update provider earnings on delivery
  if (status === REQUEST_STATUS.DELIVERED && provider) {
    provider.completedProjects = (provider.completedProjects || 0) + 1;
    provider.totalEarnings = (provider.totalEarnings || 0) + request.budget;
    await provider.save();
  }
  
  res.json(request);
});

// @desc    Add attachment to request
// @route   POST /api/requests/:id/attachments
export const addAttachment = asyncHandler(async (req, res) => {
  const request = await Request.findById(req.params.id);
  
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  if (request.customerId.toString() !== req.user._id.toString() &&
      request.providerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  const attachments = [];
  if (req.files) {
    for (const file of req.files) {
      attachments.push({
        url: file.path,
        publicId: file.filename,
        name: file.originalname,
        uploadedAt: new Date(),
      });
    }
  }
  
  request.attachments.push(...attachments);
  await request.save();
  
  res.json(request);
});

// ============ ADMIN ROUTES ============

// @desc    Get all requests (admin only)
// @route   GET /api/requests/all
export const getAllRequests = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
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
});

// @desc    Get requests by provider (admin only)
// @route   GET /api/requests/admin/provider/:providerId
export const getRequestsByProviderAdmin = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const requests = await Request.find({ providerId: req.params.providerId })
    .populate('customerId', 'name email avatar')
    .populate('serviceId', 'title')
    .sort({ createdAt: -1 });
  
  res.json(requests);
});

// @desc    Get requests by customer (admin only)
// @route   GET /api/requests/admin/customer/:customerId
export const getRequestsByCustomer = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const requests = await Request.find({ customerId: req.params.customerId })
    .populate('providerId', 'name email avatar')
    .populate('serviceId', 'title')
    .sort({ createdAt: -1 });
  
  res.json(requests);
});

// @desc    Admin update request status (with cancellation reason)
// @route   PUT /api/requests/admin/:id/status
export const adminUpdateRequestStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const { status, cancellationReason } = req.body;
  const request = await Request.findById(req.params.id);
  
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  // Prevent editing delivered projects
  if (request.status === 'Delivered') {
    res.status(400);
    throw new Error('Cannot change status of delivered project');
  }
  
  if (request.status === 'Cancelled') {
    res.status(400);
    throw new Error('Cannot change status of cancelled project');
  }
  
  const oldStatus = request.status;
  request.status = status;
  
  // Handle cancellation
  if (status === 'Cancelled') {
    if (!cancellationReason) {
      res.status(400);
      throw new Error('Cancellation reason is required');
    }
    request.cancellationReason = cancellationReason;
    request.cancelledAt = new Date();
    request.cancelledBy = req.user._id;
    request.progress = 0;
  }
  
  const statusProgress = {
    'Accepted': 15,
    'In Progress': 50,
    'Completed': 90,
    'Delivered': 100,
  };
  
  if (statusProgress[status]) {
    request.progress = statusProgress[status];
  }
  
  request.activityLog.push({
    status,
    time: new Date().toLocaleString(),
    note: status === 'Cancelled' 
      ? `Admin cancelled project. Reason: ${cancellationReason}`
      : `Admin changed status from ${oldStatus} to ${status}`,
  });
  
  await request.save();
  
  // Send email notifications
  const customer = await User.findById(request.customerId);
  const provider = await User.findById(request.providerId);
  
  if (customer) {
    await sendStatusChangeEmail(customer.email, customer.name, request.title, oldStatus, status);
  }
  if (provider) {
    await sendStatusChangeEmail(provider.email, provider.name, request.title, oldStatus, status);
  }
  
  // Update provider earnings on delivery
  if (status === 'Delivered' && provider) {
    provider.completedProjects = (provider.completedProjects || 0) + 1;
    provider.totalEarnings = (provider.totalEarnings || 0) + request.budget;
    await provider.save();
  }
  
  res.json(request);
});

// @desc    Delete request (admin only)
// @route   DELETE /api/requests/admin/:id
export const deleteRequest = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const request = await Request.findById(req.params.id);
  
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  // Delete attachments from cloudinary if any
  if (request.attachments && request.attachments.length > 0) {
    for (const attachment of request.attachments) {
      if (attachment.publicId) {
        await cloudinary.uploader.destroy(attachment.publicId);
      }
    }
  }
  
  await request.deleteOne();
  res.json({ message: 'Request deleted successfully' });
});

// @desc    Get request statistics (admin only)
// @route   GET /api/requests/stats
export const getRequestStats = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const stats = {
    total: await Request.countDocuments(),
    pending: await Request.countDocuments({ status: 'Pending' }),
    accepted: await Request.countDocuments({ status: 'Accepted' }),
    inProgress: await Request.countDocuments({ status: 'In Progress' }),
    completed: await Request.countDocuments({ status: 'Completed' }),
    delivered: await Request.countDocuments({ status: 'Delivered' }),
    cancelled: await Request.countDocuments({ status: 'Cancelled' }),
  };
  
  // Total revenue from delivered projects
  const deliveredProjects = await Request.find({ status: 'Delivered' });
  stats.totalRevenue = deliveredProjects.reduce((sum, p) => sum + (p.budget || 0), 0);
  
  // Monthly stats
  const monthlyStats = await Request.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 },
        totalBudget: { $sum: '$budget' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  
  res.json({ stats, monthlyStats });
});