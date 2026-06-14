import express from 'express';
import { 
  createDispute, 
  getDisputes, 
  getMyDisputes, 
  getDisputeById, 
  updateDisputeStatus, 
  deleteDispute,
  getDisputeStats
} from '../controllers/disputeController.js';
import { protect, adminOnly } from '../middleware/auth.js';
import { uploadMultiple } from '../middleware/upload.js';

const router = express.Router();

// ============ USER ROUTES ============
router.post('/', protect, uploadMultiple, createDispute);
router.get('/my-disputes', protect, getMyDisputes);
router.get('/:id', protect, getDisputeById);

// ============ ADMIN ROUTES ============
router.get('/', protect, adminOnly, getDisputes);
router.put('/:id/status', protect, adminOnly, updateDisputeStatus);
router.delete('/:id', protect, adminOnly, deleteDispute);
router.get('/stats', protect, adminOnly, getDisputeStats);

export default router;