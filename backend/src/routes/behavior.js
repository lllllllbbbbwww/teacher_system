import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listBehaviorTags,
  createBehaviorTag,
  deleteBehaviorTag,
  createStudentBehavior,
  listStudentBehavior,
} from '../controllers/behavior.js';

const router = express.Router();
router.use(authMiddleware);
// 行为标签库
router.get('/tags', listBehaviorTags);
router.post('/tags', createBehaviorTag);
router.delete('/tags/:id', deleteBehaviorTag);
// 学生行为记录
router.get('/records', listStudentBehavior);
router.post('/records', createStudentBehavior);

export { router as behaviorRouter };
