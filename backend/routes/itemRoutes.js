const express = require('express');
const { getAllItems, getItemById, createItem, updateItem, deleteItem } = require('../controllers/itemController');
const { authenticate } = require('../middleware/auth');
const upload = require('../middleware/upload');
const router = express.Router();

router.get('/', getAllItems);
router.get('/:id', getItemById);
router.post('/', authenticate, upload.single('image'), createItem);
router.put('/:id', authenticate, upload.single('image'), updateItem);
router.delete('/:id', authenticate, deleteItem);

module.exports = router;
