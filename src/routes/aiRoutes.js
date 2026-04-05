const express = require('express');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const aiController = require('../controllers/aiController');
const { taskDraftValidator } = require('../validators/aiValidators');

const router = express.Router();

router.use(auth);
router.post('/task-description', taskDraftValidator, validateRequest, aiController.generateDescription);

module.exports = router;
