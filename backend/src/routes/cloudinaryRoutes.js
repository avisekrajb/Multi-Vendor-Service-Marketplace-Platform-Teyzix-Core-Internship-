import express from 'express';
import asyncHandler from 'express-async-handler';
import { protect, adminOnly } from '../middleware/auth.js';
import cloudinary from '../config/cloudinary.js';

const router = express.Router();

// All routes require admin authentication
router.use(protect, adminOnly);

// Get all Cloudinary photos
router.get('/photos', asyncHandler(async (req, res) => {
  try {
    const { folder, nextCursor } = req.query;
    let options = {
      type: 'upload',
      max_results: 100,
      resource_type: 'image'
    };
    
    if (folder && folder !== 'all') {
      options.prefix = folder;
    }
    
    if (nextCursor) {
      options.next_cursor = nextCursor;
    }
    
    const result = await cloudinary.api.resources(options);
    
    res.json({
      success: true,
      resources: result.resources,
      total: result.total_count,
      nextCursor: result.next_cursor
    });
  } catch (error) {
    console.error('Cloudinary API Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch Cloudinary photos', 
      error: error.message 
    });
  }
}));

// Get all Cloudinary folders
router.get('/folders', asyncHandler(async (req, res) => {
  try {
    const result = await cloudinary.api.root_folders();
    res.json({
      success: true,
      folders: result.folders || []
    });
  } catch (error) {
    console.error('Error fetching folders:', error);
    res.status(500).json({ message: 'Failed to fetch folders' });
  }
}));

// Get photos by folder
router.get('/folder/:folderName', asyncHandler(async (req, res) => {
  try {
    const { folderName } = req.params;
    const { nextCursor } = req.query;
    
    let options = {
      type: 'upload',
      prefix: folderName,
      max_results: 100,
      resource_type: 'image'
    };
    
    if (nextCursor) {
      options.next_cursor = nextCursor;
    }
    
    const result = await cloudinary.api.resources(options);
    
    res.json({
      success: true,
      resources: result.resources,
      folder: folderName,
      nextCursor: result.next_cursor
    });
  } catch (error) {
    console.error('Error fetching folder:', error);
    res.status(500).json({ message: 'Failed to fetch folder photos' });
  }
}));

// Get photo details
router.get('/photo/:publicId', asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;
    const result = await cloudinary.api.resource(publicId);
    res.json({
      success: true,
      resource: result
    });
  } catch (error) {
    console.error('Error fetching photo:', error);
    res.status(404).json({ message: 'Photo not found' });
  }
}));

// Delete photo
router.delete('/photo/:publicId', asyncHandler(async (req, res) => {
  try {
    const { publicId } = req.params;
    
    // Check if exists
    try {
      await cloudinary.api.resource(publicId);
    } catch (err) {
      return res.status(404).json({ message: 'Photo not found' });
    }
    
    const result = await cloudinary.uploader.destroy(publicId);
    
    if (result.result === 'ok') {
      res.json({ success: true, message: 'Photo deleted successfully' });
    } else {
      res.status(404).json({ message: 'Photo not found or could not be deleted' });
    }
  } catch (error) {
    console.error('Delete error:', error);
    res.status(500).json({ message: 'Failed to delete photo' });
  }
}));

// Bulk delete photos
router.post('/photos/bulk-delete', asyncHandler(async (req, res) => {
  try {
    const { publicIds } = req.body;
    
    if (!publicIds || !publicIds.length) {
      return res.status(400).json({ message: 'No public IDs provided' });
    }
    
    const results = await Promise.all(
      publicIds.map(async (publicId) => {
        try {
          const result = await cloudinary.uploader.destroy(publicId);
          return { publicId, success: result.result === 'ok' };
        } catch (err) {
          return { publicId, success: false, error: err.message };
        }
      })
    );
    
    const deletedCount = results.filter(r => r.success).length;
    
    res.json({
      success: true,
      message: `Deleted ${deletedCount} photos`,
      results
    });
  } catch (error) {
    console.error('Bulk delete error:', error);
    res.status(500).json({ message: 'Failed to delete photos' });
  }
}));

// Get Cloudinary usage stats
router.get('/stats', asyncHandler(async (req, res) => {
  try {
    const result = await cloudinary.api.usage();
    res.json({
      success: true,
      usage: {
        storage: result.storage,
        bandwidth: result.bandwidth,
        requests: result.requests,
        resources: result.resources
      }
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ message: 'Failed to fetch Cloudinary stats' });
  }
}));

export default router;