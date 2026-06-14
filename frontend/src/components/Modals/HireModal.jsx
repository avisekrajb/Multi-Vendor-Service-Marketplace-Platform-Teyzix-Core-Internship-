import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { createRequest } from '../../services/api';
import toast from 'react-hot-toast';

const HireModal = ({ service, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    requirements: '',
    budget: service?.price || 0,
    deadline: ''
  });
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState(false);

  // Debug logging
  useEffect(() => {
    console.log('HireModal - Service data:', service);
    console.log('Service image URL:', service?.image);
    console.log('Service icon:', service?.icon);
  }, [service]);

  // Set minimum deadline (today + 7 days recommended)
  const getMinDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().split('T')[0];
  };

  const getMaxDeadline = () => {
    const date = new Date();
    date.setDate(date.getDate() + 90);
    return date.toISOString().split('T')[0];
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.requirements.trim()) {
      newErrors.requirements = 'Please describe your requirements';
    } else if (formData.requirements.trim().length < 20) {
      newErrors.requirements = 'Please provide at least 20 characters describing your needs';
    }
    
    if (!formData.budget || formData.budget < 100) {
      newErrors.budget = 'Minimum budget is रू 100';
    } else if (formData.budget > 1000000) {
      newErrors.budget = 'Maximum budget is रू 10,00,000';
    }
    
    if (!formData.deadline) {
      newErrors.deadline = 'Please select a deadline';
    } else {
      const selectedDate = new Date(formData.deadline);
      const minDate = new Date(getMinDeadline());
      const maxDate = new Date(getMaxDeadline());
      
      if (selectedDate < minDate) {
        newErrors.deadline = 'Minimum deadline is 7 days from today';
      } else if (selectedDate > maxDate) {
        newErrors.deadline = 'Maximum deadline is 90 days from today';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Please login to hire a service');
      onClose();
      return;
    }

    if (user.role !== 'customer') {
      toast.error('Only customers can request services');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      await createRequest({
        serviceId: service._id,
        requirements: formData.requirements,
        budget: parseInt(formData.budget),
        deadline: formData.deadline
      });
      toast.success('Service request submitted successfully! 🎉');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Hire error:', error);
      toast.error(error.response?.data?.message || 'Failed to submit request');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

  // Budget change handler with real-time validation
  const handleBudgetChange = (value) => {
    const budget = parseInt(value) || 0;
    setFormData({ ...formData, budget });
    if (budget < 100 && budget > 0) {
      setErrors({ ...errors, budget: 'Minimum budget is रू 100' });
    } else if (budget > 1000000) {
      setErrors({ ...errors, budget: 'Maximum budget is रू 10,00,000' });
    } else {
      setErrors({ ...errors, budget: null });
    }
  };

  if (!service) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl animate-slideUp">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Hire Service Provider
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors text-2xl leading-none"
              aria-label="Close"
            >
              ×
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Service Summary - WITH IMAGE SUPPORT */}
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-700 rounded-xl p-4 mb-5 flex gap-3 border border-indigo-100 dark:border-gray-600">
            {/* Service Image/Icon Section */}
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
              {service.image && !imageError ? (
                <img
                  src={service.image}
                  alt={service.title}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  loading="lazy"
                />
              ) : (
                <span className="text-3xl">{service.icon || '💻'}</span>
              )}
            </div>
            
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white text-lg">
                {service.title}
              </h3>
              <p className="text-sm text-indigo-600 dark:text-indigo-400 font-semibold mt-1">
                {formatPrice(service.price)} · {service.delivery || '7 days'}
              </p>
              {service.providerId && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Provider: {service.providerId.name}
                </p>
              )}
              {service.category && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Category: {service.category}
                </p>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Requirements */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Requirements <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.requirements}
                onChange={(e) => {
                  setFormData({ ...formData, requirements: e.target.value });
                  if (e.target.value.trim().length >= 20) {
                    setErrors({ ...errors, requirements: null });
                  }
                }}
                rows={5}
                className={`w-full px-4 py-3 rounded-xl border ${
                  errors.requirements 
                    ? 'border-red-500 focus:ring-red-500' 
                    : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent resize-none transition-colors`}
                placeholder="Describe exactly what you need... (minimum 20 characters)"
                required
              />
              {errors.requirements && (
                <p className="text-xs text-red-500 mt-1">{errors.requirements}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {formData.requirements.trim().length}/20+ characters
              </p>
            </div>

            {/* Budget & Deadline */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Budget (रू) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  value={formData.budget}
                  onChange={(e) => handleBudgetChange(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.budget 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent`}
                  min={100}
                  max={1000000}
                  step={100}
                  required
                />
                {errors.budget && (
                  <p className="text-xs text-red-500 mt-1">{errors.budget}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Base price: {formatPrice(service.price)}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Deadline <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => {
                    setFormData({ ...formData, deadline: e.target.value });
                    setErrors({ ...errors, deadline: null });
                  }}
                  min={getMinDeadline()}
                  max={getMaxDeadline()}
                  className={`w-full px-4 py-3 rounded-xl border ${
                    errors.deadline 
                      ? 'border-red-500 focus:ring-red-500' 
                      : 'border-gray-300 dark:border-gray-600 focus:ring-indigo-500'
                  } bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent`}
                  required
                />
                {errors.deadline && (
                  <p className="text-xs text-red-500 mt-1">{errors.deadline}</p>
                )}
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 7-90 days from today
                </p>
              </div>
            </div>

            {/* Info Box */}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 border border-blue-100 dark:border-blue-800">
              <div className="flex gap-2">
                <span className="text-blue-500 text-lg">ℹ️</span>
                <div className="text-xs text-blue-800 dark:text-blue-300">
                  <p className="font-semibold mb-1">What happens next?</p>
                  <p>1. Provider will review your request</p>
                  <p>2. You'll receive a response within 24-48 hours</p>
                  <p>3. Discuss details and start the project</p>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98] shadow-md"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </span>
              ) : (
                'Submit Request →'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

// Add these animations to your global CSS or tailwind.config.js
const styles = `
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.2s ease-out;
  }
  
  .animate-slideUp {
    animation: slideUp 0.3s ease-out;
  }
`;

// Add styles to document if not already present
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.textContent = styles;
  document.head.appendChild(styleSheet);
}

export default HireModal;