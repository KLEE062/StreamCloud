import express from 'express';
import asyncHandler from 'express-async-handler';
import { getAlbums, createAlbum } from '../controllers/albumController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(asyncHandler(getAlbums)).post(protect, asyncHandler(createAlbum));

export default router;
