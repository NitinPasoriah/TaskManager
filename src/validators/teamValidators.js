const { body, param } = require('express-validator');

const teamIdParam = [param('teamId').isMongoId()];
const teamMemberParam = [param('userId').isMongoId()];

const createTeamValidator = [
  body('name').trim().isLength({ min: 2 }).withMessage('Team name is required'),
  body('description').optional().trim(),
  body('kind').optional().isIn(['team', 'project'])
];

const updateTeamValidator = [
  ...teamIdParam,
  body('name').optional().trim().isLength({ min: 2 }),
  body('description').optional().trim(),
  body('kind').optional().isIn(['team', 'project'])
];

const joinTeamValidator = [
  body('inviteCode').trim().notEmpty().withMessage('Invite code is required')
];

const memberValidator = [
  ...teamIdParam,
  body('userId').isMongoId().withMessage('A valid userId is required')
];

module.exports = {
  teamIdParam,
  teamMemberParam,
  createTeamValidator,
  updateTeamValidator,
  joinTeamValidator,
  memberValidator
};
