import express from 'express';
import {
  createCard,
  getCards,
  getCard,
  updateCard,
  reorderCard,
  deleteCard,
} from '../controllers/cardController.js';

const listCardRouter = express.Router({ mergeParams: true });
const cardRouter = express.Router();

// Routes for /api/lists/:listId/cards
listCardRouter.post('/', createCard);
listCardRouter.get('/', getCards);

// Routes for /api/cards/:id
cardRouter.get('/:id', getCard);
cardRouter.put('/:id', updateCard);
cardRouter.put('/:id/reorder', reorderCard);
cardRouter.delete('/:id', deleteCard);

export { listCardRouter, cardRouter };
