import mongoose from 'mongoose';
import List from '../models/List.js';
import Board from '../models/Board.js';

/**
 * @desc    Create new list in a board
 * @route   POST /api/boards/:boardId/lists
 * @access  Private
 */
export const createList = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { name, description, position } = req.body;

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid board ID format' });
    }

    // Check if board exists and belongs to user
    const board = await Board.findById(boardId);
    if (!board) {
      return res
        .status(404)
        .json({ success: false, message: 'Board not found' });
    }
    if (board.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Not authorized to access this board',
        });
    }

    // Trim and validate name
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide list name' });
    }
    if (trimmedName.length > 100) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'List name cannot exceed 100 characters',
        });
    }

    // Trim and validate description
    const trimmedDescription = description?.trim();
    if (trimmedDescription && trimmedDescription.length > 500) {
      return res
        .status(400)
        .json({
          success: false,
          message: 'Description cannot exceed 500 characters',
        });
    }

    // Validate/derive position
    let nextPosition = 0;
    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Position must be a non-negative integer',
          });
      }
      nextPosition = position;
    } else {
      const last = await List.find({ boardId }).sort({ position: -1 }).limit(1);
      nextPosition = last.length ? last[0].position + 1 : 0;
    }

    const list = await List.create({
      name: trimmedName,
      description: trimmedDescription,
      position: nextPosition,
      workspaceId: board.workspaceId,
      boardId,
      userId: req.user._id,
    });

    res.status(201).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get all lists for a board
 * @route   GET /api/boards/:boardId/lists
 * @access  Private
 */
export const getLists = async (req, res) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid board ID format' });
    }

    const board = await Board.findById(boardId);
    if (!board) {
      return res
        .status(404)
        .json({ success: false, message: 'Board not found' });
    }
    if (board.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Not authorized to access this board',
        });
    }

    const lists = await List.find({ boardId, userId: req.user._id }).sort({
      position: 1,
    });

    res.status(200).json({ success: true, data: lists });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get single list by ID
 * @route   GET /api/lists/:id
 * @access  Private
 */
export const getList = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid list ID format' });
    }

    const list = await List.findById(id);
    if (!list) {
      return res
        .status(404)
        .json({ success: false, message: 'List not found' });
    }
    if (list.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Not authorized to access this list',
        });
    }

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Update a list
 * @route   PUT /api/lists/:id
 * @access  Private
 */
export const updateList = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, position } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid list ID format' });
    }

    const existing = await List.findById(id);
    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: 'List not found' });
    }
    if (existing.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Not authorized to update this list',
        });
    }

    const updateData = {};

    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        return res
          .status(400)
          .json({ success: false, message: 'List name cannot be empty' });
      }
      if (trimmedName.length > 100) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'List name cannot exceed 100 characters',
          });
      }
      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 500) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Description cannot exceed 500 characters',
          });
      }
      updateData.description = trimmedDescription;
    }

    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        return res
          .status(400)
          .json({
            success: false,
            message: 'Position must be a non-negative integer',
          });
      }
      updateData.position = position;
    }

    const list = await List.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: list });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete a list
 * @route   DELETE /api/lists/:id
 * @access  Private
 */
export const deleteList = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid list ID format' });
    }

    const list = await List.findById(id);
    if (!list) {
      return res
        .status(404)
        .json({ success: false, message: 'List not found' });
    }
    if (list.userId.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({
          success: false,
          message: 'Not authorized to delete this list',
        });
    }

    await List.findByIdAndDelete(id);

    // TODO: When Card model exists, cascade delete cards by listId

    res
      .status(200)
      .json({ success: true, message: 'List deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
