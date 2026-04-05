const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const Task = require('../models/Task');
const { getAccessibleTeamIds } = require('./taskAccess');

async function ensureAttachmentAccess(task, userId) {
  const teamIds = await getAccessibleTeamIds(userId);
  const canAccess =
    task.createdBy.toString() === userId.toString() ||
    (task.assignedTo && task.assignedTo.toString() === userId.toString()) ||
    (task.team && teamIds.some((teamId) => teamId.toString() === task.team.toString()));

  if (!canAccess) {
    throw new ApiError(403, 'You do not have access to this task');
  }
}

const listAttachments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId).populate('attachments.uploadedBy', 'name email');
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureAttachmentAccess(task, req.user._id);

  res.json({
    success: true,
    data: task.attachments
  });
});

module.exports = { listAttachments };
