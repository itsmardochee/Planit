import { useState, useEffect, useCallback } from 'react';
import { memberAPI } from '../utils/api';
import {
  hasPermission,
  isRoleAtLeast as checkRoleAtLeast,
  canModifyRole,
  ROLES,
  ROLE_PERMISSIONS,
} from '../utils/permissions';

/**
 * Permission definitions for UI display
 */
export const PERMISSION_DEFINITIONS = {
  'workspace:view': {
    name: 'View Workspace',
    description: 'Can view workspace details',
  },
  'workspace:create': {
    name: 'Create Workspace',
    description: 'Can create new workspaces',
  },
  'workspace:update': {
    name: 'Update Workspace',
    description: 'Can edit workspace settings',
  },
  'workspace:delete': {
    name: 'Delete Workspace',
    description: 'Can permanently delete workspace',
  },
  'workspace:view_members': {
    name: 'View Members',
    description: 'Can see workspace member list',
  },
  'board:view': { name: 'View Boards', description: 'Can view board content' },
  'board:create': {
    name: 'Create Boards',
    description: 'Can create new boards',
  },
  'board:update': {
    name: 'Update Boards',
    description: 'Can edit board settings',
  },
  'board:delete': {
    name: 'Delete Boards',
    description: 'Can permanently delete boards',
  },
  'list:create': { name: 'Create Lists', description: 'Can add new lists' },
  'list:update': { name: 'Update Lists', description: 'Can edit list names' },
  'list:delete': {
    name: 'Delete Lists',
    description: 'Can permanently delete lists',
  },
  'list:view': { name: 'View Lists', description: 'Can view list content' },
  'list:reorder': {
    name: 'Reorder Lists',
    description: 'Can change list order',
  },
  'card:create': { name: 'Create Cards', description: 'Can add new cards' },
  'card:update': { name: 'Update Cards', description: 'Can edit card details' },
  'card:delete': {
    name: 'Delete Cards',
    description: 'Can permanently delete cards',
  },
  'card:view': { name: 'View Cards', description: 'Can view card content' },
  'card:move': {
    name: 'Move Cards',
    description: 'Can move cards between lists',
  },
  'card:assign': {
    name: 'Assign Members',
    description: 'Can assign members to cards',
  },
  'comment:create': {
    name: 'Create Comments',
    description: 'Can add comments to cards',
  },
  'comment:view': {
    name: 'View Comments',
    description: 'Can view card comments',
  },
  'comment:update_own': {
    name: 'Update Own Comments',
    description: 'Can edit own comments',
  },
  'comment:delete_own': {
    name: 'Delete Own Comments',
    description: 'Can delete own comments',
  },
  'comment:delete_any': {
    name: 'Delete Any Comment',
    description: 'Can delete any comment',
  },
  'label:create': {
    name: 'Create Labels',
    description: 'Can create new labels',
  },
  'label:update': { name: 'Update Labels', description: 'Can edit labels' },
  'label:delete': {
    name: 'Delete Labels',
    description: 'Can permanently delete labels',
  },
  'label:assign': {
    name: 'Assign Labels',
    description: 'Can add labels to cards',
  },
  'member:invite': {
    name: 'Invite Members',
    description: 'Can invite new members to workspace',
  },
  'member:remove': {
    name: 'Remove Members',
    description: 'Can remove members from workspace',
  },
  'member:modify_role': {
    name: 'Modify Roles',
    description: 'Can change member roles',
  },
  'member:view': {
    name: 'View Members',
    description: 'Can see workspace members',
  },
  'member:update_role': {
    name: 'Update Roles',
    description: 'Can update member roles',
  },
  'label:manage': {
    name: 'Manage Labels',
    description: 'Can manage board labels',
  },
};

/**
 * Role display information for UI (badges, labels, etc.)
 */
export const ROLE_INFO = {
  [ROLES.OWNER]: {
    label: 'Owner',
    color: 'purple', // MUI color: 'secondary' or custom
    description: 'Full control including workspace deletion',
    permissions: ROLE_PERMISSIONS[ROLES.OWNER] || [],
  },
  [ROLES.ADMIN]: {
    label: 'Admin',
    color: 'blue', // MUI color: 'primary'
    description: 'Can manage boards, members, and settings',
    permissions: ROLE_PERMISSIONS[ROLES.ADMIN] || [],
  },
  [ROLES.MEMBER]: {
    label: 'Member',
    color: 'green', // MUI color: 'success'
    description: 'Can create and edit cards, lists, and comments',
    permissions: ROLE_PERMISSIONS[ROLES.MEMBER] || [],
  },
  [ROLES.VIEWER]: {
    label: 'Viewer',
    color: 'gray', // MUI color: 'default'
    description: 'Read-only access to workspace',
    permissions: ROLE_PERMISSIONS[ROLES.VIEWER] || [],
  },
};

/**
 * Custom hook to manage user permissions within a workspace
 * @param {string} workspaceId - ID of the workspace
 * @returns {object} Permission utilities and current user role
 */
const usePermissions = workspaceId => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user's role in workspace
  useEffect(() => {
    if (!workspaceId) {
      setRole(null);
      return;
    }

    const fetchUserRole = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get current user from localStorage
        const userStr = localStorage.getItem('user');
        if (!userStr) {
          setRole(null);
          return;
        }

        const user = JSON.parse(userStr);
        const userId = user._id;

        // Fetch workspace members
        const response = await memberAPI.getByWorkspace(workspaceId);
        const members = response.data.data || [];

        // Find current user in members list
        const userMember = members.find(
          m => m.userId && m.userId._id === userId
        );

        if (userMember) {
          setRole(userMember.role);
        } else {
          // Check if user is workspace owner (backward compatibility)
          // This would require fetching workspace data, but for now assume no role
          setRole(null);
        }
      } catch (err) {
        console.error('Error fetching user role:', err);
        setError(err.message || 'Failed to fetch role');
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [workspaceId]);

  /**
   * Check if current user has a specific permission
   * @param {string} permission - Permission to check (e.g., 'card:create')
   * @returns {boolean}
   */
  const can = useCallback(
    permission => {
      if (!role) return false;
      return hasPermission(role, permission);
    },
    [role]
  );

  /**
   * Check if current user's role meets minimum requirement
   * @param {string} requiredRole - Minimum required role
   * @returns {boolean}
   */
  const isAtLeast = useCallback(
    requiredRole => {
      if (!role) return false;
      return checkRoleAtLeast(role, requiredRole);
    },
    [role]
  );

  /**
   * Check if current user can modify another user's role
   * @param {string} targetCurrentRole - Target user's current role
   * @param {string} targetNewRole - New role to assign
   * @returns {boolean}
   */
  const canModifyUserRole = useCallback(
    (targetCurrentRole, targetNewRole) => {
      if (!role) return false;
      return canModifyRole(role, targetCurrentRole, targetNewRole);
    },
    [role]
  );

  return {
    role,
    loading,
    error,
    can,
    isAtLeast,
    canModifyUserRole,
    roleInfo: ROLE_INFO,
  };
};

export default usePermissions;
