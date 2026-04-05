const { param, body } = require('express-validator');

const commentIdParam = [param('commentId').isMongoId()];
const taskParam = [param('taskId').isMongoId()];
const createCommentValidator = [
  ...taskParam,
  body('body').trim().isLength({ min: 1, max: 3000 }).withMessage('Comment body is required')
];

module.exports = { commentIdParam, taskParam, createCommentValidator };
