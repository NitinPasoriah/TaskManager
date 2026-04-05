const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { signToken } = require('../utils/token');
const logger = require('../utils/logger');

/**
 * Build standardized token response with user data and JWT
 * @param {Object} user - Mongoose user document
 * @returns {Object} Response payload with user and token
 */
function buildTokenResponse(user) {
  return {
    user: user.toSafeObject(),
    token: signToken(user)
  };
}

/**
 * Register a new user account
 * @route POST /api/auth/register
 */
const register = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    logger.warn('Registration attempted with existing email', { email });
    throw new ApiError(409, 'Email is already registered');
  }

  const user = await User.create({ name, email, password });
  logger.info('New user registered', { userId: user._id, email });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: buildTokenResponse(user)
  });
});

/**
 * Authenticate user and return JWT
 * @route POST /api/auth/login
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    logger.warn('Login failed: user not found', { email });
    throw new ApiError(401, 'Invalid email or password');
  }

  const validPassword = await user.matchPassword(password);
  if (!validPassword) {
    logger.warn('Login failed: invalid password', { email });
    throw new ApiError(401, 'Invalid email or password');
  }

  logger.info('User logged in', { userId: user._id, email });

  res.json({
    success: true,
    message: 'Login successful',
    data: buildTokenResponse(user)
  });
});

const getMe = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: req.user.toSafeObject()
  });
});

const updateMe = asyncHandler(async (req, res) => {
  const allowedFields = ['name', 'email', 'title', 'bio', 'avatar'];
  const updates = {};

  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      updates[field] = req.body[field];
    }
  }

  const user = await User.findByIdAndUpdate(req.user._id, updates, {
    new: true,
    runValidators: true
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user.toSafeObject()
  });
});

const updatePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user._id).select('+password');
  const validPassword = await user.matchPassword(currentPassword);
  if (!validPassword) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  user.password = newPassword;
  user.tokenVersion += 1;
  await user.save();

  res.json({
    success: true,
    message: 'Password updated successfully',
    data: buildTokenResponse(user)
  });
});

const logout = asyncHandler(async (req, res) => {
  req.user.tokenVersion += 1;
  await req.user.save();

  res.json({
    success: true,
    message: 'Logout successful'
  });
});

module.exports = {
  register,
  login,
  getMe,
  updateMe,
  updatePassword,
  logout
};
