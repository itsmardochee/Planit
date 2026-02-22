/**
 * Board Helper Functions
 * Pure functions for board logic - fully testable without DOM
 */

/**
 * Check if a card is overdue
 * @param {Object} card - Card object with optional dueDate
 * @returns {boolean} True if card has a due date in the past
 */
export const isCardOverdue = card => {
  if (!card || !card.dueDate) return false;

  try {
    const dueDate = new Date(card.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Reset time to start of day

    // Check if date is valid
    if (isNaN(dueDate.getTime())) return false;

    return dueDate < today;
  } catch {
    return false;
  }
};

/**
 * Get count of overdue cards across all lists
 * @param {Array} lists - Array of list objects with cards
 * @returns {number} Count of overdue cards
 */
export const getOverdueCount = lists => {
  if (!Array.isArray(lists)) return 0;

  let count = 0;
  lists.forEach(list => {
    if (Array.isArray(list.cards)) {
      list.cards.forEach(card => {
        if (isCardOverdue(card)) count++;
      });
    }
  });
  return count;
};

/**
 * Filter cards by assigned member
 * @param {Array} cards - Array of card objects
 * @param {string|null} memberId - Member ID to filter by, 'unassigned', or null for all
 * @returns {Array} Filtered cards
 */
export const filterCardsByMember = (cards, memberId) => {
  if (!Array.isArray(cards)) return [];
  if (!memberId) return cards; // No filter

  return cards.filter(card => {
    if (memberId === 'unassigned') {
      return !card.assignedTo || card.assignedTo.length === 0;
    }

    return (
      card.assignedTo &&
      Array.isArray(card.assignedTo) &&
      card.assignedTo.some(member => member._id === memberId)
    );
  });
};

/**
 * Filter cards by overdue status
 * @param {Array} cards - Array of card objects
 * @returns {Array} Only overdue cards
 */
export const filterCardsByOverdue = cards => {
  if (!Array.isArray(cards)) return [];
  return cards.filter(card => isCardOverdue(card));
};

/**
 * Apply filters to lists (member and/or overdue)
 * @param {Array} lists - Array of list objects with cards
 * @param {Object} filters - Filter options
 * @param {string|null} filters.memberFilter - Member ID, 'unassigned', or null
 * @param {boolean} filters.overdueFilter - Show only overdue cards
 * @returns {Array} Lists with filtered cards
 */
export const applyFilters = (lists, filters = {}) => {
  if (!Array.isArray(lists)) return [];

  const { memberFilter = null, overdueFilter = false } = filters;

  // No filters applied
  if (!memberFilter && !overdueFilter) {
    return lists;
  }

  return lists.map(list => ({
    ...list,
    cards: (list.cards || []).filter(card => {
      // Apply member filter
      let passesMemberFilter = true;
      if (memberFilter) {
        if (memberFilter === 'unassigned') {
          passesMemberFilter = !card.assignedTo || card.assignedTo.length === 0;
        } else {
          passesMemberFilter =
            card.assignedTo &&
            Array.isArray(card.assignedTo) &&
            card.assignedTo.some(member => member._id === memberFilter);
        }
      }

      // Apply overdue filter
      let passesOverdueFilter = true;
      if (overdueFilter) {
        passesOverdueFilter = isCardOverdue(card);
      }

      return passesMemberFilter && passesOverdueFilter;
    }),
  }));
};

/**
 * Find list containing a specific card
 * @param {Array} lists - Array of list objects with cards
 * @param {string} cardId - Card ID to find
 * @returns {Object|null} List object or null if not found
 */
export const findListByCardId = (lists, cardId) => {
  if (!Array.isArray(lists) || !cardId) return null;

  return (
    lists.find(
      list =>
        Array.isArray(list.cards) &&
        list.cards.some(card => card._id === cardId)
    ) || null
  );
};

/**
 * Find card in lists by card ID
 * @param {Array} lists - Array of list objects with cards
 * @param {string} cardId - Card ID to find
 * @returns {Object|null} Card object or null if not found
 */
export const findCardById = (lists, cardId) => {
  if (!Array.isArray(lists) || !cardId) return null;

  for (const list of lists) {
    if (Array.isArray(list.cards)) {
      const card = list.cards.find(c => c._id === cardId);
      if (card) return card;
    }
  }
  return null;
};

/**
 * Reorder array by moving item from oldIndex to newIndex
 * @param {Array} array - Array to reorder
 * @param {number} oldIndex - Current index
 * @param {number} newIndex - Target index
 * @returns {Array} New reordered array (immutable)
 */
export const reorderArray = (array, oldIndex, newIndex) => {
  if (!Array.isArray(array)) return [];
  if (oldIndex < 0 || oldIndex >= array.length) return array;
  if (newIndex < 0 || newIndex >= array.length) return array;
  if (oldIndex === newIndex) return array;

  const result = [...array];
  const [removed] = result.splice(oldIndex, 1);
  result.splice(newIndex, 0, removed);
  return result;
};

/**
 * Extract list ID from droppable ID (handles 'list-xxx' format)
 * @param {string} droppableId - Droppable ID that may include 'list-' prefix
 * @returns {string} Clean list ID
 */
export const extractListId = droppableId => {
  if (!droppableId) return '';
  const id = droppableId.toString();
  return id.startsWith('list-') ? id.replace('list-', '') : id;
};
