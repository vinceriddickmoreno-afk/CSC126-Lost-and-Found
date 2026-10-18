const { body, param, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

const registerRules = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').isEmail().withMessage('Please provide a valid email').normalizeEmail(),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password needs an uppercase letter')
    .matches(/[a-z]/).withMessage('Password needs a lowercase letter')
    .matches(/[0-9]/).withMessage('Password needs a number'),
  handleValidationErrors
];

const loginRules = [
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password required'),
  handleValidationErrors
];

const itemRules = [
  body('title').trim().notEmpty().withMessage('Title is required'),
  body('status').isIn(['lost', 'found']).withMessage('Status must be lost or found'),
  handleValidationErrors
];

const idRule = [
  param('id').isInt().withMessage('Invalid ID'),
  handleValidationErrors
];

const claimRules = [
  body('itemId').isInt().withMessage('Valid item ID required'),
  body('message').trim().notEmpty().withMessage('Message is required'),
  body('contactNumber').trim().notEmpty().withMessage('Contact number is required'),
  handleValidationErrors
];

module.exports = {
  registerRules,
  loginRules,
  itemRules,
  idRule,
  claimRules
};