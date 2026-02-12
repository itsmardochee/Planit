import express from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';

const workspaceBoardRouter = express.Router({ mergeParams: true });
const boardRouter = express.Router();

// Routes for /api/workspaces/:workspaceId/boards
// checkWorkspaceAccess verifies user is owner or member
workspaceBoardRouter.post('/', checkWorkspaceAccess, createBoard);
workspaceBoardRouter.get('/', checkWorkspaceAccess, getBoards);

// Routes for /api/boards/:id
// checkWorkspaceAccess resolves workspace from board._id
boardRouter.get('/:id', checkWorkspaceAccess, getBoard);
boardRouter.put('/:id', checkWorkspaceAccess, updateBoard);
boardRouter.delete('/:id', checkWorkspaceAccess, deleteBoard);

export { workspaceBoardRouter, boardRouter };
