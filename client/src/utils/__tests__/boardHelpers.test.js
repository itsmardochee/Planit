import { describe, it, expect } from 'vitest';
import {
  isCardOverdue,
  getOverdueCount,
  filterCardsByMember,
  filterCardsByOverdue,
  applyFilters,
  findListByCardId,
  findCardById,
  reorderArray,
  extractListId,
} from '../boardHelpers';

describe('boardHelpers', () => {
  describe('isCardOverdue', () => {
    it('returns false for card without dueDate', () => {
      const card = { _id: '1', title: 'Test Card' };
      expect(isCardOverdue(card)).toBe(false);
    });

    it('returns false for card with null dueDate', () => {
      const card = { _id: '1', title: 'Test Card', dueDate: null };
      expect(isCardOverdue(card)).toBe(false);
    });

    it('returns true for card with past dueDate', () => {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const card = { _id: '1', title: 'Test Card', dueDate: yesterday };
      expect(isCardOverdue(card)).toBe(true);
    });

    it('returns false for card with future dueDate', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const card = { _id: '1', title: 'Test Card', dueDate: tomorrow };
      expect(isCardOverdue(card)).toBe(false);
    });

    it('returns false for card with today dueDate', () => {
      const today = new Date();
      today.setHours(12, 0, 0, 0); // Noon today
      const card = {
        _id: '1',
        title: 'Test Card',
        dueDate: today.toISOString(),
      };
      expect(isCardOverdue(card)).toBe(false);
    });

    it('returns false for card with invalid dueDate', () => {
      const card = { _id: '1', title: 'Test Card', dueDate: 'invalid-date' };
      expect(isCardOverdue(card)).toBe(false);
    });

    it('returns false for null card', () => {
      expect(isCardOverdue(null)).toBe(false);
    });

    it('returns false for undefined card', () => {
      expect(isCardOverdue(undefined)).toBe(false);
    });
  });

  describe('getOverdueCount', () => {
    it('returns 0 for empty lists array', () => {
      expect(getOverdueCount([])).toBe(0);
    });

    it('returns 0 for lists with no overdue cards', () => {
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const lists = [
        {
          _id: 'list1',
          cards: [
            { _id: 'card1', dueDate: tomorrow },
            { _id: 'card2', dueDate: null },
          ],
        },
      ];
      expect(getOverdueCount(lists)).toBe(0);
    });

    it('counts overdue cards correctly', () => {
      const yesterday = new Date(
        Date.now() - 24 * 60 * 60 * 1000
      ).toISOString();
      const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      const lists = [
        {
          _id: 'list1',
          cards: [
            { _id: 'card1', dueDate: yesterday },
            { _id: 'card2', dueDate: tomorrow },
          ],
        },
        {
          _id: 'list2',
          cards: [{ _id: 'card3', dueDate: yesterday }],
        },
      ];
      expect(getOverdueCount(lists)).toBe(2);
    });

    it('returns 0 for lists with empty cards arrays', () => {
      const lists = [{ _id: 'list1', cards: [] }];
      expect(getOverdueCount(lists)).toBe(0);
    });

    it('returns 0 for lists without cards property', () => {
      const lists = [{ _id: 'list1' }];
      expect(getOverdueCount(lists)).toBe(0);
    });

    it('returns 0 for null input', () => {
      expect(getOverdueCount(null)).toBe(0);
    });

    it('returns 0 for non-array input', () => {
      expect(getOverdueCount('not an array')).toBe(0);
    });
  });

  describe('filterCardsByMember', () => {
    const cards = [
      { _id: 'card1', title: 'Card 1', assignedTo: [{ _id: 'user1' }] },
      { _id: 'card2', title: 'Card 2', assignedTo: [{ _id: 'user2' }] },
      { _id: 'card3', title: 'Card 3', assignedTo: [] },
      { _id: 'card4', title: 'Card 4', assignedTo: null },
      { _id: 'card5', title: 'Card 5' },
    ];

    it('returns all cards when memberId is null', () => {
      expect(filterCardsByMember(cards, null)).toEqual(cards);
    });

    it('returns all cards when memberId is empty string', () => {
      expect(filterCardsByMember(cards, '')).toEqual(cards);
    });

    it('filters cards by specific member', () => {
      const filtered = filterCardsByMember(cards, 'user1');
      expect(filtered).toHaveLength(1);
      expect(filtered[0]._id).toBe('card1');
    });

    it('filters unassigned cards', () => {
      const filtered = filterCardsByMember(cards, 'unassigned');
      expect(filtered).toHaveLength(3);
      expect(filtered.map(c => c._id)).toEqual(['card3', 'card4', 'card5']);
    });

    it('returns empty array for non-matching member', () => {
      const filtered = filterCardsByMember(cards, 'user999');
      expect(filtered).toHaveLength(0);
    });

    it('returns empty array for null cards input', () => {
      expect(filterCardsByMember(null, 'user1')).toEqual([]);
    });

    it('returns empty array for non-array cards input', () => {
      expect(filterCardsByMember('not an array', 'user1')).toEqual([]);
    });
  });

  describe('filterCardsByOverdue', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const cards = [
      { _id: 'card1', dueDate: yesterday },
      { _id: 'card2', dueDate: tomorrow },
      { _id: 'card3', dueDate: null },
      { _id: 'card4' },
    ];

    it('returns only overdue cards', () => {
      const filtered = filterCardsByOverdue(cards);
      expect(filtered).toHaveLength(1);
      expect(filtered[0]._id).toBe('card1');
    });

    it('returns empty array when no cards are overdue', () => {
      const notOverdueCards = [
        { _id: 'card1', dueDate: tomorrow },
        { _id: 'card2', dueDate: null },
      ];
      expect(filterCardsByOverdue(notOverdueCards)).toEqual([]);
    });

    it('returns empty array for empty cards array', () => {
      expect(filterCardsByOverdue([])).toEqual([]);
    });

    it('returns empty array for null input', () => {
      expect(filterCardsByOverdue(null)).toEqual([]);
    });
  });

  describe('applyFilters', () => {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const lists = [
      {
        _id: 'list1',
        name: 'List 1',
        cards: [
          { _id: 'card1', dueDate: yesterday, assignedTo: [{ _id: 'user1' }] },
          { _id: 'card2', dueDate: tomorrow, assignedTo: [{ _id: 'user1' }] },
          { _id: 'card3', dueDate: yesterday, assignedTo: [] },
        ],
      },
      {
        _id: 'list2',
        name: 'List 2',
        cards: [
          { _id: 'card4', dueDate: tomorrow, assignedTo: [{ _id: 'user2' }] },
        ],
      },
    ];

    it('returns all lists unchanged when no filters applied', () => {
      const filtered = applyFilters(lists, {});
      expect(filtered).toEqual(lists);
    });

    it('filters by member only', () => {
      const filtered = applyFilters(lists, { memberFilter: 'user1' });
      expect(filtered[0].cards).toHaveLength(2);
      expect(filtered[0].cards.map(c => c._id)).toEqual(['card1', 'card2']);
      expect(filtered[1].cards).toHaveLength(0);
    });

    it('filters by overdue only', () => {
      const filtered = applyFilters(lists, { overdueFilter: true });
      expect(filtered[0].cards).toHaveLength(2);
      expect(filtered[0].cards.map(c => c._id)).toEqual(['card1', 'card3']);
      expect(filtered[1].cards).toHaveLength(0);
    });

    it('filters by both member and overdue', () => {
      const filtered = applyFilters(lists, {
        memberFilter: 'user1',
        overdueFilter: true,
      });
      expect(filtered[0].cards).toHaveLength(1);
      expect(filtered[0].cards[0]._id).toBe('card1');
    });

    it('filters unassigned cards', () => {
      const filtered = applyFilters(lists, { memberFilter: 'unassigned' });
      expect(filtered[0].cards).toHaveLength(1);
      expect(filtered[0].cards[0]._id).toBe('card3');
    });

    it('returns empty array for null lists', () => {
      expect(applyFilters(null, {})).toEqual([]);
    });

    it('handles lists without cards property', () => {
      const listsWithoutCards = [{ _id: 'list1', name: 'List 1' }];
      const filtered = applyFilters(listsWithoutCards, {
        memberFilter: 'user1',
      });
      expect(filtered[0].cards).toEqual([]);
    });
  });

  describe('findListByCardId', () => {
    const lists = [
      {
        _id: 'list1',
        cards: [
          { _id: 'card1', title: 'Card 1' },
          { _id: 'card2', title: 'Card 2' },
        ],
      },
      {
        _id: 'list2',
        cards: [{ _id: 'card3', title: 'Card 3' }],
      },
    ];

    it('finds list containing the card', () => {
      const list = findListByCardId(lists, 'card2');
      expect(list).not.toBeNull();
      expect(list._id).toBe('list1');
    });

    it('returns null for non-existent card', () => {
      expect(findListByCardId(lists, 'card999')).toBeNull();
    });

    it('returns null for null lists', () => {
      expect(findListByCardId(null, 'card1')).toBeNull();
    });

    it('returns null for null cardId', () => {
      expect(findListByCardId(lists, null)).toBeNull();
    });

    it('returns null for empty cardId', () => {
      expect(findListByCardId(lists, '')).toBeNull();
    });

    it('handles lists without cards property', () => {
      const listsWithoutCards = [{ _id: 'list1' }];
      expect(findListByCardId(listsWithoutCards, 'card1')).toBeNull();
    });
  });

  describe('findCardById', () => {
    const lists = [
      {
        _id: 'list1',
        cards: [
          { _id: 'card1', title: 'Card 1' },
          { _id: 'card2', title: 'Card 2' },
        ],
      },
      {
        _id: 'list2',
        cards: [{ _id: 'card3', title: 'Card 3' }],
      },
    ];

    it('finds card by id', () => {
      const card = findCardById(lists, 'card2');
      expect(card).not.toBeNull();
      expect(card._id).toBe('card2');
      expect(card.title).toBe('Card 2');
    });

    it('returns null for non-existent card', () => {
      expect(findCardById(lists, 'card999')).toBeNull();
    });

    it('returns null for null lists', () => {
      expect(findCardById(null, 'card1')).toBeNull();
    });

    it('returns null for null cardId', () => {
      expect(findCardById(lists, null)).toBeNull();
    });

    it('handles lists without cards property', () => {
      const listsWithoutCards = [{ _id: 'list1' }];
      expect(findCardById(listsWithoutCards, 'card1')).toBeNull();
    });
  });

  describe('reorderArray', () => {
    const array = ['a', 'b', 'c', 'd', 'e'];

    it('reorders array correctly', () => {
      const result = reorderArray(array, 1, 3);
      expect(result).toEqual(['a', 'c', 'd', 'b', 'e']);
    });

    it('moves item to beginning', () => {
      const result = reorderArray(array, 2, 0);
      expect(result).toEqual(['c', 'a', 'b', 'd', 'e']);
    });

    it('moves item to end', () => {
      const result = reorderArray(array, 1, 4);
      expect(result).toEqual(['a', 'c', 'd', 'e', 'b']);
    });

    it('returns same array when oldIndex equals newIndex', () => {
      const result = reorderArray(array, 2, 2);
      expect(result).toEqual(array);
    });

    it('returns original array for invalid oldIndex', () => {
      const result = reorderArray(array, -1, 2);
      expect(result).toEqual(array);
    });

    it('returns original array for out-of-bounds oldIndex', () => {
      const result = reorderArray(array, 10, 2);
      expect(result).toEqual(array);
    });

    it('returns original array for invalid newIndex', () => {
      const result = reorderArray(array, 1, -1);
      expect(result).toEqual(array);
    });

    it('returns original array for out-of-bounds newIndex', () => {
      const result = reorderArray(array, 1, 10);
      expect(result).toEqual(array);
    });

    it('returns empty array for null input', () => {
      expect(reorderArray(null, 0, 1)).toEqual([]);
    });

    it('does not mutate original array', () => {
      const original = [...array];
      reorderArray(array, 1, 3);
      expect(array).toEqual(original);
    });
  });

  describe('extractListId', () => {
    it('extracts list ID from list- prefixed string', () => {
      expect(extractListId('list-abc123')).toBe('abc123');
    });

    it('returns ID unchanged when no prefix', () => {
      expect(extractListId('abc123')).toBe('abc123');
    });

    it('handles multiple list- occurrences', () => {
      expect(extractListId('list-list-abc')).toBe('list-abc');
    });

    it('returns empty string for null input', () => {
      expect(extractListId(null)).toBe('');
    });

    it('returns empty string for undefined input', () => {
      expect(extractListId(undefined)).toBe('');
    });

    it('returns empty string for empty string input', () => {
      expect(extractListId('')).toBe('');
    });

    it('handles numeric IDs', () => {
      expect(extractListId('list-12345')).toBe('12345');
    });
  });
});
