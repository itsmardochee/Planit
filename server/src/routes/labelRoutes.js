import express from 'express';
import {
  createLabel,
  getLabels,
  updateLabel,
  deleteLabel,
} from '../controllers/labelController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';

// Routes for /api/boards/:boardId/labels
const boardLabelRouter = express.Router({ mergeParams: true });

boardLabelRouter.post('/', checkWorkspaceAccess, createLabel);
boardLabelRouter.get('/', checkWorkspaceAccess, getLabels);

// Routes for /api/labels/:id
const labelRouter = express.Router();

labelRouter.put('/:id', checkWorkspaceAccess, updateLabel);
labelRouter.delete('/:id', checkWorkspaceAccess, deleteLabel);

export { boardLabelRouter, labelRouter };
