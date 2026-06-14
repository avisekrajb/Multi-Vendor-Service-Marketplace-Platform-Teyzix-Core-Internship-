import React, { useState, useEffect } from 'react';
import { getProviders } from '../services/api';
import Avatar from '../components/Common/Avatar';
import Stars from '../components/Common/Stars';
import LoadingSpinner from '../components/Common/LoadingSpinner';

const ProvidersPage = () => {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvider, setSelectedProvider] = useState(null);

  useEffect(() => {
    fetchProviders();
  }, []);

  const fetchProviders = async () => {
    try {
      const response = await getProviders();
      setProviders(response.data || []);
    } catch (error) {
      console.error('Error fetching providers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">Our Service Providers</h1>
        <p className="text-gray-600 dark:text-gray-400">Verified professionals ready to help you</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {providers.map(provider => (
          <div
            key={provider._id}
            onClick={() => setSelectedProvider(provider)}
            className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-lg transition-all"
          >
            <div className="flex items-center gap-4 mb-4">
              <Avatar src={provider.avatar} name={provider.name} size={56} />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">{provider.name}</h3>
                <p className="text-sm text-gray-500">{provider.title || 'Service Provider'}</p>
              </div>
            </div>

            {provider.skills && provider.skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {provider.skills.slice(0, 3).map(skill => (
                  <span key={skill} className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-xs rounded-full">
                    {skill}
                  </span>
                ))}
                {provider.skills.length > 3 && (
                  <span className="text-xs text-gray-500">+{provider.skills.length - 3}</span>
                )}
              </div>
            )}

            <div className="flex items-center gap-4 pt-3 border-t border-gray-100 dark:border-gray-700 text-sm">
              <div className="flex items-center gap-1">
                <Stars rating={provider.rating} size={14} />
                <span className="font-semibold">{provider.rating?.toFixed(1) || '0.0'}</span>
              </div>
              <div>✅ {provider.completedProjects || 0} done</div>
              <div>⭐ {provider.totalReviews || 0} reviews</div>
            </div>
          </div>
        ))}
      </div>

      {/* Provider Detail Modal */}
      {selectedProvider && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={(e) => e.target === e.currentTarget && setSelectedProvider(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <Avatar src={selectedProvider.avatar} name={selectedProvider.name} size={56} />
                  <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">{selectedProvider.name}</h3>
                    <p className="text-sm text-gray-500">{selectedProvider.title || 'Service Provider'}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedProvider(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>

              {selectedProvider.bio && (
                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedProvider.bio}</p>
                </div>
              )}

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600">Rating</span>
                  <div className="flex items-center gap-2">
                    <Stars rating={selectedProvider.rating} size={16} />
                    <span className="font-semibold">{selectedProvider.rating?.toFixed(1) || '0.0'}</span>
                  </div>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600">Completed Projects</span>
                  <span className="font-semibold">{selectedProvider.completedProjects || 0}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
                  <span className="text-sm text-gray-600">Total Reviews</span>
                  <span className="font-semibold">{selectedProvider.totalReviews || 0}</span>
                </div>
              </div>

              {selectedProvider.skills && selectedProvider.skills.length > 0 && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Skills</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedProvider.skills.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-sm">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvidersPage;