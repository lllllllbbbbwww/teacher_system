import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import {
  listStyleTags,
  createStyleTag,
  updateStyleTag,
  deleteStyleTag,
} from '../controllers/styleTag.js';

const router = express.Router();
router.use(authMiddleware);
router.get('/', listStyleTags);
router.post('/', createStyleTag);
router.put('/:id', updateStyleTag);
router.delete('/:id', deleteStyleTag);

export { router as styleTagRouter };
