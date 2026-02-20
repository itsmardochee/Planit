import express from 'express';
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';

// Map cardId to id so checkWorkspaceAccess can resolve the workspace
const mapCardId = (req, _res, next) => {
  if (req.params.cardId && !req.params.id) {
    req.params.id = req.params.cardId;
  }
  next();
};

// Routes scoped to a card: /api/cards/:cardId/comments
const cardCommentRouter = express.Router({ mergeParams: true });

cardCommentRouter.post('/', mapCardId, checkWorkspaceAccess, createComment);
cardCommentRouter.get('/', mapCardId, checkWorkspaceAccess, getComments);

// Routes scoped to a comment: /api/comments/:id
// No checkWorkspaceAccess here — controller enforces author-only access
const commentRouter = express.Router();

commentRouter.put('/:id', updateComment);
commentRouter.delete('/:id', deleteComment);

export { cardCommentRouter, commentRouter };
