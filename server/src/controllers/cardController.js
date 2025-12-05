import mongoose from 'mongoose';
import Card from '../models/Card.js';
import List from '../models/List.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
  AuthError,
  ConflictError,
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
 * @access  Private
 */
export const createCard = async (req, res, next) => {
  try {
    const { listId } = req.params;
    const { title, description, position } = req.body;

    // Validate list ID format
    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ValidationError('Invalid list ID format');
    }

    // Check if list exists and belongs to user
    const list = await List.findById(listId);
    if (!list) {
      throw new NotFoundError('List not found');
    }
    if (list.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to access this list');
    }

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
 * @access  Private
 */
export const getCards = async (req, res, next) => {
  try {
    const { listId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(listId)) {
      throw new ValidationError('Invalid list ID format');
    }

    const list = await List.findById(listId);
    if (!list) {
      throw new NotFoundError('List not found');
    }
    if (list.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to access this list');
    }

    const cards = await Card.find({ listId, userId: req.user._id }).sort({
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
 * @access  Private
 */
export const getCard = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }
    if (card.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to access this card');
    }

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
 * @access  Private
 */
export const updateCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }
    if (card.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to update this card');
    }

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
 * @access  Private
 */
export const deleteCard = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }
    if (card.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to delete this card');
    }

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
 *     summary: Reorder a card within its list
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
 *               - newPosition
 *             properties:
 *               newPosition:
 *                 type: integer
 *                 minimum: 0
 *                 example: 2
 *                 description: New position index in the list
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
 * @desc    Reorder card within its list
 * @route   PUT /api/cards/:id/reorder
 * @access  Private
 */
export const reorderCard = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { newPosition } = req.body;

    // Validate card ID format
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid card ID format');
    }

    // Validate newPosition
    if (
      newPosition === undefined ||
      !Number.isInteger(newPosition) ||
      newPosition < 0
    ) {
      throw new ValidationError('newPosition must be a non-negative integer');
    }

    // Find card and verify ownership
    const card = await Card.findById(id);
    if (!card) {
      throw new NotFoundError('Card not found');
    }
    if (card.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Not authorized to reorder this card');
    }

    const oldPosition = card.position;
    const listId = card.listId;

    // No change needed
    if (oldPosition === newPosition) {
      return res.status(200).json({ success: true, data: card });
    }

    // Moving card down (increasing position)
    if (newPosition > oldPosition) {
      await Card.updateMany(
        {
          listId,
          position: { $gt: oldPosition, $lte: newPosition },
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
          listId,
          position: { $gte: newPosition, $lt: oldPosition },
        },
        {
          $inc: { position: 1 },
        }
      );
    }

    // Update card position
    card.position = newPosition;
    await card.save();

    logger.info(`Card reordered: ${id} to position ${newPosition}`);
    res.status(200).json({ success: true, data: card });
  } catch (error) {
    next(error);
  }
};
