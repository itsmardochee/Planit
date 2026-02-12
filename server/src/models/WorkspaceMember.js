import mongoose from 'mongoose';

const workspaceMemberSchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    role: {
      type: String,
      enum: {
        values: ['owner', 'admin', 'member', 'viewer'],
        message: 'Role must be one of: owner, admin, member, viewer',
      },
      default: 'member',
      required: [true, 'Role is required'],
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'InvitedBy user ID is required'],
    },
    invitedAt: {
      type: Date,
      default: Date.now,
    },
    joinedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to prevent duplicate memberships
workspaceMemberSchema.index({ workspaceId: 1, userId: 1 }, { unique: true });

// Useful indexes for query performance
workspaceMemberSchema.index({ workspaceId: 1, role: 1 });
workspaceMemberSchema.index({ userId: 1 });

const WorkspaceMember = mongoose.model('WorkspaceMember', workspaceMemberSchema);

export default WorkspaceMember;
