// ============================================
// FixMyCity - Main Server Entry Point v2
// ============================================

const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

dotenv.config();
connectDB();

const app = express();

// ---- CORS: allow citizen + municipal frontends ----
const allowedOrigins = [
  'http://localhost:3000',  // citizen (local dev)
  'http://localhost:5001',  // municipal (local dev)
  'http://127.0.0.1:3000',
  'http://127.0.0.1:5001',
  // Add your Netlify URLs here after deploy:
  // 'https://fixmycity-citizen.netlify.app',
  // 'https://fixmycity-municipal.netlify.app',
];
// Also read from env for easy deploy config
if (process.env.CITIZEN_URL)   allowedOrigins.push(process.env.CITIZEN_URL);
if (process.env.MUNICIPAL_URL) allowedOrigins.push(process.env.MUNICIPAL_URL);

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile, Postman, etc.)
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---- API ROUTES ----
app.use('/api/auth',             require('./routes/authRoutes'));
app.use('/api/issues',          require('./routes/issueRoutes'));
app.use('/api/comments',        require('./routes/commentRoutes'));
app.use('/api/municipal-comments', require('./routes/municipalCommentRoutes'));
app.use('/api/users',           require('./routes/userRoutes'));
app.use('/api/municipal',       require('./routes/municipalRoutes'));
app.use('/api/upload',          require('./routes/uploadRoutes'));
app.use('/api/location',        require('./routes/locationRoutes'));

// ---- HEALTH ----
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'FixMyCity API running ✅' }));

// ---- 404 ----
app.use('/api/*', (req, res) => res.status(404).json({ success: false, message: 'Route not found' }));

// ---- ERROR HANDLER ----
app.use((err, req, res, next) => {
  console.error('❌', err.stack);
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`\n🚀 FixMyCity API running on http://localhost:${PORT}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✅ Allowed origins: ${allowedOrigins.join(', ')}\n`);
});
