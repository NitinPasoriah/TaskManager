const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 120
    },
    description: {
      type: String,
      trim: true,
      maxlength: 1000
    },
    kind: {
      type: String,
      enum: ['team', 'project'],
      default: 'team'
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      }
    ],
    inviteCode: {
      type: String,
      unique: true,
      default: () => uuidv4().split('-')[0].toUpperCase()
    }
  },
  { timestamps: true }
);

teamSchema.pre('save', function ensureOwnerInMembers(next) {
  if (!this.members.some((member) => member.toString() === this.owner.toString())) {
    this.members.push(this.owner);
  }
  next();
});

module.exports = mongoose.model('Team', teamSchema);
