// ============================================
// FixMyCity - Comment Model
// Handles comments, escalations, and appreciation reviews
// ============================================

const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({

  issue: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Issue',
    required: true,
  },

  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  text: {
    type: String,
    required: [true, 'Comment text is required'],
    trim: true,
    maxlength: [1000, 'Comment cannot exceed 1000 characters'],
  },

  // Type of comment:
  // 'comment'     = regular comment (also experiencing this issue)
  // 'escalation'  = user escalating urgency
  // 'appreciation' = praising municipal work / improvement
  // 'review'      = detailed review of resolution quality (1-5 stars)
  // 'reopen'      = explanation when user reopens ticket
  type: {
    type: String,
    enum: ['comment', 'escalation', 'appreciation', 'review', 'reopen'],
    default: 'comment',
  },

  // Rating for 'review' type comments (1-5 stars)
  rating: {
    type: Number,
    min: 1,
    max: 5,
    default: null,
  },

  // Optional media attachments on comments
  media: [{
    url:          { type: String },
    publicId:     { type: String },
    resourceType: { type: String, enum: ['image', 'video'], default: 'image' },
  }],

  // Likes on comment
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },

  isDeleted: { type: Boolean, default: false },

}, { timestamps: true });

commentSchema.index({ issue: 1, createdAt: 1 });
commentSchema.index({ author: 1 });
commentSchema.index({ type: 1 });

module.exports = mongoose.model('Comment', commentSchema);
