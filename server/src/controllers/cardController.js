import mongoose from 'mongoose';
import Card from '../models/Card.js';
import List from '../models/List.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';

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

    logger.info(`Card created: ${card._id} by user ${req.user._id}`);
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
    const cards = await Card.find({ listId }).sort({
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

    const card = await Card.findById(id);
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

    await card.save();

    logger.info(`Card updated: ${id}`);
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

    await card.deleteOne();

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

    logger.info(`Card reordered: ${id} to position ${position}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};
