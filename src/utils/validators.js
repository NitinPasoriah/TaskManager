/**
 * Validation helper functions for common checks
 */

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validatePassword(password) {
  return password && password.length >= 8;
}

function validateMongoId(id) {
  return /^[0-9a-fA-F]{24}$/.test(id);
}

function isValidStatus(status) {
  return ['open', 'in-progress', 'completed', 'archived'].includes(status);
}

function isValidPriority(priority) {
  return ['low', 'medium', 'high'].includes(priority);
}

module.exports = {
  validateEmail,
  validatePassword,
  validateMongoId,
  isValidStatus,
  isValidPriority
};
