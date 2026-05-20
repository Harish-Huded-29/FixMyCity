// ============================================
// FixMyCity - Cloudinary Configuration
// Handles image & video uploads
// ============================================

const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure cloudinary with credentials from .env
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Storage config for issue photos/videos
const issueStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    const isVideo = file.mimetype.startsWith('video/');
    return {
      folder: 'fixmycity/issues',
      resource_type: isVideo ? 'video' : 'image',
      // Auto quality + format for images; keep original for video
      transformation: isVideo ? [] : [{ quality: 'auto', fetch_format: 'auto' }],
      public_id: `issue_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  },
});

// Storage config for profile photos
const profileStorage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => ({
    folder: 'fixmycity/profiles',
    resource_type: 'image',
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face', quality: 'auto' }
    ],
    public_id: `profile_${req.user?.id || 'u'}_${Date.now()}`,
  }),
});

// Multer upload middleware for issues (max 5 files, 50MB each)
const uploadIssueMedia = multer({
  storage: issueStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only JPG, PNG, WebP images and MP4/MOV videos are allowed'), false);
    }
  },
}).array('media', 5); // max 5 files per post

// Multer upload middleware for profile photo (single file)
const uploadProfilePhoto = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only images allowed for profile photo'), false);
    }
  },
}).single('photo');

// Delete a file from cloudinary by public_id
const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (err) {
    console.error('Cloudinary delete error:', err.message);
  }
};

module.exports = {
  cloudinary,
  uploadIssueMedia,
  uploadProfilePhoto,
  deleteFromCloudinary,
};