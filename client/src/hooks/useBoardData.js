import { useState, useEffect, useCallback } from 'react';
import { boardAPI, listAPI, cardAPI, memberAPI } from '../utils/api';

/**
 * Custom hook for managing board data fetching
 * @param {string} boardId - Board ID to fetch
 * @returns {Object} Board data, loading state, and refetch function
 */
const useBoardData = boardId => {
  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchBoardData = useCallback(async () => {
    try {
      setLoading(true);

      // Fetch board details
      const boardResponse = await boardAPI.getById(boardId);
      const boardData = boardResponse.data.data;
      setBoard(boardData);

      // Fetch workspace members if workspaceId is available
      if (boardData.workspaceId) {
        try {
          const membersResponse = await memberAPI.getByWorkspace(
            boardData.workspaceId
          );
          setMembers(membersResponse.data.data || []);
        } catch (memberErr) {
          console.error('Error loading members', memberErr);
          setMembers([]);
        }
      }

      // Fetch lists with cards
      const listsResponse = await listAPI.getByBoard(boardId);
      const listsData = listsResponse.data.data || [];
      const listsWithCards = await Promise.all(
        listsData.map(async list => {
          const cardsResponse = await cardAPI.getByList(list._id);
          return { ...list, cards: cardsResponse.data.data || [] };
        })
      );
      setLists(listsWithCards);
    } catch (err) {
      console.error('Error loading board', err);
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  useEffect(() => {
    fetchBoardData();
  }, [fetchBoardData]);

  return {
    board,
    lists,
    members,
    loading,
    setLists, // Exposed for optimistic updates (e.g., drag & drop)
    refetch: fetchBoardData,
  };
};

export default useBoardData;
