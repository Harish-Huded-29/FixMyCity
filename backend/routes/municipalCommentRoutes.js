// backend/routes/municipalCommentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, asyncHandler } = require('../middleware/auth');
const MunicipalComment = require('../models/MunicipalComment');

// GET /api/municipal-comments/:issueId
router.get('/:issueId', asyncHandler(async (req, res) => {
  const comments = await MunicipalComment.find({ issue: req.params.issueId, isDeleted: false })
    .sort({ createdAt: 1 })
    .populate('author', 'name profilePhoto role');
  res.json({ success: true, comments });
}));

// POST /api/municipal-comments/:issueId
router.post('/:issueId', protect, asyncHandler(async (req, res) => {
  const { text } = req.body;
  if (!text?.trim()) return res.status(400).json({ success: false, message: 'Comment text required' });
  const comment = await MunicipalComment.create({
    issue: req.params.issueId,
    author: req.user.id,
    text: text.trim(),
  });
  await comment.populate('author', 'name profilePhoto role');
  res.status(201).json({ success: true, comment });
}));

// POST /api/municipal-comments/:id/like
router.post('/:id/like', protect, asyncHandler(async (req, res) => {
  const c = await MunicipalComment.findById(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Not found' });
  const liked = c.likes.includes(req.user.id);
  if (liked) { c.likes.pull(req.user.id); c.likeCount = Math.max(0, c.likeCount - 1); }
  else        { c.likes.push(req.user.id); c.likeCount += 1; }
  await c.save();
  res.json({ success: true, likeCount: c.likeCount, hasLiked: !liked });
}));

// DELETE /api/municipal-comments/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const c = await MunicipalComment.findById(req.params.id);
  if (!c) return res.status(404).json({ success: false, message: 'Not found' });
  if (c.author.toString() !== req.user.id) return res.status(403).json({ success: false, message: 'Not authorized' });
  c.isDeleted = true;
  await c.save();
  res.json({ success: true });
}));

module.exports = router;
