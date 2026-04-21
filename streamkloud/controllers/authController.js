import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import sendEmail from '../utils/sendEmail.js';
import crypto from 'crypto';

const generateToken = (id) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('Error: JWT_SECRET is not defined in environment variables.');
    return 'mock-token-secret-missing';
  }
  return jwt.sign({ id }, secret, {
    expiresIn: '30d',
  });
};

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
const registerUser = async (req, res) => {
  const { name, email, password, role } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400).json({ message: 'User already exists' });
    return;
  }

  const user = await User.create({
    name,
    email,
    password,
    role: email === 'rickylemar0@gmail.com' ? 'admin' : (role || 'user'),
  });

  if (user) {
    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(400).json({ message: 'Invalid user data' });
  }
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const authUser = async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      token: generateToken(user._id),
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
};

export { registerUser, authUser };

// @desc    Send verification email
// @route   POST /api/auth/send-verification
// @access  Public
export const sendVerificationCode = async (req, res) => {
  const { email } = req.body;
  console.log(`Attempting to send verification code to: ${email}`);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      console.log(`User not found in MongoDB: ${email}`);
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate 6 digit code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    user.verificationCode = verificationCode;
    user.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();

    const message = `Your verification code for StreamKloud is: ${verificationCode}. It expires in 10 minutes.`;

    try {
      await sendEmail({
        email: user.email,
        subject: 'StreamKloud Email Verification',
        message,
        html: `<h1>Email Verification</h1><p>Your verification code is: <strong>${verificationCode}</strong></p><p>It expires in 10 minutes.</p>`,
      });

      res.status(200).json({ success: true, message: 'Email sent' });
    } catch (error) {
      console.error('Email sending failed, falling back to console log:', error.message);
      
      // LOG TO CONSOLE SO USER CAN STILL VERIFY
      console.log('\n' + '█'.repeat(60));
      console.log('█' + ' '.repeat(58) + '█');
      console.log('█   DEVELOPMENT FALLBACK: VERIFICATION CODE' + ' '.repeat(16) + '█');
      console.log('█' + ' '.repeat(58) + '█');
      console.log(`█   EMAIL: ${user.email.padEnd(45)} █`);
      console.log(`█   CODE:  ${verificationCode.padEnd(45)} █`);
      console.log('█' + ' '.repeat(58) + '█');
      console.log('█'.repeat(60) + '\n');

      // Return success anyway so the user can proceed in the UI
      res.status(200).json({ 
        success: true, 
        message: 'Email delivery failed, but you can find your code in the server logs (Console).',
        isMock: true 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// @desc    Verify email token
// @route   POST /api/auth/verify-token
// @access  Public
export const verifyToken = async (req, res) => {
  const { email, token } = req.body;
  console.log(`Verifying token for: ${email}, token: ${token}`);

  try {
    const user = await User.findOne({
      email,
      verificationCode: token,
      verificationCodeExpires: { $gt: Date.now() },
    });

    if (!user) {
      console.log(`Invalid or expired token for: ${email}`);
      return res.status(400).json({ success: false, error: 'Invalid or expired verification code' });
    }

    user.isVerified = true;
    user.verificationCode = undefined;
    user.verificationCodeExpires = undefined;
    await user.save();

    res.status(200).json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server Error' });
  }
};
