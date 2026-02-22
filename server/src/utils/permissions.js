/**
 * Role-Based Access Control (RBAC) Permissions
 * Defines roles, permissions, and helpers for authorization
 */

// Role hierarchy (lower index = higher privileges)
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

// Role hierarchy for comparison (owner > admin > member > viewer)
const ROLE_HIERARCHY = [ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER];

/**
 * Permissions organized by resource and action
 */
export const PERMISSIONS = {
  // Workspace permissions
  WORKSPACE_DELETE: 'workspace:delete',
  WORKSPACE_UPDATE: 'workspace:update',
  WORKSPACE_VIEW: 'workspace:view',

  // Member management permissions
  MEMBER_INVITE: 'member:invite',
  MEMBER_REMOVE: 'member:remove',
  MEMBER_UPDATE_ROLE: 'member:update_role',
  MEMBER_VIEW: 'member:view',

  // Board permissions
  BOARD_CREATE: 'board:create',
  BOARD_UPDATE: 'board:update',
  BOARD_DELETE: 'board:delete',
  BOARD_VIEW: 'board:view',

  // List permissions
  LIST_CREATE: 'list:create',
  LIST_UPDATE: 'list:update',
  LIST_DELETE: 'list:delete',
  LIST_VIEW: 'list:view',

  // Card permissions
  CARD_CREATE: 'card:create',
  CARD_UPDATE: 'card:update',
  CARD_DELETE: 'card:delete',
  CARD_VIEW: 'card:view',
  CARD_ASSIGN: 'card:assign',

  // Comment permissions
  COMMENT_CREATE: 'comment:create',
  COMMENT_UPDATE: 'comment:update',
  COMMENT_UPDATE_OWN: 'comment:update_own',
  COMMENT_DELETE: 'comment:delete',
  COMMENT_DELETE_OWN: 'comment:delete_own',
  COMMENT_VIEW: 'comment:view',

  // Label permissions
  LABEL_CREATE: 'label:create',
  LABEL_UPDATE: 'label:update',
  LABEL_DELETE: 'label:delete',
  LABEL_ASSIGN: 'label:assign',
  LABEL_VIEW: 'label:view',
};

/**
 * Permissions granted to each role
 */
export const ROLE_PERMISSIONS = {
  [ROLES.OWNER]: [
    // Owner has ALL permissions
    PERMISSIONS.WORKSPACE_DELETE,
    PERMISSIONS.WORKSPACE_UPDATE,
    PERMISSIONS.WORKSPACE_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.MEMBER_UPDATE_ROLE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.BOARD_CREATE,
    PERMISSIONS.BOARD_UPDATE,
    PERMISSIONS.BOARD_DELETE,
    PERMISSIONS.BOARD_VIEW,
    PERMISSIONS.LIST_CREATE,
    PERMISSIONS.LIST_UPDATE,
    PERMISSIONS.LIST_DELETE,
    PERMISSIONS.LIST_VIEW,
    PERMISSIONS.CARD_CREATE,
    PERMISSIONS.CARD_UPDATE,
    PERMISSIONS.CARD_DELETE,
    PERMISSIONS.CARD_VIEW,
    PERMISSIONS.CARD_ASSIGN,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_UPDATE,
    PERMISSIONS.COMMENT_UPDATE_OWN,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.COMMENT_DELETE_OWN,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.LABEL_CREATE,
    PERMISSIONS.LABEL_UPDATE,
    PERMISSIONS.LABEL_DELETE,
    PERMISSIONS.LABEL_ASSIGN,
    PERMISSIONS.LABEL_VIEW,
  ],

  [ROLES.ADMIN]: [
    // Admin can manage workspace content but not delete workspace
    PERMISSIONS.WORKSPACE_UPDATE,
    PERMISSIONS.WORKSPACE_VIEW,
    PERMISSIONS.MEMBER_INVITE,
    PERMISSIONS.MEMBER_REMOVE,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.BOARD_CREATE,
    PERMISSIONS.BOARD_UPDATE,
    PERMISSIONS.BOARD_DELETE,
    PERMISSIONS.BOARD_VIEW,
    PERMISSIONS.LIST_CREATE,
    PERMISSIONS.LIST_UPDATE,
    PERMISSIONS.LIST_DELETE,
    PERMISSIONS.LIST_VIEW,
    PERMISSIONS.CARD_CREATE,
    PERMISSIONS.CARD_UPDATE,
    PERMISSIONS.CARD_DELETE,
    PERMISSIONS.CARD_VIEW,
    PERMISSIONS.CARD_ASSIGN,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_UPDATE,
    PERMISSIONS.COMMENT_UPDATE_OWN,
    PERMISSIONS.COMMENT_DELETE,
    PERMISSIONS.COMMENT_DELETE_OWN,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.LABEL_CREATE,
    PERMISSIONS.LABEL_UPDATE,
    PERMISSIONS.LABEL_DELETE,
    PERMISSIONS.LABEL_ASSIGN,
    PERMISSIONS.LABEL_VIEW,
  ],

  [ROLES.MEMBER]: [
    // Member can create/edit/delete cards and lists
    PERMISSIONS.WORKSPACE_VIEW,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.BOARD_VIEW,
    PERMISSIONS.LIST_CREATE,
    PERMISSIONS.LIST_UPDATE,
    PERMISSIONS.LIST_DELETE,
    PERMISSIONS.LIST_VIEW,
    PERMISSIONS.CARD_CREATE,
    PERMISSIONS.CARD_UPDATE,
    PERMISSIONS.CARD_DELETE,
    PERMISSIONS.CARD_VIEW,
    PERMISSIONS.CARD_ASSIGN,
    PERMISSIONS.COMMENT_CREATE,
    PERMISSIONS.COMMENT_UPDATE_OWN,
    PERMISSIONS.COMMENT_DELETE_OWN,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.LABEL_ASSIGN,
    PERMISSIONS.LABEL_VIEW,
  ],

  [ROLES.VIEWER]: [
    // Viewer has read-only access
    PERMISSIONS.WORKSPACE_VIEW,
    PERMISSIONS.MEMBER_VIEW,
    PERMISSIONS.BOARD_VIEW,
    PERMISSIONS.LIST_VIEW,
    PERMISSIONS.CARD_VIEW,
    PERMISSIONS.COMMENT_VIEW,
    PERMISSIONS.LABEL_VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User role (owner, admin, member, viewer)
 * @param {string} permission - Permission to check (from PERMISSIONS)
 * @returns {boolean} - True if role has permission
 */
export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;
  const permissions = ROLE_PERMISSIONS[role];
  return permissions ? permissions.includes(permission) : false;
};

/**
 * Check if a role is at least the minimum required role
 * Example: isRoleAtLeast('admin', 'member') => true
 *          isRoleAtLeast('viewer', 'admin') => false
 * @param {string} userRole - User's current role
 * @param {string} minimumRole - Minimum required role
 * @returns {boolean} - True if userRole >= minimumRole in hierarchy
 */
export const isRoleAtLeast = (userRole, minimumRole) => {
  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const minIndex = ROLE_HIERARCHY.indexOf(minimumRole);
  return userIndex !== -1 && minIndex !== -1 && userIndex <= minIndex;
};

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} - Array of permission strings
 */
export const getRolePermissions = role => {
  return ROLE_PERMISSIONS[role] || [];
};

/**
 * Check if user can modify another user's role
 * Rules:
 * - Owner can change any role (except cannot demote themselves if they're the last owner)
 * - Admin can change roles below admin (member, viewer)
 * - Member and Viewer cannot change roles
 * @param {string} userRole - Role of user making the change
 * @param {string} targetCurrentRole - Current role of target user
 * @param {string} targetNewRole - New role being assigned
 * @returns {boolean}
 */
export const canModifyRole = (userRole, targetCurrentRole, targetNewRole) => {
  // Validate all roles
  const validRoles = Object.values(ROLES);
  if (
    !validRoles.includes(userRole) ||
    !validRoles.includes(targetCurrentRole) ||
    !validRoles.includes(targetNewRole)
  ) {
    return false;
  }

  // Only owner and admin can modify roles
  if (!isRoleAtLeast(userRole, ROLES.ADMIN)) {
    return false;
  }

  // Owner can modify any role
  if (userRole === ROLES.OWNER) {
    return true;
  }

  // Admin can only modify member and viewer roles
  if (userRole === ROLES.ADMIN) {
    const canModifyTarget = [ROLES.MEMBER, ROLES.VIEWER].includes(
      targetCurrentRole
    );
    const canAssignNew = [ROLES.MEMBER, ROLES.VIEWER].includes(targetNewRole);
    return canModifyTarget && canAssignNew;
  }

  return false;
};
