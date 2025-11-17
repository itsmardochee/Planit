import express from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspaceController.js';

const router = express.Router();

// @route   POST /api/workspaces
// @desc    Create new workspace
// @access  Private
router.post('/', createWorkspace);

// @route   GET /api/workspaces
// @desc    Get all workspaces for authenticated user
// @access  Private
router.get('/', getWorkspaces);

// @route   GET /api/workspaces/:id
// @desc    Get workspace by id
// @access  Private
router.get('/:id', getWorkspaceById);

// @route   PUT /api/workspaces/:id
// @desc    Update workspace
// @access  Private
router.put('/:id', updateWorkspace);

// @route   DELETE /api/workspaces/:id
// @desc    Delete workspace
// @access  Private
router.delete('/:id', deleteWorkspace);

export default router;
