import mongoose from 'mongoose';
import Card from '../models/Card.js';
import List from '../models/List.js';
import User from '../models/User.js';
import Label from '../models/Label.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Comment from '../models/Comment.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';
import logActivity from '../utils/logActivity.js';
import { getIO } from '../socket/index.js';

/**
 * @swagger
 * /api/lists/{listId}/cards:
 *   post:
 *     summary: Create a new card in a list
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
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
 *               - title
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: Implement authentication
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Create JWT-based auth system
 *               position:
 *                 type: integer
 *                 minimum: 0
 *                 example: 0
 *                 description: Position in list (auto-incremented if not provided)
 *     responses:
 *       201:
 *         description: Card created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       400:
 *         description: Validation error
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
 * @desc    Create new card in a list
 * @route   POST /api/lists/:listId/cards
 * @access  Private (workspace owner or member)
 */
export const createCard = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { title, description, position } = req.body;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware
    // (middleware resolved workspace from listId)

    // Validate list ID format
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ValidationError('Invalid list ID format');
    }

    // Check if list exists
    const list = await List.findById(listId);
    if (!list) {
      throw new NotFoundError('List not found');
    }

    // No need to check list.userId - workspace access is already verified by middleware

    // Trim and validate title
    const trimmedTitle = title?.trim();
    if (!trimmedTitle) {
      throw new ValidationError('Please provide card title');
    }
    if (trimmedTitle.length > 200) {
      throw new ValidationError('Card title cannot exceed 200 characters');
    }

    // Trim and validate description
    const trimmedDescription = description?.trim();
    if (trimmedDescription && trimmedDescription.length > 2000) {
      throw new ValidationError('Description cannot exceed 2000 characters');
    }

    // Validate/derive position
    let nextPosition = 0;
    if (position !== undefined) {
      if (!Number.isInteger(position) || position < 0) {
        throw new ValidationError('Position must be a non-negative integer');
      }
      nextPosition = position;
    } else {
      const last = await Card.find({ listId }).sort({ position: -1 }).limit(1);
      nextPosition = last.length ? last[0].position + 1 : 0;
    }

    const card = await Card.create({
      title: trimmedTitle,
      description: trimmedDescription,
      position: nextPosition,
      listId,
      boardId: list.boardId,
      userId: req.user._id,
    });

    // Log activity
    await logActivity({
      workspaceId: list.workspaceId,
      boardId: list.boardId,
      cardId: card._id,
      userId: req.user._id,
      action: 'created',
      entityType: 'card',
      details: { cardTitle: card.title },
    });

    logger.info(`Card created: ${card._id} by user ${req.user._id}`);
    getIO()?.to(`board:${list.boardId}`).emit('card:created', {
      card,
      listId,
      boardId: list.boardId,
    });
    res.status(201).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/lists/{listId}/cards:
 *   get:
 *     summary: Get all cards for a list
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *         description: List ID
 *     responses:
 *       200:
 *         description: List of cards sorted by position
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardsResponse'
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
 * @desc    Get all cards for a list
 * @route   GET /api/lists/:listId/cards
 * @access  Private (workspace owner or member)
 */
export const getCards = async (req, res, next) => {
  try {
    const { listId } = req.params;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ValidationError('Invalid list ID format');
    }

    const list = await List.findById(listId);
    if (!list) {
      throw new NotFoundError('List not found');
    }

    // No need to check list.userId - workspace access is already verified by middleware

    // Return ALL cards in the list (workspace-scoped, not user-scoped)
    // Populate assignedTo with user details for filtering and display
    const cards = await Card.find({ listId })
      .populate('assignedTo', 'username email')
      .populate('labels', 'name color')
      .sort({
        position: 1,
      });

    logger.info(`Retrieved ${cards.length} cards for list ${listId}`);
    res.status(200).json({ success: true, data: cards });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}:
 *   get:
 *     summary: Get a single card by ID
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       400:
 *         description: Invalid card ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to access this card
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Get single card by ID
 * @route   GET /api/cards/:id
 * @access  Private (workspace owner or member)
 */
export const getCard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware
    // (middleware resolved workspace from cardId)

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(id)
      .populate('assignedTo', 'username email')
      .populate('labels', 'name color');
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // No need to check card.userId - workspace access is already verified by middleware

    logger.info(`Retrieved card ${id}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}:
 *   put:
 *     summary: Update a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 maxLength: 200
 *                 example: Updated title
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *                 example: Updated description
 *     responses:
 *       200:
 *         description: Card updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to update this card
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Update card
 * @route   PUT /api/cards/:id
 * @access  Private (workspace owner or member)
 */
export const updateCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // No need to check card.userId - workspace access is already verified by middleware

    // Update title if provided
    if (title !== undefined) {
      const trimmedTitle = title.trim();
      if (!trimmedTitle) {
        throw new ValidationError('Title cannot be empty');
      }
      if (trimmedTitle.length > 200) {
        throw new ValidationError('Card title cannot exceed 200 characters');
      }
      card.title = trimmedTitle;
    }

    // Update description if provided
    if (description !== undefined) {
      const trimmedDescription = description.trim();
      if (trimmedDescription.length > 2000) {
        throw new ValidationError('Description cannot exceed 2000 characters');
      }
      card.description = trimmedDescription;
    }

    // Update dueDate if provided (can be null to clear)
    if (req.body.dueDate !== undefined) {
      const { dueDate } = req.body;
      if (dueDate !== null) {
        const parsed = new Date(dueDate);
        if (isNaN(parsed.getTime())) {
          throw new ValidationError('Invalid dueDate format');
        }
        card.dueDate = parsed;
      } else {
        card.dueDate = null;
        card.reminderDate = null; // Clear reminder if due date is cleared
      }
    }

    await card.save();

    // Log activity for updates
    const updatedFields = [];
    if (title !== undefined) updatedFields.push('title');
    if (description !== undefined) updatedFields.push('description');

    if (updatedFields.length > 0) {
      const list = await List.findById(card.listId);
      await logActivity({
        workspaceId: list.workspaceId,
        boardId: card.boardId,
        cardId: card._id,
        userId: req.user._id,
        action: 'updated',
        entityType: 'card',
        details: { cardTitle: card.title, fields: updatedFields },
      });
    }

    logger.info(`Card updated: ${id}`);
    getIO()?.to(`board:${card.boardId}`).emit('card:updated', { card });
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}:
 *   delete:
 *     summary: Delete a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     responses:
 *       200:
 *         description: Card deleted successfully
 *       400:
 *         description: Invalid card ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to delete this card
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Delete card
 * @route   DELETE /api/cards/:id
 * @access  Private (workspace owner or member)
 */
export const deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // No need to check card.userId - workspace access is already verified by middleware

    const deletedPosition = card.position;
    const listId = card.listId;
    const cardTitle = card.title;
    const boardId = card.boardId;

    // Get list for workspace ID
    const list = await List.findById(listId);

    // Cascade delete: remove all comments on this card
    await Comment.deleteMany({ cardId: id });

    await card.deleteOne();

    // Log activity
    if (list) {
      await logActivity({
        workspaceId: list.workspaceId,
        boardId,
        cardId: id,
        userId: req.user._id,
        action: 'deleted',
        entityType: 'card',
        details: { cardTitle },
      });
    }

    // Adjust positions of remaining cards
    await Card.updateMany(
      {
        listId,
        position: { $gt: deletedPosition },
      },
      {
        $inc: { position: -1 },
      }
    );

    logger.info(`Card deleted: ${id}`);
    getIO()?.to(`board:${boardId}`).emit('card:deleted', {
      cardId: id,
      listId,
      boardId,
    });
    res
      .status(200)
      .json({ success: true, message: 'Card deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}/reorder:
 *   put:
 *     summary: Reorder a card within its list or move to another list
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
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
 *                 description: New position index in the list
 *               listId:
 *                 type: string
 *                 example: 507f1f77bcf86cd799439011
 *                 description: Target list ID (optional, for moving between lists)
 *     responses:
 *       200:
 *         description: Card reordered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CardResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized to reorder this card
 *       404:
 *         description: Card not found
 *       500:
 *         description: Server error
 */
/**
 * @desc    Reorder card within its list or move to another list
 * @route   PUT /api/cards/:id/reorder
 * @access  Private (workspace owner or member)
 */
export const reorderCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { position, listId: newListId } = req.body;

    // req.workspace is already validated and attached by checkWorkspaceAccess middleware

    // Validate card ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    // Validate position
    if (position === undefined || !Number.isInteger(position) || position < 0) {
      throw new ValidationError('position must be a non-negative integer');
    }

    // Find card
    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // No need to check card.userId - workspace access is already verified by middleware

    const oldPosition = card.position;
    const oldListId = card.listId.toString();
    const targetListId = newListId || oldListId;

    // Validate new list ID if moving between lists
    if (newListId && !mongoose.Types.ObjectId.isValid(newListId)) {
      return res
        .status(400)
        .json({ success: false, message: 'Invalid list ID format' });
    }

    // If moving to a different list, verify the new list exists
    if (newListId && newListId !== oldListId) {
      const targetList = await List.findById(newListId);
      if (!targetList) {
        return res
          .status(404)
          .json({ success: false, message: 'Target list not found' });
      }

      // Verify target list is in the SAME workspace
      if (targetList.workspaceId.toString() !== req.workspace._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Cannot move card to a list in a different workspace',
        });
      }

      // Remove card from old list (shift positions)
      await Card.updateMany(
        { listId: oldListId, position: { $gt: oldPosition } },
        { $inc: { position: -1 } }
      );

      // Make space in new list (shift positions)
      await Card.updateMany(
        { listId: targetListId, position: { $gte: position } },
        { $inc: { position: 1 } }
      );

      // Move card to new list
      card.listId = targetListId;
      card.boardId = targetList.boardId;
      card.position = position;
      await card.save();

      // Log activity for moving between lists
      const oldList = await List.findById(oldListId);
      await logActivity({
        workspaceId: req.workspace._id,
        boardId: card.boardId,
        cardId: card._id,
        userId: req.user._id,
        action: 'moved',
        entityType: 'card',
        details: {
          cardTitle: card.title,
          fromList: oldList.name,
          toList: targetList.name,
          from: { listId: oldListId, position: oldPosition },
          to: { listId: targetListId, position },
        },
      });

      getIO()?.to(`board:${card.boardId}`).emit('card:moved', {
        card,
        fromListId: oldListId,
        toListId: targetListId,
        boardId: card.boardId,
      });
      return res.status(200).json({ success: true, data: card });
    }

    // Reordering within same list
    if (oldPosition === position) {
      return res.status(200).json({ success: true, data: card });
    }

    // Moving card down (increasing position)
    if (position > oldPosition) {
      await Card.updateMany(
        {
          listId: oldListId,
          position: { $gt: oldPosition, $lte: position },
        },
        {
          $inc: { position: -1 },
        }
      );
    }
    // Moving card up (decreasing position)
    else {
      await Card.updateMany(
        {
          listId: oldListId,
          position: { $gte: position, $lt: oldPosition },
        },
        {
          $inc: { position: 1 },
        }
      );
    }

    // Update card position
    card.position = position;
    await card.save();

    // Log activity for reordering within same list
    const list = await List.findById(oldListId);
    await logActivity({
      workspaceId: list.workspaceId,
      boardId: card.boardId,
      cardId: card._id,
      userId: req.user._id,
      action: 'moved',
      entityType: 'card',
      details: {
        cardTitle: card.title,
        listName: list.name,
        from: { position: oldPosition },
        to: { position },
      },
    });

    logger.info(`Card reordered: ${id} to position ${position}`);
    getIO()?.to(`board:${card.boardId}`).emit('card:moved', {
      card,
      fromListId: oldListId,
      toListId: oldListId,
      boardId: card.boardId,
    });
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}/assign:
 *   post:
 *     summary: Assign a member to a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: User ID to assign
 *     responses:
 *       200:
 *         description: Member assigned successfully
 *       400:
 *         description: Invalid input or user already assigned
 *       403:
 *         description: User is not a workspace member
 *       404:
 *         description: Card or user not found
 */
export const assignMember = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    // Validate card ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    // Validate userId
    if (!userId) {
      throw new ValidationError('User ID is required');
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError('Invalid user ID format');
    }

    // Check if user exists
    const userToAssign = await User.findById(userId);
    if (!userToAssign) {
      throw new NotFoundError('User not found');
    }

    // Get card with workspace access already verified by middleware
    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // Check if user is workspace owner or member
    const workspace = req.workspace;
    const isOwner = workspace.userId.toString() === userId;

    if (!isOwner) {
      const membership = await WorkspaceMember.findOne({
        workspaceId: workspace._id,
        userId: userId,
      });

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'User is not a member of the workspace',
        });
      }
    }

    // Check if user is already assigned
    const alreadyAssigned = card.assignedTo.some(
      assignedId => assignedId.toString() === userId
    );

    if (alreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: 'User is already assigned to this card',
      });
    }

    // Add user to assignedTo array
    card.assignedTo.push(userId);
    await card.save();

    // Populate assigned users
    await card.populate('assignedTo', 'username email');

    // Log activity
    const list = await List.findById(card.listId);
    await logActivity({
      workspaceId: list.workspaceId,
      boardId: card.boardId,
      cardId: card._id,
      userId: req.user._id,
      action: 'assigned',
      entityType: 'card',
      details: {
        cardTitle: card.title,
        assignedUser: userToAssign.username,
      },
    });

    logger.info(`User ${userId} assigned to card ${id}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}/unassign/{userId}:
 *   delete:
 *     summary: Unassign a member from a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to unassign
 *     responses:
 *       200:
 *         description: Member unassigned successfully
 *       400:
 *         description: Invalid input or user not assigned
 *       404:
 *         description: Card not found
 */
export const unassignMember = async (req, res, next) => {
  try {
    const { id, userId } = req.params;

    // Validate card ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    // Validate userId
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new ValidationError('Invalid user ID format');
    }

    // Get card with workspace access already verified by middleware
    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // Check if user is assigned to the card
    const isAssigned = card.assignedTo.some(
      assignedId => assignedId.toString() === userId
    );

    if (!isAssigned) {
      return res.status(400).json({
        success: false,
        message: 'User is not assigned to this card',
      });
    }

    // Remove user from assignedTo array
    card.assignedTo = card.assignedTo.filter(
      assignedId => assignedId.toString() !== userId
    );
    await card.save();

    // Populate remaining assigned users
    await card.populate('assignedTo', 'username email');

    // Log activity
    const list = await List.findById(card.listId);
    const user = await User.findById(userId);
    await logActivity({
      workspaceId: list.workspaceId,
      boardId: card.boardId,
      cardId: card._id,
      userId: req.user._id,
      action: 'unassigned',
      entityType: 'card',
      details: {
        cardTitle: card.title,
        unassignedUser: user?.username,
      },
    });

    logger.info(`User ${userId} unassigned from card ${id}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}/labels/{labelId}:
 *   post:
 *     summary: Assign a label to a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Label ID
 *     responses:
 *       200:
 *         description: Label assigned successfully
 *       400:
 *         description: Invalid input or label already assigned
 *       404:
 *         description: Card or label not found
 */
export const assignLabel = async (req, res, next) => {
  try {
    const { id, labelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw new ValidationError('Invalid label ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const label = await Label.findById(labelId);
    if (!label) {
      throw new NotFoundError('Label not found');
    }

    // Verify label belongs to the same board as the card
    if (label.boardId.toString() !== card.boardId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'Label does not belong to the same board as the card',
      });
    }

    // Check if label is already assigned
    const alreadyAssigned = card.labels.some(l => l.toString() === labelId);
    if (alreadyAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Label is already assigned to this card',
      });
    }

    card.labels.push(labelId);
    await card.save();
    await card.populate('labels', 'name color');

    // Log activity
    const list = await List.findById(card.listId);
    await logActivity({
      workspaceId: list.workspaceId,
      boardId: card.boardId,
      cardId: card._id,
      userId: req.user._id,
      action: 'updated',
      entityType: 'card',
      details: {
        cardTitle: card.title,
        labelName: label.name,
        action: 'label_added',
      },
    });

    logger.info(`Label ${labelId} assigned to card ${id}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}/labels/{labelId}:
 *   delete:
 *     summary: Remove a label from a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *       - in: path
 *         name: labelId
 *         required: true
 *         schema:
 *           type: string
 *         description: Label ID
 *     responses:
 *       200:
 *         description: Label removed successfully
 *       400:
 *         description: Label not assigned to card
 *       404:
 *         description: Card not found
 */
export const removeLabel = async (req, res, next) => {
  try {
    const { id, labelId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    if (!mongoose.Types.ObjectId.isValid(labelId)) {
      throw new ValidationError('Invalid label ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const isAssigned = card.labels.some(l => l.toString() === labelId);
    if (!isAssigned) {
      return res.status(400).json({
        success: false,
        message: 'Label is not assigned to this card',
      });
    }

    // Get label for logging
    const label = await Label.findById(labelId);

    card.labels = card.labels.filter(l => l.toString() !== labelId);
    await card.save();
    await card.populate('labels', 'name color');

    // Log activity
    const list = await List.findById(card.listId);
    await logActivity({
      workspaceId: list.workspaceId,
      boardId: card.boardId,
      cardId: card._id,
      userId: req.user._id,
      action: 'updated',
      entityType: 'card',
      details: {
        cardTitle: card.title,
        labelName: label?.name,
        action: 'label_removed',
      },
    });

    logger.info(`Label ${labelId} removed from card ${id}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}/status:
 *   patch:
 *     summary: Update card status
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [todo, in-progress, done, blocked]
 *                 nullable: true
 *                 example: in-progress
 *     responses:
 *       200:
 *         description: Card status updated
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Card not found
 */
export const updateCardStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const validStatuses = ['todo', 'in-progress', 'done', 'blocked'];

    if (status === undefined) {
      throw new ValidationError('Please provide status');
    }

    if (status !== null && !validStatuses.includes(status)) {
      throw new ValidationError(
        'Status must be one of: todo, in-progress, done, blocked'
      );
    }

    const oldStatus = card.status;
    card.status = status;
    await card.save();

    // Log activity
    const list = await List.findById(card.listId);
    await logActivity({
      workspaceId: list.workspaceId,
      boardId: card.boardId,
      cardId: card._id,
      userId: req.user._id,
      action: 'updated',
      entityType: 'card',
      details: {
        cardTitle: card.title,
        field: 'status',
        oldValue: oldStatus,
        newValue: status,
      },
    });

    logger.info(`Card ${id} status updated to ${status}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{id}/due-date:
 *   patch:
 *     summary: Set or update the due date of a card
 *     tags: [Cards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dueDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-03-15T10:00:00.000Z"
 *               reminderDate:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *                 example: "2026-03-14T10:00:00.000Z"
 *     responses:
 *       200:
 *         description: Due date updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Card not found
 */
/**
 * @desc    Set or update due date (and optional reminder) on a card
 * @route   PATCH /api/cards/:id/due-date
 * @access  Private (workspace owner or member)
 */
export const updateDueDate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { dueDate, reminderDate } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    // dueDate is required in body (can be null to clear)
    if (dueDate === undefined) {
      throw new ValidationError('Please provide dueDate (use null to clear)');
    }

    // Validate dueDate format if not null
    if (dueDate !== null) {
      const parsed = new Date(dueDate);
      if (isNaN(parsed.getTime())) {
        throw new ValidationError('Invalid dueDate format');
      }
      card.dueDate = parsed;
    } else {
      card.dueDate = null;
      card.reminderDate = null; // Clear reminder if due date is cleared
    }

    // Handle reminderDate if provided
    if (reminderDate !== undefined) {
      if (reminderDate !== null) {
        const parsedReminder = new Date(reminderDate);
        if (isNaN(parsedReminder.getTime())) {
          throw new ValidationError('Invalid reminderDate format');
        }
        if (card.dueDate && parsedReminder >= card.dueDate) {
          throw new ValidationError('reminderDate must be before dueDate');
        }
        card.reminderDate = parsedReminder;
      } else {
        card.reminderDate = null;
      }
    }

    await card.save();

    logger.info(`Card ${id} due date updated to ${card.dueDate}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};
