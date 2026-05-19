// ============================================
// FixMyCity - Auth Middleware
// Protects private routes by verifying JWT
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Verify JWT and attach user to req
const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Not authorized — please login' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: 'User not found or account deactivated' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token — please login again' });
  }
};

// Only allow municipal workers and admins
const municipalOnly = (req, res, next) => {
  if (req.user.role !== 'municipal' && req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Access restricted to municipal workers' });
  }
  next();
};

// Only allow admins
const adminOnly = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// Global error handler wrapper for async controllers
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = { protect, municipalOnly, adminOnly, asyncHandler };
