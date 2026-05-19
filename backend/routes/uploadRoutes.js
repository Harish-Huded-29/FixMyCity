// backend/routes/uploadRoutes.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { uploadIssueMedia } = require('../config/drive');

// Simple upload endpoint (returns URLs)
router.post('/', protect, (req, res, next) => {
  uploadIssueMedia(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    const files = (req.files || []).map(f => ({
      url: f.path, publicId: f.filename,
      resourceType: f.mimetype.startsWith('video/') ? 'video' : 'image',
    }));
    res.json({ success: true, files });
  });
});

module.exports = router;