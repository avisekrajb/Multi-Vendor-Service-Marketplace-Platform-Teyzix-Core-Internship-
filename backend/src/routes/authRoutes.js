import express from 'express';
import passport from 'passport';
import { 
  register, 
  login, 
  refreshToken, 
  logout, 
  forgotPassword, 
  verifyOtp, 
  resetPassword, 
  changePassword,
  googleAuthCallback,
  googleTokenLogin
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import { uploadAvatar } from '../middleware/upload.js';
import { registerValidation, loginValidation, validate } from '../middleware/validation.js';

const router = express.Router();

// ============ LOCAL AUTHENTICATION ============

// Register
router.post('/register', uploadAvatar, registerValidation, validate, register);

// Login
router.post('/login', loginValidation, validate, login);

// Refresh token
router.post('/refresh-token', refreshToken);

// Logout
router.post('/logout', protect, logout);

// Forgot password
router.post('/forgot-password', forgotPassword);

// Verify OTP
router.post('/verify-otp', verifyOtp);

// Reset password
router.post('/reset-password', resetPassword);

// Change password (authenticated)
router.post('/change-password', protect, changePassword);

// ============ GOOGLE OAUTH ============

// Initiate Google OAuth (redirect flow)
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'],
  prompt: 'select_account'
}));

// Google OAuth Callback (redirect flow)
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login?error=google_auth_failed`,
    session: false 
  }),
  googleAuthCallback
);

// Google Token Login (for frontend Google SDK)
router.post('/google/token', googleTokenLogin);

export default router;