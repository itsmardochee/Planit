/**
 * Role-Based Access Control (RBAC) Utilities
 * Mirror of backend permissions system for frontend UI control
 */

// Role constants
export const ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  MEMBER: 'member',
  VIEWER: 'viewer',
};

// Permission constants - organized by resource type
export const PERMISSIONS = {
  WORKSPACE: {
    VIEW: 'workspace:view',
    CREATE: 'workspace:create',
    UPDATE: 'workspace:update',
    DELETE: 'workspace:delete',
  },
  BOARD: {
    VIEW: 'board:view',
    CREATE: 'board:create',
    UPDATE: 'board:update',
    DELETE: 'board:delete',
  },
  LIST: {
    CREATE: 'list:create',
    UPDATE: 'list:update',
    DELETE: 'list:delete',
    REORDER: 'list:reorder',
  },
  CARD: {
    CREATE: 'card:create',
    UPDATE: 'card:update',
    DELETE: 'card:delete',
    MOVE: 'card:move',
    ASSIGN: 'card:assign',
  },
  COMMENT: {
    CREATE: 'comment:create',
    UPDATE_OWN: 'comment:update_own',
    DELETE_OWN: 'comment:delete_own',
  },
  LABEL: {
    CREATE: 'label:create',
    UPDATE: 'label:update',
    DELETE: 'label:delete',
    ASSIGN: 'label:assign',
  },
  MEMBER: {
    VIEW: 'member:view',
    INVITE: 'member:invite',
    REMOVE: 'member:remove',
    UPDATE_ROLE: 'member:update_role',
  },
};

// Role hierarchy (higher index = higher privilege)
const ROLE_HIERARCHY = [ROLES.VIEWER, ROLES.MEMBER, ROLES.ADMIN, ROLES.OWNER];

// Permissions mapping by role
export const ROLE_PERMISSIONS = {
  // OWNER: All 33 permissions
  [ROLES.OWNER]: [
    // Workspace permissions
    PERMISSIONS.WORKSPACE.VIEW,
    PERMISSIONS.WORKSPACE.CREATE,
    PERMISSIONS.WORKSPACE.UPDATE,
    PERMISSIONS.WORKSPACE.DELETE, // Only owner can delete workspace

    // Board permissions
    PERMISSIONS.BOARD.VIEW,
    PERMISSIONS.BOARD.CREATE,
    PERMISSIONS.BOARD.UPDATE,
    PERMISSIONS.BOARD.DELETE,

    // List permissions
    PERMISSIONS.LIST.CREATE,
    PERMISSIONS.LIST.UPDATE,
    PERMISSIONS.LIST.DELETE,
    PERMISSIONS.LIST.REORDER,

    // Card permissions
    PERMISSIONS.CARD.CREATE,
    PERMISSIONS.CARD.UPDATE,
    PERMISSIONS.CARD.DELETE,
    PERMISSIONS.CARD.MOVE,
    PERMISSIONS.CARD.ASSIGN,

    // Comment permissions
    PERMISSIONS.COMMENT.CREATE,
    PERMISSIONS.COMMENT.UPDATE_OWN,
    PERMISSIONS.COMMENT.DELETE_OWN,

    // Label permissions
    PERMISSIONS.LABEL.CREATE,
    PERMISSIONS.LABEL.UPDATE,
    PERMISSIONS.LABEL.DELETE,
    PERMISSIONS.LABEL.ASSIGN,

    // Member permissions
    PERMISSIONS.MEMBER.VIEW,
    PERMISSIONS.MEMBER.INVITE,
    PERMISSIONS.MEMBER.REMOVE,
    PERMISSIONS.MEMBER.UPDATE_ROLE,
  ],

  // ADMIN: 32 permissions (all except workspace:delete)
  [ROLES.ADMIN]: [
    // Workspace permissions (no delete)
    PERMISSIONS.WORKSPACE.VIEW,
    PERMISSIONS.WORKSPACE.CREATE,
    PERMISSIONS.WORKSPACE.UPDATE,

    // Board permissions
    PERMISSIONS.BOARD.VIEW,
    PERMISSIONS.BOARD.CREATE,
    PERMISSIONS.BOARD.UPDATE,
    PERMISSIONS.BOARD.DELETE,

    // List permissions
    PERMISSIONS.LIST.CREATE,
    PERMISSIONS.LIST.UPDATE,
    PERMISSIONS.LIST.DELETE,
    PERMISSIONS.LIST.REORDER,

    // Card permissions
    PERMISSIONS.CARD.CREATE,
    PERMISSIONS.CARD.UPDATE,
    PERMISSIONS.CARD.DELETE,
    PERMISSIONS.CARD.MOVE,
    PERMISSIONS.CARD.ASSIGN,

    // Comment permissions
    PERMISSIONS.COMMENT.CREATE,
    PERMISSIONS.COMMENT.UPDATE_OWN,
    PERMISSIONS.COMMENT.DELETE_OWN,

    // Label permissions
    PERMISSIONS.LABEL.CREATE,
    PERMISSIONS.LABEL.UPDATE,
    PERMISSIONS.LABEL.DELETE,
    PERMISSIONS.LABEL.ASSIGN,

    // Member permissions
    PERMISSIONS.MEMBER.VIEW,
    PERMISSIONS.MEMBER.INVITE,
    PERMISSIONS.MEMBER.REMOVE,
    PERMISSIONS.MEMBER.UPDATE_ROLE,
  ],

  // MEMBER: 18 permissions (CRUD on lists/cards/comments, label assign)
  [ROLES.MEMBER]: [
    // Workspace view
    PERMISSIONS.WORKSPACE.VIEW,

    // Board view
    PERMISSIONS.BOARD.VIEW,

    // List permissions
    PERMISSIONS.LIST.CREATE,
    PERMISSIONS.LIST.UPDATE,
    PERMISSIONS.LIST.DELETE,
    PERMISSIONS.LIST.REORDER,

    // Card permissions
    PERMISSIONS.CARD.CREATE,
    PERMISSIONS.CARD.UPDATE,
    PERMISSIONS.CARD.DELETE,
    PERMISSIONS.CARD.MOVE,
    PERMISSIONS.CARD.ASSIGN,

    // Comment permissions
    PERMISSIONS.COMMENT.CREATE,
    PERMISSIONS.COMMENT.UPDATE_OWN,
    PERMISSIONS.COMMENT.DELETE_OWN,

    // Label assign only
    PERMISSIONS.LABEL.ASSIGN,

    // Member view
    PERMISSIONS.MEMBER.VIEW,
  ],

  // VIEWER: 7 permissions (read-only)
  [ROLES.VIEWER]: [
    PERMISSIONS.WORKSPACE.VIEW,
    PERMISSIONS.BOARD.VIEW,
    PERMISSIONS.COMMENT.CREATE, // Can comment (basic interaction)
    PERMISSIONS.LABEL.ASSIGN, // Can assign labels (basic interaction)
    PERMISSIONS.MEMBER.VIEW,
  ],
};

/**
 * Check if a role has a specific permission
 * @param {string} role - User's role (owner, admin, member, viewer)
 * @param {string} permission - Permission to check (e.g., 'card:create')
 * @returns {boolean} True if role has permission
 */
export const hasPermission = (role, permission) => {
  if (!role || !permission) return false;

  const rolePerms = ROLE_PERMISSIONS[role];
  if (!rolePerms) return false;

  return rolePerms.includes(permission);
};

/**
 * Check if a role is at least as privileged as another role
 * @param {string} userRole - User's current role
 * @param {string} requiredRole - Minimum required role
 * @returns {boolean} True if userRole >= requiredRole in hierarchy
 */
export const isRoleAtLeast = (userRole, requiredRole) => {
  if (!userRole || !requiredRole) return false;

  const userIndex = ROLE_HIERARCHY.indexOf(userRole);
  const requiredIndex = ROLE_HIERARCHY.indexOf(requiredRole);

  if (userIndex === -1 || requiredIndex === -1) return false;

  return userIndex >= requiredIndex;
};

/**
 * Check if a user can modify another user's role
 * @param {string} modifierRole - Role of user attempting to modify
 * @param {string} currentRole - Current role of target user
 * @param {string} newRole - New role to assign
 * @returns {boolean} True if modification is allowed
 */
export const canModifyRole = (modifierRole, currentRole, newRole) => {
  // Validate all roles exist
  if (
    !ROLE_HIERARCHY.includes(modifierRole) ||
    !ROLE_HIERARCHY.includes(currentRole) ||
    !ROLE_HIERARCHY.includes(newRole)
  ) {
    return false;
  }

  // Cannot modify owner role (prevent accidental ownership transfer)
  if (currentRole === ROLES.OWNER) {
    return false;
  }

  // Only admin+ can modify roles
  if (!isRoleAtLeast(modifierRole, ROLES.ADMIN)) {
    return false;
  }

  // Admin cannot promote to owner
  if (modifierRole === ROLES.ADMIN && newRole === ROLES.OWNER) {
    return false;
  }

  // Owner can do anything (except modify owner, checked above)
  if (modifierRole === ROLES.OWNER) {
    return true;
  }

  // Admin can modify member/viewer roles
  return true;
};

// Export all permission strings for easy access
export const getAllPermissions = () => {
  const perms = [];
  Object.values(PERMISSIONS).forEach(category => {
    Object.values(category).forEach(perm => perms.push(perm));
  });
  return perms;
};
