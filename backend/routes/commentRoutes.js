// backend/routes/commentRoutes.js
const express = require('express');
const router = express.Router();
const { protect, asyncHandler } = require('../middleware/auth');
const { addComment, deleteComment, toggleLike } = require('../controllers/commentController');

router.post('/:issueId',    protect, asyncHandler(addComment));
router.delete('/:id',       protect, asyncHandler(deleteComment));
router.post('/:id/like',    protect, asyncHandler(toggleLike));

module.exports = router;
