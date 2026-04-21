import express from 'express';
import asyncHandler from 'express-async-handler';
import { getArtists, createArtist } from '../controllers/artistController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.route('/').get(asyncHandler(getArtists)).post(protect, asyncHandler(createArtist));

export default router;
