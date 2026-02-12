import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Board from '../models/Board.js';

/**
 * Middleware to check if user has access to a workspace
 * Allows access if user is:
 * 1. Workspace owner (userId)
 * 2. Workspace member (in WorkspaceMember collection)
 * 
 * Attaches to req object:
 * - req.workspace: The workspace document
 * - req.isWorkspaceOwner: Boolean indicating if user is owner
 * - req.memberRole: Role of the member (if not owner)
 */
const checkWorkspaceAccess = async (req, res, next) => {
  try {
    let workspaceId = req.params.workspaceId;

    // If no workspaceId in params, try to resolve from boardId or id parameter
    if (!workspaceId) {
      // Check if we have a boardId or id parameter (for /api/boards/:id routes)
      const possibleBoardId = req.params.boardId || req.params.id;

      if (possibleBoardId) {
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(possibleBoardId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
          });
        }

        // Try to find a board with this ID
        const board = await Board.findById(possibleBoardId);

        if (board) {
          // Found a board - use its workspaceId
          workspaceId = board.workspaceId.toString();
        } else {
          // Not a board - assume it's a workspace ID (for /api/workspaces/:id routes)
          workspaceId = possibleBoardId;
        }
      }
    }

    // Validate workspace ID
    if (!workspaceId) {
      return res.status(400).json({
        success: false,
        message: 'Workspace ID or Board ID is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(workspaceId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid workspace ID format',
      });
    }

    // Find workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return res.status(404).json({
        success: false,
        message: 'Workspace not found',
      });
    }

    // Check if user is workspace owner
    const isOwner = workspace.userId.toString() === req.user._id.toString();

    if (isOwner) {
      // User is owner - grant access
      req.workspace = workspace;
      req.isWorkspaceOwner = true;
      return next();
    }

    // Check if user is a member
    const membership = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId: req.user._id,
    });

    if (membership) {
      // User is a member - grant access
      req.workspace = workspace;
      req.isWorkspaceOwner = false;
      req.memberRole = membership.role;
      return next();
    }

    // User is neither owner nor member - deny access
    return res.status(403).json({
      success: false,
      message: 'You do not have access to this workspace',
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export default checkWorkspaceAccess;
