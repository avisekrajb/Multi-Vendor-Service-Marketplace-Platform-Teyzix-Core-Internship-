import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';
import toast from 'react-hot-toast';

const AuthCallback = () => {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  useEffect(() => {
    const handleCallback = () => {
      const urlParams = new URLSearchParams(window.location.search);
      const accessToken = urlParams.get('accessToken');
      const refreshToken = urlParams.get('refreshToken');
      const userParam = urlParams.get('user');
      const error = urlParams.get('error');

      console.log('AuthCallback - URL params:', { accessToken: !!accessToken, refreshToken: !!refreshToken, userParam: !!userParam, error });

      if (error) {
        console.error('Auth error:', error);
        toast.error('Authentication failed');
        navigate('/home');
        return;
      }

      if (accessToken && refreshToken && userParam) {
        try {
          const user = JSON.parse(decodeURIComponent(userParam));
          console.log('Auth successful - User role:', user.role);
          
          // Store in localStorage
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          localStorage.setItem('user', JSON.stringify(user));
          
          // Update auth context
          googleLogin(accessToken, refreshToken, user);
          
          toast.success(`Welcome${user.name ? ' ' + user.name.split(' ')[0] : ''}! 👋`);
          
          // Redirect based on role
          setTimeout(() => {
            if (user.role === 'admin') {
              navigate('/admin/dashboard');
            } else if (user.role === 'provider') {
              navigate('/provider/dashboard');
            } else if (user.role === 'customer') {
              navigate('/customer/dashboard');
            } else if (user.role === 'superadmin') {
              navigate('/superadmin/dashboard');
            } else {
              navigate('/home');
            }
          }, 500);
        } catch (error) {
          console.error('Failed to parse user data:', error);
          toast.error('Login failed');
          navigate('/home');
        }
      } else {
        console.error('Missing authentication data');
        toast.error('Login failed - missing data');
        navigate('/home');
      }
    };

    handleCallback();
  }, [googleLogin, navigate]);

  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-600 dark:text-gray-400">Completing Google sign in...</p>
    </div>
  );
};

export default AuthCallback;
