import express from 'express';
import {
  createCard,
  getCards,
  getCard,
  updateCard,
  reorderCard,
  deleteCard,
  assignMember,
  unassignMember,
  assignLabel,
  removeLabel,
  updateCardStatus,
  updateDueDate,
} from '../controllers/cardController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';
import { checkPermission } from '../middlewares/checkPermission.js';
import { PERMISSIONS } from '../utils/permissions.js';

const listCardRouter = express.Router({ mergeParams: true });
const cardRouter = express.Router();

// Routes for /api/lists/:listId/cards
// checkWorkspaceAccess verifies user is owner or member
listCardRouter.post(
  '/',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.CARD_CREATE),
  createCard
);
listCardRouter.get('/', checkWorkspaceAccess, getCards);

// Routes for /api/cards/:id
// checkWorkspaceAccess resolves workspace from card._id

// Member assignment routes (BEFORE /:id routes to avoid conflicts)
cardRouter.post(
  '/:id/assign',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.CARD_ASSIGN),
  assignMember
);
cardRouter.delete(
  '/:id/unassign/:userId',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.CARD_ASSIGN),
  unassignMember
);

// Label assignment routes
cardRouter.post(
  '/:id/labels/:labelId',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.LABEL_ASSIGN),
  assignLabel
);
cardRouter.delete(
  '/:id/labels/:labelId',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.LABEL_ASSIGN),
  removeLabel
);

// Status route
cardRouter.patch(
  '/:id/status',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.CARD_UPDATE),
  updateCardStatus
);

// Due date route
cardRouter.patch(
  '/:id/due-date',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.CARD_UPDATE),
  updateDueDate
);

// Card CRUD routes
cardRouter.get('/:id', checkWorkspaceAccess, getCard);
cardRouter.put(
  '/:id',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.CARD_UPDATE),
  updateCard
);
cardRouter.put(
  '/:id/reorder',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.CARD_UPDATE),
  reorderCard
);
cardRouter.delete(
  '/:id',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.CARD_DELETE),
  deleteCard
);

export { listCardRouter, cardRouter };
