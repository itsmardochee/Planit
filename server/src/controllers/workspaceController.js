import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';
import Comment from '../models/Comment.js';
import logActivity from '../utils/logActivity.js';

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
export const createWorkspace = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Trim and validate name
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide workspace name',
      });
    }

    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Workspace name cannot exceed 100 characters',
      });
    }

    // Trim and validate description
    const trimmedDescription = description?.trim();
    if (trimmedDescription && trimmedDescription.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Description cannot exceed 500 characters',
      });
    }

    // Create workspace
    const workspace = await Workspace.create({
      name: trimmedName,
      description: trimmedDescription,
      userId: req.user._id,
    });

    // Log activity
    await logActivity({
      workspaceId: workspace._id,
      userId: req.user._id,
      action: 'created',
      entityType: 'workspace',
      details: { workspaceName: workspace.name },
    });

    res.status(201).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * @swagger
 * /api/workspaces:
 *   get:
 *     summary: Get all workspaces for authenticated user
 *     description: Returns all workspaces owned by the user or where the user is a member
 *     tags: [Workspaces]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of workspaces (owned and member workspaces combined)
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
 * @desc    Get all workspaces for authenticated user (owned + member workspaces)
 * @route   GET /api/workspaces
 * @access  Private
 */
export const getWorkspaces = async (req, res) => {
  try {
    // Get workspaces owned by user
    const ownedWorkspaces = await Workspace.find({ userId: req.user._id });

    // Get workspaces where user is a member
    const memberships = await WorkspaceMember.find({ userId: req.user._id });
    const membershipMap = new Map(
      memberships.map(m => [m.workspaceId.toString(), m.role])
    );
    const memberWorkspaceIds = memberships.map(m => m.workspaceId);

    // Get workspace details for member workspaces
    const memberWorkspaces = await Workspace.find({
      _id: { $in: memberWorkspaceIds },
    });

    // Combine and deduplicate workspaces, enriching with userRole
    const workspaceMap = new Map();

    // Add owned workspaces first (userRole = 'owner')
    ownedWorkspaces.forEach(ws => {
      workspaceMap.set(ws._id.toString(), {
        ...ws.toObject(),
        userRole: 'owner',
      });
    });

    // Add member workspaces (won't overwrite if already owner)
    memberWorkspaces.forEach(ws => {
      const id = ws._id.toString();
      if (!workspaceMap.has(id)) {
        workspaceMap.set(id, {
          ...ws.toObject(),
          userRole: membershipMap.get(id) || 'member',
        });
      }
    });

    // Convert map to array
    const workspaces = Array.from(workspaceMap.values());

    res.status(200).json({
      success: true,
      data: workspaces,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
export const getWorkspaceById = async (req, res) => {
  try {
    // req.workspace is already validated and attached by checkWorkspaceAccess middleware
    res.status(200).json({
      success: true,
      data: req.workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
export const updateWorkspace = async (req, res) => {
  try {
    // req.workspace is already validated by checkWorkspaceAccess middleware
    // Permission check (workspace:update) is enforced by checkPermission middleware in route

    const { name, description } = req.body;

    // Prepare update data with trimmed values
    const updateData = {};

    // Trim and validate name if provided
    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Workspace name cannot be empty',
        });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Workspace name cannot exceed 100 characters',
        });
      }
      updateData.name = trimmedName;
    }

    // Trim and validate description if provided
    if (description !== undefined) {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 500 characters',
        });
      }
      updateData.description = trimmedDescription;
    }

    // Find and update workspace (already validated by middleware)
    const workspace = await Workspace.findByIdAndUpdate(
      req.workspace._id,
      { $set: updateData },
      { new: true, runValidators: true }
    );

    // Log activity if there were updates
    const updatedFields = Object.keys(updateData);
    if (updatedFields.length > 0) {
      await logActivity({
        workspaceId: workspace._id,
        userId: req.user._id,
        action: 'updated',
        entityType: 'workspace',
        details: { workspaceName: workspace.name, fields: updatedFields },
      });
    }

    res.status(200).json({
      success: true,
      data: workspace,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
export const deleteWorkspace = async (req, res) => {
  try {
    // req.workspace is already validated by checkWorkspaceAccess middleware
    // Only workspace owner can delete
    if (!req.isWorkspaceOwner) {
      return res.status(403).json({
        success: false,
        message: 'Only workspace owner can delete workspace',
      });
    }

    const workspaceId = req.workspace._id;
    const workspaceName = req.workspace.name;

    // Cascade delete: Get all boards in this workspace
    const boards = await Board.find({ workspaceId });
    const boardIds = boards.map(board => board._id);

    // Delete all comments on cards in those boards
    const cardIds = (
      await Card.find({ boardId: { $in: boardIds } }).select('_id')
    ).map(c => c._id);
    await Comment.deleteMany({ cardId: { $in: cardIds } });

    // Delete all cards associated with those boards
    await Card.deleteMany({ boardId: { $in: boardIds } });

    // Delete all lists associated with those boards
    await List.deleteMany({ boardId: { $in: boardIds } });

    // Delete all boards in this workspace
    await Board.deleteMany({ workspaceId });

    // Delete all workspace members
    await WorkspaceMember.deleteMany({ workspaceId });

    // Finally, delete the workspace itself
    await Workspace.findByIdAndDelete(workspaceId);

    // Log activity
    await logActivity({
      workspaceId,
      userId: req.user._id,
      action: 'deleted',
      entityType: 'workspace',
      details: { workspaceName },
    });

    res.status(200).json({
      success: true,
      message: 'Workspace deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
