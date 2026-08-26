import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { examOverview } from '../controllers/analytics.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/exam-overview', examOverview);

export { router as analyticsRouter };
