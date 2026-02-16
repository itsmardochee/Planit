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
  },
  {
    timestamps: true,
  }
);

// Useful indexes for query performance
cardSchema.index({ listId: 1, userId: 1 });
cardSchema.index({ listId: 1, position: 1 });

const Card = mongoose.model('Card', cardSchema);

export default Card;
