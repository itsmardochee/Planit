import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { listAPI } from '../utils/api';
import KanbanList from '../components/KanbanList';
import CardModal from '../components/CardModal';
import KanbanCard from '../components/KanbanCard';
import ListEditModal from '../components/ListEditModal';
import LabelManager from '../components/LabelManager';
import ActivityFeed from '../components/ActivityFeed';
import useBoardData from '../hooks/useBoardData';
import useBoardFilters from '../hooks/useBoardFilters';
import useBoardDrag from '../hooks/useBoardDrag';
import { DndContext, DragOverlay } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';

const BoardPage = () => {
  const { t } = useTranslation(['board', 'common']);
  const { boardId } = useParams();
  const navigate = useNavigate();

  // Data fetching
  const { board, lists, members, loading, setLists, refetch } =
    useBoardData(boardId);

  // Filtering
  const {
    filteredLists,
    overdueCount,
    selectedMemberFilter,
    setSelectedMemberFilter,
    showOverdueFilter,
    setShowOverdueFilter,
  } = useBoardFilters(lists, members);

  // Drag & drop
  const { sensors, collisionDetection, dragHandlers, activeCard } =
    useBoardDrag(lists, setLists, refetch);

  // UI state (modals, forms)
  const [showNewListForm, setShowNewListForm] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [selectedCard, setSelectedCard] = useState(null);
  const [showCardModal, setShowCardModal] = useState(false);
  const [editingList, setEditingList] = useState(null);
  const [showLabelManager, setShowLabelManager] = useState(false);
  const [showActivityDrawer, setShowActivityDrawer] = useState(false);

  // Get permissions
  const { can } = usePermissions(board?.workspaceId);

  // Simple UI handlers
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
      alert(err.response?.data?.message || t('board:errors.creatingList'));
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
    await refetch();
  };

  const handleEditList = list => {
    setEditingList(list);
  };

  const handleSaveList = async updatedData => {
    const response = await listAPI.update(editingList._id, updatedData);
    if (response.data.success) {
      await refetch();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-blue-500 dark:bg-blue-900 flex items-center justify-center transition-colors">
        <p className="text-white">{t('board:loading')}</p>
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      {...dragHandlers}
    >
      <div className="min-h-screen bg-gradient-to-b from-blue-500 to-blue-600 dark:from-blue-900 dark:to-blue-950 transition-colors">
        {/* Header */}
        <header className="bg-blue-800 dark:bg-blue-950 shadow">
          <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <button
              onClick={() => navigate(-1)}
              className="text-white hover:bg-blue-700 dark:hover:bg-blue-900 px-3 py-1.5 rounded-lg text-sm font-medium transition-all mb-2 inline-flex items-center gap-2"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              {t('board:back')}
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">{board?.name}</h1>
                {board?.description && (
                  <p className="text-blue-100 dark:text-blue-200 mt-1">
                    {board.description}
                  </p>
                )}
              </div>

              {/* Filters and Actions */}
              <div className="flex items-center gap-3">
                {/* Overdue Filter Button */}
                <button
                  onClick={() => setShowOverdueFilter(!showOverdueFilter)}
                  className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2 ${
                    showOverdueFilter
                      ? 'bg-red-600 hover:bg-red-700 text-white'
                      : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                  aria-label={`Overdue ${overdueCount}`}
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {t('board:overdue', 'Overdue')} ({overdueCount})
                </button>

                {/* Member Filter */}
                {members.length > 0 && (
                  <div className="flex items-center gap-2">
                    <label className="text-white text-sm font-medium">
                      {t('board:filterByMember', 'Filter by:')}
                    </label>
                    <select
                      value={selectedMemberFilter || ''}
                      onChange={e =>
                        setSelectedMemberFilter(e.target.value || null)
                      }
                      className="bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-lg px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm"
                    >
                      <option value="">
                        {t('board:allMembers', 'All members')}
                      </option>
                      <option value="unassigned">
                        {t('board:unassigned', 'Unassigned')}
                      </option>
                      {members.map(member => (
                        <option
                          key={member.userId._id}
                          value={member.userId._id}
                        >
                          {member.userId.username}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Manage Labels Button */}
                <button
                  onClick={() => setShowLabelManager(true)}
                  className="bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                  {t('board:manageLabels', 'Manage Labels')}
                </button>

                {/* Activity Button */}
                <button
                  onClick={() => setShowActivityDrawer(!showActivityDrawer)}
                  className="bg-white hover:bg-gray-100 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-800 dark:text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center gap-2"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {t('board:activity', 'Activity')}
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Activity Drawer */}
        {showActivityDrawer && (
          <div className="fixed top-0 right-0 h-full w-96 bg-white dark:bg-gray-800 shadow-2xl z-50 flex flex-col border-l border-gray-200 dark:border-gray-700">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {t('board:activity', 'Activity')}
              </h2>
              <button
                onClick={() => setShowActivityDrawer(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-all"
                aria-label="Close drawer"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Activity Feed */}
            <div className="flex-1 overflow-y-auto">
              <ActivityFeed scope="board" scopeId={boardId} limit={50} />
            </div>
          </div>
        )}

        {/* Overlay to close drawer */}
        {showActivityDrawer && (
          <div
            onClick={() => setShowActivityDrawer(false)}
            className="fixed inset-0 bg-black bg-opacity-30 z-40"
          />
        )}

        {/* Kanban Board */}
        <main className="py-6 px-4">
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-blue-300 scrollbar-track-blue-100 hover:scrollbar-thumb-blue-400">
            <SortableContext
              items={lists.map(l => l._id)}
              strategy={horizontalListSortingStrategy}
            >
              {filteredLists.map(list => (
                <KanbanList
                  key={list._id}
                  list={list}
                  boardId={boardId}
                  workspaceId={board?.workspaceId}
                  onCardClick={card => handleOpenCardModal(card, list)}
                  onListUpdate={refetch}
                  onEditList={handleEditList}
                />
              ))}
            </SortableContext>

            <div className="flex-shrink-0 w-80">
              {showNewListForm ? (
                <div className="bg-white/10 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-white/20 dark:border-gray-700">
                  <h3 className="text-white font-semibold mb-3">
                    {t('board:addNewList')}
                  </h3>
                  <form onSubmit={handleCreateList} className="space-y-3">
                    <input
                      type="text"
                      value={newListName}
                      onChange={e => setNewListName(e.target.value)}
                      placeholder={t('board:listTitlePlaceholder')}
                      className="w-full px-4 py-2.5 bg-white dark:bg-gray-900 text-gray-800 dark:text-white border border-gray-300 dark:border-gray-600 rounded-lg placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-400 focus:border-blue-400 outline-none transition-all"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        className="flex-1 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-all shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                          />
                        </svg>
                        {t('board:add')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowNewListForm(false)}
                        className="px-4 py-2.5 bg-gray-600 dark:bg-gray-700 hover:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg text-sm font-medium transition-all shadow-sm"
                      >
                        {t('board:cancel')}
                      </button>
                    </div>
                  </form>
                </div>
              ) : can && can('list:create') ? (
                <button
                  onClick={() => setShowNewListForm(true)}
                  className="w-80 bg-white/10 dark:bg-gray-800/50 hover:bg-white/20 dark:hover:bg-gray-700/50 backdrop-blur-sm text-white rounded-lg p-4 font-semibold transition-all border border-white/20 dark:border-gray-700 shadow-sm hover:shadow-md flex items-center justify-center gap-2"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                    />
                  </svg>
                  {t('board:addAnotherList')}
                </button>
              ) : (
                <Tooltip
                  title={t(
                    'board:noPermission',
                    'You do not have permission to create lists'
                  )}
                >
                  <span>
                    <button
                      disabled
                      className="w-80 bg-gray-500 dark:bg-gray-700 text-gray-300 dark:text-gray-500 rounded-lg p-4 font-semibold cursor-not-allowed flex items-center gap-2"
                    >
                      + {t('board:addAnotherList')}
                    </button>
                  </span>
                </Tooltip>
              )}
            </div>
          </div>
        </main>

        {/* List Edit Modal */}
        <ListEditModal
          list={editingList}
          onClose={() => setEditingList(null)}
          onSave={handleSaveList}
        />

        {/* Label Manager */}
        <LabelManager
          boardId={boardId}
          open={showLabelManager}
          onClose={() => {
            setShowLabelManager(false);
            // Optionally refresh board data to update labels on cards
            refetch();
          }}
        />

        {/* Card Modal */}
        {showCardModal && selectedCard && (
          <CardModal
            card={selectedCard}
            boardId={boardId}
            workspaceId={board?.workspaceId}
            members={members}
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
