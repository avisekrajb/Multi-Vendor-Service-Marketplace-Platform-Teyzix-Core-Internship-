import asyncHandler from 'express-async-handler';
import bcrypt from 'bcryptjs';
import SuperAdmin from '../models/SuperAdmin.js';
import SuperAdminLog from '../models/SuperAdminLog.js';
import User from '../models/User.js';
import AdminLog from '../models/AdminLog.js';
import Service from '../models/Service.js';
import Request from '../models/Request.js';
import Review from '../models/Review.js';
import Dispute from '../models/Dispute.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';

// ============ AUTHENTICATION ============

// @desc    Super Admin Login
// @route   POST /api/super/login
export const superLogin = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  console.log('=== SUPER ADMIN LOGIN ATTEMPT ===');
  console.log('Email:', email);
  console.log('Password received:', password);
  
  // Find super admin by email
  const superAdmin = await SuperAdmin.findOne({ email });
  
  if (!superAdmin) {
    console.log('Super admin not found in database');
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  console.log('Super admin found:', superAdmin.email);
  console.log('Stored password hash:', superAdmin.password);
  
  // Compare password using bcrypt
  const isMatch = await bcrypt.compare(password, superAdmin.password);
  console.log('Password match result:', isMatch);
  
  if (!isMatch) {
    console.log('Password does not match');
    res.status(401);
    throw new Error('Invalid credentials');
  }
  
  if (!superAdmin.isActive) {
    console.log('Account is disabled');
    res.status(403);
    throw new Error('Account is disabled');
  }
  
  // Update last login
  superAdmin.lastLogin = new Date();
  await superAdmin.save();
  
  // Generate tokens
  const accessToken = generateAccessToken(superAdmin._id);
  const refreshToken = generateRefreshToken(superAdmin._id);
  
  // Log the login
  await SuperAdminLog.create({
    superAdminId: superAdmin._id,
    action: 'login',
    details: { email: superAdmin.email },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
    status: 'success',
  });
  
  console.log('Super Admin login successful!');
  console.log('==============================');
  
  res.json({
    user: {
      _id: superAdmin._id,
      name: superAdmin.name,
      email: superAdmin.email,
      role: 'superadmin',
    },
    accessToken,
    refreshToken,
  });
});

// ============ DASHBOARD ============

// @desc    Get Dashboard Overview
// @route   GET /api/super/dashboard
export const getDashboardOverview = asyncHandler(async (req, res) => {
  const [
    totalUsers,
    totalProviders,
    totalAdmins,
    totalServices,
    totalProjects,
    totalReviews,
    totalDisputes,
    totalRevenue,
    pendingServices,
    pendingDisputes,
    activeProjects,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'provider' }),
    User.countDocuments({ role: 'admin' }),
    Service.countDocuments(),
    Request.countDocuments(),
    Review.countDocuments(),
    Dispute.countDocuments(),
    Request.aggregate([{ $match: { status: 'Delivered' } }, { $group: { _id: null, total: { $sum: '$budget' } } }]),
    Service.countDocuments({ status: 'pending' }),
    Dispute.countDocuments({ status: 'open' }),
    Request.countDocuments({ status: { $in: ['In Progress', 'Accepted'] } }),
  ]);
  
  const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5).select('name email role createdAt');
  const recentServices = await Service.find().populate('providerId', 'name').sort({ createdAt: -1 }).limit(5);
  const recentProjects = await Request.find().populate('customerId providerId', 'name').sort({ createdAt: -1 }).limit(5);
  
  res.json({
    stats: {
      totalUsers,
      totalProviders,
      totalAdmins,
      totalServices,
      totalProjects,
      totalReviews,
      totalDisputes,
      totalRevenue: totalRevenue[0]?.total || 0,
      pendingServices,
      pendingDisputes,
      activeProjects,
    },
    recentUsers,
    recentServices,
    recentProjects,
  });
});

// ============ ADMIN MANAGEMENT ============

// @desc    Get All Admins
// @route   GET /api/super/admins
export const getAllAdmins = asyncHandler(async (req, res) => {
  const admins = await User.find({ role: 'admin' }).select('-password -refreshToken');
  res.json(admins);
});

// @desc    Add Admin
// @route   POST /api/super/admins
export const addAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  
  const existingAdmin = await User.findOne({ email });
  if (existingAdmin) {
    res.status(400);
    throw new Error('Admin already exists');
  }
  
  const hashedPassword = await bcrypt.hash(password, 10);
  const admin = await User.create({
    name,
    email,
    phone,
    password: hashedPassword,
    role: 'admin',
  });
  
  await SuperAdminLog.create({
    superAdminId: req.user._id,
    action: 'add_admin',
    targetType: 'admin',
    targetId: admin._id,
    targetEmail: admin.email,
    targetName: admin.name,
    details: { name, email, phone },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  const adminResponse = admin.toObject();
  delete adminResponse.password;
  delete adminResponse.refreshToken;
  
  res.status(201).json(adminResponse);
});

// @desc    Edit Admin
// @route   PUT /api/super/admins/:id
export const editAdmin = asyncHandler(async (req, res) => {
  const { name, email, phone, password } = req.body;
  const admin = await User.findById(req.params.id);
  
  if (!admin || admin.role !== 'admin') {
    res.status(404);
    throw new Error('Admin not found');
  }
  
  if (name) admin.name = name;
  if (email) admin.email = email;
  if (phone) admin.phone = phone;
  if (password) {
    admin.password = await bcrypt.hash(password, 10);
  }
  
  await admin.save();
  
  await SuperAdminLog.create({
    superAdminId: req.user._id,
    action: 'edit_admin',
    targetType: 'admin',
    targetId: admin._id,
    targetEmail: admin.email,
    targetName: admin.name,
    details: { name, email, phone },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  const adminResponse = admin.toObject();
  delete adminResponse.password;
  delete adminResponse.refreshToken;
  
  res.json(adminResponse);
});

// @desc    Delete Admin
// @route   DELETE /api/super/admins/:id
export const deleteAdmin = asyncHandler(async (req, res) => {
  const admin = await User.findById(req.params.id);
  
  if (!admin || admin.role !== 'admin') {
    res.status(404);
    throw new Error('Admin not found');
  }
  
  await admin.deleteOne();
  
  await SuperAdminLog.create({
    superAdminId: req.user._id,
    action: 'delete_admin',
    targetType: 'admin',
    targetId: admin._id,
    targetEmail: admin.email,
    targetName: admin.name,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  res.json({ message: 'Admin deleted successfully' });
});

// ============ PROVIDER MANAGEMENT ============

// @desc    Get All Providers
// @route   GET /api/super/providers
export const getAllProviders = asyncHandler(async (req, res) => {
  const providers = await User.find({ role: 'provider' }).select('-password -refreshToken');
  res.json(providers);
});

// @desc    Get Provider Details
// @route   GET /api/super/providers/:id
export const getProviderDetails = asyncHandler(async (req, res) => {
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
    reviews,
  });
});

// @desc    Toggle Provider Ban Status
// @route   PUT /api/super/providers/:id/toggle-ban
export const toggleProviderBan = asyncHandler(async (req, res) => {
  const provider = await User.findById(req.params.id);
  
  if (!provider || provider.role !== 'provider') {
    res.status(404);
    throw new Error('Provider not found');
  }
  
  provider.banned = !provider.banned;
  await provider.save();
  
  await SuperAdminLog.create({
    superAdminId: req.user._id,
    action: provider.banned ? 'ban_provider' : 'unban_provider',
    targetType: 'provider',
    targetId: provider._id,
    targetEmail: provider.email,
    targetName: provider.name,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  res.json({ message: provider.banned ? 'Provider banned' : 'Provider unbanned', banned: provider.banned });
});

// ============ USER MANAGEMENT ============

// @desc    Get All Users (Customers)
// @route   GET /api/super/users
export const getAllUsers = asyncHandler(async (req, res) => {
  const users = await User.find({ role: 'customer' }).select('-password -refreshToken');
  res.json(users);
});

// @desc    Delete User
// @route   DELETE /api/super/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  await user.deleteOne();
  
  await SuperAdminLog.create({
    superAdminId: req.user._id,
    action: 'delete_user',
    targetType: 'user',
    targetId: user._id,
    targetEmail: user.email,
    targetName: user.name,
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  res.json({ message: 'User deleted successfully' });
});

// @desc    Get User Details
// @route   GET /api/super/users/:id
export const getUserDetails = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  const projects = await Request.find({ customerId: user._id });
  const reviews = await Review.find({ customerId: user._id });
  
  res.json({ user, projects, reviews });
});

// ============ SERVICE MANAGEMENT ============

// @desc    Get All Services
// @route   GET /api/super/services
export const getAllServices = asyncHandler(async (req, res) => {
  const services = await Service.find().populate('providerId', 'name email');
  res.json(services);
});

// @desc    Delete Service
// @route   DELETE /api/super/services/:id
export const deleteService = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id);
  
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  
  await service.deleteOne();
  
  await SuperAdminLog.create({
    superAdminId: req.user._id,
    action: 'delete_service',
    targetType: 'service',
    targetId: service._id,
    details: { title: service.title, providerId: service.providerId },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  res.json({ message: 'Service deleted successfully' });
});

// @desc    Get Service Details
// @route   GET /api/super/services/:id
export const getServiceDetails = asyncHandler(async (req, res) => {
  const service = await Service.findById(req.params.id).populate('providerId', 'name email');
  if (!service) {
    res.status(404);
    throw new Error('Service not found');
  }
  
  const reviews = await Review.find({ serviceId: service._id });
  const projects = await Request.find({ serviceId: service._id });
  
  res.json({ service, reviews, projects });
});

// ============ PROJECT MANAGEMENT ============

// @desc    Get All Projects
// @route   GET /api/super/projects
export const getAllProjects = asyncHandler(async (req, res) => {
  const projects = await Request.find()
    .populate('customerId', 'name email')
    .populate('providerId', 'name email')
    .populate('serviceId', 'title');
  res.json(projects);
});

// @desc    Get Project Details
// @route   GET /api/super/projects/:id
export const getProjectDetails = asyncHandler(async (req, res) => {
  const project = await Request.findById(req.params.id)
    .populate('customerId', 'name email phone')
    .populate('providerId', 'name email phone')
    .populate('serviceId', 'title price description');
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  
  res.json(project);
});

// @desc    Delete Project
// @route   DELETE /api/super/projects/:id
export const deleteProject = asyncHandler(async (req, res) => {
  const project = await Request.findById(req.params.id);
  
  if (!project) {
    res.status(404);
    throw new Error('Project not found');
  }
  
  await project.deleteOne();
  
  await SuperAdminLog.create({
    superAdminId: req.user._id,
    action: 'delete_project',
    targetType: 'project',
    targetId: project._id,
    details: { title: project.title, budget: project.budget },
    ipAddress: req.ip,
    userAgent: req.headers['user-agent'],
  });
  
  res.json({ message: 'Project deleted successfully' });
});

// ============ LOGS MANAGEMENT ============

// @desc    Get Admin Logs
// @route   GET /api/super/logs/admin
export const getAdminLogs = asyncHandler(async (req, res) => {
  const logs = await AdminLog.find()
    .populate('adminId', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(logs);
});

// @desc    Get Super Admin Logs
// @route   GET /api/super/logs/super
export const getSuperAdminLogs = asyncHandler(async (req, res) => {
  const logs = await SuperAdminLog.find()
    .populate('superAdminId', 'name email')
    .sort({ createdAt: -1 })
    .limit(100);
  res.json(logs);
});

// @desc    Get All Logs (Combined)
// @route   GET /api/super/logs/all
export const getAllLogs = asyncHandler(async (req, res) => {
  const [adminLogs, superLogs] = await Promise.all([
    AdminLog.find().populate('adminId', 'name email').sort({ createdAt: -1 }).limit(100),
    SuperAdminLog.find().populate('superAdminId', 'name email').sort({ createdAt: -1 }).limit(100),
  ]);
  
  const allLogs = [
    ...adminLogs.map(log => ({ ...log.toObject(), logType: 'admin' })),
    ...superLogs.map(log => ({ ...log.toObject(), logType: 'superadmin' })),
  ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(allLogs);
});

// @desc    Get Log by ID
// @route   GET /api/super/logs/:id
export const getLogById = asyncHandler(async (req, res) => {
  let log = await AdminLog.findById(req.params.id).populate('adminId', 'name email');
  let logType = 'admin';
  
  if (!log) {
    log = await SuperAdminLog.findById(req.params.id).populate('superAdminId', 'name email');
    logType = 'superadmin';
  }
  
  if (!log) {
    res.status(404);
    throw new Error('Log not found');
  }
  
  res.json({ ...log.toObject(), logType });
});

// @desc    Get Logs by Date Range
// @route   GET /api/super/logs/date-range
export const getLogsByDateRange = asyncHandler(async (req, res) => {
  const { startDate, endDate, type } = req.query;
  
  const query = {};
  if (startDate && endDate) {
    query.createdAt = {
      $gte: new Date(startDate),
      $lte: new Date(endDate),
    };
  }
  
  let logs = [];
  
  if (type === 'admin' || !type) {
    const adminLogs = await AdminLog.find(query).populate('adminId', 'name email').sort({ createdAt: -1 });
    logs.push(...adminLogs.map(log => ({ ...log.toObject(), logType: 'admin' })));
  }
  
  if (type === 'superadmin' || !type) {
    const superLogs = await SuperAdminLog.find(query).populate('superAdminId', 'name email').sort({ createdAt: -1 });
    logs.push(...superLogs.map(log => ({ ...log.toObject(), logType: 'superadmin' })));
  }
  
  logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
  res.json(logs);
});

// ============ STATISTICS ============

// @desc    Get Platform Statistics
// @route   GET /api/super/stats
export const getPlatformStats = asyncHandler(async (req, res) => {
  // Monthly user registrations
  const monthlyUsers = await User.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  
  // Monthly revenue
  const monthlyRevenue = await Request.aggregate([
    { $match: { status: 'Delivered' } },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        total: { $sum: '$budget' }
      }
    },
    { $sort: { '_id.year': -1, '_id.month': -1 } },
    { $limit: 12 }
  ]);
  
  // Top providers by earnings
  const topProviders = await User.find({ role: 'provider' })
    .select('name email totalEarnings completedProjects rating')
    .sort({ totalEarnings: -1 })
    .limit(10);
  
  // Top customers by spending
  const customerSpending = await Request.aggregate([
    { $match: { status: 'Delivered' } },
    {
      $group: {
        _id: '$customerId',
        totalSpent: { $sum: '$budget' },
        projectCount: { $sum: 1 }
      }
    },
    { $sort: { totalSpent: -1 } },
    { $limit: 10 }
  ]);
  
  // Populate customer names
  const populatedTopCustomers = await Promise.all(
    customerSpending.map(async (item) => {
      const user = await User.findById(item._id).select('name email');
      return {
        ...item,
        customer: user,
      };
    })
  );
  
  res.json({
    monthlyUsers,
    monthlyRevenue,
    topProviders,
    topCustomers: populatedTopCustomers,
  });
});

// ============ TEMPORARY DEBUG ENDPOINT ============
// @desc    Test endpoint to verify super admin password
// @route   GET /api/super/debug
export const debugSuperAdmin = asyncHandler(async (req, res) => {
  const superAdmin = await SuperAdmin.findOne({ email: 'superadmin999@gmail.com' });
  if (!superAdmin) {
    return res.json({ exists: false });
  }
  
  // Test password
  const testPassword = '123456';
  const isValid = await bcrypt.compare(testPassword, superAdmin.password);
  
  res.json({
    exists: true,
    email: superAdmin.email,
    name: superAdmin.name,
    role: superAdmin.role,
    isActive: superAdmin.isActive,
    passwordHash: superAdmin.password,
    passwordValid: isValid
  });
});