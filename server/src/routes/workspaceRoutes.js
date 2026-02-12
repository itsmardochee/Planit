import express from 'express';
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceById,
  updateWorkspace,
  deleteWorkspace,
} from '../controllers/workspaceController.js';
import {
  inviteMember,
  getWorkspaceMembers,
  removeMember,
} from '../controllers/workspaceMemberController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';

const router = express.Router();

// Workspace CRUD operations
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
// @access  Private (owner or member)
router.get('/:id', checkWorkspaceAccess, getWorkspaceById);

// @route   PUT /api/workspaces/:id
// @desc    Update workspace
// @access  Private (owner only)
router.put('/:id', checkWorkspaceAccess, updateWorkspace);

// @route   DELETE /api/workspaces/:id
// @desc    Delete workspace
// @access  Private (owner only)
router.delete('/:id', checkWorkspaceAccess, deleteWorkspace);

// Workspace membership operations
// @route   POST /api/workspaces/:id/invite
// @desc    Invite a user to workspace
// @access  Private (workspace owner only)
router.post('/:id/invite', inviteMember);

// @route   GET /api/workspaces/:id/members
// @desc    Get all members of a workspace
// @access  Private
router.get('/:id/members', getWorkspaceMembers);

// @route   DELETE /api/workspaces/:id/members/:userId
// @desc    Remove a member from workspace
// @access  Private (workspace owner or the member themselves)
router.delete('/:id/members/:userId', removeMember);

export default router;
