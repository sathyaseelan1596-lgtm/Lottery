import express from 'express';
import jwt from 'jsonwebtoken';
import Admin from './schema/AdminSchema.js';
import protect from './middleware.js';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

// Helper to generate token
const generateToken = (id, username) => {
  return jwt.sign({ id, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// ─────────────────────────────────────────
// @route   POST /api/auth/register
// @desc    Register a new admin (secret key required)
// @access  Private (secret key)
// ─────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { username, password, secretKey } = req.body;

    // ✅ Validate secret key first
    const REGISTER_SECRET = process.env.REGISTER_SECRET;

    if (!REGISTER_SECRET) {
      return res.status(500).json({
        success: false,
        error: 'Registration is not configured properly. Set REGISTER_SECRET in .env'
      });
    }

    if (!secretKey || secretKey !== REGISTER_SECRET) {
      return res.status(403).json({
        success: false,
        error: 'Invalid registration key. Access denied.'
      });
    }

    // ✅ Validate fields
    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        error: 'Password must be at least 6 characters.' 
      });
    }

    // ✅ Check if admin already exists
    const existingAdmin = await Admin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({ 
        success: false, 
        error: 'Admin already exists.' 
      });
    }

    // ✅ Create admin
    const admin = await Admin.create({ username, password });
    const token = generateToken(admin._id, admin.username);

    res.status(201).json({
      success: true,
      message: 'Admin registered successfully.',
      token,
      admin: { id: admin._id, username: admin.username }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// @route   POST /api/auth/login
// @desc    Login and get token
// @access  Public
// ─────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username and password are required.' 
      });
    }

    // Find admin
    const admin = await Admin.findOne({ username });
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials.' 
      });
    }

    // Check password
    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        error: 'Invalid credentials.' 
      });
    }

    const token = generateToken(admin._id, admin.username);

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      admin: { id: admin._id, username: admin.username }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// @route   GET /api/auth/me
// @desc    Get current logged-in admin
// @access  Protected
// ─────────────────────────────────────────
router.get('/me', protect, async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    res.json({ success: true, admin });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export default router;