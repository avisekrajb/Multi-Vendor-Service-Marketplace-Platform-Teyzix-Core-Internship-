import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getMyReviews, deleteReview, updateReview } from '../../services/api';
import Stars from '../../components/Common/Stars';
import Avatar from '../../components/Common/Avatar';
import ConfirmModal from '../../components/Modals/ConfirmModal';
import toast from 'react-hot-toast';

const CustomerReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editForm, setEditForm] = useState({ rating: 5, comment: '' });

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await getMyReviews();
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReview = async () => {
    try {
      await updateReview(editingReview._id, editForm);
      toast.success('Review updated successfully');
      fetchReviews();
      setEditingReview(null);
    } catch (error) {
      toast.error('Failed to update review');
    }
  };

  const handleDeleteReview = async () => {
    try {
      await deleteReview(deleteConfirm);
      toast.success('Review deleted successfully');
      fetchReviews();
      setDeleteConfirm(null);
    } catch (error) {
      toast.error('Failed to delete review');
    }
  };

  const canEdit = (createdAt) => {
    const daysSince = (Date.now() - new Date(createdAt).getTime()) / (1000 * 3600 * 24);
    return daysSince <= 7;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">My Reviews</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">Reviews you've written for service providers</p>

      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">⭐</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No reviews yet</h3>
          <p className="text-gray-500">Reviews you write for completed projects will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar src={review.providerId?.avatar} name={review.providerId?.name} size={40} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{review.providerId?.name}</h3>
                    <p className="text-xs text-gray-500">Service: {review.serviceId?.title}</p>
                  </div>
                </div>
                <Stars rating={review.rating} size={16} />
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-3">{review.comment}</p>
              
              <div className="flex justify-between items-center">
                <span className="text-xs text-gray-500">Posted on {review.date}</span>
                {canEdit(review.createdAt) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setEditingReview(review);
                        setEditForm({ rating: review.rating, comment: review.comment });
                      }}
                      className="text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(review._id)}
                      className="text-sm text-red-600 hover:text-red-700"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>

              {review.providerResponse && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-xs font-semibold text-indigo-600 mb-1">Provider Response:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.providerResponse.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{review.providerResponse.date}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {editingReview && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setEditingReview(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Edit Review</h2>
              <button onClick={() => setEditingReview(null)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rating</label>
              <Stars 
                rating={editForm.rating} 
                size={28} 
                interactive 
                onChange={(rating) => setEditForm({ ...editForm, rating })}
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Comment</label>
              <textarea
                value={editForm.comment}
                onChange={(e) => setEditForm({ ...editForm, comment: e.target.value })}
                rows={4}
                className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Share your experience..."
              />
            </div>

            <button
              onClick={handleUpdateReview}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold rounded-xl"
            >
              Update Review
            </button>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <ConfirmModal
          title="Delete Review"
          message="Are you sure you want to delete this review? This action cannot be undone."
          onConfirm={handleDeleteReview}
          onCancel={() => setDeleteConfirm(null)}
        />
      )}
    </div>
  );
};

export default CustomerReviews;