import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const CloudinaryPhotos = () => {
  const { user, loading: authLoading } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [categories, setCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // grid, large, mini
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [selectMode, setSelectMode] = useState(false);
  const [usageStats, setUsageStats] = useState({
    used: 0,
    total: 25, // 25 GB free space
    percentage: 0
  });

  const isAdmin = user?.role === 'admin';
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

  // Fetch photos from backend
  const fetchCloudinaryPhotos = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`${API_URL}/admin/cloudinary/photos`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const allPhotos = response.data.resources || [];
      // Sort by creation date - recent at top
      const sortedPhotos = allPhotos.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setPhotos(sortedPhotos);
      
      // Calculate used space in GB
      const totalBytes = sortedPhotos.reduce((sum, photo) => sum + photo.bytes, 0);
      const usedGB = totalBytes / (1024 * 1024 * 1024);
      const usedPercent = (usedGB / 25) * 100;
      
      setUsageStats({
        used: usedGB.toFixed(2),
        total: 25,
        percentage: Math.min(usedPercent, 100)
      });
      
      // Extract unique folders
      const uniqueFolders = [...new Set(sortedPhotos.map(photo => photo.folder || 'Uncategorized'))];
      setCategories(['all', ...uniqueFolders]);
      
      toast.success(`Loaded ${allPhotos.length} photos`);
    } catch (error) {
      console.error('Error fetching Cloudinary photos:', error);
      toast.error(error.response?.data?.message || 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  // Delete single photo
  const handleDeletePhoto = async (publicId) => {
    if (!window.confirm('Are you sure you want to delete this photo permanently?')) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('accessToken');
      await axios.delete(`${API_URL}/admin/cloudinary/photo/${encodeURIComponent(publicId)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      toast.success('Photo deleted successfully');
      setPhotos(photos.filter(photo => photo.public_id !== publicId));
      setSelectedPhoto(null);
      setSelectedPhotos([]);
      setSelectMode(false);
      fetchCloudinaryPhotos(); // Refresh stats
    } catch (error) {
      console.error('Error deleting photo:', error);
      toast.error(error.response?.data?.message || 'Failed to delete photo');
    } finally {
      setDeleting(false);
    }
  };

  // Bulk delete selected photos
  const handleBulkDelete = async () => {
    if (selectedPhotos.length === 0) {
      toast.error('No photos selected');
      return;
    }
    
    if (!window.confirm(`Delete ${selectedPhotos.length} photos? This cannot be undone.`)) return;
    
    setDeleting(true);
    let deleted = 0;
    for (const publicId of selectedPhotos) {
      try {
        const token = localStorage.getItem('accessToken');
        await axios.delete(`${API_URL}/admin/cloudinary/photo/${encodeURIComponent(publicId)}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        deleted++;
      } catch (err) {
        console.error('Error deleting:', publicId);
      }
    }
    
    toast.success(`Deleted ${deleted} photos`);
    setSelectedPhotos([]);
    setSelectMode(false);
    fetchCloudinaryPhotos();
    setDeleting(false);
  };

  // Toggle photo selection
  const toggleSelect = (publicId) => {
    setSelectedPhotos(prev => 
      prev.includes(publicId) 
        ? prev.filter(id => id !== publicId)
        : [...prev, publicId]
    );
  };

  // Select all photos
  const selectAll = () => {
    if (selectedPhotos.length === filteredPhotos.length) {
      setSelectedPhotos([]);
    } else {
      setSelectedPhotos(filteredPhotos.map(p => p.public_id));
    }
  };

  useEffect(() => {
    if (!authLoading && isAdmin) {
      fetchCloudinaryPhotos();
    }
  }, [authLoading, isAdmin]);

  // Filter photos
  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = selectedCategory === 'all' || 
      (photo.folder || 'Uncategorized') === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      photo.public_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (photo.folder || '').toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  if (authLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/home" replace />;
  }

  // Render different views
  const renderGridView = () => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
      {filteredPhotos.map((photo) => (
        <div
          key={photo.public_id}
          className={`group bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 ${
            selectMode ? 'cursor-pointer' : ''
          } ${selectedPhotos.includes(photo.public_id) ? 'ring-2 ring-indigo-600 ring-offset-2' : ''}`}
          onClick={() => selectMode && toggleSelect(photo.public_id)}
        >
          <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={photo.secure_url}
              alt={photo.public_id}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
              onDoubleClick={() => !selectMode && setSelectedPhoto(photo)}
            />
            {selectMode && (
              <div className="absolute top-2 left-2">
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                  selectedPhotos.includes(photo.public_id) 
                    ? 'bg-indigo-600 border-indigo-600' 
                    : 'bg-white/80 border-gray-400'
                }`}>
                  {selectedPhotos.includes(photo.public_id) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            )}
            <div className="absolute top-2 right-2 bg-black/70 text-white text-xs px-1.5 py-0.5 rounded">
              {photo.format?.toUpperCase()}
            </div>
          </div>
          <div className="p-2">
            <div className="text-xs text-gray-500 truncate">{photo.public_id?.split('/').pop()?.slice(-15)}</div>
            <div className="text-xs text-gray-400">{Math.round(photo.bytes / 1024)} KB</div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderLargeView = () => (
    <div className="space-y-4">
      {filteredPhotos.map((photo) => (
        <div
          key={photo.public_id}
          className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex ${
            selectMode ? 'cursor-pointer' : ''
          } ${selectedPhotos.includes(photo.public_id) ? 'ring-2 ring-indigo-600' : ''}`}
          onClick={() => selectMode && toggleSelect(photo.public_id)}
        >
          <div className="w-48 h-48 flex-shrink-0 overflow-hidden bg-gray-100 dark:bg-gray-700">
            <img
              src={photo.secure_url}
              alt={photo.public_id}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onDoubleClick={() => !selectMode && setSelectedPhoto(photo)}
            />
          </div>
          <div className="flex-1 p-4">
            {selectMode && (
              <div className="mb-2">
                <div className={`inline-flex w-5 h-5 rounded border-2 items-center justify-center ${
                  selectedPhotos.includes(photo.public_id) 
                    ? 'bg-indigo-600 border-indigo-600' 
                    : 'bg-white border-gray-400'
                }`}>
                  {selectedPhotos.includes(photo.public_id) && (
                    <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            )}
            <div className="space-y-2">
              <div>
                <label className="text-xs text-gray-500">Public ID:</label>
                <p className="text-sm font-mono break-all">{photo.public_id}</p>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div><span className="text-gray-500">Size:</span> {Math.round(photo.bytes / 1024)} KB</div>
                <div><span className="text-gray-500">Dimensions:</span> {photo.width} x {photo.height}</div>
                <div><span className="text-gray-500">Format:</span> {photo.format?.toUpperCase()}</div>
                <div><span className="text-gray-500">Folder:</span> {photo.folder || 'Root'}</div>
                <div className="col-span-2"><span className="text-gray-500">Created:</span> {new Date(photo.created_at).toLocaleString()}</div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeletePhoto(photo.public_id);
                }}
                disabled={deleting}
                className="mt-2 px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors disabled:opacity-50"
              >
                Delete Photo
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  const renderMiniView = () => (
    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-2">
      {filteredPhotos.map((photo) => (
        <div
          key={photo.public_id}
          className={`relative group cursor-pointer ${
            selectedPhotos.includes(photo.public_id) ? 'ring-2 ring-indigo-600 ring-offset-2' : ''
          }`}
          onClick={() => selectMode ? toggleSelect(photo.public_id) : setSelectedPhoto(photo)}
        >
          <div className="aspect-square overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
            <img
              src={photo.secure_url}
              alt={photo.public_id}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              loading="lazy"
            />
          </div>
          {selectMode && (
            <div className="absolute top-1 left-1">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                selectedPhotos.includes(photo.public_id) 
                  ? 'bg-indigo-600 border-indigo-600' 
                  : 'bg-white/80 border-gray-400'
              }`}>
                {selectedPhotos.includes(photo.public_id) && (
                  <svg className="w-2 h-2 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Modern Header - Hidden by default, appears on scroll */}
      <header className="sticky top-0 z-20 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 py-4">
          {/* Storage Stats */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Cloudinary Media Library
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {photos.length} photos • {filteredPhotos.length} showing
                </p>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  {usageStats.used} GB / {usageStats.total} GB used
                </div>
                <div className="text-xs text-gray-500">
                  {((usageStats.total - usageStats.used) / usageStats.total * 100).toFixed(1)}% free
                </div>
              </div>
            </div>
            <div className="relative w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="absolute left-0 top-0 h-full bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full transition-all duration-500"
                style={{ width: `${usageStats.percentage}%` }}
              />
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-wrap gap-3 items-center justify-between">
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                title="Grid View"
              >
                ⊞
              </button>
              <button
                onClick={() => setViewMode('large')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'large' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                title="Large View"
              >
                ▤
              </button>
              <button
                onClick={() => setViewMode('mini')}
                className={`p-2 rounded-lg transition-all ${viewMode === 'mini' ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'}`}
                title="Mini View"
              >
                ⋮⋮
              </button>
            </div>

            <div className="flex gap-2">
              {selectMode && (
                <>
                  <button
                    onClick={selectAll}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {selectedPhotos.length === filteredPhotos.length ? 'Deselect All' : 'Select All'}
                  </button>
                  <button
                    onClick={handleBulkDelete}
                    disabled={selectedPhotos.length === 0 || deleting}
                    className="px-3 py-1.5 text-sm bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:opacity-50"
                  >
                    Delete {selectedPhotos.length > 0 && `(${selectedPhotos.length})`}
                  </button>
                  <button
                    onClick={() => {
                      setSelectMode(false);
                      setSelectedPhotos([]);
                    }}
                    className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg"
                  >
                    Cancel
                  </button>
                </>
              )}
              
              {!selectMode && (
                <button
                  onClick={() => setSelectMode(true)}
                  className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Select Multiple
                </button>
              )}
              
              <button
                onClick={fetchCloudinaryPhotos}
                disabled={loading}
                className="px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
              >
                {loading ? '...' : '⟳ Refresh'}
              </button>
            </div>
          </div>

          {/* Search & Filter */}
          <div className="mt-3 flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Search by ID or folder..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
            >
              {categories.map(cat => (
                <option key={cat} value={cat}>
                  {cat === 'all' ? '📷 All Folders' : `📁 ${cat}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">📸</div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Photos Found</h3>
            <p className="text-gray-500">Try adjusting your search or filter</p>
          </div>
        ) : (
          <>
            {viewMode === 'grid' && renderGridView()}
            {viewMode === 'large' && renderLargeView()}
            {viewMode === 'mini' && renderMiniView()}
          </>
        )}
      </main>

      {/* Photo Detail Modal */}
      {selectedPhoto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90" onClick={() => setSelectedPhoto(null)}>
          <div className="relative max-w-5xl max-h-[90vh] bg-white dark:bg-gray-800 rounded-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelectedPhoto(null)} className="absolute top-4 right-4 z-10 w-8 h-8 bg-black/50 hover:bg-black/70 rounded-full flex items-center justify-center text-white text-xl">✕</button>
            <div className="flex flex-col md:flex-row">
              <div className="md:w-2/3 bg-gray-100 dark:bg-gray-900 flex items-center justify-center p-4">
                <img src={selectedPhoto.secure_url} alt={selectedPhoto.public_id} className="max-w-full max-h-[60vh] object-contain" />
              </div>
              <div className="md:w-1/3 p-6 overflow-y-auto max-h-[90vh]">
                <h3 className="text-lg font-bold mb-4">Photo Details</h3>
                <div className="space-y-3 text-sm">
                  <div><label className="text-gray-500 block text-xs">Public ID</label><p className="font-mono text-xs break-all">{selectedPhoto.public_id}</p></div>
                  <div><label className="text-gray-500 block text-xs">Format</label><p>{selectedPhoto.format?.toUpperCase()}</p></div>
                  <div><label className="text-gray-500 block text-xs">Dimensions</label><p>{selectedPhoto.width} x {selectedPhoto.height}</p></div>
                  <div><label className="text-gray-500 block text-xs">Size</label><p>{Math.round(selectedPhoto.bytes / 1024)} KB</p></div>
                  <div><label className="text-gray-500 block text-xs">Folder</label><p>{selectedPhoto.folder || 'Root'}</p></div>
                  <div><label className="text-gray-500 block text-xs">Created</label><p>{new Date(selectedPhoto.created_at).toLocaleString()}</p></div>
                </div>
                <div className="flex gap-3 mt-6">
                  <a href={selectedPhoto.secure_url} download className="flex-1 px-4 py-2 bg-indigo-600 text-white text-center rounded-lg hover:bg-indigo-700">Download</a>
                  <button onClick={() => handleDeletePhoto(selectedPhoto.public_id)} className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600">Delete</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudinaryPhotos;