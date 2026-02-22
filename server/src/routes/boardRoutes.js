import express from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { PERMISSIONS } from '../utils/permissions.js';

const workspaceBoardRouter = express.Router({ mergeParams: true });
const boardRouter = express.Router();

// Routes for /api/workspaces/:workspaceId/boards
// checkWorkspaceAccess verifies user is owner or member
workspaceBoardRouter.post(
  '/',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.BOARD_CREATE),
  createBoard
);
workspaceBoardRouter.get('/', checkWorkspaceAccess, getBoards);

// Routes for /api/boards/:id
// checkWorkspaceAccess resolves workspace from board._id
boardRouter.get('/:id', checkWorkspaceAccess, getBoard);
boardRouter.put(
  '/:id',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.BOARD_UPDATE),
  updateBoard
);
boardRouter.delete(
  '/:id',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.BOARD_DELETE),
  deleteBoard
);

export { workspaceBoardRouter, boardRouter };
