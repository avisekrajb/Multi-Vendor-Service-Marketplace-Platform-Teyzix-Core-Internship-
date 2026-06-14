import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Service from '../models/Service.js';
import Request from '../models/Request.js';
import Review from '../models/Review.js';
import AdminLog from '../models/AdminLog.js';
import Dispute from '../models/Dispute.js';
import { REQUEST_STATUS } from '../constants/status.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
export const getDashboardStats = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalServices,
    totalRequests,
    totalRevenue,
    pendingServices,
    pendingDisputes,
    recentUsers,
    recentRequests,
    statusCounts
  ] = await Promise.all([
    User.countDocuments(),
    Service.countDocuments(),
    Request.countDocuments(),
    Request.aggregate([{ $match: { status: REQUEST_STATUS.DELIVERED } }, { $group: { _id: null, total: { $sum: '$budget' } } }]),
    Service.countDocuments({ status: 'pending' }),
    Dispute.countDocuments({ status: 'open' }),
    User.find().sort({ createdAt: -1 }).limit(5).select('-password'),
    Request.find().populate('customerId', 'name').populate('providerId', 'name').sort({ createdAt: -1 }).limit(5),
    Request.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ])
  ]);
  
  const statusCountMap = {};
  statusCounts.forEach(s => { statusCountMap[s._id] = s.count; });
  
  res.json({
    stats: {
      totalUsers,
      totalServices,
      totalRequests,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingServices,
      pendingDisputes,
      statusCounts: statusCountMap
    },
    recentUsers,
    recentRequests
  });
});

// @desc    Get admin logs
// @route   GET /api/admin/logs
export const getAdminLogs = asyncHandler(async (req, res) => {
  const { limit = 100, targetType, adminId } = req.query;
  let query = {};
  if (targetType && targetType !== 'all') query.targetType = targetType;
  if (adminId && adminId !== 'all') query.adminId = adminId;
  
  const logs = await AdminLog.find(query)
    .populate('adminId', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit));
  res.json(logs);
});

// @desc    Ban/Unban user
// @route   PUT /api/admin/users/:userId/ban
export const banUser = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const user = await User.findById(userId);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  if (user.role === 'admin') {
    res.status(403);
    throw new Error('Cannot ban admin users');
  }
  
  user.banned = !user.banned;
  await user.save();
  
  await logAdminAction(req.user._id, user.banned ? 'ban_user' : 'unban_user', 'user', userId, { name: user.name }, req);
  
  res.json({ message: user.banned ? 'User banned' : 'User unbanned', banned: user.banned });
});

// @desc    Log admin action helper
export const logAdminAction = async (adminId, action, targetType, targetId, details, req) => {
  await AdminLog.create({
    adminId,
    action,
    targetType,
    targetId,
    details,
    ipAddress: req?.ip || req?.connection?.remoteAddress,
    userAgent: req?.headers?.['user-agent']
  });
};