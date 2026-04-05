const ApiError = require('../utils/ApiError');
const { verifyToken } = require('../utils/token');
const User = require('../models/User');

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
      return next(new ApiError(401, 'Invalid token'));
    }

    if (user.tokenVersion !== decoded.tokenVersion) {
      return next(new ApiError(401, 'Session has been revoked'));
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(new ApiError(401, 'Invalid or expired token'));
  }
}

module.exports = auth;
