// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const { protect, asyncHandler } = require('../middleware/auth');
const {
  googleLogin, googleRegister,
  registerWithEmail, registerMunicipal, loginWithEmail,
  getMe, changePassword,
} = require('../controllers/authController');

router.post('/google',              asyncHandler(googleLogin));
router.post('/google/register',     asyncHandler(googleRegister));
router.post('/register',            asyncHandler(registerWithEmail));
router.post('/register-municipal',  asyncHandler(registerMunicipal));
router.post('/login',               asyncHandler(loginWithEmail));
router.get('/me',                   protect, asyncHandler(getMe));
router.put('/change-password',      protect, asyncHandler(changePassword));

module.exports = router;
