import express from 'express';
import {
  createBoard,
  getBoards,
  getBoard,
  updateBoard,
  deleteBoard,
} from '../controllers/boardController.js';

const router = express.Router({ mergeParams: true });

// Routes for /api/workspaces/:workspaceId/boards
router.post('/', createBoard);
router.get('/', getBoards);

// Routes for /api/boards/:id
router.get('/:id', getBoard);
router.put('/:id', updateBoard);
router.delete('/:id', deleteBoard);

export default router;
