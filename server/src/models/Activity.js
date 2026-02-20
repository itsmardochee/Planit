import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema(
  {
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
      index: true,
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      index: true,
    },
    cardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Card',
      index: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    action: {
      type: String,
      required: [true, 'Action is required'],
      enum: {
        values: [
          'created',
          'updated',
          'moved',
          'deleted',
          'commented',
          'assigned',
          'archived',
        ],
        message: '{VALUE} is not a valid action',
      },
      index: true,
    },
    entityType: {
      type: String,
      required: [true, 'Entity type is required'],
      enum: {
        values: [
          'workspace',
          'board',
          'list',
          'card',
          'comment',
          'member',
          'label',
        ],
        message: '{VALUE} is not a valid entity type',
      },
      index: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Compound indexes for common queries
activitySchema.index({ workspaceId: 1, createdAt: -1 });
activitySchema.index({ boardId: 1, createdAt: -1 });
activitySchema.index({ cardId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, createdAt: -1 });

const Activity = mongoose.model('Activity', activitySchema);

export default Activity;
