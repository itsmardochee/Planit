import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import useBoardFilters from '../useBoardFilters';

describe('useBoardFilters', () => {
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

  const mockLists = [
    {
      _id: 'list1',
      name: 'To Do',
      cards: [
        {
          _id: 'card1',
          title: 'Overdue Card',
          dueDate: yesterday,
          assignedTo: [{ _id: 'user1' }],
        },
        {
          _id: 'card2',
          title: 'Future Card',
          dueDate: tomorrow,
          assignedTo: [{ _id: 'user1' }],
        },
        {
          _id: 'card3',
          title: 'Unassigned Overdue',
          dueDate: yesterday,
          assignedTo: [],
        },
      ],
    },
    {
      _id: 'list2',
      name: 'In Progress',
      cards: [
        {
          _id: 'card4',
          title: 'User 2 Card',
          dueDate: tomorrow,
          assignedTo: [{ _id: 'user2' }],
        },
      ],
    },
  ];

  const mockMembers = [
    { userId: { _id: 'user1', username: 'User 1' } },
    { userId: { _id: 'user2', username: 'User 2' } },
  ];

  describe('Initial State', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      expect(result.current.selectedMemberFilter).toBeNull();
      expect(result.current.showOverdueFilter).toBe(false);
      expect(result.current.filteredLists).toEqual(mockLists);
      expect(result.current.overdueCount).toBe(2);
    });

    it('should return all lists when no filter is applied', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      expect(result.current.filteredLists).toHaveLength(2);
      expect(result.current.filteredLists[0].cards).toHaveLength(3);
      expect(result.current.filteredLists[1].cards).toHaveLength(1);
    });
  });

  describe('Member Filter', () => {
    it('should filter by specific member', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      act(() => {
        result.current.setSelectedMemberFilter('user1');
      });

      expect(result.current.selectedMemberFilter).toBe('user1');
      expect(result.current.filteredLists[0].cards).toHaveLength(2);
      expect(result.current.filteredLists[0].cards.map(c => c._id)).toEqual([
        'card1',
        'card2',
      ]);
      expect(result.current.filteredLists[1].cards).toHaveLength(0);
    });

    it('should filter unassigned cards', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      act(() => {
        result.current.setSelectedMemberFilter('unassigned');
      });

      expect(result.current.filteredLists[0].cards).toHaveLength(1);
      expect(result.current.filteredLists[0].cards[0]._id).toBe('card3');
      expect(result.current.filteredLists[1].cards).toHaveLength(0);
    });

    it('should update filteredLists when member filter changes', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      act(() => {
        result.current.setSelectedMemberFilter('user2');
      });

      expect(result.current.filteredLists[0].cards).toHaveLength(0);
      expect(result.current.filteredLists[1].cards).toHaveLength(1);
      expect(result.current.filteredLists[1].cards[0]._id).toBe('card4');
    });
  });

  describe('Overdue Filter', () => {
    it('should filter overdue cards', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      act(() => {
        result.current.setShowOverdueFilter(true);
      });

      expect(result.current.showOverdueFilter).toBe(true);
      expect(result.current.filteredLists[0].cards).toHaveLength(2);
      expect(result.current.filteredLists[0].cards.map(c => c._id)).toEqual([
        'card1',
        'card3',
      ]);
      expect(result.current.filteredLists[1].cards).toHaveLength(0);
    });

    it('should toggle overdue filter', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      act(() => {
        result.current.setShowOverdueFilter(true);
      });
      expect(result.current.showOverdueFilter).toBe(true);

      act(() => {
        result.current.setShowOverdueFilter(false);
      });
      expect(result.current.showOverdueFilter).toBe(false);
      expect(result.current.filteredLists).toEqual(mockLists);
    });
  });

  describe('Combined Filters', () => {
    it('should apply both member and overdue filters', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      act(() => {
        result.current.setSelectedMemberFilter('user1');
        result.current.setShowOverdueFilter(true);
      });

      expect(result.current.filteredLists[0].cards).toHaveLength(1);
      expect(result.current.filteredLists[0].cards[0]._id).toBe('card1');
      expect(result.current.filteredLists[1].cards).toHaveLength(0);
    });

    it('should clear all filters', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      act(() => {
        result.current.setSelectedMemberFilter('user1');
        result.current.setShowOverdueFilter(true);
      });

      expect(result.current.selectedMemberFilter).toBe('user1');
      expect(result.current.showOverdueFilter).toBe(true);

      act(() => {
        result.current.clearFilters();
      });

      expect(result.current.selectedMemberFilter).toBeNull();
      expect(result.current.showOverdueFilter).toBe(false);
      expect(result.current.filteredLists).toEqual(mockLists);
    });
  });

  describe('Overdue Count', () => {
    it('should calculate overdue count correctly', () => {
      const { result } = renderHook(() =>
        useBoardFilters(mockLists, mockMembers)
      );

      expect(result.current.overdueCount).toBe(2);
    });

    it('should update overdue count when lists change', () => {
      const { result, rerender } = renderHook(
        ({ lists }) => useBoardFilters(lists, mockMembers),
        { initialProps: { lists: mockLists } }
      );

      expect(result.current.overdueCount).toBe(2);

      // Remove overdue cards
      const newLists = [
        {
          ...mockLists[0],
          cards: [mockLists[0].cards[1]], // Only future card
        },
        mockLists[1],
      ];

      rerender({ lists: newLists });
      expect(result.current.overdueCount).toBe(0);
    });

    it('should return 0 for empty lists', () => {
      const { result } = renderHook(() => useBoardFilters([], mockMembers));

      expect(result.current.overdueCount).toBe(0);
    });
  });

  describe('Edge Cases', () => {
    it('should handle null lists gracefully', () => {
      const { result } = renderHook(() => useBoardFilters(null, mockMembers));

      expect(result.current.filteredLists).toEqual([]);
      expect(result.current.overdueCount).toBe(0);
    });

    it('should handle undefined lists gracefully', () => {
      const { result } = renderHook(() =>
        useBoardFilters(undefined, mockMembers)
      );

      expect(result.current.filteredLists).toEqual([]);
      expect(result.current.overdueCount).toBe(0);
    });

    it('should handle lists without cards', () => {
      const emptyLists = [{ _id: 'list1', name: 'Empty List' }];
      const { result } = renderHook(() =>
        useBoardFilters(emptyLists, mockMembers)
      );

      expect(result.current.filteredLists).toHaveLength(1);
      expect(result.current.overdueCount).toBe(0);
    });
  });
});
