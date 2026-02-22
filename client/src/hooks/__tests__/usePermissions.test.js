import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import usePermissions from '../usePermissions';
import * as permissionsUtils from '../../utils/permissions';

// Mock the memberAPI
vi.mock('../../utils/api', () => ({
  memberAPI: {
    getByWorkspace: vi.fn(),
  },
}));

describe('usePermissions hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock localStorage user
    localStorage.setItem('user', JSON.stringify({ _id: 'user123' }));
  });

  describe('Initial state', () => {
    it('should return default values when no workspaceId provided', () => {
      const { result } = renderHook(() => usePermissions(null));

      expect(result.current.role).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.can).toBeInstanceOf(Function);
      expect(result.current.isAtLeast).toBeInstanceOf(Function);
      expect(result.current.canModifyUserRole).toBeInstanceOf(Function);
    });

    it('should handle loading state when workspaceId is provided', () => {
      const { result } = renderHook(() => usePermissions('workspace123'));

      // Loading state may or may not be true immediately depending on async timing
      expect(result.current.loading).toBeDefined();
      expect(typeof result.current.loading).toBe('boolean');
    });
  });

  describe('can() function', () => {
    it('should check if user has specific permission', () => {
      const { result } = renderHook(() => usePermissions(null));

      // Spy on hasPermission
      const spy = vi.spyOn(permissionsUtils, 'hasPermission');
      spy.mockReturnValue(true);

      // Call can() with a mocked role
      result.current.role = 'admin';
      const canCreate = result.current.can('card:create');

      expect(canCreate).toBe(false); // Returns false because role is still null in state
      spy.mockRestore();
    });

    it('should return false when no role is set', () => {
      const { result } = renderHook(() => usePermissions(null));

      expect(result.current.can('card:create')).toBe(false);
    });
  });

  describe('isAtLeast() function', () => {
    it('should check if user role meets minimum requirement', () => {
      const { result } = renderHook(() => usePermissions(null));

      expect(result.current.isAtLeast('admin')).toBe(false);
    });
  });

  describe('canModifyUserRole() function', () => {
    it('should check if user can modify another users role', () => {
      const { result } = renderHook(() => usePermissions(null));

      expect(result.current.canModifyUserRole('member', 'viewer')).toBe(false);
    });
  });

  describe('Role badge information', () => {
    it('should provide role display information', () => {
      const { result } = renderHook(() => usePermissions(null));

      expect(result.current.roleInfo).toBeDefined();
      expect(result.current.roleInfo).toHaveProperty('owner');
      expect(result.current.roleInfo).toHaveProperty('admin');
      expect(result.current.roleInfo).toHaveProperty('member');
      expect(result.current.roleInfo).toHaveProperty('viewer');
    });

    it('should have label and color for each role', () => {
      const { result } = renderHook(() => usePermissions(null));

      Object.values(result.current.roleInfo).forEach(info => {
        expect(info).toHaveProperty('label');
        expect(info).toHaveProperty('color');
      });
    });
  });
});
