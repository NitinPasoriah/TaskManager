const ApiError = require('../utils/ApiError');
const logger = require('../utils/logger');

function notFound(req, res, next) {
  const err = new ApiError(404, `Route not found: ${req.originalUrl}`);
  logger.warn('Route not found', { url: req.originalUrl, method: req.method });
  next(err);
}

function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    message: err.message || 'Internal Server Error'
  };

  if (err.errors && err.errors.length) {
    payload.errors = err.errors;
  }

  if (process.env.NODE_ENV !== 'production') {
    payload.stack = err.stack;
  }

  // Log all errors for monitoring
  if (statusCode >= 500) {
    logger.error('Server error', { statusCode, message: err.message, url: req.url });
  } else {
    logger.warn('Client error', { statusCode, message: err.message, url: req.url });
  }

  res.status(statusCode).json(payload);
}

module.exports = { notFound, errorHandler };
