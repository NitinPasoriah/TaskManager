const { body, param, query } = require('express-validator');

const taskIdParam = [param('taskId').isMongoId()];
const attachmentIdParam = [param('attachmentId').isMongoId()];

const createTaskValidator = [
  body('title').trim().isLength({ min: 2 }).withMessage('Task title is required'),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601().toDate(),
  body('status').optional().isIn(['open', 'in-progress', 'completed', 'archived']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('team').optional().isMongoId(),
  body('assignedTo').optional().isMongoId(),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim()
];

const updateTaskValidator = [
  ...taskIdParam,
  body('title').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601().toDate(),
  body('status').optional().isIn(['open', 'in-progress', 'completed', 'archived']),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('assignedTo').optional().isMongoId(),
  body('tags').optional().isArray(),
  body('tags.*').optional().trim()
];

const assignTaskValidator = [
  ...taskIdParam,
  body('assignedTo').isMongoId().withMessage('A valid userId is required')
];

const commentValidator = [
  ...taskIdParam,
  body('body').trim().isLength({ min: 1, max: 3000 }).withMessage('Comment body is required')
];

const attachmentParamValidator = [
  ...taskIdParam,
  ...attachmentIdParam
];

const listTasksValidator = [
  query('status').optional().isIn(['open', 'in-progress', 'completed', 'archived']),
  query('teamId').optional().isMongoId(),
  query('assignedTo').optional().isMongoId(),
  query('createdBy').optional().isMongoId(),
  query('search').optional().trim(),
  query('sortBy').optional().isString(),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 100 })
];

module.exports = {
  taskIdParam,
  attachmentIdParam,
  createTaskValidator,
  updateTaskValidator,
  assignTaskValidator,
  commentValidator,
  attachmentParamValidator,
  listTasksValidator
};
