const { body, validationResult } = require('express-validator');

const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

const registerValidation = [
    body('name').notEmpty().withMessage('Name is required').trim().isLength({ min: 2 }),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    validate
];

const loginValidation = [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
    validate
];

const itemValidation = [
    body('title').notEmpty().withMessage('Title is required').trim(),
    body('category').optional().trim(),
    body('location').optional().trim(),
    validate
];

const claimValidation = [
    body('itemId').isInt().withMessage('Valid item ID required'),
    body('message').optional().trim(),
    validate
];

module.exports = {
    registerValidation,
    loginValidation,
    itemValidation,
    claimValidation
};