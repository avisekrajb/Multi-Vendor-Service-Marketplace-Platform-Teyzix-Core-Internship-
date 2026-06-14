import asyncHandler from 'express-async-handler';
import User from '../models/User.js';
import Otp from '../models/Otp.js';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/generateToken.js';
import { generateOtp } from '../utils/generateOtp.js';
import { sendWelcomeEmail, sendOtpEmail } from '../config/email.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Register user
// @route   POST /api/auth/register
export const register = asyncHandler(async (req, res) => {
  const { name, email, phone, password, role } = req.body;
  
  const userExists = await User.findOne({ email });
  if (userExists) {
    res.status(400);
    throw new Error('User already exists');
  }
  
  let avatar = '';
  let avatarPublicId = '';
  
  if (req.file) {
    const result = await cloudinary.uploader.upload(req.file.path);
    avatar = result.secure_url;
    avatarPublicId = result.public_id;
  }
  
  const user = await User.create({
    name,
    email,
    phone,
    password,
    role: role || 'customer',
    avatar,
    avatarPublicId,
  });
  
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  user.refreshToken = refreshToken;
  await user.save();
  
  await sendWelcomeEmail(email, name);
  
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  
  res.status(201).json({
    user: userResponse,
    accessToken,
    refreshToken,
  });
});

// @desc    Login user
// @route   POST /api/auth/login
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  
  const user = await User.findOne({ email });
  if (!user || !(await user.comparePassword(password))) {
    res.status(401);
    throw new Error('Invalid email or password');
  }
  
  if (user.banned) {
    res.status(403);
    throw new Error('Your account has been banned');
  }
  
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  user.refreshToken = refreshToken;
  user.isOnline = true;
  user.lastSeen = new Date();
  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  
  res.json({
    user: userResponse,
    accessToken,
    refreshToken,
  });
});

// @desc    Refresh token
// @route   POST /api/auth/refresh-token
export const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    res.status(401);
    throw new Error('Refresh token required');
  }
  
  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
  
  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    res.status(401);
    throw new Error('Invalid refresh token');
  }
  
  const accessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);
  
  user.refreshToken = newRefreshToken;
  await user.save();
  
  res.json({
    accessToken,
    refreshToken: newRefreshToken,
  });
});

// @desc    Logout user
// @route   POST /api/auth/logout
export const logout = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (user) {
    user.refreshToken = null;
    user.isOnline = false;
    user.lastSeen = new Date();
    await user.save();
  }
  res.json({ message: 'Logged out successfully' });
});

// @desc    Forgot password - send OTP
// @route   POST /api/auth/forgot-password
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  const otp = generateOtp();
  await Otp.create({ email, otp });
  await sendOtpEmail(email, otp);
  
  res.json({ message: 'OTP sent to your email' });
});

// @desc    Verify OTP
// @route   POST /api/auth/verify-otp
export const verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  
  const otpRecord = await Otp.findOne({ email, otp });
  if (!otpRecord) {
    res.status(400);
    throw new Error('Invalid or expired OTP');
  }
  
  await Otp.deleteOne({ _id: otpRecord._id });
  res.json({ message: 'OTP verified successfully' });
});

// @desc    Reset password
// @route   POST /api/auth/reset-password
export const resetPassword = asyncHandler(async (req, res) => {
  const { email, newPassword } = req.body;
  
  const user = await User.findOne({ email });
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  user.password = newPassword;
  await user.save();
  
  res.json({ message: 'Password reset successfully' });
});

// @desc    Change password (authenticated)
// @route   POST /api/auth/change-password
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  
  if (!user) {
    res.status(404);
    throw new Error('User not found');
  }
  
  if (!(await user.comparePassword(currentPassword))) {
    res.status(400);
    throw new Error('Current password is incorrect');
  }
  
  user.password = newPassword;
  await user.save();
  
  res.json({ message: 'Password changed successfully' });
});

// @desc    Google Auth Callback Handler (for redirect flow)
// @route   GET /api/auth/google/callback (handled in routes)
// @desc    Google Auth Callback Handler (for redirect flow)
// @route   GET /api/auth/google/callback (handled in routes)
export const googleAuthCallback = asyncHandler(async (req, res) => {
  console.log('=== GOOGLE CALLBACK HIT ===');
  console.log('User from passport:', req.user);
  
  const user = req.user;
  
  if (!user) {
    console.error('No user found in callback');
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`);
  }
  
  if (user.banned) {
    console.error('User is banned:', user.email);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=account_banned`);
  }
  
  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  // Store refresh token in user document
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();
  
  // Prepare user data for frontend
  const userData = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    title: user.title,
    bio: user.bio,
    skills: user.skills,
    rating: user.rating,
    totalReviews: user.totalReviews,
    completedProjects: user.completedProjects,
    totalEarnings: user.totalEarnings,
    banned: user.banned,
    isOnline: user.isOnline,
    lastSeen: user.lastSeen
  };
  
  // Encode user data for URL
  const encodedUser = encodeURIComponent(JSON.stringify(userData));
  
  // Redirect to frontend callback handler
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const redirectUrl = `${frontendUrl}/auth/google/callback?accessToken=${accessToken}&refreshToken=${refreshToken}&user=${encodedUser}`;
  
  console.log('Redirecting to:', redirectUrl);
  
  res.redirect(redirectUrl);
});
// @desc    Google Token Login (for frontend Google SDK)
// @route   POST /api/auth/google/token
export const googleTokenLogin = asyncHandler(async (req, res) => {
  const { email, name, picture, googleId } = req.body;
  
  if (!email) {
    res.status(400);
    throw new Error('Email is required');
  }
  
  let user = await User.findOne({ email });
  
  if (user) {
    if (user.banned) {
      res.status(403);
      throw new Error('Account is banned');
    }
    
    if (!user.avatar && picture) {
      user.avatar = picture;
    }
    user.lastLogin = new Date();
    await user.save();
    
  } else {
    user = await User.create({
      name: name || email.split('@')[0],
      email: email,
      phone: '',
      password: Math.random().toString(36).slice(-8),
      role: 'customer',
      avatar: picture || '',
      isGoogleLogin: true,
      lastLogin: new Date()
    });
    
    // Send welcome email for new users
    await sendWelcomeEmail(email, user.name).catch(console.error);
  }
  
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  
  user.refreshToken = refreshToken;
  await user.save();
  
  const userResponse = user.toObject();
  delete userResponse.password;
  delete userResponse.refreshToken;
  
  res.json({
    success: true,
    user: userResponse,
    accessToken,
    refreshToken
  });
});
