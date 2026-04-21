import express from 'express';
import asyncHandler from 'express-async-handler';
import {
  getSongs,
  getSongById,
  createSong,
  deleteSong,
} from '../controllers/songController.js';
import { protect, admin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(asyncHandler(getSongs)).post(protect, asyncHandler(createSong));
router.route('/:id').get(asyncHandler(getSongById)).delete(protect, admin, asyncHandler(deleteSong));

export default router;
