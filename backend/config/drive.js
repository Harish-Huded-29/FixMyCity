// ============================================
// FixMyCity — Google Drive Upload Config
// Replaces Cloudinary. Uses Google Apps Script
// web app as the upload endpoint.
//
// ENV vars needed in .env:
//   DRIVE_UPLOAD_URL=https://script.google.com/macros/s/YOUR_DEPLOY_ID/exec
//
// Interface is identical to the old cloudinary.js:
//   uploadIssueMedia  → multer middleware for issue photos/videos (max 5, 50MB)
//   uploadProfilePhoto → multer middleware for profile photo (single, 5MB)
//   deleteFromDrive   → delete a file by Drive file ID (best-effort)
// ============================================

const multer  = require('multer');
const fetch   = (...args) => import('node-fetch').then(({ default: f }) => f(...args));

const DRIVE_URL = process.env.DRIVE_UPLOAD_URL;

if (!DRIVE_URL) {
  console.warn('⚠️  DRIVE_UPLOAD_URL not set in .env — file uploads will fail!');
}

// ---- Memory storage (hold file in RAM, then push to Drive) ----
const memStorage = multer.memoryStorage();

// ---- Upload a single file buffer to Drive via Apps Script ----
async function uploadToDrive(file) {
  if (!DRIVE_URL) throw new Error('DRIVE_UPLOAD_URL is not configured');

  const base64Data = file.buffer.toString('base64');
  const isVideo    = file.mimetype.startsWith('video/');
  const ext        = file.originalname.split('.').pop() || (isVideo ? 'mp4' : 'jpg');
  const fileName   = `fmc_${Date.now()}_${Math.random().toString(36).substr(2, 7)}.${ext}`;

  const res  = await fetch(DRIVE_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fileName, mimeType: file.mimetype, base64Data }),
  });

  if (!res.ok) {
    throw new Error(`Drive upload HTTP error: ${res.status}`);
  }

  const data = await res.json();
  if (!data.success) {
    throw new Error(data.error || 'Drive upload failed');
  }

  const fileId = data.fileId;

  // ----------------------------------------------------------------
  // IMPORTANT: Google's "uc?export=view" URLs are blocked by browsers
  // when used in <img src=""> tags (CORS + redirect restriction).
  //
  // The correct embeddable URL format is:
  //   https://lh3.googleusercontent.com/d/{fileId}
  //
  // For videos, we store the Drive viewer URL (iframes work fine):
  //   https://drive.google.com/file/d/{fileId}/preview
  // ----------------------------------------------------------------
  const url = isVideo
    ? `https://drive.google.com/file/d/${fileId}/preview`
    : `https://lh3.googleusercontent.com/d/${fileId}`;

  return {
    url,                           // embeddable URL for <img> / <iframe>
    publicId:     fileId,          // Drive file ID (stored as publicId in MongoDB)
    resourceType: isVideo ? 'video' : 'image',
    mimeType:     file.mimetype,
  };
}

// ---- Middleware factory ----
// After multer collects the files in memory, we push them all to Drive
// and attach the results to req.file (single) or req.files (array)
// so all existing controllers work without any changes.

function makeDriveUploadMiddleware(multerMiddleware, mode) {
  return (req, res, next) => {
    // Step 1: run multer (fills req.file / req.files with buffer)
    multerMiddleware(req, res, async (err) => {
      if (err) return next(err);

      try {
        if (mode === 'single' && req.file) {
          // Upload and replace req.file with drive result fields
          const result = await uploadToDrive(req.file);
          // Attach in the same shape controllers expect (file.path = url, file.filename = publicId)
          req.file.path     = result.url;
          req.file.filename = result.publicId;

        } else if (mode === 'array' && req.files && req.files.length > 0) {
          // Upload all files concurrently
          const results = await Promise.all(req.files.map(uploadToDrive));
          req.files.forEach((file, i) => {
            file.path     = results[i].url;
            file.filename = results[i].publicId;
          });
        }

        next();
      } catch (uploadErr) {
        console.error('Drive upload error:', uploadErr.message);
        res.status(500).json({ success: false, message: `File upload failed: ${uploadErr.message}` });
      }
    });
  };
}

// ---- Issue media: max 5 files, 50MB each, images + videos ----
const _issueMulter = multer({
  storage: memStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, WebP images and MP4/MOV videos are allowed'));
  },
}).array('media', 5);

const uploadIssueMedia = makeDriveUploadMiddleware(_issueMulter, 'array');

// ---- Profile photo: single file, 5MB, images only ----
const _profileMulter = multer({
  storage: memStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only images allowed for profile photo'));
  },
}).single('photo');

const uploadProfilePhoto = makeDriveUploadMiddleware(_profileMulter, 'single');

// ---- Delete a file from Drive (best-effort, won't crash if it fails) ----
// Note: Apps Script can't delete files via a simple POST without auth,
// so this hits the same endpoint with action='delete'.
// If you don't need deletion, this is a no-op.
const deleteFromDrive = async (fileId) => {
  if (!DRIVE_URL || !fileId) return;
  try {
    await fetch(DRIVE_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ action: 'delete', fileId }),
    });
  } catch (err) {
    console.error('Drive delete error (non-fatal):', err.message);
  }
};

module.exports = {
  uploadIssueMedia,
  uploadProfilePhoto,
  deleteFromDrive,
  // Keep old name as alias so any code referencing deleteFromCloudinary still works
  deleteFromCloudinary: deleteFromDrive,
};