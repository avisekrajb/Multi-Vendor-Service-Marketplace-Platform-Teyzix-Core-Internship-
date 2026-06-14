import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getReviewsForProvider, respondToReview } from '../../services/api';
import Stars from '../../components/Common/Stars';
import Avatar from '../../components/Common/Avatar';
import toast from 'react-hot-toast';

const ProviderReviews = () => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState('');

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      const response = await getReviewsForProvider(user._id);
      setReviews(response.data || []);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (reviewId) => {
    if (!responseText.trim()) {
      toast.error('Please enter a response');
      return;
    }
    
    try {
      await respondToReview(reviewId, responseText);
      toast.success('Response posted successfully');
      fetchReviews();
      setRespondingTo(null);
      setResponseText('');
    } catch (error) {
      toast.error('Failed to post response');
    }
  };

  const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / (reviews.length || 1);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Client Reviews</h1>
      
      {/* Rating Summary */}
      <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center gap-6 flex-wrap">
          <div className="text-center">
            <div className="text-4xl font-bold text-indigo-600">{averageRating.toFixed(1)}</div>
            <Stars rating={averageRating} size={20} />
            <div className="text-sm text-gray-500 mt-1">{reviews.length} reviews</div>
          </div>
          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(star => {
              const count = reviews.filter(r => Math.floor(r.rating) === star).length;
              const percentage = reviews.length ? (count / reviews.length) * 100 : 0;
              return (
                <div key={star} className="flex items-center gap-2 mb-1">
                  <span className="text-sm w-8">{star} ★</span>
                  <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }} />
                  </div>
                  <span className="text-sm text-gray-500 w-12">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Reviews List */}
      {reviews.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="text-5xl mb-4">⭐</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No reviews yet</h3>
          <p className="text-gray-500">Reviews from customers will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map(review => (
            <div key={review._id} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-3">
                  <Avatar src={review.customerId?.avatar} name={review.author} size={40} />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{review.author}</h3>
                    <p className="text-xs text-gray-500">Posted on {review.date}</p>
                  </div>
                </div>
                <Stars rating={review.rating} size={16} />
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-4">{review.comment}</p>

              {review.providerResponse ? (
                <div className="mt-3 p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <p className="text-xs font-semibold text-indigo-600 mb-1">Your Response:</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{review.providerResponse.text}</p>
                  <p className="text-xs text-gray-500 mt-1">{review.providerResponse.date}</p>
                </div>
              ) : (
                respondingTo === review._id ? (
                  <div className="mt-3">
                    <textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={3}
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      placeholder="Write your response..."
                    />
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleRespond(review._id)}
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg text-sm"
                      >
                        Post Response
                      </button>
                      <button
                        onClick={() => setRespondingTo(null)}
                        className="px-4 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setRespondingTo(review._id)}
                    className="text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    Respond to Review →
                  </button>
                )
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProviderReviews;