import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import WorkspaceMember from '../models/WorkspaceMember.js';
import Board from '../models/Board.js';
import List from '../models/List.js';
import Card from '../models/Card.js';

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

    // If no workspaceId in params, try to resolve from other parameters
    if (!workspaceId) {
      // Try boardId, listId, or generic id parameter
      const possibleId =
        req.params.boardId || req.params.listId || req.params.id;

      if (possibleId) {
        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(possibleId)) {
          return res.status(400).json({
            success: false,
            message: 'Invalid ID format',
          });
        }

        // Try to resolve workspace from different models in cascade
        // Priority: Card -> List -> Board -> Workspace
        let card = await Card.findById(possibleId);
        if (card) {
          // Card doesn't have workspaceId, get it via List
          const list = await List.findById(card.listId);
          if (list) {
            workspaceId = list.workspaceId.toString();
          } else {
            // Card exists but List doesn't - data integrity issue
            return res.status(404).json({
              success: false,
              message: 'List not found for this card',
            });
          }
        } else {
          let list = await List.findById(possibleId);
          if (list) {
            workspaceId = list.workspaceId.toString();
          } else {
            let board = await Board.findById(possibleId);
            if (board) {
              workspaceId = board.workspaceId.toString();
            } else {
              // Assume it's a workspace ID - the controller will validate if resource exists
              workspaceId = possibleId;
            }
          }
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
