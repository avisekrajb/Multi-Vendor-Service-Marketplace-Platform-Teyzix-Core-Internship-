import express from 'express';
import { generateReport, getReports } from '../controllers/reportController.js';
import { protect, adminOnly } from '../middleware/auth.js';

const router = express.Router();

router.use(protect, adminOnly);
router.post('/generate', generateReport);
router.get('/', getReports);

export default router;