import { useState, useEffect, useCallback } from 'react';
import { memberAPI } from '../utils/api';
import {
  hasPermission,
  isRoleAtLeast as checkRoleAtLeast,
  canModifyRole,
  ROLES,
} from '../utils/permissions';

/**
 * Role display information for UI (badges, labels, etc.)
 */
export const ROLE_INFO = {
  [ROLES.OWNER]: {
    label: 'Owner',
    color: 'purple', // MUI color: 'secondary' or custom
    description: 'Full control including workspace deletion',
  },
  [ROLES.ADMIN]: {
    label: 'Admin',
    color: 'blue', // MUI color: 'primary'
    description: 'Can manage boards, members, and settings',
  },
  [ROLES.MEMBER]: {
    label: 'Member',
    color: 'green', // MUI color: 'success'
    description: 'Can create and edit cards, lists, and comments',
  },
  [ROLES.VIEWER]: {
    label: 'Viewer',
    color: 'gray', // MUI color: 'default'
    description: 'Read-only access to workspace',
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
