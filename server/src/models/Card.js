import mongoose from 'mongoose';

const cardSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Card title is required'],
      maxlength: [200, 'Card title cannot exceed 200 characters'],
      trim: true,
    },
    description: {
      type: String,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
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
    listId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'List',
      required: [true, 'List ID is required'],
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
    assignedTo: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    labels: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Label',
      },
    ],
    status: {
      type: String,
      enum: {
        values: ['todo', 'in-progress', 'done', 'blocked'],
        message: 'Status must be one of: todo, in-progress, done, blocked',
      },
      default: null,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    reminderDate: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field: true if dueDate exists and is in the past
cardSchema.virtual('isOverdue').get(function () {
  if (!this.dueDate) return false;
  return new Date() > this.dueDate;
});

// Useful indexes for query performance
cardSchema.index({ listId: 1, userId: 1 });
cardSchema.index({ listId: 1, position: 1 });

const Card = mongoose.model('Card', cardSchema);

export default Card;
