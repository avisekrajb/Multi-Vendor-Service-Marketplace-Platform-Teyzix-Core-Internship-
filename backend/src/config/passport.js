import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Get URLs from environment variables
const BACKEND_URL = process.env.BACKEND_URL || process.env.RENDER_EXTERNAL_URL || 'http://localhost:5000';
const FRONTEND_URL = process.env.FRONTEND_URL || 'https://multi-vendor-service-marketplace.onrender.com';

console.log('=== Passport Configuration ===');
console.log('Backend URL:', BACKEND_URL);
console.log('Frontend URL:', FRONTEND_URL);
console.log('Google Client ID configured:', !!process.env.GOOGLE_CLIENT_ID);
console.log('===============================');

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: `${BACKEND_URL}/api/auth/google/callback`,
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      console.log('Google profile received for email:', profile.emails[0]?.value);
      
      let user = await User.findOne({ email: profile.emails[0].value });
      
      if (user) {
        console.log('Existing user found:', user.email, 'Role:', user.role);
        return done(null, user);
      }
      
      // Create new user
      user = await User.create({
        name: profile.displayName,
        email: profile.emails[0].value,
        phone: '',
        password: Math.random().toString(36).slice(-8),
        role: 'customer',
        avatar: profile.photos[0]?.value || '',
        isGoogleLogin: true,
      });
      
      console.log('New user created:', user.email);
      return done(null, user);
    } catch (error) {
      console.error('Google strategy error:', error);
      return done(error, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    console.error('Deserialize user error:', error);
    done(error, null);
  }
});

export default passport;
