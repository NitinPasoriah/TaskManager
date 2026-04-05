const { body } = require('express-validator');

const registerValidator = [
  body('name').trim().isLength({ min: 2 }).withMessage('Name is required'),
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
];

const loginValidator = [
  body('email').isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('password').notEmpty().withMessage('Password is required')
];

const updateProfileValidator = [
  body('name').optional().trim().isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email').optional().isEmail().withMessage('A valid email is required').normalizeEmail(),
  body('title').optional().trim().isLength({ max: 120 }),
  body('bio').optional().trim().isLength({ max: 500 }),
  body('avatar').optional().trim()
];

const updatePasswordValidator = [
  body('currentPassword').notEmpty().withMessage('Current password is required'),
  body('newPassword').isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
];

module.exports = {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  updatePasswordValidator
};
