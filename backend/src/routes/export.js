import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  exportExamExcel,
  exportAttendanceExcel,
  exportStudentPdf,
} from '../controllers/export.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/exam-excel', exportExamExcel);
router.get('/attendance-excel', exportAttendanceExcel);
router.get('/student-pdf', exportStudentPdf);

export { router as exportRouter };
