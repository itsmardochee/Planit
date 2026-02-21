import { describe, it, expect } from 'vitest';
import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  isRoleAtLeast,
  canModifyRole,
} from '../permissions';

describe('permissions utility', () => {
  describe('ROLES constant', () => {
    it('should define all role levels', () => {
      expect(ROLES).toEqual({
        OWNER: 'owner',
        ADMIN: 'admin',
        MEMBER: 'member',
        VIEWER: 'viewer',
      });
    });
  });

  describe('PERMISSIONS constant', () => {
    it('should define workspace permissions', () => {
      expect(PERMISSIONS.WORKSPACE).toBeDefined();
      expect(PERMISSIONS.WORKSPACE.VIEW).toBe('workspace:view');
      expect(PERMISSIONS.WORKSPACE.CREATE).toBe('workspace:create');
      expect(PERMISSIONS.WORKSPACE.UPDATE).toBe('workspace:update');
      expect(PERMISSIONS.WORKSPACE.DELETE).toBe('workspace:delete');
    });

    it('should define board permissions', () => {
      expect(PERMISSIONS.BOARD).toBeDefined();
      expect(PERMISSIONS.BOARD.VIEW).toBe('board:view');
      expect(PERMISSIONS.BOARD.CREATE).toBe('board:create');
      expect(PERMISSIONS.BOARD.UPDATE).toBe('board:update');
      expect(PERMISSIONS.BOARD.DELETE).toBe('board:delete');
    });

    it('should define list permissions', () => {
      expect(PERMISSIONS.LIST).toBeDefined();
      expect(PERMISSIONS.LIST.CREATE).toBe('list:create');
      expect(PERMISSIONS.LIST.UPDATE).toBe('list:update');
      expect(PERMISSIONS.LIST.DELETE).toBe('list:delete');
      expect(PERMISSIONS.LIST.REORDER).toBe('list:reorder');
    });

    it('should define card permissions', () => {
      expect(PERMISSIONS.CARD).toBeDefined();
      expect(PERMISSIONS.CARD.CREATE).toBe('card:create');
      expect(PERMISSIONS.CARD.UPDATE).toBe('card:update');
      expect(PERMISSIONS.CARD.DELETE).toBe('card:delete');
      expect(PERMISSIONS.CARD.MOVE).toBe('card:move');
      expect(PERMISSIONS.CARD.ASSIGN).toBe('card:assign');
    });

    it('should define comment permissions', () => {
      expect(PERMISSIONS.COMMENT).toBeDefined();
      expect(PERMISSIONS.COMMENT.CREATE).toBe('comment:create');
      expect(PERMISSIONS.COMMENT.UPDATE_OWN).toBe('comment:update_own');
      expect(PERMISSIONS.COMMENT.DELETE_OWN).toBe('comment:delete_own');
    });

    it('should define label permissions', () => {
      expect(PERMISSIONS.LABEL).toBeDefined();
      expect(PERMISSIONS.LABEL.CREATE).toBe('label:create');
      expect(PERMISSIONS.LABEL.UPDATE).toBe('label:update');
      expect(PERMISSIONS.LABEL.DELETE).toBe('label:delete');
      expect(PERMISSIONS.LABEL.ASSIGN).toBe('label:assign');
    });

    it('should define member permissions', () => {
      expect(PERMISSIONS.MEMBER).toBeDefined();
      expect(PERMISSIONS.MEMBER.VIEW).toBe('member:view');
      expect(PERMISSIONS.MEMBER.INVITE).toBe('member:invite');
      expect(PERMISSIONS.MEMBER.REMOVE).toBe('member:remove');
      expect(PERMISSIONS.MEMBER.UPDATE_ROLE).toBe('member:update_role');
    });
  });

  describe('ROLE_PERMISSIONS mapping', () => {
    it('should define permissions for owner role', () => {
      const ownerPerms = ROLE_PERMISSIONS.owner;
      expect(ownerPerms).toBeInstanceOf(Array);
      expect(ownerPerms).toContain('workspace:delete');
      expect(ownerPerms.length).toBe(28); // All permissions including workspace:delete
    });

    it('should define permissions for admin role', () => {
      const adminPerms = ROLE_PERMISSIONS.admin;
      expect(adminPerms).toBeInstanceOf(Array);
      expect(adminPerms).not.toContain('workspace:delete');
      expect(adminPerms).toContain('board:create');
      expect(adminPerms.length).toBe(27); // All permissions except workspace:delete
    });

    it('should define permissions for member role', () => {
      const memberPerms = ROLE_PERMISSIONS.member;
      expect(memberPerms).toBeInstanceOf(Array);
      expect(memberPerms).toContain('card:create');
      expect(memberPerms).not.toContain('board:delete');
      expect(memberPerms.length).toBe(16); // Limited permissions for member
    });

    it('should define permissions for viewer role', () => {
      const viewerPerms = ROLE_PERMISSIONS.viewer;
      expect(viewerPerms).toBeInstanceOf(Array);
      expect(viewerPerms).toContain('workspace:view');
      expect(viewerPerms).toContain('board:view');
      expect(viewerPerms).not.toContain('card:create');
      expect(viewerPerms.length).toBeLessThan(10);
    });
  });

  describe('hasPermission', () => {
    it('should return true if owner has workspace:delete permission', () => {
      expect(hasPermission('owner', 'workspace:delete')).toBe(true);
    });

    it('should return false if admin tries workspace:delete', () => {
      expect(hasPermission('admin', 'workspace:delete')).toBe(false);
    });

    it('should return true if member has card:create permission', () => {
      expect(hasPermission('member', 'card:create')).toBe(true);
    });

    it('should return false if viewer tries card:create', () => {
      expect(hasPermission('viewer', 'card:create')).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid-role', 'card:create')).toBe(false);
    });

    it('should return false for null/undefined role', () => {
      expect(hasPermission(null, 'card:create')).toBe(false);
      expect(hasPermission(undefined, 'card:create')).toBe(false);
    });
  });

  describe('isRoleAtLeast', () => {
    it('should return true if owner compared to owner', () => {
      expect(isRoleAtLeast('owner', 'owner')).toBe(true);
    });

    it('should return true if owner compared to admin', () => {
      expect(isRoleAtLeast('owner', 'admin')).toBe(true);
    });

    it('should return true if admin compared to member', () => {
      expect(isRoleAtLeast('admin', 'member')).toBe(true);
    });

    it('should return false if member compared to admin', () => {
      expect(isRoleAtLeast('member', 'admin')).toBe(false);
    });

    it('should return false if viewer compared to member', () => {
      expect(isRoleAtLeast('viewer', 'member')).toBe(false);
    });

    it('should return true if member compared to viewer', () => {
      expect(isRoleAtLeast('member', 'viewer')).toBe(true);
    });

    it('should return false for invalid roles', () => {
      expect(isRoleAtLeast('invalid', 'member')).toBe(false);
      expect(isRoleAtLeast('member', 'invalid')).toBe(false);
    });
  });

  describe('canModifyRole', () => {
    it('should allow owner to change member to admin', () => {
      expect(canModifyRole('owner', 'member', 'admin')).toBe(true);
    });

    it('should allow owner to change admin to member', () => {
      expect(canModifyRole('owner', 'admin', 'member')).toBe(true);
    });

    it('should not allow owner to change own role', () => {
      expect(canModifyRole('owner', 'owner', 'admin')).toBe(false);
    });

    it('should allow admin to change member to viewer', () => {
      expect(canModifyRole('admin', 'member', 'viewer')).toBe(true);
    });

    it('should not allow admin to change owner role', () => {
      expect(canModifyRole('admin', 'owner', 'member')).toBe(false);
    });

    it('should not allow admin to promote member to owner', () => {
      expect(canModifyRole('admin', 'member', 'owner')).toBe(false);
    });

    it('should not allow member to change any role', () => {
      expect(canModifyRole('member', 'viewer', 'member')).toBe(false);
    });

    it('should not allow viewer to change any role', () => {
      expect(canModifyRole('viewer', 'member', 'admin')).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(canModifyRole('invalid', 'member', 'admin')).toBe(false);
      expect(canModifyRole('admin', 'invalid', 'member')).toBe(false);
      expect(canModifyRole('admin', 'member', 'invalid')).toBe(false);
    });
  });
});
