import express from 'express';
import asyncHandler from 'express-async-handler';
import { getUserProfile } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/profile', protect, asyncHandler(getUserProfile));

export default router;
