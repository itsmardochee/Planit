import mongoose from 'mongoose';

const listSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'List name is required'],
      maxlength: [100, 'List name cannot exceed 100 characters'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      trim: true,
    },
    position: {
      type: Number,
      default: 0,
      min: [0, 'Position must be a non-negative integer'],
      validate: {
        validator: Number.isInteger,
        message: 'Position must be an integer',
      },
    },
    workspaceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Workspace',
      required: [true, 'Workspace ID is required'],
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes for query performance
listSchema.index({ boardId: 1, userId: 1 });
listSchema.index({ boardId: 1, position: 1 });

const List = mongoose.model('List', listSchema);

export default List;
