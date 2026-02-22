import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('API Utils', () => {
  let api,
    authAPI,
    workspaceAPI,
    boardAPI,
    listAPI,
    cardAPI,
    labelAPI,
    commentAPI,
    notificationAPI;

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
    authAPI = apiModule.authAPI;
    workspaceAPI = apiModule.workspaceAPI;
    boardAPI = apiModule.boardAPI;
    listAPI = apiModule.listAPI;
    cardAPI = apiModule.cardAPI;
    labelAPI = apiModule.labelAPI;
    commentAPI = apiModule.commentAPI;
    notificationAPI = apiModule.notificationAPI;

    // Mock API methods
    api.get = vi.fn();
    api.post = vi.fn();
    api.put = vi.fn();
    api.delete = vi.fn();
    api.patch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('authAPI', () => {
    it('should call register endpoint', async () => {
      const mockData = { email: 'test@test.com', password: '123456' };
      const mockResponse = { data: { success: true } };

      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await authAPI.register(mockData);

      expect(api.post).toHaveBeenCalledWith('/auth/register', mockData);
      expect(result).toBe(mockResponse);
    });

    it('should call login endpoint', async () => {
      const mockData = { email: 'test@test.com', password: '123456' };
      const mockResponse = { data: { success: true, token: 'jwt-token' } };

      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await authAPI.login(mockData);

      expect(api.post).toHaveBeenCalledWith('/auth/login', mockData);
      expect(result).toBe(mockResponse);
    });
  });

  describe('workspaceAPI', () => {
    it('should get all workspaces', async () => {
      const mockResponse = { data: [] };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await workspaceAPI.getAll();

      expect(api.get).toHaveBeenCalledWith('/workspaces');
      expect(result).toBe(mockResponse);
    });

    it('should get workspace by ID', async () => {
      const mockId = '123';
      const mockResponse = { data: { id: mockId } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await workspaceAPI.getById(mockId);

      expect(api.get).toHaveBeenCalledWith(`/workspaces/${mockId}`);
      expect(result).toBe(mockResponse);
    });

    it('should create workspace', async () => {
      const mockData = { name: 'New Workspace' };
      const mockResponse = { data: { id: '123', ...mockData } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await workspaceAPI.create(mockData);

      expect(api.post).toHaveBeenCalledWith('/workspaces', mockData);
      expect(result).toBe(mockResponse);
    });

    it('should update workspace', async () => {
      const mockId = '123';
      const mockData = { name: 'Updated Workspace' };
      const mockResponse = { data: { id: mockId, ...mockData } };
      api.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await workspaceAPI.update(mockId, mockData);

      expect(api.put).toHaveBeenCalledWith(`/workspaces/${mockId}`, mockData);
      expect(result).toBe(mockResponse);
    });

    it('should delete workspace', async () => {
      const mockId = '123';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await workspaceAPI.delete(mockId);

      expect(api.delete).toHaveBeenCalledWith(`/workspaces/${mockId}`);
      expect(result).toBe(mockResponse);
    });
  });

  describe('boardAPI', () => {
    it('should get boards by workspace', async () => {
      const mockWorkspaceId = '123';
      const mockResponse = { data: [] };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await boardAPI.getByWorkspace(mockWorkspaceId);

      expect(api.get).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/boards`
      );
      expect(result).toBe(mockResponse);
    });

    it('should get board by ID', async () => {
      const mockBoardId = '456';
      const mockResponse = { data: { id: mockBoardId } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await boardAPI.getById(mockBoardId);

      expect(api.get).toHaveBeenCalledWith(`/boards/${mockBoardId}`);
      expect(result).toBe(mockResponse);
    });

    it('should create board', async () => {
      const mockWorkspaceId = '123';
      const mockData = { name: 'New Board' };
      const mockResponse = { data: { id: '456', ...mockData } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await boardAPI.create(mockWorkspaceId, mockData);

      expect(api.post).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/boards`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should update board', async () => {
      const mockBoardId = '456';
      const mockData = { name: 'Updated Board' };
      const mockResponse = { data: { id: mockBoardId, ...mockData } };
      api.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await boardAPI.update(mockBoardId, mockData);

      expect(api.put).toHaveBeenCalledWith(`/boards/${mockBoardId}`, mockData);
      expect(result).toBe(mockResponse);
    });

    it('should delete board', async () => {
      const mockBoardId = '456';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await boardAPI.delete(mockBoardId);

      expect(api.delete).toHaveBeenCalledWith(`/boards/${mockBoardId}`);
      expect(result).toBe(mockResponse);
    });
  });

  describe('listAPI', () => {
    it('should get lists by board', async () => {
      const mockBoardId = '123';
      const mockResponse = { data: [] };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await listAPI.getByBoard(mockBoardId);

      expect(api.get).toHaveBeenCalledWith(`/boards/${mockBoardId}/lists`);
      expect(result).toBe(mockResponse);
    });

    it('should get list by ID', async () => {
      const mockListId = '789';
      const mockResponse = { data: { id: mockListId } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await listAPI.getById(mockListId);

      expect(api.get).toHaveBeenCalledWith(`/lists/${mockListId}`);
      expect(result).toBe(mockResponse);
    });

    it('should create list', async () => {
      const mockBoardId = '123';
      const mockData = { title: 'New List' };
      const mockResponse = { data: { id: '789', ...mockData } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await listAPI.create(mockBoardId, mockData);

      expect(api.post).toHaveBeenCalledWith(
        `/boards/${mockBoardId}/lists`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should update list', async () => {
      const mockListId = '789';
      const mockData = { title: 'Updated List' };
      const mockResponse = { data: { id: mockListId, ...mockData } };
      api.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await listAPI.update(mockListId, mockData);

      expect(api.put).toHaveBeenCalledWith(`/lists/${mockListId}`, mockData);
      expect(result).toBe(mockResponse);
    });

    it('should reorder list', async () => {
      const mockListId = '789';
      const mockData = { position: 2 };
      const mockResponse = { data: { success: true } };
      api.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await listAPI.reorder(mockListId, mockData);

      expect(api.put).toHaveBeenCalledWith(
        `/lists/${mockListId}/reorder`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should delete list', async () => {
      const mockListId = '789';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await listAPI.delete(mockListId);

      expect(api.delete).toHaveBeenCalledWith(`/lists/${mockListId}`);
      expect(result).toBe(mockResponse);
    });
  });

  describe('cardAPI', () => {
    it('should get cards by list', async () => {
      const mockListId = '123';
      const mockResponse = { data: [] };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.getByList(mockListId);

      expect(api.get).toHaveBeenCalledWith(`/lists/${mockListId}/cards`);
      expect(result).toBe(mockResponse);
    });

    it('should get card by ID', async () => {
      const mockCardId = '999';
      const mockResponse = { data: { id: mockCardId } };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.getById(mockCardId);

      expect(api.get).toHaveBeenCalledWith(`/cards/${mockCardId}`);
      expect(result).toBe(mockResponse);
    });

    it('should create card', async () => {
      const mockListId = '123';
      const mockData = { title: 'New Card' };
      const mockResponse = { data: { id: '999', ...mockData } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.create(mockListId, mockData);

      expect(api.post).toHaveBeenCalledWith(
        `/lists/${mockListId}/cards`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should update card', async () => {
      const mockCardId = '999';
      const mockData = { title: 'Updated Card' };
      const mockResponse = { data: { id: mockCardId, ...mockData } };
      api.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.update(mockCardId, mockData);

      expect(api.put).toHaveBeenCalledWith(`/cards/${mockCardId}`, mockData);
      expect(result).toBe(mockResponse);
    });

    it('should reorder card', async () => {
      const mockCardId = '999';
      const mockData = { position: 3 };
      const mockResponse = { data: { success: true } };
      api.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.reorder(mockCardId, mockData);

      expect(api.put).toHaveBeenCalledWith(
        `/cards/${mockCardId}/reorder`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should delete card', async () => {
      const mockCardId = '999';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.delete(mockCardId);

      expect(api.delete).toHaveBeenCalledWith(`/cards/${mockCardId}`);
      expect(result).toBe(mockResponse);
    });

    it('should assign member to card', async () => {
      const mockCardId = '999';
      const mockUserId = 'user123';
      const mockResponse = { data: { success: true } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.assign(mockCardId, mockUserId);

      expect(api.post).toHaveBeenCalledWith(`/cards/${mockCardId}/assign`, {
        userId: mockUserId,
      });
      expect(result).toBe(mockResponse);
    });

    it('should unassign member from card', async () => {
      const mockCardId = '999';
      const mockUserId = 'user123';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.unassign(mockCardId, mockUserId);

      expect(api.delete).toHaveBeenCalledWith(
        `/cards/${mockCardId}/unassign/${mockUserId}`
      );
      expect(result).toBe(mockResponse);
    });

    it('should assign label to card', async () => {
      const mockCardId = '999';
      const mockLabelId = 'label123';
      const mockResponse = { data: { success: true } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.assignLabel(mockCardId, mockLabelId);

      expect(api.post).toHaveBeenCalledWith(
        `/cards/${mockCardId}/labels/${mockLabelId}`
      );
      expect(result).toBe(mockResponse);
    });

    it('should remove label from card', async () => {
      const mockCardId = '999';
      const mockLabelId = 'label123';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.removeLabel(mockCardId, mockLabelId);

      expect(api.delete).toHaveBeenCalledWith(
        `/cards/${mockCardId}/labels/${mockLabelId}`
      );
      expect(result).toBe(mockResponse);
    });

    it('should update card status', async () => {
      const mockCardId = '999';
      const mockStatus = 'done';
      const mockResponse = { data: { success: true } };
      api.patch = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.updateStatus(mockCardId, mockStatus);

      expect(api.patch).toHaveBeenCalledWith(`/cards/${mockCardId}/status`, {
        status: mockStatus,
      });
      expect(result).toBe(mockResponse);
    });

    it('should update card due date', async () => {
      const mockCardId = '999';
      const mockDueDate = '2026-03-15T00:00:00.000Z';
      const mockResponse = { data: { success: true } };
      api.patch = vi.fn().mockResolvedValue(mockResponse);

      const result = await cardAPI.updateDueDate(mockCardId, mockDueDate);

      expect(api.patch).toHaveBeenCalledWith(`/cards/${mockCardId}/due-date`, {
        dueDate: mockDueDate,
      });
      expect(result).toBe(mockResponse);
    });
  });

  describe('memberAPI', () => {
    it('should get members by workspace', async () => {
      const mockWorkspaceId = '123';
      const mockResponse = { data: [] };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await (
        await import('../api')
      ).memberAPI.getByWorkspace(mockWorkspaceId);

      expect(api.get).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/members`
      );
      expect(result).toBe(mockResponse);
    });

    it('should invite member to workspace', async () => {
      const mockWorkspaceId = '123';
      const mockData = { email: 'new@example.com' };
      const mockResponse = { data: { success: true } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await (
        await import('../api')
      ).memberAPI.invite(mockWorkspaceId, mockData);

      expect(api.post).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/invite`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should remove member from workspace', async () => {
      const mockWorkspaceId = '123';
      const mockUserId = 'user456';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await (
        await import('../api')
      ).memberAPI.remove(mockWorkspaceId, mockUserId);

      expect(api.delete).toHaveBeenCalledWith(
        `/workspaces/${mockWorkspaceId}/members/${mockUserId}`
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('labelAPI', () => {
    it('should get labels by board', async () => {
      const mockBoardId = 'board123';
      const mockResponse = { data: [] };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await labelAPI.getByBoard(mockBoardId);

      expect(api.get).toHaveBeenCalledWith(`/boards/${mockBoardId}/labels`);
      expect(result).toBe(mockResponse);
    });

    it('should create label', async () => {
      const mockBoardId = 'board123';
      const mockData = { name: 'Bug', color: '#FF0000' };
      const mockResponse = { data: { id: 'label1', ...mockData } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await labelAPI.create(mockBoardId, mockData);

      expect(api.post).toHaveBeenCalledWith(
        `/boards/${mockBoardId}/labels`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should update label', async () => {
      const mockLabelId = 'label1';
      const mockData = { name: 'Feature', color: '#00FF00' };
      const mockResponse = { data: { id: mockLabelId, ...mockData } };
      api.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await labelAPI.update(mockLabelId, mockData);

      expect(api.put).toHaveBeenCalledWith(`/labels/${mockLabelId}`, mockData);
      expect(result).toBe(mockResponse);
    });

    it('should delete label', async () => {
      const mockLabelId = 'label1';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await labelAPI.delete(mockLabelId);

      expect(api.delete).toHaveBeenCalledWith(`/labels/${mockLabelId}`);
      expect(result).toBe(mockResponse);
    });
  });

  describe('commentAPI', () => {
    it('should get comments by card', async () => {
      const mockCardId = 'card123';
      const mockResponse = { data: [] };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await commentAPI.getByCard(mockCardId);

      expect(api.get).toHaveBeenCalledWith(`/cards/${mockCardId}/comments`);
      expect(result).toBe(mockResponse);
    });

    it('should create comment', async () => {
      const mockCardId = 'card123';
      const mockData = { content: 'Great work!' };
      const mockResponse = { data: { id: 'comment1', ...mockData } };
      api.post = vi.fn().mockResolvedValue(mockResponse);

      const result = await commentAPI.create(mockCardId, mockData);

      expect(api.post).toHaveBeenCalledWith(
        `/cards/${mockCardId}/comments`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should update comment', async () => {
      const mockCommentId = 'comment1';
      const mockData = { content: 'Updated comment' };
      const mockResponse = { data: { id: mockCommentId, ...mockData } };
      api.put = vi.fn().mockResolvedValue(mockResponse);

      const result = await commentAPI.update(mockCommentId, mockData);

      expect(api.put).toHaveBeenCalledWith(
        `/comments/${mockCommentId}`,
        mockData
      );
      expect(result).toBe(mockResponse);
    });

    it('should delete comment', async () => {
      const mockCommentId = 'comment1';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await commentAPI.delete(mockCommentId);

      expect(api.delete).toHaveBeenCalledWith(`/comments/${mockCommentId}`);
      expect(result).toBe(mockResponse);
    });
  });

  describe('notificationAPI', () => {
    it('should get all notifications', async () => {
      const mockResponse = { data: [] };
      api.get = vi.fn().mockResolvedValue(mockResponse);

      const result = await notificationAPI.getAll();

      expect(api.get).toHaveBeenCalledWith('/notifications');
      expect(result).toBe(mockResponse);
    });

    it('should mark notification as read', async () => {
      const mockNotificationId = 'notif1';
      const mockResponse = { data: { success: true } };
      api.patch = vi.fn().mockResolvedValue(mockResponse);

      const result = await notificationAPI.markAsRead(mockNotificationId);

      expect(api.patch).toHaveBeenCalledWith(
        `/notifications/${mockNotificationId}/read`
      );
      expect(result).toBe(mockResponse);
    });

    it('should mark all notifications as read', async () => {
      const mockResponse = { data: { success: true } };
      api.patch = vi.fn().mockResolvedValue(mockResponse);

      const result = await notificationAPI.markAllAsRead();

      expect(api.patch).toHaveBeenCalledWith('/notifications/read-all');
      expect(result).toBe(mockResponse);
    });

    it('should delete notification', async () => {
      const mockNotificationId = 'notif1';
      const mockResponse = { data: { success: true } };
      api.delete = vi.fn().mockResolvedValue(mockResponse);

      const result = await notificationAPI.delete(mockNotificationId);

      expect(api.delete).toHaveBeenCalledWith(
        `/notifications/${mockNotificationId}`
      );
      expect(result).toBe(mockResponse);
    });
  });

  describe('interceptors', () => {
    it('request interceptor adds Authorization header when token exists', () => {
      // Override the no-op localStorage mock to return a token
      vi.spyOn(globalThis.localStorage, 'getItem').mockReturnValue(
        'my-jwt-token'
      );

      const requestHandler = api.interceptors.request.handlers[0];
      const config = { headers: {} };
      const result = requestHandler.fulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer my-jwt-token');
    });

    it('request interceptor does not add Authorization header when no token', () => {
      vi.spyOn(globalThis.localStorage, 'getItem').mockReturnValue(null);

      const requestHandler = api.interceptors.request.handlers[0];
      const config = { headers: {} };
      const result = requestHandler.fulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('response interceptor redirects to /login on 401 when not on login/root page', async () => {
      window.location = { href: '', pathname: '/dashboard' };
      const removeItemSpy = vi.spyOn(globalThis.localStorage, 'removeItem');

      const responseHandler = api.interceptors.response.handlers[0];
      const error = { response: { status: 401 } };

      await expect(responseHandler.rejected(error)).rejects.toEqual(error);
      expect(window.location.href).toBe('/login');
      expect(removeItemSpy).toHaveBeenCalledWith('token');
      expect(removeItemSpy).toHaveBeenCalledWith('user');
    });

    it('response interceptor does not redirect on 401 when on /login page', async () => {
      window.location = { href: '', pathname: '/login' };

      const responseHandler = api.interceptors.response.handlers[0];
      const error = { response: { status: 401 } };

      await expect(responseHandler.rejected(error)).rejects.toEqual(error);
      expect(window.location.href).toBe('');
    });

    it('response interceptor does not redirect on 401 when on root page', async () => {
      window.location = { href: '', pathname: '/' };

      const responseHandler = api.interceptors.response.handlers[0];
      const error = { response: { status: 401 } };

      await expect(responseHandler.rejected(error)).rejects.toEqual(error);
      expect(window.location.href).toBe('');
    });

    it('response interceptor does not redirect on non-401 errors', async () => {
      window.location = { href: '', pathname: '/dashboard' };

      const responseHandler = api.interceptors.response.handlers[0];
      const error = { response: { status: 500 } };

      await expect(responseHandler.rejected(error)).rejects.toEqual(error);
      expect(window.location.href).toBe('');
    });

    it('response interceptor passes through successful responses', () => {
      const responseHandler = api.interceptors.response.handlers[0];
      const response = { data: { success: true } };

      const result = responseHandler.fulfilled(response);
      expect(result).toBe(response);
    });
  });
});
