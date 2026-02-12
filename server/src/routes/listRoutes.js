import express from 'express';
import {
  createList,
  getLists,
  getList,
  updateList,
  reorderList,
  deleteList,
} from '../controllers/listController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';

const boardListRouter = express.Router({ mergeParams: true });
const listRouter = express.Router();

// Routes for /api/boards/:boardId/lists
// checkWorkspaceAccess verifies user is owner or member
boardListRouter.post('/', checkWorkspaceAccess, createList);
boardListRouter.get('/', checkWorkspaceAccess, getLists);

// Routes for /api/lists/:id
// checkWorkspaceAccess resolves workspace from list._id
listRouter.get('/:id', checkWorkspaceAccess, getList);
listRouter.put('/:id', checkWorkspaceAccess, updateList);
listRouter.put('/:id/reorder', checkWorkspaceAccess, reorderList);
listRouter.delete('/:id', checkWorkspaceAccess, deleteList);

export { boardListRouter, listRouter };
