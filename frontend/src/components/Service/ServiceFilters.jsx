import React, { useState } from 'react';

const CATEGORIES = ['All', 'Web Dev', 'Design', 'Marketing', 'Content', 'Video', 'SEO'];

const ServiceFilters = ({ filters, onFilterChange }) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const handleChange = (key, value) => {
    const newFilters = { ...localFilters, [key]: value };
    setLocalFilters(newFilters);
    onFilterChange(newFilters);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Filters</h3>

      {/* Search */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Search</label>
        <input
          type="text"
          value={localFilters.search}
          onChange={(e) => handleChange('search', e.target.value)}
          placeholder="Search services..."
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Category */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => handleChange('category', cat)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                localFilters.category === cat
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Price Range</label>
        <div className="flex gap-3">
          <input
            type="number"
            value={localFilters.minPrice}
            onChange={(e) => handleChange('minPrice', e.target.value)}
            placeholder="Min"
            className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <input
            type="number"
            value={localFilters.maxPrice}
            onChange={(e) => handleChange('maxPrice', e.target.value)}
            placeholder="Max"
            className="w-1/2 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Rating */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Minimum Rating</label>
        <select
          value={localFilters.rating}
          onChange={(e) => handleChange('rating', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="">Any</option>
          <option value="4.5">4.5+ ★</option>
          <option value="4.0">4.0+ ★</option>
          <option value="3.5">3.5+ ★</option>
          <option value="3.0">3.0+ ★</option>
        </select>
      </div>

      {/* Sort */}
      <div className="mb-5">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Sort By</label>
        <select
          value={localFilters.sort}
          onChange={(e) => handleChange('sort', e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
        >
          <option value="rating">Top Rated</option>
          <option value="price">Price: Low to High</option>
          <option value="price-desc">Price: High to Low</option>
          <option value="newest">Newest First</option>
        </select>
      </div>

      {/* Clear Filters */}
      {(localFilters.search || localFilters.category !== 'All' || localFilters.minPrice || localFilters.maxPrice || localFilters.rating) && (
        <button
          onClick={() => {
            const resetFilters = { search: '', category: 'All', minPrice: '', maxPrice: '', rating: '', sort: 'rating' };
            setLocalFilters(resetFilters);
            onFilterChange(resetFilters);
          }}
          className="w-full py-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
};

export default ServiceFilters;