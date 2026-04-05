const express = require('express');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const authController = require('../controllers/authController');
const {
  registerValidator,
  loginValidator,
  updateProfileValidator,
  updatePasswordValidator
} = require('../validators/authValidators');

const router = express.Router();

router.post('/register', registerValidator, validateRequest, authController.register);
router.post('/login', loginValidator, validateRequest, authController.login);
router.post('/logout', auth, authController.logout);
router.get('/me', auth, authController.getMe);
router.patch('/me', auth, updateProfileValidator, validateRequest, authController.updateMe);
router.patch('/password', auth, updatePasswordValidator, validateRequest, authController.updatePassword);

module.exports = router;
