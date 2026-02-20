import { useState, useMemo } from 'react';
import { applyFilters, getOverdueCount } from '../utils/boardHelpers';

/**
 * Custom hook for managing board filtering logic
 * @param {Array} lists - Array of list objects with cards
 * @param {Array} members - Array of workspace members
 * @returns {Object} Filtering state and handlers
 */
const useBoardFilters = (lists, members) => {
  const [selectedMemberFilter, setSelectedMemberFilter] = useState(null);
  const [showOverdueFilter, setShowOverdueFilter] = useState(false);

  // Apply filters using helper function
  const filteredLists = useMemo(
    () =>
      applyFilters(lists, {
        memberFilter: selectedMemberFilter,
        overdueFilter: showOverdueFilter,
      }),
    [lists, selectedMemberFilter, showOverdueFilter]
  );

  // Calculate overdue count using helper function
  const overdueCount = useMemo(() => getOverdueCount(lists), [lists]);

  // Clear all filters
  const clearFilters = () => {
    setSelectedMemberFilter(null);
    setShowOverdueFilter(false);
  };

  return {
    // State
    selectedMemberFilter,
    showOverdueFilter,
    filteredLists,
    overdueCount,
    // Actions
    setSelectedMemberFilter,
    setShowOverdueFilter,
    clearFilters,
  };
};

export default useBoardFilters;
