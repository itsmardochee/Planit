import mongoose from 'mongoose';
import Board from '../models/Board.js';
import Workspace from '../models/Workspace.js';

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
export const createBoard = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    // Validate workspace ID format
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workspace ID format',
      });
    }

    // Check if workspace exists and belongs to user
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      userId: req.user._id,
    });

    if (!workspace) {
      const workspaceExists = await Workspace.findById(workspaceId);
      if (!workspaceExists) {
        return res.status(404).json({
          success: false,
          message: 'Workspace not found',
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this workspace',
      });
    }

    // Trim and validate name
    const trimmedName = name?.trim();
    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Please provide board name',
      });
    }

    if (trimmedName.length > 100) {
      return res.status(400).json({
        success: false,
        message: 'Board name cannot exceed 100 characters',
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
export const getBoards = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Validate workspace ID format
    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workspace ID format',
      });
    }

    // Check if workspace exists and belongs to user
    const workspace = await Workspace.findOne({
      _id: workspaceId,
      userId: req.user._id,
    });

    if (!workspace) {
      const workspaceExists = await Workspace.findById(workspaceId);
      if (!workspaceExists) {
        return res.status(404).json({
          success: false,
          message: 'Workspace not found',
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this workspace',
      });
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
export const getBoard = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid board ID format',
      });
    }

    // Find board
    const board = await Board.findOne({
      _id: id,
      userId: req.user._id,
    });

    if (!board) {
      const boardExists = await Board.findById(id);
      if (!boardExists) {
        return res.status(404).json({
          success: false,
          message: 'Board not found',
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this board',
      });
    }

    res.status(200).json({
      success: true,
      data: board,
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
export const updateBoard = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid board ID format',
      });
    }

    // Build update object
    const updateData = {};

    // Trim and validate name if provided
    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        return res.status(400).json({
          success: false,
          message: 'Board name cannot be empty',
        });
      }
      if (trimmedName.length > 100) {
        return res.status(400).json({
          success: false,
          message: 'Board name cannot exceed 100 characters',
        });
      }
      updateData.name = trimmedName;
    }

    // Trim and validate description if provided
    if (description !== undefined) {
      const trimmedDescription = description?.trim();
      if (trimmedDescription && trimmedDescription.length > 500) {
        return res.status(400).json({
          success: false,
          message: 'Description cannot exceed 500 characters',
        });
      }
      updateData.description = trimmedDescription;
    }

    // Find and update board
    const board = await Board.findOneAndUpdate(
      {
        _id: id,
        userId: req.user._id,
      },
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!board) {
      const boardExists = await Board.findById(id);
      if (!boardExists) {
        return res.status(404).json({
          success: false,
          message: 'Board not found',
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this board',
      });
    }

    res.status(200).json({
      success: true,
      data: board,
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
export const deleteBoard = async (req, res) => {
  try {
    const { id } = req.params;

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid board ID format',
      });
    }

    // Find and delete board
    const board = await Board.findOneAndDelete({
      _id: id,
      userId: req.user._id,
    });

    if (!board) {
      const boardExists = await Board.findById(id);
      if (!boardExists) {
        return res.status(404).json({
          success: false,
          message: 'Board not found',
        });
      }
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this board',
      });
    }

    // TODO: When List and Card models are implemented, add cascade delete logic:
    // - Delete all lists associated with this board
    // - Delete all cards associated with those lists

    res.status(200).json({
      success: true,
      message: 'Board deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
