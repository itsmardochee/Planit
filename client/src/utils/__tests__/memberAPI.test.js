import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('memberAPI.updateRole', () => {
  let memberAPI, api;

  beforeEach(async () => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.resetModules();

    const apiModule = await import('../api');
    api = apiModule.api;
    memberAPI = apiModule.memberAPI;
    api.patch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should call PATCH endpoint with correct params', async () => {
    api.patch = vi.fn().mockResolvedValue({
      data: { success: true, data: { _id: 'member1', role: 'admin' } },
    });

    await memberAPI.updateRole('workspace123', 'user456', 'admin');

    expect(api.patch).toHaveBeenCalledWith(
      '/workspaces/workspace123/members/user456/role',
      { role: 'admin' }
    );
  });

  it('should handle successful role update response', async () => {
    const mockResponse = {
      data: { success: true, data: { _id: 'member1', role: 'admin' } },
    };
    api.patch = vi.fn().mockResolvedValue(mockResponse);

    const result = await memberAPI.updateRole(
      'workspace123',
      'user456',
      'admin'
    );

    expect(result.data.success).toBe(true);
    expect(result.data.data.role).toBe('admin');
  });

  it('should handle error response from API', async () => {
    const mockError = {
      response: { status: 403, data: { message: 'Insufficient permissions' } },
    };
    api.patch = vi.fn().mockRejectedValue(mockError);

    await expect(
      memberAPI.updateRole('workspace123', 'user456', 'owner')
    ).rejects.toEqual(mockError);
  });
});
