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
  updateMemberRole,
} from '../controllers/workspaceMemberController.js';
import checkWorkspaceAccess from '../middlewares/checkWorkspaceAccess.js';
import {
  checkPermission,
  attachUserRole,
} from '../middlewares/checkPermission.js';
import { PERMISSIONS } from '../utils/permissions.js';

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
// @access  Private (owner/admin)
router.put(
  '/:id',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.WORKSPACE_UPDATE),
  updateWorkspace
);

// @route   DELETE /api/workspaces/:id
// @desc    Delete workspace
// @access  Private (owner only)
router.delete(
  '/:id',
  checkWorkspaceAccess,
  checkPermission(PERMISSIONS.WORKSPACE_DELETE),
  deleteWorkspace
);

// Workspace membership operations
// @route   POST /api/workspaces/:id/invite
// @desc    Invite a user to workspace
// @access  Private (owner/admin can invite - checked in controller)
router.post('/:id/invite', checkWorkspaceAccess, inviteMember);

// @route   GET /api/workspaces/:id/members
// @desc    Get all members of a workspace
// @access  Private
router.get('/:id/members', getWorkspaceMembers);

// @route   DELETE /api/workspaces/:id/members/:userId
// @desc    Remove a member from workspace
// @access  Private (owner/admin can remove, or member removes themselves)
router.delete(
  '/:id/members/:userId',
  checkWorkspaceAccess,
  attachUserRole,
  removeMember
);

// @route   PATCH /api/workspaces/:id/members/:userId/role
// @desc    Update member role
// @access  Private (owner can change any role, admin can change member/viewer)
router.patch(
  '/:id/members/:userId/role',
  checkWorkspaceAccess,
  attachUserRole,
  updateMemberRole
);

export default router;
