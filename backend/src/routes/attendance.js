import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { batchEnterAttendance, listAttendance, attendanceSummary } from '../controllers/attendance.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', listAttendance);
router.get('/summary', attendanceSummary);
router.post('/batch', batchEnterAttendance);

export { router as attendanceRouter };
