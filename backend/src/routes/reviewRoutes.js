import express from 'express';
import { 
  createReview, 
  getReviewsForProvider, 
  updateReview, 
  deleteReview, 
  respondToReview, 
  getMyReviews, 
  getAllReviews,
  getLatestReviews 
} from '../controllers/reviewController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Public routes
router.get('/latest', getLatestReviews);
router.get('/provider/:providerId', getReviewsForProvider);

// Protected routes
router.use(protect);
router.post('/', createReview);
router.get('/my-reviews', getMyReviews);
router.get('/', getAllReviews);
router.put('/:id', updateReview);
router.delete('/:id', deleteReview);
router.post('/:id/respond', respondToReview);

export default router;