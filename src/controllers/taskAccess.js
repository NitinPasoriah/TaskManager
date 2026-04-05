const Team = require('../models/Team');

async function getAccessibleTeamIds(userId) {
  const teams = await Team.find({ members: userId }).select('_id');
  return teams.map((team) => team._id);
}

module.exports = { getAccessibleTeamIds };
