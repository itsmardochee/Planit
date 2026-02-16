import mongoose from 'mongoose';
import Label from '../models/Label.js';
import Board from '../models/Board.js';
import Card from '../models/Card.js';
import { ValidationError, NotFoundError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * @swagger
 * /api/boards/{boardId}/labels:
 *   post:
 *     summary: Create a new label for a board
 *     tags: [Labels]
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
 *               - color
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: Bug
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#FF0000'
 *     responses:
 *       201:
 *         description: Label created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LabelResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Board not found
 */
export const createLabel = async (req, res, next) => {
  try {
    const { boardId } = req.params;
    const { name, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new ValidationError('Invalid board ID format');
    }

    const board = await Board.findById(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }

    const trimmedName = name?.trim();
    if (!trimmedName) {
      throw new ValidationError('Please provide label name');
    }
    if (trimmedName.length > 50) {
      throw new ValidationError('Label name cannot exceed 50 characters');
    }

    if (!color) {
      throw new ValidationError('Please provide label color');
    }
    if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
      throw new ValidationError(
        'Color must be a valid hex color (e.g. #FF0000)'
      );
    }

    const existing = await Label.findOne({ boardId, name: trimmedName });
    if (existing) {
      throw new ValidationError(
        'A label with this name already exists on this board'
      );
    }

    const label = await Label.create({
      name: trimmedName,
      color,
      boardId,
    });

    logger.info(`Label created: ${label._id} on board ${boardId}`);
    res.status(201).json({ success: true, data: label });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/boards/{boardId}/labels:
 *   get:
 *     summary: Get all labels for a board
 *     tags: [Labels]
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
 *         description: List of labels
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LabelsResponse'
 *       400:
 *         description: Invalid board ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Board not found
 */
export const getLabels = async (req, res, next) => {
  try {
    const { boardId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(boardId)) {
      throw new ValidationError('Invalid board ID format');
    }

    const board = await Board.findById(boardId);
    if (!board) {
      throw new NotFoundError('Board not found');
    }

    const labels = await Label.find({ boardId }).sort({ name: 1 });

    logger.info(`Retrieved ${labels.length} labels for board ${boardId}`);
    res.status(200).json({ success: true, data: labels });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/labels/{id}:
 *   put:
 *     summary: Update a label
 *     tags: [Labels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Label ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 maxLength: 50
 *                 example: Feature
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *                 example: '#00FF00'
 *     responses:
 *       200:
 *         description: Label updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LabelResponse'
 *       400:
 *         description: Validation error
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Label not found
 */
export const updateLabel = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, color } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid label ID format');
    }

    const label = await Label.findById(id);
    if (!label) {
      throw new NotFoundError('Label not found');
    }

    if (name !== undefined) {
      const trimmedName = name.trim();
      if (!trimmedName) {
        throw new ValidationError('Label name cannot be empty');
      }
      if (trimmedName.length > 50) {
        throw new ValidationError('Label name cannot exceed 50 characters');
      }

      const existing = await Label.findOne({
        boardId: label.boardId,
        name: trimmedName,
        _id: { $ne: id },
      });
      if (existing) {
        throw new ValidationError(
          'A label with this name already exists on this board'
        );
      }
      label.name = trimmedName;
    }

    if (color !== undefined) {
      if (!/^#[0-9A-Fa-f]{6}$/.test(color)) {
        throw new ValidationError(
          'Color must be a valid hex color (e.g. #FF0000)'
        );
      }
      label.color = color;
    }

    await label.save();

    logger.info(`Label updated: ${id}`);
    res.status(200).json({ success: true, data: label });
  } catch (error) {
    next(error);
  }
};

/**
 * @swagger
 * /api/labels/{id}:
 *   delete:
 *     summary: Delete a label
 *     tags: [Labels]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Label ID
 *     responses:
 *       200:
 *         description: Label deleted successfully
 *       400:
 *         description: Invalid label ID
 *       401:
 *         description: Not authenticated
 *       403:
 *         description: Not authorized
 *       404:
 *         description: Label not found
 */
export const deleteLabel = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ValidationError('Invalid label ID format');
    }

    const label = await Label.findById(id);
    if (!label) {
      throw new NotFoundError('Label not found');
    }

    // Remove label references from all cards
    await Card.updateMany({ labels: id }, { $pull: { labels: id } });

    await label.deleteOne();

    logger.info(`Label deleted: ${id}`);
    res
      .status(200)
      .json({ success: true, message: 'Label deleted successfully' });
  } catch (error) {
    next(error);
  }
};
