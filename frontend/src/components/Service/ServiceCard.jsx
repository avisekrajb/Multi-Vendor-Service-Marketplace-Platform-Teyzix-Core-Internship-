import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import Stars from '../Common/Stars';
import Avatar from '../Common/Avatar';
import Badge from '../Common/Badge';
import HireModal from '../Modals/HireModal';

const ServiceCard = ({ service, onRefresh }) => {
  const { user } = useAuth();
  const [showHireModal, setShowHireModal] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset image error when service image changes
  useEffect(() => {
    setImageError(false);
  }, [service.image]);

  const formatPrice = (price) => `रू ${Number(price).toLocaleString('ne-NP')}`;

  // Only show hire button if user is logged in and not the service owner
  const canHire = user && user.role === 'customer' && user._id !== service.providerId?._id;

  return (
    <>
      <div className="group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700">
        {/* Image/Icon Section */}
        <Link to={`/service/${service._id}`} className="block">
          <div className="h-40 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center relative overflow-hidden">
            {service.image && !imageError ? (
              <img
                src={service.image}
                alt={service.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                onError={() => setImageError(true)}
                loading="lazy"
              />
            ) : (
              <span className="text-5xl">{service.icon || '💻'}</span>
            )}
            {service.status === 'pending' && (
              <div className="absolute top-3 right-3">
                <Badge label="Pending Review" color="#f59e0b" />
              </div>
            )}
          </div>
        </Link>

        <div className="p-4">
          {/* Category */}
          <div className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider mb-1">
            {service.category}
          </div>

          {/* Title */}
          <Link to={`/service/${service._id}`}>
            <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 hover:text-indigo-600 transition-colors">
              {service.title}
            </h3>
          </Link>

          {/* Description */}
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
            {service.description}
          </p>

          {/* Provider */}
          {service.providerId && (
            <div className="flex items-center gap-2 mb-3">
              <Avatar
                src={service.providerId.avatar}
                name={service.providerId.name}
                size={24}
              />
              <span className="text-xs text-gray-600 dark:text-gray-400">
                {service.providerId.name}
              </span>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2 mb-3">
            <Stars rating={service.rating} size={14} />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">
              {service.rating?.toFixed(1) || '0.0'}
            </span>
            <span className="text-xs text-gray-500">
              ({service.reviewCount || 0})
            </span>
          </div>

          {/* Price and Action */}
          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <div>
              <span className="text-lg font-bold text-indigo-600">
                {formatPrice(service.price)}
              </span>
              <span className="text-xs text-gray-500 ml-1">
                · {service.delivery}
              </span>
            </div>
            {canHire && (
              <button
                onClick={() => setShowHireModal(true)}
                className="px-4 py-1.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all"
              >
                Hire
              </button>
            )}
          </div>
        </div>
      </div>

      {showHireModal && (
        <HireModal
          service={service}
          onClose={() => setShowHireModal(false)}
          onSuccess={onRefresh}
        />
      )}
    </>
  );
};

export default ServiceCard;