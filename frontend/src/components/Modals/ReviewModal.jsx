import React, { useState } from 'react';
import Stars from '../Common/Stars';
import { createReview } from '../../services/api';
import toast from 'react-hot-toast';

const ReviewModal = ({ request, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    rating: 5,
    comment: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.comment.trim()) {
      toast.error('Please write a review comment');
      return;
    }

    setLoading(true);
    try {
      await createReview({
        requestId: request._id,
        rating: formData.rating,
        comment: formData.comment
      });
      toast.success('Thank you for your review! ⭐');
      onSuccess?.();
      onClose();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to submit review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6 animate-slideUp">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Leave a Review</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400">Project: <strong>{request?.title}</strong></p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your Rating</label>
            <Stars 
              rating={formData.rating} 
              size={32} 
              interactive 
              onChange={(rating) => setFormData(prev => ({ ...prev, rating }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Your Review *</label>
            <textarea
              value={formData.comment}
              onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
              rows={4}
              className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 resize-none"
              placeholder="Share your experience working with this provider..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-semibold rounded-xl hover:from-yellow-600 hover:to-orange-600 transition-colors disabled:opacity-50"
          >
            {loading ? 'Submitting...' : 'Submit Review ⭐'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ReviewModal;