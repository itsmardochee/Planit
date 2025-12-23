import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardAPI, listAPI, cardAPI } from '../utils/api';
import KanbanList from '../components/KanbanList';
import CardModal from '../components/CardModal';
import KanbanCard from '../components/KanbanCard';
import {
  DndContext,
  PointerSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCorners,
  DragOverlay,
  pointerWithin,
  rectIntersection,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

const BoardPage = () => {
  const { boardId } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [activeCard, setActiveCard] = useState(null);
  const [overId, setOverId] = useState(null);
  const [activeSourceListId, setActiveSourceListId] = useState(null);

  const fetchBoardData = useCallback(async () => {
    try {
      setLoading(true);

      const boardResponse = await boardAPI.getById(boardId);
      setBoard(boardResponse.data.data);
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
  const customCollisionDetection = args => {
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
  };

  const handleDragStart = event => {
    const { active } = event;
    const activeList = lists.find(l => l.cards.some(c => c._id === active.id));
    const card = activeList?.cards.find(c => c._id === active.id);
    setActiveCard(card);
    setActiveSourceListId(activeList?._id || null);
    setOverId(null);
  };

  const handleDragOver = event => {
    const { over } = event;
    setOverId(over?.id || null);
  };

  const handleDragCancel = () => {
    setActiveCard(null);
    setOverId(null);
    setActiveSourceListId(null);
  };

  const handleDragEnd = async event => {
    const { active, over } = event;

    const sourceListId = activeSourceListId;
    setActiveCard(null);
    setOverId(null);
    setActiveSourceListId(null);

    if (!over || active.id === over.id) {
      return;
    }

    // Find source list
    const sourceListIndex = lists.findIndex(l => l._id === sourceListId);
    if (sourceListIndex === -1) {
      await fetchBoardData();
      return;
    }

    const sourceList = lists[sourceListIndex];
    const movedCard = sourceList.cards.find(c => c._id === active.id);
    if (!movedCard) {
      await fetchBoardData();
      return;
    }

    // Determine destination list
    let destListIndex = -1;
    let destList = null;

    // Check if dropping on a list container
    if (over.data?.current?.type === 'list') {
      const listId = over.data.current.listId;
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
      await fetchBoardData();
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
          await fetchBoardData();
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
        await fetchBoardData();
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
      await fetchBoardData();
    }
  };

  const handleCreateList = async e => {
    e.preventDefault();
    if (!newListName.trim()) return;

    try {
      const response = await listAPI.create(boardId, {
        name: newListName,
        position: lists.length,
      });
      if (response.data.success) {
        const newList = { ...response.data.data, cards: [] };
        setLists(prev => [...(prev || []), newList]);
        setNewListName('');
        setShowNewListForm(false);
      }
    } catch (err) {
      console.error('Error creating list', err);
      alert(err.response?.data?.message || 'Error creating list');
    }
  };

  const handleOpenCardModal = (card, list) => {
    setSelectedCard({ ...card, listId: list._id });
    setShowCardModal(true);
  };

  const handleCloseCardModal = () => {
    setShowCardModal(false);
    setSelectedCard(null);
  };

  const handleCardUpdate = async () => {
    await fetchBoardData();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-500 flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600">
        {/* Header */}
        <header className="bg-blue-800 shadow">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:opacity-80 text-sm mb-2 inline-block"
            >
              ← Back
            </button>
            <h1 className="text-3xl font-bold text-white">{board?.name}</h1>
            {board?.description && (
              <p className="text-blue-100 mt-1">{board.description}</p>
            )}
          </div>
        </header>

        {/* Kanban Board */}
        <main className="py-6 px-4">
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 hover:scrollbar-thumb-blue-400">
            {lists.map(list => (
              <KanbanList
                key={list._id}
                list={list}
                boardId={boardId}
                onCardClick={card => handleOpenCardModal(card, list)}
                onListUpdate={fetchBoardData}
                activeCardId={activeCard?._id}
                overId={overId}
              />
            ))}

            <div className="flex-shrink-0 w-80">
              {showNewListForm ? (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Add a new list
                  </h3>
                  <form onSubmit={handleCreateList} className="space-y-2">
                    <input
                      type="text"
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      placeholder="List title"
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-trello-blue outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-trello-green hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"
                      >
                        Add
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewListForm(false)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewListForm(true)}
                  className="w-80 bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-4 font-semibold transition flex items-center gap-2"
                >
                  + Add another list
                </button>
              )}
            </div>
          </div>
        </main>

        {/* Card Modal */}
        {showCardModal && selectedCard && (
          <CardModal
            card={selectedCard}
            boardId={boardId}
            onClose={handleCloseCardModal}
            onCardUpdate={handleCardUpdate}
          />
        )}
      </div>

      <DragOverlay dropAnimation={null}>
        {activeCard ? (
          <div className="opacity-95 rotate-2 cursor-grabbing scale-105 shadow-2xl">
            <KanbanCard
              card={activeCard}
              onClick={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default BoardPage;
