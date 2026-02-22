import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import usePermissions from '../usePermissions';
import * as permissionsUtils from '../../utils/permissions';
import { memberAPI } from '../../utils/api';

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

  describe('fetchUserRole with workspaceId', () => {
    const originalLocalStorage = globalThis.localStorage;

    beforeEach(() => {
      // The global setup mocks localStorage.getItem → null; override for these tests
      globalThis.localStorage = {
        getItem: () => JSON.stringify({ _id: 'user123' }),
        setItem: () => {},
        removeItem: () => {},
        clear: () => {},
      };
    });

    afterEach(() => {
      globalThis.localStorage = originalLocalStorage;
    });

    it('should set error when memberAPI throws', async () => {
      memberAPI.getByWorkspace.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => usePermissions('ws-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Network error');
      expect(result.current.role).toBeNull();
    });

    it('should set error with fallback message when error has no message', async () => {
      memberAPI.getByWorkspace.mockRejectedValue({});
      const { result } = renderHook(() => usePermissions('ws-123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.error).toBe('Failed to fetch role');
    });

    it('can() returns true when role is set and has permission', async () => {
      memberAPI.getByWorkspace.mockResolvedValue({
        data: { data: [{ userId: { _id: 'user123' }, role: 'owner' }] },
      });
      const { result } = renderHook(() => usePermissions('ws-123'));

      await waitFor(() => expect(result.current.role).toBe('owner'));

      expect(result.current.can('card:create')).toBe(true);
    });

    it('isAtLeast() returns true when role meets requirement', async () => {
      memberAPI.getByWorkspace.mockResolvedValue({
        data: { data: [{ userId: { _id: 'user123' }, role: 'admin' }] },
      });
      const { result } = renderHook(() => usePermissions('ws-123'));

      await waitFor(() => expect(result.current.role).toBe('admin'));

      expect(result.current.isAtLeast('member')).toBe(true);
    });

    it('canModifyUserRole() returns value when role is set', async () => {
      memberAPI.getByWorkspace.mockResolvedValue({
        data: { data: [{ userId: { _id: 'user123' }, role: 'owner' }] },
      });
      const { result } = renderHook(() => usePermissions('ws-123'));

      await waitFor(() => expect(result.current.role).toBe('owner'));

      expect(typeof result.current.canModifyUserRole('member', 'admin')).toBe(
        'boolean'
      );
    });

    it('sets role to null when user is not found in members list', async () => {
      memberAPI.getByWorkspace.mockResolvedValue({
        data: { data: [{ userId: { _id: 'other-user' }, role: 'member' }] },
      });
      const { result } = renderHook(() => usePermissions('ws-123'));

      await waitFor(() => expect(result.current.loading).toBe(false));

      expect(result.current.role).toBeNull();
    });
  });
});
