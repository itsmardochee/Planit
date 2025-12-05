import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';

/**
 * @swagger
 * /api/workspaces:
 *   post:
 *     summary: Create a new workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
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
 *                 example: My Workspace
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: A workspace for managing projects
 *     responses:
 *       201:
 *         description: Workspace created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkspaceResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Create new workspace
 * @route   POST /api/workspaces
 * @access  Private
 */
export const createWorkspace = async (req, res, next) => {
  try {
    const { name, description } = req.body;

    // Trim and validate name
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new ValidationError('Please provide workspace name');
    }

    if (trimmedName.length > 100) {
      throw new ValidationError('Workspace name cannot exceed 100 characters');
    }

    // Trim and validate description
    const trimmedDescription = description?.trim();
    if (trimmedDescription && trimmedDescription.length > 500) {
      throw new ValidationError('Description cannot exceed 500 characters');
    }

    // Create workspace
    const workspace = await Workspace.create({
      name: trimmedName,
      description: trimmedDescription,
      userId: req.user._id,
    });

    res.status(201).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     summary: Get all workspaces for authenticated user
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkspacesResponse'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Get all workspaces for authenticated user
 * @route   GET /api/workspaces
 * @access  Private
 */
export const getWorkspaces = async (req, res, next) => {
  try {
    const workspaces = await Workspace.find({ userId: req.user._id });

    res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/workspaces/{id}:
 *   get:
 *     summary: Get workspace by ID
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkspaceResponse'
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workspace not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Get single workspace by id
 * @route   GET /api/workspaces/:id
 * @access  Private
 */
export const getWorkspaceById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid workspace ID format');
    }

    const workspace = await Workspace.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/workspaces/{id}:
 *   put:
 *     summary: Update workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: Updated Workspace
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Workspace updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/WorkspaceResponse'
 *       400:
 *         description: Validation error or invalid ID
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workspace not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Update workspace
 * @route   PUT /api/workspaces/:id
 * @access  Private
 */
export const updateWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid workspace ID format');
    }

    // Prepare update data with trimmed values
    const updateData = {};

    // Trim and validate name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new ValidationError('Workspace name cannot be empty');
      }
      if (trimmedName.length > 100) {
        throw new ValidationError(
          'Workspace name cannot exceed 100 characters'
        );
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

    // Find and update workspace
    const workspace = await Workspace.findOneAndUpdate(
      { _id: id, userId: req.user._id },
      { $set: updateData },
      { new: true, runValidators: true }
    );

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/workspaces/{id}:
 *   delete:
 *     summary: Delete workspace
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Workspace ID
 *     responses:
 *       200:
 *         description: Workspace deleted successfully
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
 *                   example: Workspace deleted successfully
 *       400:
 *         description: Invalid ID format
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Not authenticated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Workspace not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
/**
 * @desc    Delete workspace
 * @route   DELETE /api/workspaces/:id
 * @access  Private
 */
export const deleteWorkspace = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Validate ObjectId
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid workspace ID format');
    }

    // Find workspace first to verify ownership
    const workspace = await Workspace.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!workspace) {
      throw new NotFoundError('Workspace not found');
    }

    // Cascade delete: Get all boards in this workspace
    const boards = await Board.find({ workspaceId: id });
    const boardIds = boards.map(board => board._id);

    // Delete all cards associated with those boards
    await Card.deleteMany({ boardId: { $in: boardIds } });

    // Delete all lists associated with those boards
    await List.deleteMany({ boardId: { $in: boardIds } });

    // Delete all boards in this workspace
    await Board.deleteMany({ workspaceId: id });

    // Finally, delete the workspace itself
    await Workspace.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
