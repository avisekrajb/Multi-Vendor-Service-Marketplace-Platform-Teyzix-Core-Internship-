import express from 'express';
import { 
  getServices, 
  getServiceById, 
  createService, 
  updateService, 
  deleteService, 
  approveService, 
  rejectService, 
  getMyServices,
  getAllServicesForAdmin,
  getServicesByProvider
} from '../controllers/serviceController.js';
import { protect, adminOnly, providerOnly } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

// ============ PUBLIC ROUTES (No authentication needed) ============
router.get('/', getServices);

// Get services by provider ID (public) - ADD THIS BEFORE PARAM ROUTES
router.get('/provider/:providerId', getServicesByProvider);

// ============ SPECIFIC ROUTES MUST COME BEFORE PARAM ROUTES ============
// Get my services (provider) - exact match
router.get('/my-services', protect, providerOnly, getMyServices);

// Get all services for admin - exact match  
router.get('/admin/all', protect, adminOnly, getAllServicesForAdmin);

// Create new service
router.post('/', protect, providerOnly, upload.single('image'), createService);

// ============ PARAMETER ROUTES (These come last) ============
// Get service by ID - this will match /:id
router.get('/:id', getServiceById);

// Update service by ID
router.put('/:id', protect, providerOnly, upload.single('image'), updateService);

// Delete service by ID
router.delete('/:id', protect, providerOnly, deleteService);

// Admin actions by ID
router.put('/:id/approve', protect, adminOnly, approveService);
router.put('/:id/reject', protect, adminOnly, rejectService);

export default router;