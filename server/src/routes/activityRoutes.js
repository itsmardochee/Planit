import express from 'express';
import {
  getWorkspaceActivity,
  getBoardActivity,
  getCardActivity,
} from '../controllers/activityController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';

const router = express.Router();

/**
 * GET /api/workspaces/:workspaceId/activity
 * Get activity log for a workspace
 * checkWorkspaceAccess verifies user is owner or member
 */
router.get(
  '/workspaces/:workspaceId/activity',
  checkWorkspaceAccess,
  getWorkspaceActivity
);

/**
 * GET /api/boards/:id/activity
 * Get activity log for a board
 * checkWorkspaceAccess resolves workspace from board._id
 */
router.get('/boards/:id/activity', checkWorkspaceAccess, getBoardActivity);

/**
 * GET /api/cards/:id/activity
 * Get activity log for a card
 * checkWorkspaceAccess resolves workspace from card._id via list
 */
router.get('/cards/:id/activity', checkWorkspaceAccess, getCardActivity);

export default router;
