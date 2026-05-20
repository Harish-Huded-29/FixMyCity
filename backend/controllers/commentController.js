// ============================================
// FixMyCity - Comment Controller
// ============================================

const Comment = require('../models/Comment');
const Issue = require('../models/Issue');

// POST /api/comments/:issueId
const addComment = async (req, res) => {
  const { text, type = 'comment', rating } = req.body;
  const issue = await Issue.findById(req.params.issueId);
  if (!issue || issue.isDeleted) {
    return res.status(404).json({ success: false, message: 'Issue not found' });
  }

  const media = (req.files || []).map(file => ({
    url: file.path, publicId: file.filename,
    resourceType: file.mimetype.startsWith('video/') ? 'video' : 'image',
  }));

  const comment = await Comment.create({
    issue: issue._id,
    author: req.user.id,
    text, type, rating, media,
  });

  await Issue.findByIdAndUpdate(issue._id, { $inc: { commentCount: 1 } });
  await comment.populate('author', 'name profilePhoto role');
  res.status(201).json({ success: true, comment });
};

// DELETE /api/comments/:id
const deleteComment = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.isDeleted) {
    return res.status(404).json({ success: false, message: 'Comment not found' });
  }
  if (comment.author.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Not authorized' });
  }
  comment.isDeleted = true;
  await comment.save();
  await Issue.findByIdAndUpdate(comment.issue, { $inc: { commentCount: -1 } });
  res.json({ success: true, message: 'Comment deleted' });
};

// POST /api/comments/:id/like
const toggleLike = async (req, res) => {
  const comment = await Comment.findById(req.params.id);
  if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });
  const hasLiked = comment.likes.includes(req.user.id);
  if (hasLiked) {
    comment.likes.pull(req.user.id);
    comment.likeCount = Math.max(0, comment.likeCount - 1);
  } else {
    comment.likes.push(req.user.id);
    comment.likeCount += 1;
  }
  await comment.save();
  res.json({ success: true, likeCount: comment.likeCount, hasLiked: !hasLiked });
};

module.exports = { addComment, deleteComment, toggleLike };
