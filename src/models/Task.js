const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema(
  {
    filename: String,
    originalName: String,
    mimetype: String,
    size: Number,
    path: String,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      trim: true,
      maxlength: 5000
    },
    dueDate: Date,
    status: {
      type: String,
      enum: ['open', 'in-progress', 'completed', 'archived'],
      default: 'open'
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    team: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    attachments: [attachmentSchema],
    completedAt: Date
  },
  { timestamps: true }
);

taskSchema.index({ title: 'text', description: 'text', tags: 'text' });

taskSchema.pre('save', function setCompletedTimestamp(next) {
  if (this.status === 'completed' && !this.completedAt) {
    this.completedAt = new Date();
  }

  if (this.status !== 'completed') {
    this.completedAt = undefined;
  }

  next();
});

module.exports = mongoose.model('Task', taskSchema);
