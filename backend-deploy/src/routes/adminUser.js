import express from 'express';
import { listUsers, createUser, updateUser, deleteUser } from '../controllers/adminUser.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// 所有接口均需登录 + 管理员权限
router.use(authMiddleware, requireAdmin);

router.get('/', listUsers);
router.post('/', createUser);
router.put('/:id', updateUser);
router.delete('/:id', deleteUser);

export { router as adminUserRouter };
