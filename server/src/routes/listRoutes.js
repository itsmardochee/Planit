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
import { checkPermission } from '../middlewares/checkPermission.js';
import { PERMISSIONS } from '../utils/permissions.js';

const boardListRouter = express.Router({ mergeParams: true });
const listRouter = express.Router();

// Routes for /api/boards/:boardId/lists
// checkWorkspaceAccess verifies user is owner or member
boardListRouter.post(
  '/',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.LIST_CREATE),
  createList
);
boardListRouter.get('/', checkWorkspaceAccess, getLists);

// Routes for /api/lists/:id
// checkWorkspaceAccess resolves workspace from list._id
listRouter.get('/:id', checkWorkspaceAccess, getList);
listRouter.put(
  '/:id',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.LIST_UPDATE),
  updateList
);
listRouter.put(
  '/:id/reorder',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.LIST_UPDATE),
  reorderList
);
listRouter.delete(
  '/:id',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.LIST_DELETE),
  deleteList
);

export { boardListRouter, listRouter };
