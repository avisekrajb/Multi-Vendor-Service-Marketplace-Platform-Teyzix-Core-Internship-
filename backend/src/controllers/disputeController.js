import asyncHandler from 'express-async-handler';
import Dispute from '../models/Dispute.js';
import Request from '../models/Request.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { sendEmail } from '../config/email.js';

// @desc    Create a new dispute
// @route   POST /api/disputes
export const createDispute = asyncHandler(async (req, res) => {
  const { requestId, reason, description } = req.body;
  
  // Check if request exists
  const request = await Request.findById(requestId);
  if (!request) {
    res.status(404);
    throw new Error('Request not found');
  }
  
  // Check if user is authorized (customer or provider of the request)
  if (request.customerId.toString() !== req.user._id.toString() &&
      request.providerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorized to raise dispute for this project');
  }
  
  // Check if dispute already exists for this request
  const existingDispute = await Dispute.findOne({ 
    requestId, 
    status: { $in: ['open', 'under_review'] } 
  });
  if (existingDispute) {
    res.status(400);
    throw new Error('An active dispute already exists for this project');
  }
  
  // Upload attachments to cloudinary
  const attachments = [];
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'disputes'
      });
      attachments.push({
        url: result.secure_url,
        publicId: result.public_id,
        name: file.originalname,
        fileType: file.mimetype
      });
    }
  }
  
  const dispute = await Dispute.create({
    requestId,
    raisedBy: req.user._id,
    reason,
    description,
    attachments,
    status: 'open'
  });
  
  // Populate request details for response
  const populatedDispute = await Dispute.findById(dispute._id)
    .populate('requestId', 'title budget status')
    .populate('raisedBy', 'name email');
  
  // Send email notification to admin
  await sendDisputeCreatedEmail(populatedDispute);
  
  res.status(201).json(populatedDispute);
});

// @desc    Get all disputes (admin only)
// @route   GET /api/disputes
export const getDisputes = asyncHandler(async (req, res) => {
  const { status, search } = req.query;
  let query = {};
  
  if (status && status !== 'all') {
    query.status = status;
  }
  
  let disputes = await Dispute.find(query)
    .populate('requestId', 'title budget status deadline customerId providerId')
    .populate('raisedBy', 'name email avatar')
    .populate('adminResponse.resolvedBy', 'name email')
    .sort({ createdAt: -1 });
  
  // Filter by search term
  if (search) {
    disputes = disputes.filter(d => 
      d.reason?.toLowerCase().includes(search.toLowerCase()) ||
      d.description?.toLowerCase().includes(search.toLowerCase()) ||
      d.requestId?.title?.toLowerCase().includes(search.toLowerCase())
    );
  }
  
  res.json(disputes);
});

// @desc    Get my disputes (for current user)
// @route   GET /api/disputes/my-disputes
export const getMyDisputes = asyncHandler(async (req, res) => {
  const disputes = await Dispute.find({ raisedBy: req.user._id })
    .populate('requestId', 'title budget status')
    .sort({ createdAt: -1 });
  res.json(disputes);
});

// @desc    Get dispute by ID
// @route   GET /api/disputes/:id
export const getDisputeById = asyncHandler(async (req, res) => {
  const dispute = await Dispute.findById(req.params.id)
    .populate('requestId', 'title budget status requirements deadline customerId providerId')
    .populate('raisedBy', 'name email avatar phone')
    .populate('adminResponse.resolvedBy', 'name email');
  
  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found');
  }
  
  // Check authorization
  if (dispute.raisedBy._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Not authorized');
  }
  
  res.json(dispute);
});

// @desc    Update dispute status (admin only)
// @route   PUT /api/disputes/:id/status
export const updateDisputeStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const { status, resolution, adminMessage, resolutionAmount } = req.body;
  const dispute = await Dispute.findById(req.params.id)
    .populate('requestId', 'title budget customerId providerId');
  
  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found');
  }
  
  const oldStatus = dispute.status;
  dispute.status = status || 'resolved';
  dispute.resolution = resolution;
  if (resolutionAmount) dispute.resolutionAmount = resolutionAmount;
  
  dispute.adminResponse = {
    message: adminMessage,
    resolvedAt: new Date(),
    resolvedBy: req.user._id
  };
  
  await dispute.save();
  
  // Update request status based on resolution
  const request = await Request.findById(dispute.requestId._id);
  const customer = await User.findById(request.customerId);
  const provider = await User.findById(request.providerId);
  
  if (resolution === 'customer_won') {
    request.status = 'Cancelled';
    request.cancellationReason = `Dispute resolved: Customer won. ${adminMessage}`;
    await request.save();
    
    // Send email to customer about winning
    await sendDisputeResolutionEmail(customer.email, customer.name, 'won', resolution, adminMessage, dispute.requestId.title);
    // Send email to provider about losing
    await sendDisputeResolutionEmail(provider.email, provider.name, 'lost', resolution, adminMessage, dispute.requestId.title);
    
  } else if (resolution === 'provider_won') {
    request.status = 'Delivered';
    await request.save();
    
    // Update provider earnings
    provider.completedProjects = (provider.completedProjects || 0) + 1;
    provider.totalEarnings = (provider.totalEarnings || 0) + request.budget;
    await provider.save();
    
    // Send email to provider about winning
    await sendDisputeResolutionEmail(provider.email, provider.name, 'won', resolution, adminMessage, dispute.requestId.title);
    // Send email to customer about losing
    await sendDisputeResolutionEmail(customer.email, customer.name, 'lost', resolution, adminMessage, dispute.requestId.title);
    
  } else if (resolution === 'partial_refund') {
    request.status = 'Completed';
    await request.save();
    
    // Send email to both parties about partial refund
    await sendDisputeResolutionEmail(customer.email, customer.name, 'partial', resolution, adminMessage, dispute.requestId.title, resolutionAmount);
    await sendDisputeResolutionEmail(provider.email, provider.name, 'partial', resolution, adminMessage, dispute.requestId.title, resolutionAmount);
    
  } else if (resolution === 'completed') {
    request.status = 'Delivered';
    await request.save();
    
    provider.completedProjects = (provider.completedProjects || 0) + 1;
    provider.totalEarnings = (provider.totalEarnings || 0) + request.budget;
    await provider.save();
    
    await sendDisputeResolutionEmail(customer.email, customer.name, 'completed', resolution, adminMessage, dispute.requestId.title);
    await sendDisputeResolutionEmail(provider.email, provider.name, 'completed', resolution, adminMessage, dispute.requestId.title);
  }
  
  res.json({ message: 'Dispute resolved successfully', dispute });
});

// @desc    Delete dispute (admin only)
// @route   DELETE /api/disputes/:id
export const deleteDispute = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const dispute = await Dispute.findById(req.params.id);
  
  if (!dispute) {
    res.status(404);
    throw new Error('Dispute not found');
  }
  
  // Delete attachments from cloudinary
  if (dispute.attachments && dispute.attachments.length > 0) {
    for (const attachment of dispute.attachments) {
      if (attachment.publicId) {
        await cloudinary.uploader.destroy(attachment.publicId);
      }
    }
  }
  
  await dispute.deleteOne();
  res.json({ message: 'Dispute deleted successfully' });
});

// @desc    Get dispute statistics (admin only)
// @route   GET /api/disputes/stats
export const getDisputeStats = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  
  const stats = {
    total: await Dispute.countDocuments(),
    open: await Dispute.countDocuments({ status: 'open' }),
    underReview: await Dispute.countDocuments({ status: 'under_review' }),
    resolved: await Dispute.countDocuments({ status: 'resolved' }),
    closed: await Dispute.countDocuments({ status: 'closed' }),
    byResolution: {
      customerWon: await Dispute.countDocuments({ resolution: 'customer_won' }),
      providerWon: await Dispute.countDocuments({ resolution: 'provider_won' }),
      partialRefund: await Dispute.countDocuments({ resolution: 'partial_refund' }),
      completed: await Dispute.countDocuments({ resolution: 'completed' })
    }
  };
  
  res.json(stats);
});

// ============ EMAIL FUNCTIONS ============

const sendDisputeCreatedEmail = async (dispute) => {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@teyzix.com';
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #ef4444, #dc2626); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">⚠️ New Dispute Raised</h1>
      </div>
      <div style="background: #f9fafb; padding: 25px; border-radius: 0 0 10px 10px;">
        <p><strong>Project:</strong> ${dispute.requestId?.title}</p>
        <p><strong>Raised By:</strong> ${dispute.raisedBy?.name} (${dispute.raisedBy?.email})</p>
        <p><strong>Reason:</strong> ${dispute.reason}</p>
        <p><strong>Description:</strong> ${dispute.description}</p>
        <p><strong>Budget:</strong> रू ${dispute.requestId?.budget?.toLocaleString()}</p>
        <a href="${process.env.FRONTEND_URL}/admin/disputes" style="display: inline-block; background: #ef4444; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">Review Dispute</a>
      </div>
    </div>
  `;
  await sendEmail(adminEmail, 'New Dispute Raised - Action Required', html);
};

const sendDisputeResolutionEmail = async (email, name, outcome, resolution, message, projectTitle, amount = null) => {
  let title = '';
  let content = '';
  
  if (outcome === 'won') {
    title = '✅ Dispute Resolved in Your Favor';
    content = `<p>The dispute for project <strong>"${projectTitle}"</strong> has been resolved in your favor.</p>
               <p><strong>Resolution:</strong> ${resolution.replace('_', ' ')}</p>`;
  } else if (outcome === 'lost') {
    title = '❌ Dispute Resolution Update';
    content = `<p>The dispute for project <strong>"${projectTitle}"</strong> has been resolved.</p>
               <p><strong>Resolution:</strong> ${resolution.replace('_', ' ')}</p>`;
  } else if (outcome === 'partial') {
    title = '🔄 Partial Refund Issued';
    content = `<p>The dispute for project <strong>"${projectTitle}"</strong> has been resolved with a partial refund.</p>
               <p><strong>Resolution:</strong> ${resolution.replace('_', ' ')}</p>
               <p><strong>Refund Amount:</strong> रू ${amount?.toLocaleString()}</p>`;
  } else {
    title = '📋 Dispute Resolution Completed';
    content = `<p>The dispute for project <strong>"${projectTitle}"</strong> has been resolved.</p>
               <p><strong>Resolution:</strong> ${resolution.replace('_', ' ')}</p>`;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: linear-gradient(135deg, #6366f1, #8b5cf6); padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
        <h1 style="color: white; margin: 0;">${title}</h1>
      </div>
      <div style="background: #f9fafb; padding: 25px; border-radius: 0 0 10px 10px;">
        <p>Dear ${name},</p>
        ${content}
        <p><strong>Admin Message:</strong> ${message}</p>
        <a href="${process.env.FRONTEND_URL}/dashboard" style="display: inline-block; background: #6366f1; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 15px;">View Dashboard</a>
        <p style="margin-top: 20px; font-size: 12px; color: #6b7280;">If you have any questions, please contact our support team.</p>
      </div>
    </div>
  `;
  await sendEmail(email, title, html);
};