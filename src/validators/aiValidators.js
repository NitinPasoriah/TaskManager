const { body } = require('express-validator');

const taskDraftValidator = [
  body('title').trim().isLength({ min: 2 }).withMessage('Title is required'),
  body('context').optional().trim()
];

module.exports = { taskDraftValidator };
