// ============================================
// FixMyCity - Issue Controller
// All CRUD operations for civic issues
// ============================================

const Issue = require('../models/Issue');
const User = require('../models/User');
const Comment = require('../models/Comment');

// ============================================
// @route   GET /api/issues
// @desc    Get issues (filtered by location, category, status)
// @access  Public
// ============================================
const getIssues = async (req, res) => {
  const {
    city, state, district,
    category, status,
    page = 1, limit = 10,
    sort = 'newest',
  } = req.query;

  // Build filter
  const filter = { isDeleted: false };
  if (city)     filter['location.city']     = { $regex: new RegExp(city, 'i') };
  if (state)    filter['location.state']    = { $regex: new RegExp(state, 'i') };
  if (district) filter['location.district'] = { $regex: new RegExp(district, 'i') };
  if (category) filter.category = category;
  if (status)   filter.status   = status;

  // Sort options
  const sortMap = {
    newest:    { createdAt: -1 },
    oldest:    { createdAt:  1 },
    popular:   { upvoteCount: -1 },
    comments:  { commentCount: -1 },
  };
  const sortOption = sortMap[sort] || { createdAt: -1 };

  const skip = (parseInt(page) - 1) * parseInt(limit);
  const total = await Issue.countDocuments(filter);

  const issues = await Issue.find(filter)
    .sort(sortOption)
    .skip(skip)
    .limit(parseInt(limit))
    .populate('postedBy', 'name profilePhoto location')
    .populate('assignedTo', 'name');

  // For anonymous posts — hide author details in the response
  const sanitized = issues.map(issue => {
    const obj = issue.toObject();
    if (obj.isAnonymous) {
      obj.postedBy = { name: 'Anonymous', profilePhoto: { url: '' } };
    }
    return obj;
  });

  res.json({
    success: true,
    count: issues.length,
    total,
    totalPages: Math.ceil(total / parseInt(limit)),
    currentPage: parseInt(page),
    issues: sanitized,
  });
};


// ============================================
// @route   GET /api/issues/:id
// @desc    Get single issue with full details
// @access  Public
// ============================================
const getIssueById = async (req, res) => {
  const issue = await Issue.findOne({ _id: req.params.id, isDeleted: false })
    .populate('postedBy', 'name profilePhoto location')
    .populate('resolution.resolvedBy', 'name profilePhoto')
    .populate('assignedTo', 'name profilePhoto')
    .populate('reopenHistory.reopenedBy', 'name profilePhoto');

  if (!issue) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }

  const obj = issue.toObject();
  if (obj.isAnonymous) {
    obj.postedBy = { name: 'Anonymous', profilePhoto: { url: '' } };
  }

  // Get comments for this issue
  const comments = await Comment.find({ issue: issue._id, isDeleted: false })
    .sort({ createdAt: 1 })
    .populate('author', 'name profilePhoto role');

  res.json({ success: true, issue: obj, comments });
};


// ============================================
// @route   POST /api/issues
// @desc    Create a new issue
// @access  Private (logged in users only)
// ============================================
const createIssue = async (req, res) => {
  const {
    title, description, category,
    location, isAnonymous,
  } = req.body;

  if (!title || !description || !category || !location) {
    return res.status(400).json({ success: false, message: 'Title, description, category, and location are required' });
  }

  // Parse location (comes as JSON string from form)
  let parsedLocation;
  try {
    parsedLocation = typeof location === 'string' ? JSON.parse(location) : location;
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid location data' });
  }

  // Handle uploaded media files (from Cloudinary via multer)
  const media = (req.files || []).map(file => ({
    url:          file.path,           // Cloudinary URL
    publicId:     file.filename,       // Cloudinary public_id
    resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
  }));

  const issue = await Issue.create({
    title,
    description,
    category,
    location: parsedLocation,
    isAnonymous: isAnonymous === 'true' || isAnonymous === true,
    postedBy: req.user.id,
    media,
  });

  // Update user's issue count
  await User.findByIdAndUpdate(req.user.id, { $inc: { issuesPosted: 1 } });

  const populated = await issue.populate('postedBy', 'name profilePhoto');
  res.status(201).json({ success: true, issue: populated });
};


// ============================================
// @route   PUT /api/issues/:id
// @desc    Update issue (title, description, etc.)
// @access  Private (only the author, before resolution)
// ============================================
const updateIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue || issue.isDeleted) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }

  if (issue.postedBy.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to edit this issue' });
  }

  if (issue.status === 'resolved') {
    return res.status(400).json({ success: false, message: 'Cannot edit a resolved issue' });
  }

  const { title, description, category } = req.body;
  if (title)       issue.title = title;
  if (description) issue.description = description;
  if (category)    issue.category = category;

  await issue.save();
  res.json({ success: true, issue });
};


// ============================================
// @route   DELETE /api/issues/:id
// @desc    Soft-delete issue (only if not resolved by municipal)
// @access  Private (only the author)
// ============================================
const deleteIssue = async (req, res) => {
  const issue = await Issue.findById(req.params.id);

  if (!issue || issue.isDeleted) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }

  if (issue.postedBy.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized to delete this issue' });
  }

  // RULE: Cannot delete if municipal has posted a resolution
  if (issue.resolution && issue.resolution.resolvedAt) {
    return res.status(400).json({
      success: false,
      message: 'Cannot delete this issue — municipal has already posted a resolution.',
    });
  }

  issue.isDeleted = true;
  await issue.save();

  // Update user's post count
  await User.findByIdAndUpdate(req.user.id, { $inc: { issuesPosted: -1 } });

  res.json({ success: true, message: 'Issue deleted successfully' });
};


// ============================================
// @route   POST /api/issues/:id/upvote
// @desc    Toggle upvote on an issue
// @access  Private
// ============================================
const toggleUpvote = async (req, res) => {
  const issue = await Issue.findById(req.params.id);
  if (!issue || issue.isDeleted) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }

  const userId = req.user.id;
  const hasUpvoted = issue.upvotes.includes(userId);

  if (hasUpvoted) {
    // Remove upvote
    issue.upvotes.pull(userId);
    issue.upvoteCount = Math.max(0, issue.upvoteCount - 1);
  } else {
    // Add upvote
    issue.upvotes.push(userId);
    issue.upvoteCount += 1;
  }

  await issue.save();
  res.json({ success: true, upvoteCount: issue.upvoteCount, hasUpvoted: !hasUpvoted });
};


// ============================================
// @route   POST /api/issues/:id/reopen
// @desc    Reopen a resolved issue
// @access  Private (any user in that area)
// ============================================
const reopenIssue = async (req, res) => {
  const { reason, media } = req.body;
  const issue = await Issue.findById(req.params.id);

  if (!issue || issue.isDeleted) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }

  if (issue.status !== 'resolved') {
    return res.status(400).json({ success: false, message: 'Can only reopen resolved issues' });
  }

  // Handle uploaded media
  const reopenMedia = (req.files || []).map(file => ({
    url:          file.path,
    publicId:     file.filename,
    resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
  }));

  issue.status = 'reopened';
  issue.reopenHistory.push({
    reopenedBy: req.user.id,
    reason: reason || '',
    media: reopenMedia,
  });

  await issue.save();

  // Add a reopen comment automatically
  await Comment.create({
    issue: issue._id,
    author: req.user.id,
    text: reason || 'Issue reopened — problem persists.',
    type: 'reopen',
    media: reopenMedia,
  });

  issue.commentCount += 1;
  await issue.save();

  res.json({ success: true, message: 'Issue reopened', issue });
};


// ============================================
// @route   GET /api/issues/user/:userId
// @desc    Get all issues posted by a specific user
// @access  Public
// ============================================
const getUserIssues = async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const filter = { postedBy: req.params.userId, isDeleted: false };
  const total = await Issue.countDocuments(filter);

  const issues = await Issue.find(filter)
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(parseInt(limit));

  res.json({ success: true, total, issues });
};


module.exports = {
  getIssues,
  getIssueById,
  createIssue,
  updateIssue,
  deleteIssue,
  toggleUpvote,
  reopenIssue,
  getUserIssues,
};
