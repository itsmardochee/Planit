import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import useBoardData from '../useBoardData';
import * as api from '../../utils/api';

// Mock the API modules
vi.mock('../../utils/api', () => ({
  boardAPI: {
    getById: vi.fn(),
  },
  listAPI: {
    getByBoard: vi.fn(),
  },
  cardAPI: {
    getByList: vi.fn(),
  },
  memberAPI: {
    getByWorkspace: vi.fn(),
  },
}));

describe('useBoardData', () => {
  const mockBoard = {
    _id: 'board123',
    name: 'Test Board',
    description: 'Test Description',
    workspaceId: 'workspace123',
  };

  const mockBoardNoWorkspace = {
    _id: 'board123',
    name: 'Test Board',
    description: 'Test Description',
    // no workspaceId
  };

  const mockLists = [
    { _id: 'list1', name: 'To Do', position: 0 },
    { _id: 'list2', name: 'In Progress', position: 1 },
  ];

  const mockCards = {
    list1: [
      { _id: 'card1', title: 'Card 1', listId: 'list1' },
      { _id: 'card2', title: 'Card 2', listId: 'list1' },
    ],
    list2: [{ _id: 'card3', title: 'Card 3', listId: 'list2' }],
  };

  const mockMembers = [
    { userId: { _id: 'user1', username: 'User 1' }, role: 'admin' },
    { userId: { _id: 'user2', username: 'User 2' }, role: 'member' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();

    // Default successful responses
    api.boardAPI.getById.mockResolvedValue({
      data: { success: true, data: mockBoard },
    });
    api.listAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: mockLists },
    });
    api.cardAPI.getByList.mockImplementation(listId => {
      const cards = listId === 'list1' ? mockCards.list1 : mockCards.list2;
      return Promise.resolve({
        data: { success: true, data: cards },
      });
    });
    api.memberAPI.getByWorkspace.mockResolvedValue({
      data: { success: true, data: mockMembers },
    });
  });

  describe('Initial Fetch', () => {
    it('should start with loading true', () => {
      const { result } = renderHook(() => useBoardData('board123'));

      expect(result.current.loading).toBe(true);
      expect(result.current.board).toBeNull();
      expect(result.current.lists).toEqual([]);
      expect(result.current.members).toEqual([]);
    });

    it('should fetch board, lists, cards, and members', async () => {
      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.board).toEqual(mockBoard);
      expect(result.current.lists).toHaveLength(2);
      expect(result.current.lists[0].cards).toEqual(mockCards.list1);
      expect(result.current.lists[1].cards).toEqual(mockCards.list2);
      expect(result.current.members).toEqual(mockMembers);

      expect(api.boardAPI.getById).toHaveBeenCalledWith('board123');
      expect(api.listAPI.getByBoard).toHaveBeenCalledWith('board123');
      expect(api.cardAPI.getByList).toHaveBeenCalledTimes(2);
      expect(api.memberAPI.getByWorkspace).toHaveBeenCalledWith('workspace123');
    });

    it('should not fetch members when board has no workspaceId', async () => {
      api.boardAPI.getById.mockResolvedValue({
        data: { success: true, data: mockBoardNoWorkspace },
      });

      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.board).toEqual(mockBoardNoWorkspace);
      expect(result.current.members).toEqual([]);
      expect(api.memberAPI.getByWorkspace).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle board fetch error gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      api.boardAPI.getById.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.board).toBeNull();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should handle member fetch error gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      api.memberAPI.getByWorkspace.mockRejectedValue(
        new Error('Members error')
      );

      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.board).toEqual(mockBoard);
      expect(result.current.members).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Error loading members',
        expect.any(Error)
      );
      consoleErrorSpy.mockRestore();
    });

    it('should handle lists fetch error gracefully', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      api.listAPI.getByBoard.mockRejectedValue(new Error('Lists error'));

      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lists).toEqual([]);
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });

  describe('Refetch', () => {
    it('should provide refetch function', async () => {
      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.refetch).toBe('function');
    });

    it('should refetch data when refetch is called', async () => {
      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      // Clear mock calls
      vi.clearAllMocks();

      // Call refetch
      await result.current.refetch();

      await waitFor(() => {
        expect(api.boardAPI.getById).toHaveBeenCalledWith('board123');
      });

      expect(api.listAPI.getByBoard).toHaveBeenCalledWith('board123');
      expect(api.cardAPI.getByList).toHaveBeenCalledTimes(2);
    });
  });

  describe('Optimistic Updates', () => {
    it('should expose setLists for optimistic updates', async () => {
      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(typeof result.current.setLists).toBe('function');
    });

    it('should allow updating lists directly', async () => {
      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      const newLists = [
        ...result.current.lists,
        { _id: 'list3', name: 'Done', cards: [] },
      ];

      result.current.setLists(newLists);

      await waitFor(() => {
        expect(result.current.lists).toHaveLength(3);
      });

      expect(result.current.lists[2]._id).toBe('list3');
    });
  });

  describe('BoardId Changes', () => {
    it('should refetch when boardId changes', async () => {
      const { result, rerender } = renderHook(
        ({ boardId }) => useBoardData(boardId),
        { initialProps: { boardId: 'board123' } }
      );

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(api.boardAPI.getById).toHaveBeenCalledWith('board123');

      // Change boardId
      vi.clearAllMocks();
      rerender({ boardId: 'board456' });

      await waitFor(() => {
        expect(api.boardAPI.getById).toHaveBeenCalledWith('board456');
      });
    });
  });

  describe('Empty Data', () => {
    it('should handle empty lists response', async () => {
      api.listAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: [] },
      });

      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lists).toEqual([]);
      expect(api.cardAPI.getByList).not.toHaveBeenCalled();
    });

    it('should handle null members response', async () => {
      api.memberAPI.getByWorkspace.mockResolvedValue({
        data: { success: true, data: null },
      });

      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.members).toEqual([]);
    });

    it('should handle null list data from API', async () => {
      api.listAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: null },
      });

      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lists).toEqual([]);
    });

    it('should handle null card data from API', async () => {
      // listAPI returns 1 list, cardAPI returns null data
      api.listAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: [{ _id: 'list1', name: 'To Do' }] },
      });
      api.cardAPI.getByList.mockResolvedValue({
        data: { success: true, data: null },
      });

      const { result } = renderHook(() => useBoardData('board123'));

      await waitFor(() => {
        expect(result.current.loading).toBe(false);
      });

      expect(result.current.lists[0].cards).toEqual([]);
    });
  });
});
