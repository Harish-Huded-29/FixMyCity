// backend/routes/issueRoutes.js
const express = require('express');
const router = express.Router();
const { protect, asyncHandler } = require('../middleware/auth');
const { uploadIssueMedia } = require('../config/drive');
const {
  getIssues, getIssueById, createIssue, updateIssue,
  deleteIssue, toggleUpvote, reopenIssue, getUserIssues,
} = require('../controllers/issueController');

router.get('/',                    asyncHandler(getIssues));
router.get('/user/:userId',        asyncHandler(getUserIssues));
router.get('/:id',                 asyncHandler(getIssueById));
router.post('/',                   protect, uploadIssueMedia, asyncHandler(createIssue));
router.put('/:id',                 protect, asyncHandler(updateIssue));
router.delete('/:id',              protect, asyncHandler(deleteIssue));
router.post('/:id/upvote',         protect, asyncHandler(toggleUpvote));
router.post('/:id/reopen',         protect, uploadIssueMedia, asyncHandler(reopenIssue));

module.exports = router;