const Team = require('../models/Team');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('../services/notificationService');

const createTeam = asyncHandler(async (req, res) => {
  const team = await Team.create({
    name: req.body.name,
    description: req.body.description,
    kind: req.body.kind || 'team',
    owner: req.user._id,
    members: [req.user._id]
  });

  res.status(201).json({
    success: true,
    message: 'Team created successfully',
    data: team
  });
});

const listMyTeams = asyncHandler(async (req, res) => {
  const teams = await Team.find({ members: req.user._id }).populate('owner members', 'name email title');

  res.json({
    success: true,
    data: teams
  });
});

const getTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId).populate('owner members', 'name email title');
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  const isMember = team.members.some((member) => member._id.toString() === req.user._id.toString());
  if (!isMember) {
    throw new ApiError(403, 'You do not have access to this team');
  }

  res.json({
    success: true,
    data: team
  });
});

const updateTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (team.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the owner can update this team');
  }

  ['name', 'description', 'kind'].forEach((field) => {
    if (req.body[field] !== undefined) {
      team[field] = req.body[field];
    }
  });

  await team.save();

  res.json({
    success: true,
    message: 'Team updated successfully',
    data: team
  });
});

const deleteTeam = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (team.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the owner can delete this team');
  }

  await team.deleteOne();

  res.json({
    success: true,
    message: 'Team deleted successfully'
  });
});

const joinTeam = asyncHandler(async (req, res) => {
  const team = await Team.findOne({ inviteCode: req.body.inviteCode });
  if (!team) {
    throw new ApiError(404, 'Invite code is invalid');
  }

  if (!team.members.some((member) => member.toString() === req.user._id.toString())) {
    team.members.push(req.user._id);
    await team.save();
  }

  res.json({
    success: true,
    message: 'Joined team successfully',
    data: team
  });
});

const addMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (team.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the owner can add members');
  }

  const user = await User.findById(req.body.userId);
  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  if (!team.members.some((member) => member.toString() === user._id.toString())) {
    team.members.push(user._id);
    await team.save();
    await createNotification({
      recipient: user._id,
      actor: req.user._id,
      team: team._id,
      type: 'member_added',
      message: `You were added to ${team.name}`
    });
  }

  res.json({
    success: true,
    message: 'Member added successfully',
    data: team
  });
});

const removeMember = asyncHandler(async (req, res) => {
  const team = await Team.findById(req.params.teamId);
  if (!team) {
    throw new ApiError(404, 'Team not found');
  }

  if (team.owner.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the owner can remove members');
  }

  if (team.owner.toString() === req.params.userId) {
    throw new ApiError(400, 'The owner cannot be removed from the team');
  }

  const removed = team.members.filter((member) => member.toString() !== req.params.userId);
  team.members = removed;
  await team.save();

  await createNotification({
    recipient: req.params.userId,
    actor: req.user._id,
    team: team._id,
    type: 'member_removed',
    message: `You were removed from ${team.name}`
  });

  res.json({
    success: true,
    message: 'Member removed successfully',
    data: team
  });
});

module.exports = {
  createTeam,
  listMyTeams,
  getTeam,
  updateTeam,
  deleteTeam,
  joinTeam,
  addMember,
  removeMember
};
