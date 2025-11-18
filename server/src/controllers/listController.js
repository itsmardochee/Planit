import mongoose from 'mongoose';
import List from '../models/List.js';
import Board from '../models/Board.js';

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
      return res.status(403).json({
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
      return res.status(400).json({
        success: false,
        message: 'List name cannot exceed 100 characters',
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

    // Validate/derive position
    let nextPosition = 0;
    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        return res.status(400).json({
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
      return res.status(403).json({
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
      return res.status(403).json({
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
      return res.status(403).json({
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
        return res.status(400).json({
          success: false,
          message: 'List name cannot exceed 100 characters',
        });
      }
      updateData.name = trimmedName;
    }

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

    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        return res.status(400).json({
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
      return res.status(403).json({
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
