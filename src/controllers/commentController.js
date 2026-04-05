const Comment = require('../models/Comment');
const Task = require('../models/Task');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('../services/notificationService');
const { getAccessibleTeamIds } = require('./taskAccess');

async function ensureCommentAccess(task, userId) {
  const teamIds = await getAccessibleTeamIds(userId);
  const canAccess =
    task.createdBy.toString() === userId.toString() ||
    (task.assignedTo && task.assignedTo.toString() === userId.toString()) ||
    (task.team && teamIds.some((teamId) => teamId.toString() === task.team.toString()));

  if (!canAccess) {
    throw new ApiError(403, 'You do not have access to this task');
  }
}

const listComments = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureCommentAccess(task, req.user._id);

  const comments = await Comment.find({ task: task._id }).populate('author', 'name email title').sort({ createdAt: 1 });

  res.json({
    success: true,
    data: comments
  });
});

const addComment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureCommentAccess(task, req.user._id);

  const comment = await Comment.create({
    task: task._id,
    author: req.user._id,
    body: req.body.body
  });

  if (task.createdBy.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: task.createdBy,
      actor: req.user._id,
      task: task._id,
      team: task.team,
      type: 'comment_added',
      message: `A new comment was added to ${task.title}`
    });
  }

  if (task.assignedTo && task.assignedTo.toString() !== req.user._id.toString()) {
    await createNotification({
      recipient: task.assignedTo,
      actor: req.user._id,
      task: task._id,
      team: task.team,
      type: 'comment_added',
      message: `A new comment was added to ${task.title}`
    });
  }

  const populatedComment = await Comment.findById(comment._id).populate('author', 'name email title');

  res.status(201).json({
    success: true,
    message: 'Comment added successfully',
    data: populatedComment
  });
});

const deleteComment = asyncHandler(async (req, res) => {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) {
    throw new ApiError(404, 'Comment not found');
  }

  if (comment.author.toString() !== req.user._id.toString()) {
    throw new ApiError(403, 'Only the author can delete this comment');
  }

  await comment.deleteOne();

  res.json({
    success: true,
    message: 'Comment deleted successfully'
  });
});

module.exports = {
  listComments,
  addComment,
  deleteComment
};
