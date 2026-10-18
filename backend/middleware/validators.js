const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ error: errors.array()[0].msg });
    }
    next();
};

const registerRules = [
    body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Name must be 2–100 characters')
        .matches(/^[a-zA-Z\s.'-]+$/).withMessage('Name contains invalid characters'),
    body('email').trim().isEmail().withMessage('Invalid email').normalizeEmail(),
    body('password').isLength({ min: 8, max: 72 }).withMessage('Password must be 8–72 characters')
        .matches(/[A-Z]/).withMessage('Password needs an uppercase letter')
        .matches(/[a-z]/).withMessage('Password needs a lowercase letter')
        .matches(/[0-9]/).withMessage('Password needs a number'),
    handleValidation
];

const loginRules = [
    body('email').trim().isEmail().normalizeEmail(),
    body('password').notEmpty().isLength({ max: 72 }),
    handleValidation
];

const itemRules = [
    body('title').trim().isLength({ min: 3, max: 150 }).withMessage('Title must be 3–150 characters')
        .escape(),
    body('description').optional({ checkFalsy: true }).trim().isLength({ max: 2000 }).escape(),
    body('category').optional({ checkFalsy: true }).trim().isLength({ max: 50 }).escape(),
    body('location').optional({ checkFalsy: true }).trim().isLength({ max: 100 }).escape(),
    body('status').optional().isIn(['lost', 'found']).withMessage('Invalid status'),
    handleValidation
];

const claimRules = [
    body('itemId').isInt({ min: 1 }).withMessage('Invalid item'),
    body('message').optional({ checkFalsy: true }).trim().isLength({ max: 1000 }).escape(),
    body('contactNumber').optional({ checkFalsy: true }).trim()
        .matches(/^[0-9+\-\s()]{7,20}$/).withMessage('Invalid contact number'),
    handleValidation
];

const idRule = [param('id').isInt({ min: 1 }).withMessage('Invalid ID'), handleValidation];

module.exports = { registerRules, loginRules, itemRules, claimRules, idRule };