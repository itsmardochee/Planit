import mongoose from 'mongoose';
import Comment from '../models/Comment.js';
import Card from '../models/Card.js';
import List from '../models/List.js';
import {
  ValidationError,
  NotFoundError,
  ForbiddenError,
} from '../utils/errors.js';
import logger from '../utils/logger.js';
import logActivity from '../utils/logActivity.js';
import { getIO } from '../socket/index.js';

/**
 * @swagger
 * /api/cards/{cardId}/comments:
 *   post:
 *     summary: Create a new comment on a card
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
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
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *                 example: "This task needs more details."
 *     responses:
 *       201:
 *         description: Comment created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Card not found
 */
/**
 * @desc    Create a new comment on a card
 * @route   POST /api/cards/:cardId/comments
 * @access  Private (workspace owner or member)
 */
export const createComment = async (req, res, next) => {
  try {
    const { cardId } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    if (!content || !content.trim()) {
      throw new ValidationError('Comment content is required');
    }

    if (content.trim().length > 5000) {
      throw new ValidationError('Comment cannot exceed 5000 characters');
    }

    const comment = await Comment.create({
      content: content.trim(),
      cardId,
      userId: req.user._id,
    });

    const populated = await Comment.findById(comment._id).populate(
      'userId',
      'username email'
    );

    // Log activity
    const list = await List.findById(card.listId);
    if (list) {
      await logActivity({
        workspaceId: list.workspaceId,
        boardId: card.boardId,
        cardId: card._id,
        userId: req.user._id,
        action: 'commented',
        entityType: 'comment',
        details: { commentId: comment._id },
      });
    }

    logger.info(`Comment created on card ${cardId} by user ${req.user._id}`);
    getIO()?.to(`board:${card.boardId}`).emit('comment:created', {
      comment: populated,
      cardId,
    });
    res.status(201).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/cards/{cardId}/comments:
 *   get:
 *     summary: Get all comments for a card
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: cardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Card ID
 *     responses:
 *       200:
 *         description: List of comments
 *       400:
 *         description: Invalid card ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Card not found
 */
/**
 * @desc    Get all comments for a card
 * @route   GET /api/cards/:cardId/comments
 * @access  Private (workspace owner or member)
 */
export const getComments = async (req, res, next) => {
  try {
    const { cardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(cardId)) {
      throw new ValidationError('Invalid card ID format');
    }

    const card = await Card.findById(cardId);
    if (!card) {
      throw new NotFoundError('Card not found');
    }

    const comments = await Comment.find({ cardId })
      .populate('userId', 'username email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: comments,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     summary: Update a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 maxLength: 5000
 *                 example: "Updated comment text."
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (only author can update)
 *       404:
 *         description: Comment not found
 */
/**
 * @desc    Update a comment (only author can update)
 * @route   PUT /api/comments/:id
 * @access  Private (comment author only)
 */
export const updateComment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid comment ID format');
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Only the author can update their comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Only the author can update this comment');
    }

    if (!content || !content.trim()) {
      throw new ValidationError('Comment content is required');
    }

    comment.content = content.trim();
    await comment.save();

    const populated = await Comment.findById(comment._id).populate(
      'userId',
      'username email'
    );

    logger.info(`Comment ${id} updated by user ${req.user._id}`);

    res.status(200).json({
      success: true,
      data: populated,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Comment ID
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *       400:
 *         description: Invalid comment ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized (only author can delete)
 *       404:
 *         description: Comment not found
 */
/**
 * @desc    Delete a comment (only author can delete)
 * @route   DELETE /api/comments/:id
 * @access  Private (comment author only)
 */
export const deleteComment = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid comment ID format');
    }

    const comment = await Comment.findById(id);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Only the author can delete their comment
    if (comment.userId.toString() !== req.user._id.toString()) {
      throw new ForbiddenError('Only the author can delete this comment');
    }

    const cardId = comment.cardId;

    // Get workspaceId and boardId for activity logging
    const card = await Card.findById(cardId);
    const list = card ? await List.findById(card.listId) : null;

    await Comment.findByIdAndDelete(id);

    // Log activity
    if (card && list) {
      await logActivity({
        workspaceId: list.workspaceId,
        boardId: card.boardId,
        cardId: card._id,
        userId: req.user._id,
        action: 'deleted',
        entityType: 'comment',
        details: { commentId: id },
      });
    }

    logger.info(`Comment ${id} deleted by user ${req.user._id}`);
    if (card) {
      getIO()?.to(`board:${card.boardId}`).emit('comment:deleted', {
        commentId: id,
        cardId,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
