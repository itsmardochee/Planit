import mongoose from 'mongoose';

const labelSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Label name is required'],
      maxlength: [50, 'Label name cannot exceed 50 characters'],
      trim: true,
    },
    color: {
      type: String,
      required: [true, 'Label color is required'],
      validate: {
        validator: function (v) {
          return /^#[0-9A-Fa-f]{6}$/.test(v);
        },
        message: 'Color must be a valid hex color (e.g. #FF0000)',
      },
    },
    boardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Board',
      required: [true, 'Board ID is required'],
    },
  },
  {
    timestamps: true,
  }
);

labelSchema.index({ boardId: 1 });
labelSchema.index({ boardId: 1, name: 1 }, { unique: true });

const Label = mongoose.model('Label', labelSchema);

export default Label;
