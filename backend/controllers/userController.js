// ============================================
// FixMyCity - User Controller
// ============================================

const User = require('../models/User');

// GET /api/users/:id
const getUserProfile = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, user: user.toPublicProfile() });
};

// PUT /api/users/profile — update photo only (multipart)
const updateProfilePhoto = async (req, res) => {
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (req.file) {
    user.profilePhoto = { url: req.file.path, publicId: req.file.filename };
    await user.save();
  }

  res.json({ success: true, user: user.toPublicProfile() });
};

// PUT /api/users/profile-text — update text fields only (JSON)
const updateProfileText = async (req, res) => {
  const { name, phone, bio } = req.body;
  const user = await User.findById(req.user.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  if (name  !== undefined) user.name  = name;
  if (phone !== undefined) user.phone = phone;
  if (bio   !== undefined) user.bio   = bio;

  await user.save();
  res.json({ success: true, user: user.toPublicProfile() });
};

module.exports = { getUserProfile, updateProfilePhoto, updateProfileText };
