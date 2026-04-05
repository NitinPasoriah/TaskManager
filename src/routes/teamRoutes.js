const express = require('express');
const auth = require('../middleware/auth');
const validateRequest = require('../middleware/validate');
const teamController = require('../controllers/teamController');
const {
  createTeamValidator,
  updateTeamValidator,
  joinTeamValidator,
  memberValidator,
  teamIdParam,
  teamMemberParam
} = require('../validators/teamValidators');

const router = express.Router();

router.use(auth);
router.get('/', teamController.listMyTeams);
router.post('/', createTeamValidator, validateRequest, teamController.createTeam);
router.post('/join', joinTeamValidator, validateRequest, teamController.joinTeam);
router.get('/:teamId', teamIdParam, validateRequest, teamController.getTeam);
router.patch('/:teamId', updateTeamValidator, validateRequest, teamController.updateTeam);
router.delete('/:teamId', teamIdParam, validateRequest, teamController.deleteTeam);
router.post('/:teamId/members', memberValidator, validateRequest, teamController.addMember);
router.delete('/:teamId/members/:userId', teamIdParam, teamMemberParam, validateRequest, teamController.removeMember);

module.exports = router;
