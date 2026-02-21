import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { setBoards } from '../store/index';
import usePermissions from '../hooks/usePermissions';
import { Tooltip } from '@mui/material';
import { workspaceAPI, boardAPI, memberAPI } from '../utils/api';
import BoardEditModal from '../components/BoardEditModal';
import MemberList from '../components/MemberList';
import InviteMembers from '../components/InviteMembers';
import ConfirmModal from '../components/ConfirmModal';

const WorkspacePage = () => {
  const { t } = useTranslation(['workspace', 'common']);
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const currentUser = useSelector(state => state.auth.user);
  const [workspace, setWorkspace] = useState(null);
  const [boards, setLocalBoards] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');
  const [editingBoard, setEditingBoard] = useState(null);
  const [confirmDeleteBoard, setConfirmDeleteBoard] = useState(null);
  const [pageError, setPageError] = useState('');

  // Get permissions for current user
  const { can, role } = usePermissions(workspaceId);

  useEffect(() => {
    const fetchWorkspaceAndBoards = async () => {
      try {
        setLoading(true);

        const wsResponse = await workspaceAPI.getById(workspaceId);
        setWorkspace(wsResponse.data.data);
        const boardsResponse = await boardAPI.getByWorkspace(workspaceId);
        const boardsData = boardsResponse.data.data;
        setLocalBoards(boardsData);
        dispatch(setBoards(boardsData));

        // Fetch members
        const membersResponse = await memberAPI.getByWorkspace(workspaceId);
        setMembers(membersResponse.data.data || []);
      } catch (err) {
        console.error('Error loading workspace', err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceAndBoards();
  }, [workspaceId, dispatch]);

  const handleCreateBoard = async e => {
    e.preventDefault();
    if (!newBoardName.trim()) return;

    try {
      // Create board via backend API
      const response = await boardAPI.create(workspaceId, {
        name: newBoardName,
        description: 'New board',
      });

      if (response.data.success) {
        const newBoard = response.data.data;
        setLocalBoards([...(boards || []), newBoard]);
        dispatch(setBoards([...(boards || []), newBoard]));
        setNewBoardName('');
        setShowNewBoardForm(false);
      }
    } catch (err) {
      console.error('Error creating board', err);
      setPageError(
        err.response?.data?.message || t('workspace:errors.creatingBoard')
      );
    }
  };

  const handleBoardClick = boardId => {
    navigate(`/board/${boardId}`);
  };

  const handleEditBoard = (e, board) => {
    e.stopPropagation();
    setEditingBoard(board);
  };

  const handleSaveBoard = async updatedData => {
    const response = await boardAPI.update(editingBoard._id, updatedData);
    if (response.data.success) {
      const updatedBoard = response.data.data;
      setLocalBoards(prevBoards =>
        prevBoards.map(b => (b._id === updatedBoard._id ? updatedBoard : b))
      );
      dispatch(
        setBoards(
          boards.map(b => (b._id === updatedBoard._id ? updatedBoard : b))
        )
      );
    }
  };

  const handleDeleteBoard = (e, boardId, boardName) => {
    e.stopPropagation();
    setConfirmDeleteBoard({ id: boardId, name: boardName });
  };

  const handleConfirmDeleteBoard = async () => {
    try {
      await boardAPI.delete(confirmDeleteBoard.id);
      const updatedBoards = boards.filter(b => b._id !== confirmDeleteBoard.id);
      setLocalBoards(updatedBoards);
      dispatch(setBoards(updatedBoards));
      setPageError('');
    } catch (err) {
      console.error('Error deleting board', err);
      setPageError(
        err.response?.data?.message || t('workspace:errors.deletingBoard')
      );
    } finally {
      setConfirmDeleteBoard(null);
    }
  };

  const handleMemberRemoved = async () => {
    // Refresh members list after removing a member
    try {
      const membersResponse = await memberAPI.getByWorkspace(workspaceId);
      setMembers(membersResponse.data.data || []);
    } catch (err) {
      console.error('Error refreshing members', err);
    }
  };

  const handleMemberInvited = async () => {
    // Refresh members list after inviting a member
    try {
      const membersResponse = await memberAPI.getByWorkspace(workspaceId);
      setMembers(membersResponse.data.data || []);
      setShowInviteModal(false);
    } catch (err) {
      console.error('Error refreshing members', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">{t('common:messages.loading')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-trello-blue dark:text-blue-400 hover:underline text-sm mb-2"
          >
            ← {t('workspace:backToWorkspaces')}
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
                {workspace?.name}
              </h1>
              {workspace?.description && (
                <p className="text-gray-600 dark:text-gray-300 mt-1">
                  {workspace.description}
                </p>
              )}
            </div>
            <button
              onClick={() => navigate(`/workspace/${workspaceId}/settings`)}
              className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-800 dark:text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              <span>⚙️</span>
              {t('workspace:permissionsLabel', 'Permissions')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Members Section */}
        <div className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
            <div className="flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 text-trello-blue dark:text-blue-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <h2 className="text-lg font-semibold text-gray-800 dark:text-white">
                {t('workspace:members', 'Members')}
              </h2>
              {members.length > 0 && (
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                  {members.length}
                </span>
              )}
            </div>
            {can && can('member:invite') && (
              <button
                onClick={() => setShowInviteModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-trello-blue hover:bg-blue-600 text-white text-sm font-medium rounded-lg shadow-sm hover:shadow transition-all duration-150"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                  />
                </svg>
                {t('workspace:inviteMembers', 'Invite Members')}
              </button>
            )}
          </div>
          <div className="p-6">
            <MemberList
              members={members}
              workspaceId={workspaceId}
              currentUserId={currentUser?._id}
              onMemberRemoved={handleMemberRemoved}
              onRoleUpdated={handleMemberRemoved}
            />
          </div>
        </div>

        {/* New Board Form */}
        {showNewBoardForm && (
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              {t('workspace:createBoard')}
            </h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('workspace:boardName')}
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  placeholder={t('workspace:boardNamePlaceholder')}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-trello-blue focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-trello-blue hover:bg-trello-blue-dark text-white rounded-lg transition"
                >
                  {t('common:buttons.create')}
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewBoardForm(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition"
                >
                  {t('common:buttons.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Boards Grid */}
        <div>
          {/* Page-level error (create / delete board) */}
          {pageError && (
            <div className="mb-4 flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg text-sm text-red-700 dark:text-red-300">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              {pageError}
            </div>
          )}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('workspace:boardsTitle')}
            </h2>
            {!showNewBoardForm &&
              (can && can('board:create') ? (
                <button
                  onClick={() => setShowNewBoardForm(true)}
                  className="px-4 py-2 bg-trello-green hover:bg-green-600 text-white rounded-lg transition"
                >
                  + {t('workspace:newBoard')}
                </button>
              ) : (
                <Tooltip
                  title={t(
                    'workspace:noPermissionToCreateBoard',
                    'You do not have permission to create boards'
                  )}
                >
                  <span>
                    <button
                      disabled
                      className="px-4 py-2 bg-gray-400 text-gray-200 rounded-lg cursor-not-allowed"
                    >
                      + {t('workspace:newBoard')}
                    </button>
                  </span>
                </Tooltip>
              ))}
          </div>

          {boards.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                {t('workspace:noBoards')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map(board => (
                <div
                  key={board._id}
                  onClick={() => handleBoardClick(board._id)}
                  className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow hover:shadow-lg cursor-pointer transition transform hover:scale-105 p-6 text-white relative"
                >
                  <div className="absolute top-2 right-2 flex gap-2">
                    {can && can('board:update') && (
                      <button
                        onClick={e => handleEditBoard(e, board)}
                        className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-3 py-1 rounded text-sm transition"
                      >
                        {t('common:buttons.edit')}
                      </button>
                    )}
                    {can && can('board:delete') && (
                      <button
                        onClick={e =>
                          handleDeleteBoard(e, board._id, board.name)
                        }
                        className="bg-red-500 bg-opacity-60 hover:bg-opacity-80 text-white px-3 py-1 rounded text-sm transition"
                      >
                        {t('common:buttons.delete')}
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{board.name}</h3>
                  <p className="text-sm opacity-90">
                    {board.description || t('common:messages.noDescription')}
                  </p>
                  <div className="mt-4 pt-4 border-t border-white border-opacity-30 text-xs opacity-75">
                    {t('common:labels.createdAt')}{' '}
                    {new Date(board.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <BoardEditModal
        board={editingBoard}
        onClose={() => setEditingBoard(null)}
        onSave={handleSaveBoard}
      />

      <InviteMembers
        open={showInviteModal}
        workspaceId={workspaceId}
        onClose={() => setShowInviteModal(false)}
        onMemberInvited={handleMemberInvited}
      />

      {/* Delete Board Confirm Modal */}
      <ConfirmModal
        open={!!confirmDeleteBoard}
        title={t('common:messages.confirmDeleteBoard', {
          name: confirmDeleteBoard?.name,
          defaultValue: `Delete board "${confirmDeleteBoard?.name}"?`,
        })}
        message={t('workspace:confirmDeleteBoardMessage', {
          name: confirmDeleteBoard?.name,
          defaultValue: `Are you sure you want to permanently delete "${confirmDeleteBoard?.name}"? This will also delete all lists and cards inside.`,
        })}
        onConfirm={handleConfirmDeleteBoard}
        onCancel={() => setConfirmDeleteBoard(null)}
      />
    </div>
  );
};

export default WorkspacePage;
