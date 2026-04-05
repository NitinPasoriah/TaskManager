const fs = require('fs/promises');
const path = require('path');
const Task = require('../models/Task');
const Team = require('../models/Team');
const User = require('../models/User');
const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const asyncHandler = require('../utils/asyncHandler');
const ApiError = require('../utils/ApiError');
const { createNotification } = require('../services/notificationService');

async function getAccessibleTeamIds(userId) {
  const teams = await Team.find({ members: userId }).select('_id');
  return teams.map((team) => team._id);
}

function escapeRegex(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function ensureTaskAccess(task, userId) {
  const teamIds = await getAccessibleTeamIds(userId);
  const isCreator = task.createdBy.toString() === userId.toString();
  const isAssignee = task.assignedTo && task.assignedTo.toString() === userId.toString();
  const inTeam = task.team && teamIds.some((teamId) => teamId.toString() === task.team.toString());

  if (!isCreator && !isAssignee && !inTeam) {
    throw new ApiError(403, 'You do not have access to this task');
  }
}

async function validateAssignee(task, assignedTo) {
  if (!assignedTo) {
    return;
  }

  const user = await User.findById(assignedTo);
  if (!user) {
    throw new ApiError(404, 'Assigned user not found');
  }

  if (task.team) {
    const team = await Team.findById(task.team);
    const isMember = team.members.some((member) => member.toString() === user._id.toString());
    if (!isMember) {
      throw new ApiError(400, 'Assigned user must be a member of the team');
    }
  }
}

const createTask = asyncHandler(async (req, res) => {
  const { title, description, dueDate, status, priority, team, assignedTo, tags } = req.body;

  if (team) {
    const teamDoc = await Team.findById(team);
    if (!teamDoc) {
      throw new ApiError(404, 'Team not found');
    }

    const hasAccess = teamDoc.members.some((member) => member.toString() === req.user._id.toString());
    if (!hasAccess) {
      throw new ApiError(403, 'You must be a team member to create team tasks');
    }

    if (assignedTo) {
      const assignee = await User.findById(assignedTo);
      if (!assignee) {
        throw new ApiError(404, 'Assigned user not found');
      }

      const assigneeIsMember = teamDoc.members.some((member) => member.toString() === assignee._id.toString());
      if (!assigneeIsMember) {
        throw new ApiError(400, 'Assigned user must be a member of the selected team');
      }
    }
  }

  const task = await Task.create({
    title,
    description,
    dueDate,
    status,
    priority,
    team,
    assignedTo,
    tags,
    createdBy: req.user._id
  });

  if (assignedTo) {
    await createNotification({
      recipient: assignedTo,
      actor: req.user._id,
      task: task._id,
      team: task.team,
      type: 'task_assigned',
      message: `You were assigned to task ${task.title}`
    });
  }

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy assignedTo team', 'name email title kind')
    .populate('attachments.uploadedBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Task created successfully',
    data: populatedTask
  });
});

const listTasks = asyncHandler(async (req, res) => {
  const teamIds = await getAccessibleTeamIds(req.user._id);
  const conditions = [
    {
      $or: [
        { createdBy: req.user._id },
        { assignedTo: req.user._id },
        { team: { $in: teamIds } }
      ]
    }
  ];

  if (req.query.status) {
    conditions.push({ status: req.query.status });
  }
  if (req.query.teamId) {
    conditions.push({ team: req.query.teamId });
  }
  if (req.query.assignedTo) {
    conditions.push({ assignedTo: req.query.assignedTo });
  }
  if (req.query.createdBy) {
    conditions.push({ createdBy: req.query.createdBy });
  }
  if (req.query.search) {
    const pattern = new RegExp(escapeRegex(req.query.search), 'i');
    conditions.push({
      $or: [
        { title: pattern },
        { description: pattern },
        { tags: pattern }
      ]
    });
  }

  const page = Number(req.query.page || 1);
  const limit = Math.min(Number(req.query.limit || 10), 100);
  const sortBy = req.query.sortBy || 'createdAt';
  const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
  const filter = conditions.length > 1 ? { $and: conditions } : conditions[0];

  const [tasks, total] = await Promise.all([
    Task.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('createdBy assignedTo team', 'name email title kind')
      .populate('attachments.uploadedBy', 'name email'),
    Task.countDocuments(filter)
  ]);

  res.json({
    success: true,
    data: tasks,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

const getTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId)
    .populate('createdBy assignedTo team', 'name email title kind')
    .populate('attachments.uploadedBy', 'name email');

  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureTaskAccess(task, req.user._id);

  res.json({
    success: true,
    data: task
  });
});

const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureTaskAccess(task, req.user._id);

  const previousAssignee = task.assignedTo ? task.assignedTo.toString() : null;
  const previousStatus = task.status;

  ['title', 'description', 'dueDate', 'status', 'priority', 'assignedTo', 'team'].forEach((field) => {
    if (req.body[field] !== undefined) {
      task[field] = req.body[field];
    }
  });
  if (req.body.tags !== undefined) {
    task.tags = req.body.tags;
  }

  if (req.body.team) {
    const teamDoc = await Team.findById(req.body.team);
    if (!teamDoc) {
      throw new ApiError(404, 'Team not found');
    }
    const hasAccess = teamDoc.members.some((member) => member.toString() === req.user._id.toString());
    if (!hasAccess) {
      throw new ApiError(403, 'You must be a member of the selected team');
    }
  }

  await validateAssignee(task, task.assignedTo);
  await task.save();

  if (task.assignedTo && task.assignedTo.toString() !== previousAssignee) {
    await createNotification({
      recipient: task.assignedTo,
      actor: req.user._id,
      task: task._id,
      team: task.team,
      type: 'task_assigned',
      message: `You were assigned to task ${task.title}`
    });
  }

  if (task.status !== previousStatus) {
    await createNotification({
      recipient: task.createdBy,
      actor: req.user._id,
      task: task._id,
      team: task.team,
      type: 'task_updated',
      message: `Task ${task.title} was updated to ${task.status}`
    });
  }

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy assignedTo team', 'name email title kind')
    .populate('attachments.uploadedBy', 'name email');

  res.json({
    success: true,
    message: 'Task updated successfully',
    data: populatedTask
  });
});

const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureTaskAccess(task, req.user._id);

  await Promise.all(
    task.attachments.map(async (attachment) => {
      if (!attachment.path) {
        return;
      }

      try {
        await fs.unlink(path.resolve(attachment.path));
      } catch (error) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    })
  );

  await Comment.deleteMany({ task: task._id });
  await Notification.deleteMany({ task: task._id });
  await task.deleteOne();

  res.json({
    success: true,
    message: 'Task deleted successfully'
  });
});

const completeTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureTaskAccess(task, req.user._id);
  task.status = 'completed';
  await task.save();

  if (task.assignedTo) {
    await createNotification({
      recipient: task.assignedTo,
      actor: req.user._id,
      task: task._id,
      team: task.team,
      type: 'task_updated',
      message: `Task ${task.title} was marked as completed`
    });
  }

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy assignedTo team', 'name email title kind')
    .populate('attachments.uploadedBy', 'name email');

  res.json({
    success: true,
    message: 'Task marked as completed',
    data: populatedTask
  });
});

const assignTask = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureTaskAccess(task, req.user._id);

  const assignee = await User.findById(req.body.assignedTo);
  if (!assignee) {
    throw new ApiError(404, 'Assigned user not found');
  }

  if (task.team) {
    const team = await Team.findById(task.team);
    const isMember = team.members.some((member) => member.toString() === assignee._id.toString());
    if (!isMember) {
      throw new ApiError(400, 'Assigned user must be a member of the team');
    }
  }

  task.assignedTo = assignee._id;
  await task.save();

  await createNotification({
    recipient: assignee._id,
    actor: req.user._id,
    task: task._id,
    team: task.team,
    type: 'task_assigned',
    message: `You were assigned to task ${task.title}`
  });

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy assignedTo team', 'name email title kind')
    .populate('attachments.uploadedBy', 'name email');

  res.json({
    success: true,
    message: 'Task assigned successfully',
    data: populatedTask
  });
});

const addAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureTaskAccess(task, req.user._id);

  if (!req.file) {
    throw new ApiError(400, 'A file upload is required');
  }

  task.attachments.push({
    filename: req.file.filename,
    originalName: req.file.originalname,
    mimetype: req.file.mimetype,
    size: req.file.size,
    path: req.file.path,
    uploadedBy: req.user._id
  });
  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('createdBy assignedTo team', 'name email title kind')
    .populate('attachments.uploadedBy', 'name email');

  res.status(201).json({
    success: true,
    message: 'Attachment uploaded successfully',
    data: populatedTask
  });
});

const removeAttachment = asyncHandler(async (req, res) => {
  const task = await Task.findById(req.params.taskId);
  if (!task) {
    throw new ApiError(404, 'Task not found');
  }

  await ensureTaskAccess(task, req.user._id);

  const attachment = task.attachments.id(req.params.attachmentId);
  if (!attachment) {
    throw new ApiError(404, 'Attachment not found');
  }

  if (attachment.path) {
    try {
      await fs.unlink(path.resolve(attachment.path));
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  attachment.deleteOne();
  await task.save();

  res.json({
    success: true,
    message: 'Attachment removed successfully'
  });
});

module.exports = {
  createTask,
  listTasks,
  getTask,
  updateTask,
  deleteTask,
  completeTask,
  assignTask,
  addAttachment,
  removeAttachment
};
