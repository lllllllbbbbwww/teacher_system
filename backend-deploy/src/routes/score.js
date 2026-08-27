import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { batchEnterScores, listScores } from '../controllers/score.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', listScores);
router.post('/batch', batchEnterScores);

export { router as scoreRouter };
