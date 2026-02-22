import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('Activity API', () => {
  let activityAPI, api;

  beforeEach(async () => {
    // Clear localStorage
    localStorage.clear();
    // Mock window.location
    delete window.location;
    window.location = { href: '', pathname: '/dashboard' };

    // Clear all mocks and reset modules
    vi.clearAllMocks();
    vi.resetModules();

    // Re-import modules after reset
    const apiModule = await import('../api');
    api = apiModule.api;
    activityAPI = apiModule.activityAPI;

    // Mock API methods
    api.get = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getByWorkspace', () => {
    it('should get activity for workspace with default params', async () => {
      const mockWorkspaceId = 'workspace123';
      const mockResponse = { data: { success: true, data: [] } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await activityAPI.getByWorkspace(mockWorkspaceId);

      expect(api.get).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/activity`,
        { params: {} }
      );
      expect(result).toBe(mockResponse);
    });

    it('should get activity with pagination params', async () => {
      const mockWorkspaceId = 'workspace123';
      const params = { limit: 20, skip: 10 };
      const mockResponse = { data: { success: true, data: [] } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await activityAPI.getByWorkspace(mockWorkspaceId, params);

      expect(api.get).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/activity`,
        { params }
      );
      expect(result).toBe(mockResponse);
    });

    it('should get activity with action filter', async () => {
      const mockWorkspaceId = 'workspace123';
      const params = { action: 'created' };
      const mockResponse = { data: { success: true, data: [] } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await activityAPI.getByWorkspace(mockWorkspaceId, params);

      expect(api.get).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/activity`,
        { params }
      );
      expect(result).toBe(mockResponse);
    });

    it('should get activity with entityType filter', async () => {
      const mockWorkspaceId = 'workspace123';
      const params = { entityType: 'Card' };
      const mockResponse = { data: { success: true, data: [] } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await activityAPI.getByWorkspace(mockWorkspaceId, params);

      expect(api.get).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/activity`,
        { params }
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('getByBoard', () => {
    it('should get activity for board with default params', async () => {
      const mockBoardId = 'board123';
      const mockResponse = { data: { success: true, data: [] } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await activityAPI.getByBoard(mockBoardId);

      expect(api.get).toHaveBeenCalledWith(`/boards/${mockBoardId}/activity`, {
        params: {},
      });
      expect(result).toBe(mockResponse);
    });

    it('should get activity with pagination and filters', async () => {
      const mockBoardId = 'board123';
      const params = { limit: 15, skip: 5, action: 'updated' };
      const mockResponse = { data: { success: true, data: [] } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await activityAPI.getByBoard(mockBoardId, params);

      expect(api.get).toHaveBeenCalledWith(`/boards/${mockBoardId}/activity`, {
        params,
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('getByCard', () => {
    it('should get activity for card with default params', async () => {
      const mockCardId = 'card123';
      const mockResponse = { data: { success: true, data: [] } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await activityAPI.getByCard(mockCardId);

      expect(api.get).toHaveBeenCalledWith(`/cards/${mockCardId}/activity`, {
        params: {},
      });
      expect(result).toBe(mockResponse);
    });

    it('should get activity with pagination', async () => {
      const mockCardId = 'card123';
      const params = { limit: 10, skip: 0 };
      const mockResponse = { data: { success: true, data: [] } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await activityAPI.getByCard(mockCardId, params);

      expect(api.get).toHaveBeenCalledWith(`/cards/${mockCardId}/activity`, {
        params,
      });
      expect(result).toBe(mockResponse);
    });
  });
});
