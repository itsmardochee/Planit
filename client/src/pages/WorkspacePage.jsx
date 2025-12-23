import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { setBoards } from '../store/index';
import { workspaceAPI, boardAPI } from '../utils/api';

const WorkspacePage = () => {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [workspace, setWorkspace] = useState(null);
  const [boards, setLocalBoards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showNewBoardForm, setShowNewBoardForm] = useState(false);
  const [newBoardName, setNewBoardName] = useState('');

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
      alert(err.response?.data?.message || 'Error creating board');
    }
  };

  const handleBoardClick = boardId => {
    navigate(`/board/${boardId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-trello-blue hover:underline text-sm mb-2"
          >
            ← Back to workspaces
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            {workspace?.name}
          </h1>
          {workspace?.description && (
            <p className="text-gray-600 mt-1">{workspace.description}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* New Board Form */}
        {showNewBoardForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">Create a new board</h2>
            <form onSubmit={handleCreateBoard} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Board name
                </label>
                <input
                  type="text"
                  value={newBoardName}
                  onChange={e => setNewBoardName(e.target.value)}
                  placeholder="My new board"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-trello-blue focus:border-transparent outline-none"
                  autoFocus
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-trello-blue hover:bg-trello-blue-dark text-white rounded-lg transition"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowNewBoardForm(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Boards Grid */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">Boards</h2>
            {!showNewBoardForm && (
              <button
                onClick={() => setShowNewBoardForm(true)}
                className="px-4 py-2 bg-trello-green hover:bg-green-600 text-white rounded-lg transition"
              >
                + New Board
              </button>
            )}
          </div>

          {boards.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No boards yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {boards.map(board => (
                <div
                  key={board._id}
                  onClick={() => handleBoardClick(board._id)}
                  className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg shadow hover:shadow-lg cursor-pointer transition transform hover:scale-105 p-6 text-white"
                >
                  <h3 className="text-lg font-semibold mb-2">{board.name}</h3>
                  <p className="text-sm opacity-90">
                    {board.description || 'No description'}
                  </p>
                  <div className="mt-4 pt-4 border-t border-white border-opacity-30 text-xs opacity-75">
                    Created on {new Date(board.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default WorkspacePage;
