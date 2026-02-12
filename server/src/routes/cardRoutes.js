import express from 'express';
import {
  createCard,
  getCards,
  getCard,
  updateCard,
  reorderCard,
  deleteCard,
} from '../controllers/cardController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';

const listCardRouter = express.Router({ mergeParams: true });
const cardRouter = express.Router();

// Routes for /api/lists/:listId/cards
// checkWorkspaceAccess verifies user is owner or member
listCardRouter.post('/', checkWorkspaceAccess, createCard);
listCardRouter.get('/', checkWorkspaceAccess, getCards);

// Routes for /api/cards/:id
// checkWorkspaceAccess resolves workspace from card._id
cardRouter.get('/:id', checkWorkspaceAccess, getCard);
cardRouter.put('/:id', checkWorkspaceAccess, updateCard);
cardRouter.put('/:id/reorder', checkWorkspaceAccess, reorderCard);
cardRouter.delete('/:id', checkWorkspaceAccess, deleteCard);

export { listCardRouter, cardRouter };
