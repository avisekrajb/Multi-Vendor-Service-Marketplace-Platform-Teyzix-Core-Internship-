import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Stars from '../Common/Stars';
import Avatar from '../Common/Avatar';
import Badge from '../Common/Badge';
import HireModal from '../Modals/HireModal';

const ServiceDetails = ({ service, provider, reviews, onHireSuccess }) => {
  const [showHireModal, setShowHireModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

  if (!service) return null;

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Image */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl h-80 flex items-center justify-center mb-6 overflow-hidden">
            {service.image && !imageError ? (
              <img 
                src={service.image} 
                alt={service.title} 
                className="w-full h-full object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <span className="text-8xl">{service.icon || '💻'}</span>
            )}
          </div>

          {/* Title & Provider */}
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-3">{service.title}</h1>
          
          <div className="flex items-center gap-3 mb-4">
            <Link to={`/providers?provider=${provider?._id}`}>
              <Avatar src={provider?.avatar} name={provider?.name} size={40} />
            </Link>
            <div>
              <Link to={`/providers?provider=${provider?._id}`} className="font-semibold text-gray-900 dark:text-white hover:text-indigo-600">
                {provider?.name}
              </Link>
              <div className="text-sm text-gray-500">{provider?.title || 'Service Provider'}</div>
            </div>
          </div>

          {/* Rating */}
          <div className="flex items-center gap-3 mb-6">
            <Stars rating={service.rating} size={18} />
            <span className="font-semibold text-gray-900 dark:text-white">{service.rating?.toFixed(1) || '0.0'}</span>
            <span className="text-gray-500">({service.reviewCount || 0} reviews)</span>
          </div>

          {/* Description */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">About This Service</h2>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{service.description}</p>
          </div>

          {/* Delivery & Category */}
          <div className="flex flex-wrap gap-4 mb-8">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2">
              <div className="text-xs text-gray-500">Delivery Time</div>
              <div className="font-semibold">{service.delivery}</div>
            </div>
            <div className="bg-gray-100 dark:bg-gray-800 rounded-xl px-4 py-2">
              <div className="text-xs text-gray-500">Category</div>
              <div className="font-semibold">{service.category}</div>
            </div>
          </div>

          {/* Reviews Section */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Client Reviews</h2>
            {reviews?.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-xl">
                <p className="text-gray-500">No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews?.map(review => (
                  <div key={review._id} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className="font-semibold text-gray-900 dark:text-white">{review.author}</span>
                        <span className="text-xs text-gray-500 ml-2">{review.date}</span>
                      </div>
                      <Stars rating={review.rating} size={14} />
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{review.comment}</p>
                    {review.providerResponse && (
                      <div className="mt-3 pl-4 border-l-2 border-indigo-300">
                        <p className="text-xs text-indigo-600 font-semibold">Provider Response:</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{review.providerResponse.text}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - Price Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-200 dark:border-gray-700 sticky top-24">
            <div className="text-center mb-4">
              <span className="text-3xl font-bold text-indigo-600">{formatPrice(service.price)}</span>
            </div>
            
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400 mb-6">
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="font-semibold">{service.delivery}</span>
              </div>
              <div className="flex justify-between">
                <span>Category:</span>
                <span className="font-semibold">{service.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Provider Rating:</span>
                <span className="font-semibold">{service.rating?.toFixed(1) || '0.0'} ★</span>
              </div>
            </div>

            <button
              onClick={() => setShowHireModal(true)}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Hire Now →
            </button>

            <div className="mt-4 text-xs text-gray-500 text-center">
              🔒 Secure payments via TEYZIX escrow
            </div>

            {/* Provider Info */}
            {provider && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">About the Provider</h4>
                <div className="flex items-center gap-3 mb-2">
                  <Avatar src={provider.avatar} name={provider.name} size={32} />
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">{provider.name}</div>
                    <div className="text-xs text-gray-500">{provider.completedProjects || 0} projects completed</div>
                  </div>
                </div>
                {provider.bio && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{provider.bio}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {showHireModal && (
        <HireModal
          service={service}
          onClose={() => setShowHireModal(false)}
          onSuccess={onHireSuccess}
        />
      )}
    </>
  );
};

export default ServiceDetails;