// ============================================
// FixMyCity - User Model
// Handles both Google (Firebase) and Email/Password users
// ============================================

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({

  // ---- Basic Info ----
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },

  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
  },

  phone: {
    type: String,
    trim: true,
    match: [/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'],
  },

  // ---- Profile ----
  profilePhoto: {
    url: { type: String, default: '' },
    publicId: { type: String, default: '' },
  },

  bio: {
    type: String,
    maxlength: [200, 'Bio cannot exceed 200 characters'],
    default: '',
  },

  // ---- Authentication ----
  // 'google' = logged in via Firebase Google OAuth
  // 'email'  = registered with email + password
  authProvider: {
    type: String,
    enum: ['google', 'email'],
    required: true,
    default: 'email',
  },

  // Only set for email/password users — NEVER for Google users
  // Google users may optionally set a password after registration
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false, // Never returned in queries by default
  },

  // Firebase UID — only for Google users
  firebaseUid: {
    type: String,
    sparse: true, // allows null for email users
    unique: true,
  },

  // ---- Location (user's home location) ----
  location: {
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
    pincode: { type: String, default: '' },
    address: { type: String, default: '' },
  },

  // ---- Role ----
  // 'citizen'   = regular user
  // 'municipal' = municipal corporation worker
  // 'admin'     = platform admin
  role: {
    type: String,
    enum: ['citizen', 'municipal', 'admin'],
    default: 'citizen',
  },

  // For municipal workers — which city/district they manage
  municipalArea: {
    state: { type: String, default: '' },
    district: { type: String, default: '' },
    city: { type: String, default: '' },
  },

  // ---- Stats ----
  issuesPosted: { type: Number, default: 0 },
  issuesResolved: { type: Number, default: 0 }, // for municipal

  // ---- Account Status ----
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },

}, { timestamps: true }); // adds createdAt, updatedAt automatically


// ---- HOOKS ----

// Hash password before saving (only if it was changed/set)
userSchema.pre('save', async function (next) {
  // Only hash if password field was modified
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});


// ---- METHODS ----

// Compare entered password with hashed password in DB
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Get safe public profile (no password, no sensitive info)
userSchema.methods.toPublicProfile = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    phone: this.phone,
    profilePhoto: this.profilePhoto,
    bio: this.bio,
    location: this.location,
    role: this.role,
    issuesPosted: this.issuesPosted,
    createdAt: this.createdAt,
  };
};


// ---- INDEXES ----
userSchema.index({ email: 1 });
userSchema.index({ firebaseUid: 1 });
userSchema.index({ 'location.city': 1, 'location.state': 1 });

module.exports = mongoose.model('User', userSchema);
