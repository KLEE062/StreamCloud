import express from 'express';
import asyncHandler from 'express-async-handler';
import { registerUser, authUser, sendVerificationCode, verifyToken } from '../controllers/authController.js';

const router = express.Router();

router.post('/register', asyncHandler(registerUser));
router.post('/login', asyncHandler(authUser));
router.post('/send-verification', asyncHandler(sendVerificationCode));
router.post('/verify-token', asyncHandler(verifyToken));

export default router;
