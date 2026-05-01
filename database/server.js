import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import Setting from './schema/SettingSchema.js';
import protect from './middleware.js';
import authRoutes from './authRoutes.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Root route
app.get('/', (req, res) => {
  res.send('API is running 🚀');
});

// MongoDB connection
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/lotteryDB')
  .then(() => console.log('MongoDB Connected ✅'))
  .catch(err => console.error('MongoDB Error ❌', err));

// ─────────────────────────────────────────
// Auth Routes (public)
// ─────────────────────────────────────────
app.use('/api/auth', authRoutes);

// ─────────────────────────────────────────
// GET settings - PUBLIC (anyone can view)
// ─────────────────────────────────────────
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await Setting.findOne();
    res.json(settings || {});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────
// POST settings - PROTECTED (admin only) ✅
// ─────────────────────────────────────────
app.post('/api/settings', protect, async (req, res) => {
  try {
    const updatedSettings = await Setting.findOneAndUpdate(
      {},
      req.body,
      { upsert: true, new: true }
    );
    res.json({ 
      success: true, 
      message: `Settings updated by admin: ${req.admin.username}`,
      data: updatedSettings 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─────────────────────────────────────────
// DELETE settings - PROTECTED (admin only) ✅
// ─────────────────────────────────────────
app.delete('/api/settings', protect, async (req, res) => {
  try {
    await Setting.findOneAndDelete({});
    res.json({ 
      success: true, 
      message: `Settings deleted by admin: ${req.admin.username}` 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT} 🚀`));