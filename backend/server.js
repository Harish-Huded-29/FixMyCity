// ============================================
// FixMyCity - Main Server Entry Point
// ============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const app = express();

// ---- MIDDLEWARE ----
app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files (for local testing)
app.use('/municipal', express.static(path.join(__dirname, '../municipal')));
app.use(express.static(path.join(__dirname, '../frontend')));

// ---- API ROUTES ----
app.use('/api/auth',       require('./routes/authRoutes'));
app.use('/api/issues',     require('./routes/issueRoutes'));
app.use('/api/comments',   require('./routes/commentRoutes'));
app.use('/api/users',      require('./routes/userRoutes'));
app.use('/api/municipal',  require('./routes/municipalRoutes'));
app.use('/api/upload',     require('./routes/uploadRoutes'));
app.use('/api/location',   require('./routes/locationRoutes'));

// ---- HEALTH CHECK ----
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'FixMyCity API is running!' });
});

// ---- CATCH-ALL: serve frontend for all non-API routes ----
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../frontend/index.html'));
  }
});

// ---- ERROR HANDLER ----
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 FixMyCity server running on http://localhost:${PORT}`);
  console.log(`📁 Serving frontend from: ${path.join(__dirname, '../frontend')}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
