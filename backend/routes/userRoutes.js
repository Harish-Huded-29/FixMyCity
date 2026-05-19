// backend/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const { protect, asyncHandler } = require('../middleware/auth');
const { uploadProfilePhoto } = require('../config/drive');
const { getUserProfile, updateProfilePhoto, updateProfileText } = require('../controllers/userController');

router.get('/:id',              asyncHandler(getUserProfile));
// Photo upload — multipart/form-data
router.put('/profile',          protect, uploadProfilePhoto, asyncHandler(updateProfilePhoto));
// Text fields — JSON body (fixes "Unexpected token" bug)
router.put('/profile-text',     protect, asyncHandler(updateProfileText));

module.exports = router;