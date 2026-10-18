const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Absolute upload directory (backend/uploads) — works regardless of cwd
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXT  = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, unique);
  }
});

const fileFilter = (req, file, cb) => {
  // Reject null bytes in original name
  if (file.originalname.includes('\0')) {
    return cb(new Error('Invalid file name'), false);
  }

  const ext = path.extname(file.originalname).toLowerCase();
  // Must have a single, known image extension
  if (!ALLOWED_EXT.includes(ext)) {
    return cb(new Error('Only image files are allowed'), false);
  }
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    return cb(new Error('Invalid image MIME type'), false);
  }
  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

module.exports = upload;