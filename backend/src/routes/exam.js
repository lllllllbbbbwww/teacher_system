import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listExams, createExam, updateExam, deleteExam } from '../controllers/exam.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', listExams);
router.post('/', createExam);
router.put('/:id', updateExam);
router.delete('/:id', deleteExam);

export { router as examRouter };
