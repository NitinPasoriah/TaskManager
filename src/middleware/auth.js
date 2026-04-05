const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authenticate request using JWT token from Authorization header.
 * Validates token and checks token version to prevent revoked sessions.
 */
async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      return next(new ApiError(401, 'Authentication required'));
    }

    const token = header.slice(7);
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.sub);

    if (!user) {
      logger.warn('Authentication failed: user not found', { userId: decoded.sub });
      return next(new ApiError(401, 'Invalid token'));
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      logger.warn('Authentication failed: session revoked', { userId: user._id });
      return next(new ApiError(401, 'Session has been revoked'));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    logger.error('Authentication error', { message: error.message });
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = auth;
