const express = require('express');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const commentController = require('../controllers/commentController');
const { commentIdParam } = require('../validators/commentValidators');

const router = express.Router();

router.use(auth);
router.delete('/:commentId', commentIdParam, validateRequest, commentController.deleteComment);

module.exports = router;
