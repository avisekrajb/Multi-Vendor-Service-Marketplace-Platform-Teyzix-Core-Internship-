// frontend/src/pages/customerdashboard/CustomerProfile.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile, changePassword } from '../../services/api';
import Avatar from '../../components/Common/Avatar';
import ChangePasswordModal from '../../components/Modals/ChangePasswordModal';
import toast from 'react-hot-toast';

const CustomerProfile = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      console.log('User updated in CustomerProfile:', user);
      console.log('Avatar URL from user:', user.avatar);
      
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
      });
      setAvatarPreview(user.avatar || null);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setAvatarPreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const submitData = new FormData();
    submitData.append('name', formData.name);
    submitData.append('phone', formData.phone);
    if (avatarFile) submitData.append('avatar', avatarFile);
    
    try {
      const response = await updateProfile(submitData);
      
      // IMPORTANT: Update context with the response data
      updateUser(response.data);
      
      // Also refresh from backend to ensure we have latest data
      await refreshUser();
      
      // Clear avatar file after successful upload
      setAvatarFile(null);
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (oldPassword, newPassword) => {
    try {
      await changePassword(oldPassword, newPassword);
      toast.success('Password changed successfully!');
      setShowPasswordModal(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password');
      throw error;
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">My Profile</h1>

      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Avatar */}
          <div className="flex items-center gap-4">
            <Avatar 
              src={avatarPreview} 
              name={formData.name || user?.name} 
              size={64} 
            />
            <label className="cursor-pointer">
              <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm">Change Photo</span>
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleAvatarChange} 
                className="hidden" 
              />
            </label>
            {avatarFile && (
              <button
                type="button"
                onClick={() => {
                  setAvatarFile(null);
                  setAvatarPreview(user?.avatar || null);
                }}
                className="text-red-500 text-sm hover:text-red-600"
              >
                Cancel
              </button>
            )}
          </div>

          {/* Display current avatar URL for debugging */}
          {user?.avatar && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Current avatar: {user.avatar.substring(0, 50)}...
            </p>
          )}

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              required
            />
          </div>

          {/* Email (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="9876543210"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setShowPasswordModal(true)}
            className="text-indigo-600 hover:text-indigo-700 text-sm font-medium"
          >
            Change Password →
          </button>
        </div>
      </div>

      {showPasswordModal && (
        <ChangePasswordModal
          onClose={() => setShowPasswordModal(false)}
          onChangePassword={handlePasswordChange}
        />
      )}
    </div>
  );
};

export default CustomerProfile;