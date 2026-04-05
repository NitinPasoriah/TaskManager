const express = require('express');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const { upload } = require('../middleware/upload');
const taskController = require('../controllers/taskController');
const attachmentController = require('../controllers/attachmentController');
const commentController = require('../controllers/commentController');
const {
  createTaskValidator,
  updateTaskValidator,
  assignTaskValidator,
  taskIdParam,
  attachmentParamValidator,
  listTasksValidator
} = require('../validators/taskValidators');
const { createCommentValidator } = require('../validators/commentValidators');

const router = express.Router();

router.use(auth);
router.get('/', listTasksValidator, validateRequest, taskController.listTasks);
router.post('/', createTaskValidator, validateRequest, taskController.createTask);
router.get('/:taskId', taskIdParam, validateRequest, taskController.getTask);
router.patch('/:taskId', updateTaskValidator, validateRequest, taskController.updateTask);
router.delete('/:taskId', taskIdParam, validateRequest, taskController.deleteTask);
router.patch('/:taskId/complete', taskIdParam, validateRequest, taskController.completeTask);
router.patch('/:taskId/assign', assignTaskValidator, validateRequest, taskController.assignTask);
router.get('/:taskId/comments', taskIdParam, validateRequest, commentController.listComments);
router.post('/:taskId/comments', createCommentValidator, validateRequest, commentController.addComment);
router.get('/:taskId/attachments', taskIdParam, validateRequest, attachmentController.listAttachments);
router.post('/:taskId/attachments', taskIdParam, validateRequest, upload.single('file'), taskController.addAttachment);
router.delete('/:taskId/attachments/:attachmentId', attachmentParamValidator, validateRequest, taskController.removeAttachment);

module.exports = router;
