import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const GoogleCallback = () => {
  const navigate = useNavigate();
  const { googleLogin } = useAuth();

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('accessToken');
    const refreshToken = urlParams.get('refreshToken');
    const userParam = urlParams.get('user');

    if (accessToken && refreshToken && userParam) {
      try {
        const user = JSON.parse(decodeURIComponent(userParam));
        googleLogin(accessToken, refreshToken, user);
        
        // Redirect based on role
        if (user.role === 'admin') {
          navigate('/admin/dashboard');
        } else if (user.role === 'provider') {
          navigate('/provider/dashboard');
        } else if (user.role === 'customer') {
          navigate('/customer/dashboard');
        } else {
          navigate('/home');
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        navigate('/home');
      }
    } else {
      navigate('/home');
    }
  }, [googleLogin, navigate]);

  return (
    <div className="flex justify-center items-center h-screen">
      <LoadingSpinner size="lg" />
      <p className="ml-3 text-gray-600">Completing Google sign in...</p>
    </div>
  );
};

export default GoogleCallback;