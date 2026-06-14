import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { forgotPassword, verifyOtp, resetPassword } from '../../services/api';
import toast from 'react-hot-toast';

const AuthModal = ({ mode, onClose, onModeChange }) => {
  const { login, superLogin, register, googleLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: 'customer',
  });
  const [error, setError] = useState('');
  const [forgotStep, setForgotStep] = useState('email');
  const [otp, setOtp] = useState('');
  const [resetEmail, setResetEmail] = useState('');

  // Clean up URL on component mount - remove any error params
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('error') || urlParams.get('accessToken') || urlParams.get('refreshToken') || urlParams.get('user')) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  // Handle Google OAuth callback
  useEffect(() => {
    const handleGoogleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('accessToken');
      const refreshToken = urlParams.get('refreshToken');
      const userParam = urlParams.get('user');
      const errorParam = urlParams.get('error');
      
      if (errorParam) {
        console.log('Google auth error:', errorParam);
        window.history.replaceState({}, document.title, window.location.pathname);
        return;
      }
      
      if (accessToken && refreshToken && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          console.log('Google login successful:', user);
          
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          googleLogin(accessToken, refreshToken, user);
          onClose();
          window.history.replaceState({}, document.title, window.location.pathname);
          toast.success(`Welcome${user.name ? ' ' + user.name.split(' ')[0] : ''}! 👋`);
          
          setTimeout(() => {
            if (user.role === 'admin') {
              window.location.href = '/admin/dashboard';
            } else if (user.role === 'provider') {
              window.location.href = '/provider/dashboard';
            } else if (user.role === 'customer') {
              window.location.href = '/customer/dashboard';
            } else if (user.role === 'superadmin') {
              window.location.href = '/superadmin/dashboard';
            } else {
              window.location.href = '/home';
            }
          }, 500);
        } catch (error) {
          console.error('Failed to parse Google callback:', error);
          window.history.replaceState({}, document.title, window.location.pathname);
          toast.error('Google login failed');
        }
      }
    };
    
    handleGoogleCallback();
  }, [googleLogin, onClose]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      let result;
      if (formData.email === 'superadmin999@gmail.com') {
        result = await superLogin(formData.email, formData.password);
      } else {
        result = await login(formData.email, formData.password);
      }
      
      if (result.success) {
        toast.success(`Welcome back, ${result.user?.name?.split(' ')[0]}! 👋`);
        onClose();
        
        setTimeout(() => {
          if (result.user?.role === 'admin') {
            window.location.href = '/admin/dashboard';
          } else if (result.user?.role === 'provider') {
            window.location.href = '/provider/dashboard';
          } else if (result.user?.role === 'customer') {
            window.location.href = '/customer/dashboard';
          } else if (result.user?.role === 'superadmin') {
            window.location.href = '/superadmin/dashboard';
          } else {
            window.location.href = '/home';
          }
        }, 500);
      } else {
        setError(result.error || 'Login failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone || !formData.password) {
      setError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    if (!/^\d{10}$/.test(formData.phone)) {
      setError('Phone number must be 10 digits');
      return;
    }
    
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const result = await register(formData);
      if (result.success) {
        toast.success('Account created successfully! 🎉');
        onClose();
        
        setTimeout(() => {
          if (result.user?.role === 'provider') {
            window.location.href = '/provider/dashboard';
          } else {
            window.location.href = '/customer/dashboard';
          }
        }, 500);
      } else {
        setError(result.error || 'Registration failed. Please try again.');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const initiateGoogleLogin = () => {
    const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
    window.location.href = `${API_URL}/auth/google`;
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!resetEmail) {
      setError('Please enter your email');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await forgotPassword(resetEmail);
      toast.success('OTP sent to your email');
      setForgotStep('otp');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!otp || otp.length !== 4) {
      setError('Please enter valid 4-digit OTP');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await verifyOtp(resetEmail, otp);
      toast.success('OTP verified successfully');
      setForgotStep('reset');
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      await resetPassword(resetEmail, formData.password);
      toast.success('Password reset successfully! Please login.');
      onClose();
      if (onModeChange) {
        onModeChange('login');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (email, password) => {
    setFormData(prev => ({ ...prev, email, password }));
  };

  // Function to change mode - THIS IS CRITICAL
  const switchMode = (newMode) => {
    console.log('Switching to mode:', newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
    // Reset form data when switching modes
    setFormData({
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'customer',
    });
    setError('');
    setForgotStep('email');
    setOtp('');
    setResetEmail('');
  };

  const renderContent = () => {
    console.log('Current mode:', mode); // Debug log
    
    // LOGIN MODE
    if (mode === 'login') {
      return (
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-3xl">⚡</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Welcome Back</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Sign in to your TEYZIX account</p>
          </div>
          
          <button
            type="button"
            onClick={initiateGoogleLogin}
            className="w-full py-2.5 flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span className="text-sm font-medium">Continue with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or continue with email</span>
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="you@example.com"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500"
              placeholder="••••••"
              required
            />
          </div>
          
          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In →'}
          </button>
          
          <div className="flex justify-between text-sm">
            <button
              type="button"
              onClick={() => { setForgotStep('email'); switchMode('forgot'); }}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Forgot password?
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Create account →
            </button>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Demo Accounts:</p>
            <div className="space-y-1 text-xs">
              <button type="button" onClick={() => fillDemoCredentials('c@gmail.com', '123456')} className="w-full text-left px-2 py-1 rounded hover:bg-gray-100">
                🛒 Customer: c@gmail.com / 123456
              </button>
              <button type="button" onClick={() => fillDemoCredentials('s@gmail.com', '123456')} className="w-full text-left px-2 py-1 rounded hover:bg-gray-100">
                🔧 Provider: s@gmail.com / 123456
              </button>
              <button type="button" onClick={() => fillDemoCredentials('a@gmail.com', '123456')} className="w-full text-left px-2 py-1 rounded hover:bg-gray-100">
                👑 Admin: a@gmail.com / 123456
              </button>
              <button type="button" onClick={() => fillDemoCredentials('superadmin999@gmail.com', '123456')} className="w-full text-left px-2 py-1 rounded bg-indigo-50 text-indigo-700 font-semibold">
                👑 Super Admin: superadmin999@gmail.com / 123456
              </button>
            </div>
          </div>
        </form>
      );
    }

    // SIGNUP MODE
    if (mode === 'signup') {
      return (
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="text-center mb-4">
            <div className="w-16 h-16 mx-auto bg-gradient-to-r from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center mb-3">
              <span className="text-3xl">⚡</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Create Account</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Join TEYZIX marketplace today</p>
          </div>
          
          <button
            type="button"
            onClick={initiateGoogleLogin}
            className="w-full py-2.5 flex items-center justify-center gap-3 border border-gray-300 dark:border-gray-600 rounded-xl hover:bg-gray-50 transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z" />
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z" />
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z" />
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z" />
            </svg>
            <span className="text-sm font-medium">Sign up with Google</span>
          </button>

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white dark:bg-gray-800 text-gray-500">Or sign up with email</span>
            </div>
          </div>
          
          <div>
            <input type="text" name="name" value={formData.name} onChange={handleChange} placeholder="Full Name *" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white dark:bg-gray-700" required />
          </div>
          <div>
            <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address *" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white dark:bg-gray-700" required />
          </div>
          <div>
            <input type="tel" name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number *" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white dark:bg-gray-700" required />
          </div>
          <div>
            <div className="flex gap-3">
              {['customer', 'provider'].map((role) => (
                <button key={role} type="button" onClick={() => setFormData(prev => ({ ...prev, role }))} className={`flex-1 py-2.5 rounded-xl border-2 font-medium ${formData.role === role ? 'border-indigo-600 bg-indigo-50 text-indigo-600' : 'border-gray-300 text-gray-600'}`}>
                  {role === 'customer' ? '🛒 Customer' : '🔧 Provider'}
                </button>
              ))}
            </div>
          </div>
          <div>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password * (min 6 characters)" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white dark:bg-gray-700" required />
          </div>
          <div>
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password *" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 bg-white dark:bg-gray-700" required />
          </div>
          
          {error && <div className="p-3 bg-red-50 rounded-xl"><p className="text-sm text-red-600">{error}</p></div>}
          
          <button type="submit" disabled={isLoading} className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all">
            {isLoading ? 'Creating account...' : 'Create Account →'}
          </button>
          
          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <button type="button" onClick={() => switchMode('login')} className="text-indigo-600 font-medium">
              Sign in
            </button>
          </p>
        </form>
      );
    }

    // FORGOT PASSWORD MODE
    if (mode === 'forgot') {
      if (forgotStep === 'email') {
        return (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🔐</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter your email to receive an OTP</p>
            </div>
            <input type="email" value={resetEmail} onChange={(e) => setResetEmail(e.target.value)} placeholder="Email Address" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" required />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">{isLoading ? 'Sending...' : 'Send OTP'}</button>
            <button type="button" onClick={() => switchMode('login')} className="w-full text-center text-sm text-indigo-600">← Back to Login</button>
          </form>
        );
      }

      if (forgotStep === 'otp') {
        return (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">📧</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verify OTP</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Enter the 4-digit code sent to {resetEmail}</p>
            </div>
            <input type="text" value={otp} onChange={(e) => setOtp(e.target.value)} maxLength={4} placeholder="0000" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-center text-2xl tracking-widest" required />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">{isLoading ? 'Verifying...' : 'Verify OTP'}</button>
          </form>
        );
      }

      if (forgotStep === 'reset') {
        return (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="text-center mb-4">
              <div className="text-5xl mb-3">🔑</div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">New Password</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">Create a new password for your account</p>
            </div>
            <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="New Password (min 6 characters)" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" required />
            <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" required />
            {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
            <button type="submit" disabled={isLoading} className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl">{isLoading ? 'Resetting...' : 'Reset Password'}</button>
          </form>
        );
      }
    }

    return null;
  };

  // Don't render modal if there's an error parameter in URL
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get('error') === 'no_auth_data') {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-6">
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 hover:text-gray-700">✕</button>
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default AuthModal;