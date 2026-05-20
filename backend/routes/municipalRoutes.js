// backend/routes/municipalRoutes.js
const express = require('express');
const router = express.Router();
const { protect, municipalOnly, asyncHandler } = require('../middleware/auth');
const { uploadIssueMedia } = require('../config/cloudinary');
const {
  getMunicipalIssues, updateIssueStatus, resolveIssue, getMunicipalStats,
} = require('../controllers/municipalController');

router.use(protect, municipalOnly); // All municipal routes require auth + role

router.get('/issues',                    asyncHandler(getMunicipalIssues));
router.get('/stats',                     asyncHandler(getMunicipalStats));
router.put('/issues/:id/status',         asyncHandler(updateIssueStatus));
router.post('/issues/:id/resolve',       uploadIssueMedia, asyncHandler(resolveIssue));

module.exports = router;
