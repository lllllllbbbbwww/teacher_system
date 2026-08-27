import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listStudents,
  createStudents,
  updateStudent,
  deleteStudent,
  studentProfile,
} from '../controllers/student.js';

const router = express.Router();

router.use(authMiddleware); // 全部鉴权
router.get('/', listStudents);
router.get('/:id/profile', studentProfile);
router.post('/', createStudents);
router.put('/:id', updateStudent);
router.delete('/:id', deleteStudent);

export { router as studentRouter };
