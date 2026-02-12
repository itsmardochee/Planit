import mongoose from 'mongoose';
import List from '../models/List.js';
import Board from '../models/Board.js';
import Card from '../models/Card.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * @swagger
 * /api/boards/{boardId}/lists:
 *   post:
 *     summary: Create a new list in a board
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
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
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 100
 *                 example: To Do
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Tasks to complete
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 example: 0
 *                 description: Position in board (auto-incremented if not provided)
 *     responses:
 *       201:
 *         description: List created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListResponse'
 *       400:
 *         description: Validation error
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
 * @desc    Create new list in a board
 * @route   POST /api/boards/:boardId/lists
 * @access  Private (workspace owner or member)
 */
export const createList = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { name, description, position } = req.body;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware
    // (middleware resolved workspace from boardId)

    // Validate board ID format
    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new ValidationError('Invalid board ID format');
    }

    // Check if board exists
    const board = await Board.findById(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }

    // No need to check board.userId - workspace access is already verified by middleware

    // Trim and validate name
    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new ValidationError('Please provide list name');
    }
    if (trimmedName.length > 100) {
      throw new ValidationError('List name cannot exceed 100 characters');
    }

    // Trim and validate description
    const trimmedDescription = description?.trim();
    if (trimmedDescription && trimmedDescription.length > 500) {
      throw new ValidationError('Description cannot exceed 500 characters');
    }

    // Validate/derive position
    let nextPosition = 0;
    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        throw new ValidationError('Position must be a non-negative integer');
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

    logger.info(`List created: ${list._id} by user ${req.user._id}`);
    res.status(201).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/lists:
 *   get:
 *     summary: Get all lists for a board
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Board ID
 *     responses:
 *       200:
 *         description: List of lists sorted by position
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListsResponse'
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
 * @desc    Get all lists for a board
 * @route   GET /api/boards/:boardId/lists
 * @access  Private (workspace owner or member)
 */
export const getLists = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new ValidationError('Invalid board ID format');
    }

    const board = await Board.findById(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }

    // No need to check board.userId - workspace access is already verified by middleware

    // Return ALL lists in the board (workspace-scoped, not user-scoped)
    const lists = await List.find({ boardId }).sort({
      position: 1,
    });

    logger.info(`Retrieved ${lists.length} lists for board ${boardId}`);
    res.status(200).json({ success: true, data: lists });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lists/{id}:
 *   get:
 *     summary: Get a single list by ID
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     responses:
 *       200:
 *         description: List details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListResponse'
 *       400:
 *         description: Invalid list ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this list
 *       404:
 *         description: List not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Get single list by ID
 * @route   GET /api/lists/:id
 * @access  Private (workspace owner or member)
 */
export const getList = async (req, res, next) => {
  try {
    const { id } = req.params;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware
    // (middleware resolved workspace from listId)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid list ID format');
    }

    const list = await List.findById(id);
    if (!list) {
      throw new NotFoundError('List not found');
    }

    // No need to check list.userId - workspace access is already verified by middleware

    logger.info(`Retrieved list ${id}`);
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lists/{id}:
 *   put:
 *     summary: Update a list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
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
 *                 example: In Progress
 *               description:
 *                 type: string
 *                 maxLength: 500
 *                 example: Currently working on
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 example: 1
 *     responses:
 *       200:
 *         description: List updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this list
 *       404:
 *         description: List not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Update a list
 * @route   PUT /api/lists/:id
 * @access  Private (workspace owner or member)
 */
export const updateList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, description, position } = req.body;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid list ID format');
    }

    const existing = await List.findById(id);
    if (!existing) {
      throw new NotFoundError('List not found');
    }

    // No need to check existing.userId - workspace access is already verified by middleware

    const updateData = {};

    if (name !== undefined) {
      const trimmedName = name?.trim();
      if (!trimmedName) {
        throw new ValidationError('List name cannot be empty');
      }
      if (trimmedName.length > 100) {
        throw new ValidationError('List name cannot exceed 100 characters');
      }
      updateData.name = trimmedName;
    }

    if (description !== undefined) {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 500) {
        throw new ValidationError('Description cannot exceed 500 characters');
      }
      updateData.description = trimmedDescription;
    }

    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        throw new ValidationError('Position must be a non-negative integer');
      }
      updateData.position = position;
    }

    const list = await List.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    logger.info(`List updated: ${id}`);
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lists/{id}/reorder:
 *   put:
 *     summary: Reorder a list by updating its position
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - position
 *             properties:
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *                 description: New position for the list
 *     responses:
 *       200:
 *         description: List reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ListResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to reorder this list
 *       404:
 *         description: List not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Update list position for reordering
 * @route   PUT /api/lists/:id/reorder
 * @access  Private (workspace owner or member)
 */
export const reorderList = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position } = req.body;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid list ID format');
    }

    if (position === undefined || position === null) {
      throw new ValidationError('Position is required');
    }

    if (!Number.isInteger(position) || position < 0) {
      throw new ValidationError('Position must be a non-negative integer');
    }

    const list = await List.findById(id);
    if (!list) {
      throw new NotFoundError('List not found');
    }

    // No need to check list.userId - workspace access is already verified by middleware

    const oldPosition = list.position;
    const newPosition = position;

    // Update positions of other lists in the same board
    if (oldPosition !== newPosition) {
      const boardId = list.boardId;

      if (newPosition > oldPosition) {
        // Moving down: decrement position of lists between old and new position
        await List.updateMany(
          {
            boardId,
            position: { $gt: oldPosition, $lte: newPosition },
            _id: { $ne: id },
          },
          { $inc: { position: -1 } }
        );
      } else {
        // Moving up: increment position of lists between new and old position
        await List.updateMany(
          {
            boardId,
            position: { $gte: newPosition, $lt: oldPosition },
            _id: { $ne: id },
          },
          { $inc: { position: 1 } }
        );
      }
    }

    // Update the list's position
    list.position = newPosition;
    await list.save();

    logger.info(`List reordered: ${id} to position ${newPosition}`);
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lists/{id}:
 *   delete:
 *     summary: Delete a list
 *     tags: [Lists]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     responses:
 *       200:
 *         description: List deleted successfully
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
 *                   example: List deleted successfully
 *       400:
 *         description: Invalid list ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to delete this list
 *       404:
 *         description: List not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Delete a list
 * @route   DELETE /api/lists/:id
 * @access  Private (workspace owner or member)
 */
export const deleteList = async (req, res, next) => {
  try {
    const { id } = req.params;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid list ID format');
    }

    const list = await List.findById(id);
    if (!list) {
      throw new NotFoundError('List not found');
    }

    // No need to check list.userId - workspace access is already verified by middleware

    await List.findByIdAndDelete(id);

    // Cascade delete: remove all cards that belong to this list
    await Card.deleteMany({ listId: id });

    logger.info(`List deleted: ${id}`);
    res
      .status(200)
      .json({ success: true, message: 'List deleted successfully' });
  } catch (error) {
    next(error);
  }
};
