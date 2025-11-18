import express from 'express';
import {
  createList,
  getLists,
  getList,
  updateList,
  reorderList,
  deleteList,
} from '../controllers/listController.js';

const boardListRouter = express.Router({ mergeParams: true });
const listRouter = express.Router();

// Routes for /api/boards/:boardId/lists
boardListRouter.post('/', createList);
boardListRouter.get('/', getLists);

// Routes for /api/lists/:id
listRouter.get('/:id', getList);
listRouter.put('/:id', updateList);
listRouter.put('/:id/reorder', reorderList);
listRouter.delete('/:id', deleteList);

export { boardListRouter, listRouter };
