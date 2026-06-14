import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get user profile
// @route   GET /api/users/profile
export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
});

// @desc    Update user profile
// @route   PUT /api/users/profile
export const updateProfile = asyncHandler(async (req, res) => {
  console.log('=== UPDATE PROFILE ===');
  console.log('Request file:', req.file);
  console.log('Request body:', req.body);
  
  const user = await User.findById(req.user._id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  const { name, title, bio, skills, phone } = req.body;
  
  if (name) user.name = name;
  if (title) user.title = title;
  if (bio) user.bio = bio;
  if (phone) user.phone = phone;
  if (skills) user.skills = skills.split(',').map(s => s.trim()).filter(Boolean);
  
  // Handle avatar upload from Cloudinary
  if (req.file) {
    console.log('Avatar file received:', req.file);
    console.log('Cloudinary URL:', req.file.path);
    
    // Delete old avatar from Cloudinary if exists
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
        console.log('Old avatar deleted:', user.avatarPublicId);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }
    user.avatar = req.file.path; // Cloudinary URL
    user.avatarPublicId = req.file.filename; // Cloudinary public ID
  }
  
  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  
  console.log('Sending response with avatar:', userResponse.avatar);
  console.log('=========================');
  
  res.json(userResponse);
});

// @desc    Get all users (admin only)
// @route   GET /api/users
export const getUsers = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  const users = await User.find({}).select('-password -refreshToken');
  res.json(users);
});

// @desc    Get provider by ID
// @route   GET /api/users/provider/:id
export const getProviderById = asyncHandler(async (req, res) => {
  const provider = await User.findById(req.params.id)
    .select('name avatar title bio skills rating totalReviews completedProjects totalEarnings isOnline lastSeen');
  if (!provider || provider.role !== 'provider') {
    res.status(404);
    throw new Error('Provider not found');
  }
  res.json(provider);
});

// @desc    Get all providers
// @route   GET /api/users/providers
export const getProviders = asyncHandler(async (req, res) => {
  const providers = await User.find({ role: 'provider', banned: false })
    .select('name avatar title bio skills rating totalReviews completedProjects isOnline lastSeen')
    .sort({ rating: -1 })
    .limit(20);
  res.json(providers);
});

// @desc    Ban/Unban user (admin only)
// @route   PUT /api/users/:id/ban
export const banUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  const user = await User.findById(req.params.id);
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
  res.json({ message: user.banned ? 'User banned' : 'User unbanned', banned: user.banned });
});

// @desc    Delete user (admin only)
// @route   DELETE /api/users/:id
export const deleteUser = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') {
    res.status(403);
    throw new Error('Admin access required');
  }
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  // Delete avatar from Cloudinary if exists
  if (user.avatarPublicId) {
    try {
      await cloudinary.uploader.destroy(user.avatarPublicId);
    } catch (err) {
      console.error('Error deleting avatar:', err);
    }
  }
  
  await user.deleteOne();
  res.json({ message: 'User deleted successfully' });
});