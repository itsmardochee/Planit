import Activity from '../models/Activity.js';
import logger from './logger.js';

/**
 * Log an activity to the database
 * @param {Object} params - Activity parameters
 * @param {ObjectId} params.workspaceId - Workspace ID
 * @param {ObjectId} params.boardId - Board ID (optional)
 * @param {ObjectId} params.cardId - Card ID (optional)
 * @param {ObjectId} params.userId - User who performed the action
 * @param {string} params.action - Action type (created, updated, deleted, moved, etc.)
 * @param {string} params.entityType - Entity type (workspace, board, list, card, comment, member, label)
 * @param {Object} params.details - Additional details about the action (optional)
 */
export const logActivity = async ({
  workspaceId,
  boardId,
  cardId,
  userId,
  action,
  entityType,
  details = {},
}) => {
  try {
    await Activity.create({
      workspaceId,
      boardId,
      cardId,
      userId,
      action,
      entityType,
      details,
    });
  } catch (error) {
    // Log error but don't fail the main operation
    logger.error('Failed to log activity:', error);
  }
};

export default logActivity;
