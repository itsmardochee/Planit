import express from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController.js';

const workspaceBoardRouter = express.Router({ mergeParams: true });
const boardRouter = express.Router();

// Routes for /api/workspaces/:workspaceId/boards
workspaceBoardRouter.post('/', createBoard);
workspaceBoardRouter.get('/', getBoards);

// Routes for /api/boards/:id
boardRouter.get('/:id', getBoard);
boardRouter.put('/:id', updateBoard);
boardRouter.delete('/:id', deleteBoard);

export { workspaceBoardRouter, boardRouter };
