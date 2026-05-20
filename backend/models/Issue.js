// ============================================
// FixMyCity - Issue Model
// Core model for civic complaints/issues
// ============================================

const mongoose = require('mongoose');

// Sub-schema for media files (photos/videos)
const mediaSchema = new mongoose.Schema({
  url:          { type: String, required: true },  // Cloudinary URL
  publicId:     { type: String, required: true },  // Cloudinary public_id (for deletion)
  resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
  thumbnail:    { type: String, default: '' },     // Thumbnail URL for videos
}, { _id: false });

// Sub-schema for location
const locationSchema = new mongoose.Schema({
  state:    { type: String, required: true },
  district: { type: String, required: true },
  city:     { type: String, required: true },
  pincode:  { type: String, default: '' },
  address:  { type: String, default: '' },       // Full text address
  // GPS coordinates (optional — from browser if user allows)
  coordinates: {
    lat: { type: Number, default: null },
    lng: { type: Number, default: null },
  },
}, { _id: false });

const issueSchema = new mongoose.Schema({

  // ---- Content ----
  title: {
    type: String,
    required: [true, 'Issue title is required'],
    trim: true,
    maxlength: [150, 'Title cannot exceed 150 characters'],
  },

  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },

  category: {
    type: String,
    required: true,
    enum: [
      'pothole',
      'road_damage',
      'garbage',
      'drainage',
      'streetlight',
      'water_supply',
      'electricity',
      'tree_fallen',
      'illegal_construction',
      'noise_pollution',
      'other',
    ],
    default: 'other',
  },

  // ---- Media ----
  media: [mediaSchema], // Array of photos/videos (max 5)

  // ---- Location ----
  location: { type: locationSchema, required: true },

  // ---- Author ----
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // Anonymous posting: true = hide user identity publicly
  isAnonymous: {
    type: Boolean,
    default: false,
  },

  // ---- Status ----
  // open       = newly posted, not yet addressed
  // in_progress = municipal is working on it
  // resolved   = municipal has fixed it
  // reopened   = user reported it's not actually fixed
  // closed     = admin closed it
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'reopened', 'closed'],
    default: 'open',
  },

  // ---- Municipal Resolution ----
  // Set when municipal marks the issue as resolved
  resolution: {
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    description: { type: String, default: '' },
    media: [mediaSchema], // Photos/videos of the fix
    resolvedAt: { type: Date, default: null },
  },

  // ---- Reopen History ----
  // Each time a user reopens a resolved issue
  reopenHistory: [{
    reopenedBy:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason:      { type: String, default: '' },
    media:       [mediaSchema],
    reopenedAt:  { type: Date, default: Date.now },
  }],

  // ---- Engagement ----
  upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],    // Users who upvoted
  upvoteCount: { type: Number, default: 0 },

  commentCount: { type: Number, default: 0 },

  // Users who "watched" this issue (get updates)
  watchers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // ---- Municipal Assignment ----
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  // ---- Flags ----
  isFlagged: { type: Boolean, default: false },    // Flagged for review
  isDeleted: { type: Boolean, default: false },    // Soft delete

}, { timestamps: true });


// ---- INDEXES (for fast location-based queries) ----
issueSchema.index({ 'location.city': 1, 'location.state': 1 });
issueSchema.index({ 'location.district': 1 });
issueSchema.index({ status: 1 });
issueSchema.index({ postedBy: 1 });
issueSchema.index({ category: 1 });
issueSchema.index({ createdAt: -1 });
issueSchema.index({ upvoteCount: -1 });

module.exports = mongoose.model('Issue', issueSchema);
