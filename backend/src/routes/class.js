import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import { listClasses, createClass, updateClass, deleteClass } from '../controllers/class.js';

const router = express.Router();

router.use(authMiddleware); // 全部鉴权
router.get('/', listClasses);
router.post('/', createClass);
router.put('/:id', updateClass);
router.delete('/:id', deleteClass);

export { router as classRouter };
