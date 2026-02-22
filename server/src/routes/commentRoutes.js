import express from 'express';
import {
  createComment,
  getComments,
  updateComment,
  deleteComment,
} from '../controllers/commentController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';
import {
  checkPermission,
  attachUserRole,
} from '../middlewares/checkPermission.js';
import { PERMISSIONS } from '../utils/permissions.js';

// Map cardId to id so checkWorkspaceAccess can resolve the workspace
const mapCardId = (req, _res, next) => {
  if (req.params.cardId && !req.params.id) {
    req.params.id = req.params.cardId;
  }
  next();
};

// Routes scoped to a card: /api/cards/:cardId/comments
const cardCommentRouter = express.Router({ mergeParams: true });

cardCommentRouter.post(
  '/',
  mapCardId,
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.COMMENT_CREATE),
  createComment
);
cardCommentRouter.get('/', mapCardId, checkWorkspaceAccess, getComments);

// Routes scoped to a comment: /api/comments/:id
// Controller enforces author-only access for updates/deletes
// attachUserRole provides role context without strict permission check
const commentRouter = express.Router();

commentRouter.put('/:id', attachUserRole, updateComment);
commentRouter.delete('/:id', attachUserRole, deleteComment);

export { cardCommentRouter, commentRouter };
