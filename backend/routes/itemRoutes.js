const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { getAllItems, createItem, deleteItem } = require('../controllers/itemController');
const auth = require('../middleware/auth');

// 5. SECURE FILE UPLOAD (Test 10)
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => {
    cb(null, `item-${Date.now()}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const mimeType = allowedTypes.test(file.mimetype);
    const extName = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    if (mimeType && extName) {
      return cb(null, true);
    }
    cb(new Error('Only images (jpeg, jpg, png, webp) are allowed!'));
  }
});

router.get('/', getAllItems);
router.post('/', auth, upload.single('image'), createItem);
router.delete('/:id', auth, deleteItem); // For Test 6 (IDOR)

module.exports = router;