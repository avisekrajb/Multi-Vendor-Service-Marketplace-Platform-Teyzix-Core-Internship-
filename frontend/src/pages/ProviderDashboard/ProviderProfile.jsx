import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateProfile } from '../../services/api';
import Avatar from '../../components/Common/Avatar';
import Stars from '../../components/Common/Stars';
import toast from 'react-hot-toast';

const ProviderProfile = () => {
  const { user, updateUser, refreshUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    title: user?.title || '',
    bio: user?.bio || '',
    skills: user?.skills?.join(', ') || '',
    phone: user?.phone || '',
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(user?.avatar || null);

  // Update form when user data changes
  useEffect(() => {
    if (user) {
      console.log('ProviderProfile - User updated:', user);
      console.log('ProviderProfile - Avatar URL:', user.avatar);
      
      setFormData({
        name: user.name || '',
        title: user.title || '',
        bio: user.bio || '',
        skills: user.skills?.join(', ') || '',
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
    Object.keys(formData).forEach(key => {
      if (formData[key]) submitData.append(key, formData[key]);
    });
    if (avatarFile) submitData.append('avatar', avatarFile);
    
    try {
      const response = await updateProfile(submitData);
      
      // Update context with response data
      updateUser(response.data);
      
      // Refresh from backend to ensure we have latest data
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

  const stats = [
    { label: 'Total Earnings', value: `रू ${user?.totalEarnings?.toLocaleString() || 0}` },
    { label: 'Completed Projects', value: user?.completedProjects || 0 },
    { label: 'Total Reviews', value: user?.totalReviews || 0 },
    { label: 'Rating', value: <Stars rating={user?.rating || 0} size={16} /> },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Provider Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Edit Form */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
          <form onSubmit={handleSubmit} className="space-y-4">
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Name</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                required
              />
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Professional Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Full Stack Developer"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
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

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
              <textarea
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                rows={4}
                placeholder="Tell clients about your experience and expertise..."
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              />
            </div>

            {/* Skills */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Skills (comma separated)</label>
              <input
                type="text"
                name="skills"
                value={formData.skills}
                onChange={handleChange}
                placeholder="React, Node.js, Python, MongoDB"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Profile'}
            </button>
          </form>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Performance</h3>
            <div className="space-y-3">
              {stats.map(stat => (
                <div key={stat.label} className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600 dark:text-gray-400">{stat.label}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-xl p-6">
            <h3 className="font-semibold text-indigo-900 dark:text-indigo-300 mb-2">💡 Pro Tips</h3>
            <ul className="text-sm text-indigo-800 dark:text-indigo-400 space-y-2">
              <li>• Complete your profile to get more clients</li>
              <li>• Respond to messages quickly</li>
              <li>• Deliver quality work on time</li>
              <li>• Ask satisfied clients for reviews</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderProfile;