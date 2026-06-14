import express from 'express';
import { 
  createRequest, 
  getMyRequests, 
  getRequestById, 
  updateRequestStatus, 
  addAttachment,
  getAllRequests,
  getRequestsByProvider,
  getRequestsByCustomer,
  adminUpdateRequestStatus,
  deleteRequest,
  getRequestStats
} from '../controllers/requestController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// ============ PUBLIC ROUTES ============
// Get requests by provider ID (public) - ADD THIS
router.get('/provider/:providerId', getRequestsByProvider);

// ============ USER ROUTES ============
router.post('/', protect, createRequest);
router.get('/my-requests', protect, getMyRequests);
router.get('/:id', protect, getRequestById);
router.put('/:id/status', protect, updateRequestStatus);
router.post('/:id/attachments', protect, uploadMultiple, addAttachment);

// ============ ADMIN ROUTES ============
router.get('/admin/all', protect, adminOnly, getAllRequests);
router.get('/admin/provider/:providerId', protect, adminOnly, getRequestsByProvider);
router.get('/admin/customer/:customerId', protect, adminOnly, getRequestsByCustomer);
router.put('/admin/:id/status', protect, adminOnly, adminUpdateRequestStatus);
router.delete('/admin/:id', protect, adminOnly, deleteRequest);
router.get('/admin/stats', protect, adminOnly, getRequestStats);

export default router;