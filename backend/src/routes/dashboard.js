import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { dashboardSummary } from '../controllers/dashboard.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/summary', dashboardSummary);

export { router as dashboardRouter };
