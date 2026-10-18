const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const ALLOWED_EXT = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase();
        cb(null, crypto.randomBytes(16).toString('hex') + ext);
    }
});

const fileFilter = (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED_MIME.includes(file.mimetype) || !ALLOWED_EXT.includes(ext)) {
        return cb(new Error('Only JPG, PNG, WEBP, or GIF images allowed'));
    }
    cb(null, true);
};

module.exports = multer({ storage, fileFilter, limits: { fileSize: 3 * 1024 * 1024, files: 1 } });