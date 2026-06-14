import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import asyncHandler from 'express-async-handler';

const router = express.Router();

// ============ PUBLIC ROUTES ============

// Get all providers (public)
router.get('/providers', asyncHandler(async (req, res) => {
  const providers = await User.find({ role: 'provider', banned: false })
    .select('name avatar title bio skills rating totalReviews completedProjects isOnline lastSeen')
    .sort({ rating: -1 })
    .limit(20);
  res.json(providers);
}));

// Get provider by ID (public)
router.get('/provider/:id', asyncHandler(async (req, res) => {
  const provider = await User.findById(req.params.id)
    .select('name avatar title bio skills rating totalReviews completedProjects totalEarnings isOnline lastSeen');
  if (!provider || provider.role !== 'provider') {
    res.status(404);
    throw new Error('Provider not found');
  }
  res.json(provider);
}));

// ============ PROTECTED ROUTES ============

// Get user profile (authenticated)
router.get('/profile', protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -refreshToken');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
}));

// Update user profile (authenticated)
router.put('/profile', protect, upload.single('avatar'), asyncHandler(async (req, res) => {
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
    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
  }
  
  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  
  console.log('Sending response with avatar:', userResponse.avatar);
  console.log('=========================');
  
  res.json(userResponse);
}));

// ============ ADMIN ONLY ROUTES ============

// Get all users (admin only)
router.get('/', protect, adminOnly, asyncHandler(async (req, res) => {
  const users = await User.find({}).select('-password -refreshToken');
  res.json(users);
}));

// Get user by ID (admin only) - FIXED: Added this route
router.get('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select('-password -refreshToken');
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  res.json(user);
}));

// Update user by ID (admin only) - FIXED: Added this route
router.put('/:id', protect, adminOnly, upload.single('avatar'), asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  const { name, email, phone, title, bio, skills, role } = req.body;
  
  if (name) user.name = name;
  if (email) user.email = email;
  if (phone) user.phone = phone;
  if (title) user.title = title;
  if (bio) user.bio = bio;
  if (skills) user.skills = typeof skills === 'string' ? skills.split(',').map(s => s.trim()).filter(Boolean) : skills;
  if (role && role !== 'admin') user.role = role; // Prevent changing to admin
  
  // Handle avatar upload
  if (req.file) {
    if (user.avatarPublicId) {
      try {
        await cloudinary.uploader.destroy(user.avatarPublicId);
      } catch (err) {
        console.error('Error deleting old avatar:', err);
      }
    }
    user.avatar = req.file.path;
    user.avatarPublicId = req.file.filename;
  }
  
  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  
  res.json(userResponse);
}));

// Delete user by ID (admin only) - FIXED: Added this route
router.delete('/:id', protect, adminOnly, asyncHandler(async (req, res) => {
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
}));

// Ban/Unban user (admin only)
router.put('/:id/ban', protect, adminOnly, asyncHandler(async (req, res) => {
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
}));

export default router;