import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { generateFeedback, listFeedback, getStudentCard } from '../controllers/feedback.js';

const router = express.Router();
router.use(authMiddleware);
router.post('/generate', generateFeedback);
router.get('/student-card', getStudentCard);
router.get('/', listFeedback);

export { router as feedbackRouter };
