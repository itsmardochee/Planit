import { useState, useCallback } from 'react';
import {
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { listAPI, cardAPI } from '../utils/api';
import { findListByCardId } from '../utils/boardHelpers';

/**
 * Custom hook for managing drag and drop logic
 * @param {Array} lists - Current lists with cards
 * @param {Function} setLists - Function to update lists (optimistic updates)
 * @param {Function} refetch - Function to refetch board data on error
 * @returns {Object} Drag handlers, sensors, and active card state
 */
const useBoardDrag = (lists, setLists, refetch) => {
  const [activeCard, setActiveCard] = useState(null);
  const [activeSourceListId, setActiveSourceListId] = useState(null);

  // Configure sensors for drag & drop
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 5,
      },
    }),
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  // Custom collision detection for better cross-list dragging
  const customCollisionDetection = useCallback(args => {
    // First, try pointer-based collision detection
    const pointerCollisions = pointerWithin(args);

    if (pointerCollisions.length > 0) {
      // Separate list and card collisions
      const listCollisions = pointerCollisions.filter(collision =>
        collision.id.toString().startsWith('list-')
      );
      const cardCollisions = pointerCollisions.filter(
        collision => !collision.id.toString().startsWith('list-')
      );

      // If we have card collisions, prioritize those
      if (cardCollisions.length > 0) {
        return cardCollisions;
      }

      // If only list collisions, return them (entering list area)
      if (listCollisions.length > 0) {
        return listCollisions;
      }

      return pointerCollisions;
    }

    // Fallback to rect intersection
    const rectCollisions = rectIntersection(args);
    return rectCollisions;
  }, []);

  const handleDragStart = useCallback(
    event => {
      const { active } = event;

      // Check if dragging a list
      if (active.data?.current?.type === 'list') {
        setActiveCard(null);
        setActiveSourceListId(null);
        return;
      }

      // Dragging a card
      const activeList = findListByCardId(lists, active.id);
      const card = activeList?.cards.find(c => c._id === active.id);
      setActiveCard(card);
      setActiveSourceListId(activeList?._id || null);
    },
    [lists]
  );

  const handleDragOver = useCallback(event => {
    const { over } = event;
    if (!over) return;
  }, []);

  const handleDragCancel = useCallback(() => {
    setActiveCard(null);
    setActiveSourceListId(null);
  }, []);

  const handleDragEnd = useCallback(
    async event => {
      const { active, over } = event;

      setActiveCard(null);
      const sourceListId = activeSourceListId;
      setActiveSourceListId(null);

      if (!over || active.id === over.id) {
        return;
      }

      // Handle list reordering
      if (
        active.data?.current?.type === 'list' &&
        over.data?.current?.type === 'list'
      ) {
        const oldIndex = lists.findIndex(l => l._id === active.id);
        const newIndex = lists.findIndex(l => l._id === over.id);

        if (oldIndex !== -1 && newIndex !== -1 && oldIndex !== newIndex) {
          const newLists = arrayMove(lists, oldIndex, newIndex);
          setLists(newLists);

          try {
            await listAPI.reorder(active.id, { position: newIndex });
          } catch (err) {
            console.error('Error reordering list', err);
            await refetch();
          }
        }
        return;
      }

      // Find source list
      const sourceListIndex = lists.findIndex(l => l._id === sourceListId);
      if (sourceListIndex === -1) {
        await refetch();
        return;
      }

      const sourceList = lists[sourceListIndex];
      const movedCard = sourceList.cards.find(c => c._id === active.id);
      if (!movedCard) {
        await refetch();
        return;
      }

      // Determine destination list
      let destListIndex = -1;
      let destList = null;

      // Check if dropping on a list container
      if (over.data?.current?.type === 'list') {
        // Can be either listId (from droppable) or list object (from sortable)
        const listId =
          over.data.current.listId || over.data.current.list?._id || over.id;
        destListIndex = lists.findIndex(l => l._id === listId);
        destList = lists[destListIndex];
      } else if (over.id.toString().startsWith('list-')) {
        // Handle case where over.id is the droppable ID (list-xxx)
        const listId = over.id.toString().replace('list-', '');
        destListIndex = lists.findIndex(l => l._id === listId);
        destList = lists[destListIndex];
      } else {
        // Dropping on a card
        destListIndex = lists.findIndex(l =>
          l.cards.some(c => c._id === over.id)
        );
        destList = lists[destListIndex];
      }

      if (destListIndex === -1 || !destList) {
        await refetch();
        return;
      }

      // Reorder within same list
      if (sourceList._id === destList._id) {
        const oldIndex = sourceList.cards.findIndex(c => c._id === active.id);
        const newIndex = sourceList.cards.findIndex(c => c._id === over.id);

        // If dropping on list container (not a card), place at end
        if (newIndex === -1) {
          const reorderedCards = sourceList.cards.filter(
            c => c._id !== active.id
          );
          reorderedCards.push(movedCard);
          const newLists = lists.map((l, idx) =>
            idx === sourceListIndex ? { ...l, cards: reorderedCards } : l
          );
          setLists(newLists);

          try {
            await cardAPI.reorder(active.id, {
              position: reorderedCards.length - 1,
            });
          } catch (err) {
            console.error('Error during reordering', err);
            await refetch();
          }
          return;
        }

        const newCards = arrayMove(sourceList.cards, oldIndex, newIndex);
        const newLists = lists.map((l, idx) =>
          idx === sourceListIndex ? { ...l, cards: newCards } : l
        );
        setLists(newLists);

        try {
          await cardAPI.reorder(active.id, {
            position: newIndex,
          });
        } catch (err) {
          console.error('Error during reordering', err);
          await refetch();
        }
        return;
      }

      // Move between lists
      const newCardIndex = destList.cards.findIndex(c => c._id === over.id);

      // Determine insert position
      let insertIndex;
      if (newCardIndex === -1) {
        // Dropping on empty list or list container - place at end
        insertIndex = destList.cards.length;
      } else {
        // Dropping on a card - insert at its position (before it)
        insertIndex = newCardIndex;
      }

      const newSourceCards = sourceList.cards.filter(c => c._id !== active.id);
      const newDestCards = [...destList.cards];
      newDestCards.splice(insertIndex, 0, movedCard);

      const newLists = lists.map((l, idx) => {
        if (idx === sourceListIndex) return { ...l, cards: newSourceCards };
        if (idx === destListIndex) return { ...l, cards: newDestCards };
        return l;
      });

      setLists(newLists);

      try {
        await cardAPI.reorder(active.id, {
          listId: destList._id,
          position: insertIndex,
        });
      } catch (err) {
        console.error('Error moving card', err);
        await refetch();
      }
    },
    [lists, activeSourceListId, setLists, refetch]
  );

  return {
    sensors,
    collisionDetection: customCollisionDetection,
    dragHandlers: {
      onDragStart: handleDragStart,
      onDragOver: handleDragOver,
      onDragEnd: handleDragEnd,
      onDragCancel: handleDragCancel,
    },
    activeCard,
  };
};

export default useBoardDrag;
