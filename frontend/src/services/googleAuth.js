export const initiateGoogleLogin = () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
  window.location.href = `${API_URL}/auth/google`;
};

export const handleGoogleCallback = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const accessToken = urlParams.get('accessToken');
  const refreshToken = urlParams.get('refreshToken');
  const userParam = urlParams.get('user');
  
  if (accessToken && refreshToken && userParam) {
    const user = JSON.parse(decodeURIComponent(userParam));
    return { accessToken, refreshToken, user };
  }
  
  return null;
};