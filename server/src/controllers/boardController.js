import mongoose from 'mongoose';
import Board from '../models/Board.js';
import Workspace from '../models/Workspace.js';
import List from '../models/List.js';
import Card from '../models/Card.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors.js';

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards:
 *   post:
 *     summary: Create a new board in a workspace
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Project Sprint 1
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Sprint planning and tracking
 *     responses:
 *       201:
 *         description: Board created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoardResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this workspace
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Create new board
 * @route   POST /api/workspaces/:workspaceId/boards
 * @access  Private
 */
export const createBoard = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    // Validate workspace ID format
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ValidationError('Invalid workspace ID format');
    }

    // Check if workspace exists and belongs to user
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    if (workspace.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to access this workspace');
    }

    // Trim and validate name
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new ValidationError('Please provide board name');
    }

    if (trimmedName.length > 100) {
      throw new ValidationError('Board name cannot exceed 100 characters');
    }

    // Trim and validate description
    const trimmedDescription = description?.trim();
    if (trimmedDescription && trimmedDescription.length > 500) {
      throw new ValidationError('Description cannot exceed 500 characters');
    }

    // Create board
    const board = await Board.create({
      name: trimmedName,
      description: trimmedDescription,
      workspaceId,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: board,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/workspaces/{workspaceId}/boards:
 *   get:
 *     summary: Get all boards for a workspace
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: workspaceId
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: List of boards
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoardsResponse'
 *       400:
 *         description: Invalid workspace ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this workspace
 *       404:
 *         description: Workspace not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Get all boards for a workspace
 * @route   GET /api/workspaces/:workspaceId/boards
 * @access  Private
 */
export const getBoards = async (req, res, next) => {
  try {
    const { workspaceId } = req.params;

    // Validate workspace ID format
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      throw new ValidationError('Invalid workspace ID format');
    }

    // Check if workspace exists and belongs to user
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    if (workspace.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to access this workspace');
    }

    const boards = await Board.find({
      workspaceId,
      userId: req.user._id,
    });

    res.status(200).json({
      success: true,
      data: boards,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/boards/{id}:
 *   get:
 *     summary: Get a single board by ID
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Board ID
 *     responses:
 *       200:
 *         description: Board details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoardResponse'
 *       400:
 *         description: Invalid board ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this board
 *       404:
 *         description: Board not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Get single board by ID
 * @route   GET /api/boards/:id
 * @access  Private
 */
export const getBoard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid board ID format');
    }

    // Find board
    const board = await Board.findById(id);

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    if (board.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to access this board');
    }

    res.status(200).json({
      success: true,
      data: board,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/boards/{id}:
 *   put:
 *     summary: Update a board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Board ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Updated Board Name
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Board updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BoardResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this board
 *       404:
 *         description: Board not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Update board
 * @route   PUT /api/boards/:id
 * @access  Private
 */
export const updateBoard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid board ID format');
    }

    // Build update object
    const updateData = {};

    // Trim and validate name if provided
    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        throw new ValidationError('Board name cannot be empty');
      }
      if (trimmedName.length > 100) {
        throw new ValidationError('Board name cannot exceed 100 characters');
      }
      updateData.name = trimmedName;
    }

    // Trim and validate description if provided
    if (description !== undefined) {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 500) {
        throw new ValidationError('Description cannot exceed 500 characters');
      }
      updateData.description = trimmedDescription;
    }

    // Find board first to check authorization
    const existingBoard = await Board.findById(id);

    if (!existingBoard) {
      throw new NotFoundError('Board not found');
    }

    if (existingBoard.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to update this board');
    }

    // Update board
    const board = await Board.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({
      success: true,
      data: board,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/boards/{id}:
 *   delete:
 *     summary: Delete a board
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Board ID
 *     responses:
 *       200:
 *         description: Board deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Board deleted successfully
 *       400:
 *         description: Invalid board ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to delete this board
 *       404:
 *         description: Board not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Delete board
 * @route   DELETE /api/boards/:id
 * @access  Private
 */
export const deleteBoard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid board ID format');
    }

    // Find board first to check authorization
    const board = await Board.findById(id);

    if (!board) {
      throw new NotFoundError('Board not found');
    }

    if (board.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to delete this board');
    }

    // Cascade delete: Delete all cards associated with this board
    await Card.deleteMany({ boardId: id });

    // Cascade delete: Delete all lists under this board
    await List.deleteMany({ boardId: id });

    // Finally, delete the board itself
    await Board.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
