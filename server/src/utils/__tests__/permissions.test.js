import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  hasPermission,
  isRoleAtLeast,
  getRolePermissions,
  canModifyRole,
} from '../permissions.js';

describe('Permissions Utils', () => {
  describe('ROLES constant', () => {
    it('should define all role constants', () => {
      expect(ROLES.OWNER).toBe('owner');
      expect(ROLES.ADMIN).toBe('admin');
      expect(ROLES.MEMBER).toBe('member');
      expect(ROLES.VIEWER).toBe('viewer');
    });
  });

  describe('PERMISSIONS constant', () => {
    it('should define workspace permissions', () => {
      expect(PERMISSIONS.WORKSPACE_UPDATE).toBe('workspace:update');
      expect(PERMISSIONS.WORKSPACE_DELETE).toBe('workspace:delete');
    });

    it('should define member permissions', () => {
      expect(PERMISSIONS.MEMBER_INVITE).toBe('member:invite');
      expect(PERMISSIONS.MEMBER_REMOVE).toBe('member:remove');
      expect(PERMISSIONS.MEMBER_UPDATE_ROLE).toBe('member:update_role');
      expect(PERMISSIONS.MEMBER_VIEW).toBe('member:view');
    });

    it('should define board permissions', () => {
      expect(PERMISSIONS.BOARD_CREATE).toBe('board:create');
      expect(PERMISSIONS.BOARD_UPDATE).toBe('board:update');
      expect(PERMISSIONS.BOARD_DELETE).toBe('board:delete');
      expect(PERMISSIONS.BOARD_VIEW).toBe('board:view');
    });

    it('should define list permissions', () => {
      expect(PERMISSIONS.LIST_CREATE).toBe('list:create');
      expect(PERMISSIONS.LIST_UPDATE).toBe('list:update');
      expect(PERMISSIONS.LIST_DELETE).toBe('list:delete');
      expect(PERMISSIONS.LIST_VIEW).toBe('list:view');
    });

    it('should define card permissions', () => {
      expect(PERMISSIONS.CARD_CREATE).toBe('card:create');
      expect(PERMISSIONS.CARD_UPDATE).toBe('card:update');
      expect(PERMISSIONS.CARD_DELETE).toBe('card:delete');
      expect(PERMISSIONS.CARD_VIEW).toBe('card:view');
      expect(PERMISSIONS.CARD_ASSIGN).toBe('card:assign');
    });

    it('should define comment permissions', () => {
      expect(PERMISSIONS.COMMENT_CREATE).toBe('comment:create');
      expect(PERMISSIONS.COMMENT_UPDATE).toBe('comment:update');
      expect(PERMISSIONS.COMMENT_DELETE).toBe('comment:delete');
      expect(PERMISSIONS.COMMENT_VIEW).toBe('comment:view');
    });

    it('should define label permissions', () => {
      expect(PERMISSIONS.LABEL_CREATE).toBe('label:create');
      expect(PERMISSIONS.LABEL_ASSIGN).toBe('label:assign');
      expect(PERMISSIONS.LABEL_VIEW).toBe('label:view');
    });
  });

  describe('ROLE_PERMISSIONS mapping', () => {
    it('should give owner all permissions', () => {
      expect(ROLE_PERMISSIONS[ROLES.OWNER].length).toBeGreaterThan(20);
      expect(ROLE_PERMISSIONS[ROLES.OWNER]).toContain(
        PERMISSIONS.WORKSPACE_DELETE
      );
    });

    it('should not give admin workspace:delete permission', () => {
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).not.toContain(
        PERMISSIONS.WORKSPACE_DELETE
      );
    });

    it('should give admin most permissions except workspace:delete', () => {
      expect(ROLE_PERMISSIONS[ROLES.ADMIN].length).toBeGreaterThan(20);
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toContain(
        PERMISSIONS.WORKSPACE_UPDATE
      );
      expect(ROLE_PERMISSIONS[ROLES.ADMIN]).toContain(PERMISSIONS.BOARD_CREATE);
    });

    it('should give member limited permissions', () => {
      expect(ROLE_PERMISSIONS[ROLES.MEMBER]).toContain(PERMISSIONS.CARD_CREATE);
      expect(ROLE_PERMISSIONS[ROLES.MEMBER]).toContain(PERMISSIONS.CARD_UPDATE);
      expect(ROLE_PERMISSIONS[ROLES.MEMBER]).not.toContain(
        PERMISSIONS.BOARD_CREATE
      );
    });

    it('should give viewer only view permissions', () => {
      const viewerPerms = ROLE_PERMISSIONS[ROLES.VIEWER];
      expect(viewerPerms.every(p => p.includes(':view'))).toBe(true);
      expect(viewerPerms).not.toContain(PERMISSIONS.CARD_CREATE);
    });
  });

  describe('hasPermission()', () => {
    it('should return true when role has permission', () => {
      expect(hasPermission(ROLES.OWNER, PERMISSIONS.WORKSPACE_DELETE)).toBe(
        true
      );
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.BOARD_CREATE)).toBe(true);
      expect(hasPermission(ROLES.MEMBER, PERMISSIONS.CARD_UPDATE)).toBe(true);
      expect(hasPermission(ROLES.VIEWER, PERMISSIONS.BOARD_VIEW)).toBe(true);
    });

    it('should return false when role does not have permission', () => {
      expect(hasPermission(ROLES.ADMIN, PERMISSIONS.WORKSPACE_DELETE)).toBe(
        false
      );
      expect(hasPermission(ROLES.MEMBER, PERMISSIONS.BOARD_CREATE)).toBe(false);
      expect(hasPermission(ROLES.VIEWER, PERMISSIONS.CARD_CREATE)).toBe(false);
    });

    it('should return false for invalid role', () => {
      expect(hasPermission('invalid-role', PERMISSIONS.CARD_VIEW)).toBe(false);
    });
  });

  describe('isRoleAtLeast()', () => {
    it('should return true when checking equal roles', () => {
      expect(isRoleAtLeast(ROLES.OWNER, ROLES.OWNER)).toBe(true);
      expect(isRoleAtLeast(ROLES.ADMIN, ROLES.ADMIN)).toBe(true);
      expect(isRoleAtLeast(ROLES.MEMBER, ROLES.MEMBER)).toBe(true);
      expect(isRoleAtLeast(ROLES.VIEWER, ROLES.VIEWER)).toBe(true);
    });

    it('should return true when user role is higher', () => {
      expect(isRoleAtLeast(ROLES.OWNER, ROLES.ADMIN)).toBe(true);
      expect(isRoleAtLeast(ROLES.OWNER, ROLES.MEMBER)).toBe(true);
      expect(isRoleAtLeast(ROLES.OWNER, ROLES.VIEWER)).toBe(true);
      expect(isRoleAtLeast(ROLES.ADMIN, ROLES.MEMBER)).toBe(true);
      expect(isRoleAtLeast(ROLES.ADMIN, ROLES.VIEWER)).toBe(true);
      expect(isRoleAtLeast(ROLES.MEMBER, ROLES.VIEWER)).toBe(true);
    });

    it('should return false when user role is lower', () => {
      expect(isRoleAtLeast(ROLES.VIEWER, ROLES.MEMBER)).toBe(false);
      expect(isRoleAtLeast(ROLES.VIEWER, ROLES.ADMIN)).toBe(false);
      expect(isRoleAtLeast(ROLES.VIEWER, ROLES.OWNER)).toBe(false);
      expect(isRoleAtLeast(ROLES.MEMBER, ROLES.ADMIN)).toBe(false);
      expect(isRoleAtLeast(ROLES.MEMBER, ROLES.OWNER)).toBe(false);
      expect(isRoleAtLeast(ROLES.ADMIN, ROLES.OWNER)).toBe(false);
    });

    it('should return false for invalid roles', () => {
      expect(isRoleAtLeast('invalid-role', ROLES.MEMBER)).toBe(false);
      expect(isRoleAtLeast(ROLES.MEMBER, 'invalid-role')).toBe(false);
    });
  });

  describe('getRolePermissions()', () => {
    it('should return permissions for valid role', () => {
      const ownerPerms = getRolePermissions(ROLES.OWNER);
      expect(Array.isArray(ownerPerms)).toBe(true);
      expect(ownerPerms.length).toBeGreaterThan(0);
      expect(ownerPerms).toContain(PERMISSIONS.WORKSPACE_DELETE);
    });

    it('should return empty array for invalid role', () => {
      expect(getRolePermissions('invalid-role')).toEqual([]);
    });
  });

  describe('canModifyRole()', () => {
    describe('owner role modification', () => {
      it('should allow owner to change any role', () => {
        expect(canModifyRole(ROLES.OWNER, ROLES.ADMIN, ROLES.MEMBER)).toBe(
          true
        );
        expect(canModifyRole(ROLES.OWNER, ROLES.MEMBER, ROLES.ADMIN)).toBe(
          true
        );
        expect(canModifyRole(ROLES.OWNER, ROLES.VIEWER, ROLES.OWNER)).toBe(
          true
        );
        expect(canModifyRole(ROLES.OWNER, ROLES.OWNER, ROLES.ADMIN)).toBe(true);
      });
    });

    describe('admin role modification', () => {
      it('should allow admin to modify member and viewer roles', () => {
        expect(canModifyRole(ROLES.ADMIN, ROLES.MEMBER, ROLES.VIEWER)).toBe(
          true
        );
        expect(canModifyRole(ROLES.ADMIN, ROLES.VIEWER, ROLES.MEMBER)).toBe(
          true
        );
      });

      it('should not allow admin to modify owner or admin roles', () => {
        expect(canModifyRole(ROLES.ADMIN, ROLES.OWNER, ROLES.ADMIN)).toBe(
          false
        );
        expect(canModifyRole(ROLES.ADMIN, ROLES.ADMIN, ROLES.MEMBER)).toBe(
          false
        );
      });

      it('should not allow admin to promote to owner or admin', () => {
        expect(canModifyRole(ROLES.ADMIN, ROLES.MEMBER, ROLES.OWNER)).toBe(
          false
        );
        expect(canModifyRole(ROLES.ADMIN, ROLES.MEMBER, ROLES.ADMIN)).toBe(
          false
        );
      });
    });

    describe('member role modification', () => {
      it('should not allow member to modify any role', () => {
        expect(canModifyRole(ROLES.MEMBER, ROLES.MEMBER, ROLES.VIEWER)).toBe(
          false
        );
        expect(canModifyRole(ROLES.MEMBER, ROLES.VIEWER, ROLES.MEMBER)).toBe(
          false
        );
      });
    });

    describe('viewer role modification', () => {
      it('should not allow viewer to modify any role', () => {
        expect(canModifyRole(ROLES.VIEWER, ROLES.MEMBER, ROLES.VIEWER)).toBe(
          false
        );
        expect(canModifyRole(ROLES.VIEWER, ROLES.VIEWER, ROLES.MEMBER)).toBe(
          false
        );
      });
    });

    describe('edge cases', () => {
      it('should return false for invalid user role', () => {
        expect(canModifyRole('invalid-role', ROLES.MEMBER, ROLES.VIEWER)).toBe(
          false
        );
      });

      it('should return false for invalid target role', () => {
        expect(canModifyRole(ROLES.OWNER, 'invalid-role', ROLES.ADMIN)).toBe(
          false
        );
      });

      it('should return false for invalid new role', () => {
        expect(canModifyRole(ROLES.OWNER, ROLES.MEMBER, 'invalid-role')).toBe(
          false
        );
      });
    });
  });
});
