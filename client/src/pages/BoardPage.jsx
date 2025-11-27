import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { boardAPI, listAPI, cardAPI } from '../utils/api';
import KanbanList from '../components/KanbanList';
import CardModal from '../components/CardModal';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
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

  useEffect(() => {
    const fetchBoardData = async () => {
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
        console.error('Erreur lors du chargement du tableau', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBoardData();
  }, [boardId]);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleDragEnd = async event => {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    // find source and destination lists
    const sourceListIndex = lists.findIndex(l =>
      l.cards.some(c => c._id === active.id)
    );
    const destListIndex = lists.findIndex(l =>
      l.cards.some(c => c._id === over.id)
    );
    if (sourceListIndex === -1 || destListIndex === -1) return;

    const sourceList = lists[sourceListIndex];
    const destList = lists[destListIndex];

    // reorder within same list
    if (sourceList._id === destList._id) {
      const oldIndex = sourceList.cards.findIndex(c => c._id === active.id);
      const newIndex = sourceList.cards.findIndex(c => c._id === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newCards = arrayMove(sourceList.cards, oldIndex, newIndex);
      const newLists = lists.map((l, idx) =>
        idx === sourceListIndex ? { ...l, cards: newCards } : l
      );
      setLists(newLists);

      await cardAPI.reorder(active.id, {
        listId: sourceList._id,
        position: newIndex,
      });
      return;
    }

    // move between lists
    const oldCardIndex = sourceList.cards.findIndex(c => c._id === active.id);
    const newCardIndex = destList.cards.findIndex(c => c._id === over.id);
    const movedCard = sourceList.cards[oldCardIndex];
    if (!movedCard) return;

    // when dropping between items, insert after the target card
    const insertIndex =
      newCardIndex === -1 ? destList.cards.length : newCardIndex + 1;

    const newSourceCards = [
      ...sourceList.cards.slice(0, oldCardIndex),
      ...sourceList.cards.slice(oldCardIndex + 1),
    ];
    const newDestCards = [
      ...destList.cards.slice(0, insertIndex),
      movedCard,
      ...destList.cards.slice(insertIndex),
    ];

    const newLists = lists.map((l, idx) => {
      if (idx === sourceListIndex) return { ...l, cards: newSourceCards };
      if (idx === destListIndex) return { ...l, cards: newDestCards };
      return l;
    });

    setLists(newLists);

    await cardAPI.reorder(active.id, {
      listId: destList._id,
      position: insertIndex,
    });
  };

  const handleCreateList = e => {
    e.preventDefault();
    if (!newListName.trim()) return;

    const localList = {
      _id: `local-list-${Date.now()}`,
      name: newListName,
      position: lists.length,
      cards: [],
    };
    setLists(prev => [...(prev || []), localList]);
    setNewListName('');
    setShowNewListForm(false);
  };

  const handleOpenCardModal = (card, list) => {
    setSelectedCard({ ...card, listId: list._id });
    setShowCardModal(true);
  };

  const handleCloseCardModal = () => {
    setShowCardModal(false);
    setSelectedCard(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-500 flex items-center justify-center">
        <p className="text-white">Chargement...</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600">
        {/* Header */}
        <header className="bg-blue-800 shadow">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:opacity-80 text-sm mb-2 inline-block"
            >
              ← Retour
            </button>
            <h1 className="text-3xl font-bold text-white">{board?.name}</h1>
            {board?.description && (
              <p className="text-blue-100 mt-1">{board.description}</p>
            )}
          </div>
        </header>

        {/* Kanban Board */}
        <main className="py-6 px-4">
          <div className="flex gap-6 overflow-x-auto pb-6">
            {lists.map(list => (
              <SortableContext
                key={list._id}
                items={list.cards.map(c => c._id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanList
                  key={list._id}
                  list={list}
                  boardId={boardId}
                  onCardClick={card => handleOpenCardModal(card, list)}
                  onListUpdate={() => setLists(prev => [...prev])}
                />
              </SortableContext>
            ))}

            <div className="flex-shrink-0 w-80">
              {showNewListForm ? (
                <div className="bg-gray-700 rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">
                    Ajouter une nouvelle liste
                  </h3>
                  <form onSubmit={handleCreateList} className="space-y-2">
                    <input
                      type="text"
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      placeholder="Titre de la liste"
                      className="w-full px-3 py-2 bg-gray-600 text-white rounded-lg placeholder-gray-400 focus:ring-2 focus:ring-trello-blue outline-none"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="px-4 py-2 bg-trello-green hover:bg-green-600 text-white rounded-lg text-sm font-medium transition"
                      >
                        Ajouter
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewListForm(false)}
                        className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded-lg text-sm transition"
                      >
                        Annuler
                      </button>
                    </div>
                  </form>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewListForm(true)}
                  className="w-80 bg-gray-700 hover:bg-gray-600 text-white rounded-lg p-4 font-semibold transition flex items-center gap-2"
                >
                  + Ajouter une autre liste
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
            onCardUpdate={() => setLists(prev => [...prev])}
          />
        )}
      </div>
    </DndContext>
  );
};

export default BoardPage;
