import WorkspaceMember from '../models/WorkspaceMember.js';
import { hasPermission } from '../utils/permissions.js';
import { ForbiddenError } from '../utils/errors.js';
import logger from '../utils/logger.js';

/**
 * Middleware to check if user has required permission in workspace
 *
 * Prerequisites:
 * - Must be used AFTER auth middleware (requires req.user)
 * - Must be used AFTER checkWorkspaceAccess middleware (requires req.workspace)
 *
 * Usage:
 *   router.delete('/:id', auth, checkWorkspaceAccess, checkPermission(PERMISSIONS.WORKSPACE_DELETE), deleteWorkspace)
 *
 * @param {string} requiredPermission - Permission constant from PERMISSIONS
 * @returns {Function} Express middleware function
 */
export const checkPermission = requiredPermission => {
  return async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const workspace = req.workspace;

      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      if (!workspace) {
        return res.status(500).json({
          success: false,
          message: 'Workspace not found in request context',
        });
      }

      // Find user's membership in this workspace
      let membership = await WorkspaceMember.findOne({
        workspaceId: workspace._id,
        userId,
      }).lean();

      // Backward compatibility: if no membership but user is workspace creator,
      // treat them as owner
      if (
        !membership &&
        workspace.userId &&
        workspace.userId.toString() === userId
      ) {
        membership = { role: 'owner', userId, workspaceId: workspace._id };
      }

      if (!membership) {
        return res.status(403).json({
          success: false,
          message: 'You are not a member of this workspace',
        });
      }

      // Check if user's role has the required permission
      const userHasPermission = hasPermission(
        membership.role,
        requiredPermission
      );

      if (!userHasPermission) {
        logger.info(
          `Permission denied: user ${userId} with role ${membership.role} attempted ${requiredPermission} in workspace ${workspace._id}`
        );
        return res.status(403).json({
          success: false,
          message: `You do not have permission to perform this action`,
        });
      }

      // Attach user role to request for controllers to use
      req.userRole = membership.role;

      logger.info(
        `Permission granted: user ${userId} has ${requiredPermission} in workspace ${workspace._id}`
      );

      next();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message,
      });
    }
  };
};

/**
 * Middleware to attach user's role to request without enforcing a specific permission
 * Useful when controller needs role-based logic but doesn't require a specific permission
 *
 * Prerequisites:
 * - Must be used AFTER auth middleware (requires req.user)
 * - Must be used AFTER checkWorkspaceAccess middleware (requires req.workspace)
 *
 * Usage:
 *   router.get('/', auth, checkWorkspaceAccess, attachUserRole, getMembers)
 */
export const attachUserRole = async (req, res, next) => {
  try {
    const userId = req.user?.id;
    const workspace = req.workspace;

    if (!userId || !workspace) {
      // If no user or workspace, skip (let other middlewares handle errors)
      req.userRole = null;
      return next();
    }

    let membership = await WorkspaceMember.findOne({
      workspaceId: workspace._id,
      userId,
    }).lean();

    // Backward compatibility: if no membership but user is workspace creator,
    // treat them as owner
    if (
      !membership &&
      workspace.userId &&
      workspace.userId.toString() === userId
    ) {
      membership = { role: 'owner', userId, workspaceId: workspace._id };
    }

    req.userRole = membership ? membership.role : null;

    next();
  } catch (error) {
    next(error);
  }
};

export default checkPermission;
