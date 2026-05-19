// ============================================
// FixMyCity - Auth Controller
// Handles Google (Firebase) and Email/Password auth
// ============================================

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const initializeFirebase = require('../config/firebase');

// ---- Helper: Generate JWT ----
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '30d' }
  );
};

// ---- Helper: Send token response ----
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id);
  res.status(statusCode).json({
    success: true,
    token,
    user: user.toPublicProfile(),
  });
};


// ============================================
// @route   POST /api/auth/google
// @desc    Google login via Firebase token
// @access  Public
// ============================================
const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({ success: false, message: 'Firebase ID token is required' });
  }

  // Verify the Firebase token
  const admin = initializeFirebase();
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired Google token' });
  }

  const { uid, email, name, picture } = decodedToken;

  // Check if user already exists in our DB
  let user = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] });

  if (user) {
    // Existing user — update Firebase UID if missing
    if (!user.firebaseUid) {
      user.firebaseUid = uid;
      await user.save();
    }
    return sendTokenResponse(user, 200, res);
  }

  // New user — signal frontend to collect extra info
  // We return the Google profile data so frontend can pre-fill the registration form
  return res.status(200).json({
    success: true,
    isNewUser: true,
    googleProfile: { uid, email, name, picture },
    message: 'New user — please complete registration',
  });
};


// ============================================
// @route   POST /api/auth/google/register
// @desc    Complete registration for new Google users
// @access  Public
// ============================================
const googleRegister = async (req, res) => {
  const { idToken, name, phone, password, location } = req.body;

  if (!idToken || !name || !phone || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }

  // Re-verify Firebase token
  const admin = initializeFirebase();
  let decodedToken;
  try {
    decodedToken = await admin.auth().verifyIdToken(idToken);
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid Google token' });
  }

  const { uid, email, picture } = decodedToken;

  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ firebaseUid: uid }, { email }] });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Account already exists. Please login.' });
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    phone,
    password,         // Will be hashed by the pre-save hook
    firebaseUid: uid,
    authProvider: 'google',
    profilePhoto: { url: picture || '', publicId: '' },
    location: location || {},
  });

  sendTokenResponse(user, 201, res);
};


// ============================================
// @route   POST /api/auth/register
// @desc    Email/Password registration
// @access  Public
// ============================================
const registerWithEmail = async (req, res) => {
  const { name, email, phone, password, location } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
  }

  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  // Check if user already exists
  const existingUser = await User.findOne({ email: email.toLowerCase() });
  if (existingUser) {
    return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
  }

  // Create user (password will be hashed by pre-save hook)
  const user = await User.create({
    name,
    email,
    phone,
    password,
    authProvider: 'email',
    location: location || {},
  });

  sendTokenResponse(user, 201, res);
};


// ============================================
// @route   POST /api/auth/login
// @desc    Email/Password login
// @access  Public
// ============================================
const loginWithEmail = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required' });
  }

  // Find user (include password for comparison)
  const user = await User.findOne({ email: email.toLowerCase() }).select('+password');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  // Google-only user trying to login with password
  if (user.authProvider === 'google' && !user.password) {
    return res.status(400).json({
      success: false,
      message: 'This account uses Google login. Please sign in with Google.',
    });
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }

  sendTokenResponse(user, 200, res);
};


// ============================================
// @route   GET /api/auth/me
// @desc    Get currently logged-in user
// @access  Private
// ============================================
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }
  res.json({ success: true, user: user.toPublicProfile() });
};


// ============================================
// @route   PUT /api/auth/change-password
// @desc    Change password (for email users)
// @access  Private
// ============================================
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!user.password) {
    return res.status(400).json({ success: false, message: 'No password set for this account' });
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters' });
  }

  user.password = newPassword;
  await user.save();

  res.json({ success: true, message: 'Password updated successfully' });
};

// ============================================
// @route   POST /api/auth/register-municipal
// @desc    Municipal worker self-registration
// @access  Public
// ============================================
const registerMunicipal = async (req, res) => {
  const { name, email, phone, password, employeeId, department, location, municipalArea } = req.body;

  if (!name || !email || !password || !municipalArea?.city) {
    return res.status(400).json({ success: false, message: 'Name, email, password, and assigned city are required' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'Email already registered. Please login.' });
  }

  const user = await User.create({
    name, email, phone, password,
    authProvider: 'email',
    role: 'municipal',
    isVerified: false,     // Admin must verify
    location: location || municipalArea,
    municipalArea: {
      state:    municipalArea.state    || '',
      district: municipalArea.district || '',
      city:     municipalArea.city     || '',
    },
    // Store extra municipal fields in bio for now
    bio: `Employee ID: ${employeeId||'N/A'} | Dept: ${department||'N/A'}`,
  });

  sendTokenResponse(user, 201, res);
};

module.exports = {
  googleLogin,
  googleRegister,
  registerWithEmail,
  registerMunicipal,
  loginWithEmail,
  getMe,
  changePassword,
};
