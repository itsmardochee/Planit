import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useBoardDrag from '../useBoardDrag';
import * as api from '../../utils/api';

// Mock the API modules
vi.mock('../../utils/api', () => ({
  listAPI: {
    reorder: vi.fn(),
  },
  cardAPI: {
    reorder: vi.fn(),
  },
}));

// Mock dnd-kit sensors
vi.mock('@dnd-kit/core', async () => {
  const actual = await vi.importActual('@dnd-kit/core');
  return {
    ...actual,
    useSensor: vi.fn(sensor => sensor),
    useSensors: vi.fn((...sensors) => sensors),
  };
});

describe('useBoardDrag', () => {
  const mockLists = [
    {
      _id: 'list1',
      name: 'To Do',
      cards: [
        { _id: 'card1', title: 'Card 1' },
        { _id: 'card2', title: 'Card 2' },
      ],
    },
    {
      _id: 'list2',
      name: 'In Progress',
      cards: [{ _id: 'card3', title: 'Card 3' }],
    },
  ];

  let setListsMock;
  let refetchMock;

  beforeEach(() => {
    vi.clearAllMocks();
    setListsMock = vi.fn();
    refetchMock = vi.fn();
    api.listAPI.reorder.mockResolvedValue({ data: { success: true } });
    api.cardAPI.reorder.mockResolvedValue({ data: { success: true } });
  });

  describe('Initialization', () => {
    it('should initialize with null activeCard', () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      expect(result.current.activeCard).toBeNull();
    });

    it('should provide sensors', () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      expect(result.current.sensors).toBeDefined();
    });

    it('should provide collision detection function', () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      expect(typeof result.current.collisionDetection).toBe('function');
    });

    it('should provide drag handlers', () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      expect(result.current.dragHandlers).toBeDefined();
      expect(typeof result.current.dragHandlers.onDragStart).toBe('function');
      expect(typeof result.current.dragHandlers.onDragOver).toBe('function');
      expect(typeof result.current.dragHandlers.onDragEnd).toBe('function');
      expect(typeof result.current.dragHandlers.onDragCancel).toBe('function');
    });
  });

  describe('handleDragStart', () => {
    it('should set activeCard when dragging a card', () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      const event = {
        active: {
          id: 'card1',
          data: { current: { type: 'card' } },
        },
      };

      act(() => {
        result.current.dragHandlers.onDragStart(event);
      });

      expect(result.current.activeCard).toEqual({
        _id: 'card1',
        title: 'Card 1',
      });
    });

    it('should clear activeCard when dragging a list', () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      // First set an active card
      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card1', data: { current: { type: 'card' } } },
        });
      });

      // Then drag a list
      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'list1', data: { current: { type: 'list' } } },
        });
      });

      expect(result.current.activeCard).toBeNull();
    });
  });

  describe('handleDragCancel', () => {
    it('should clear activeCard on cancel', () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      // Set active card
      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card1', data: { current: { type: 'card' } } },
        });
      });

      expect(result.current.activeCard).not.toBeNull();

      // Cancel drag
      act(() => {
        result.current.dragHandlers.onDragCancel();
      });

      expect(result.current.activeCard).toBeNull();
    });
  });

  describe('handleDragEnd - List Reordering', () => {
    it('should reorder lists when dragging list over list', async () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      const event = {
        active: {
          id: 'list1',
          data: { current: { type: 'list' } },
        },
        over: {
          id: 'list2',
          data: { current: { type: 'list' } },
        },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(setListsMock).toHaveBeenCalled();
      expect(api.listAPI.reorder).toHaveBeenCalledWith('list1', {
        position: 1,
      });
    });

    it('should not reorder when dropping list on same position', async () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      const event = {
        active: {
          id: 'list1',
          data: { current: { type: 'list' } },
        },
        over: {
          id: 'list1',
          data: { current: { type: 'list' } },
        },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(setListsMock).not.toHaveBeenCalled();
      expect(api.listAPI.reorder).not.toHaveBeenCalled();
    });
  });

  describe('handleDragEnd - Card Reordering in Same List', () => {
    it('should reorder cards within same list', async () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      // Start dragging card1
      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card1', data: { current: { type: 'card' } } },
        });
      });

      // Drop on card2
      const event = {
        active: { id: 'card1' },
        over: { id: 'card2' },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(setListsMock).toHaveBeenCalled();
      expect(api.cardAPI.reorder).toHaveBeenCalledWith('card1', {
        position: 1,
      });
    });
  });

  describe('handleDragEnd - Card Moving Between Lists', () => {
    it('should move card to different list', async () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      // Start dragging card1 from list1
      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card1', data: { current: { type: 'card' } } },
        });
      });

      // Drop on card3 in list2
      const event = {
        active: { id: 'card1' },
        over: { id: 'card3' },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(setListsMock).toHaveBeenCalled();
      expect(api.cardAPI.reorder).toHaveBeenCalledWith('card1', {
        listId: 'list2',
        position: 0,
      });
    });

    it('should move card to empty list', async () => {
      const listsWithEmptyList = [
        ...mockLists,
        { _id: 'list3', name: 'Done', cards: [] },
      ];

      const { result } = renderHook(() =>
        useBoardDrag(listsWithEmptyList, setListsMock, refetchMock)
      );

      // Start dragging card1
      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card1', data: { current: { type: 'card' } } },
        });
      });

      // Drop on empty list (list-list3 droppable)
      const event = {
        active: { id: 'card1' },
        over: { id: 'list-list3' },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(setListsMock).toHaveBeenCalled();
      expect(api.cardAPI.reorder).toHaveBeenCalledWith('card1', {
        listId: 'list3',
        position: 0,
      });
    });
  });

  describe('Error Handling', () => {
    it('should refetch on list reorder error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      api.listAPI.reorder.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      const event = {
        active: { id: 'list1', data: { current: { type: 'list' } } },
        over: { id: 'list2', data: { current: { type: 'list' } } },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(refetchMock).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should refetch on card reorder error', async () => {
      const consoleErrorSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      api.cardAPI.reorder.mockRejectedValue(new Error('API Error'));

      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      // Start dragging
      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card1', data: { current: { type: 'card' } } },
        });
      });

      const event = {
        active: { id: 'card1' },
        over: { id: 'card2' },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(refetchMock).toHaveBeenCalled();
      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    it('should refetch when source list not found', async () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      // Start dragging non-existent card
      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card999', data: { current: { type: 'card' } } },
        });
      });

      const event = {
        active: { id: 'card999' },
        over: { id: 'card1' },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(refetchMock).toHaveBeenCalled();
      expect(setListsMock).not.toHaveBeenCalled();
    });
  });

  describe('Edge Cases', () => {
    it('should do nothing when no over target', async () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card1', data: { current: { type: 'card' } } },
        });
      });

      const event = {
        active: { id: 'card1' },
        over: null,
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(setListsMock).not.toHaveBeenCalled();
      expect(api.cardAPI.reorder).not.toHaveBeenCalled();
    });

    it('should do nothing when dropping on same position', async () => {
      const { result } = renderHook(() =>
        useBoardDrag(mockLists, setListsMock, refetchMock)
      );

      act(() => {
        result.current.dragHandlers.onDragStart({
          active: { id: 'card1', data: { current: { type: 'card' } } },
        });
      });

      const event = {
        active: { id: 'card1' },
        over: { id: 'card1' },
      };

      await act(async () => {
        await result.current.dragHandlers.onDragEnd(event);
      });

      expect(setListsMock).not.toHaveBeenCalled();
    });
  });
});
