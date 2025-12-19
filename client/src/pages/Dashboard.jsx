import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout, setWorkspaces } from '../store/index';
import { useAuth } from '../hooks/useAuth';
import { workspaceAPI } from '../utils/api';

const Dashboard = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const workspaces = useSelector(state => state.workspaces.list);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewWorkspaceForm, setShowNewWorkspaceForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const fetchWorkspaces = async () => {
      try {
        setLoading(true);

        const response = await workspaceAPI.getAll();
        dispatch(setWorkspaces(response.data.data));
        setError('');
      } catch (err) {
        setError('Error loading workspaces');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [isAuthenticated, navigate, dispatch]);

  const handleCreateWorkspace = async e => {
    e.preventDefault();
    if (!newWorkspaceName.trim()) return;

    try {
      const response = await workspaceAPI.create({
        name: newWorkspaceName,
        description: 'New workspace',
      });
      dispatch(setWorkspaces([...(workspaces || []), response.data.data]));
      setNewWorkspaceName('');
      setShowNewWorkspaceForm(false);
    } catch (err) {
      setError('Error creating workspace');
      console.error(err);
    }
  };

  const handleWorkspaceClick = workspaceId => {
    navigate(`/workspace/${workspaceId}`);
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-trello-blue">Planit</h1>
            <p className="text-sm text-gray-600">Welcome, {user?.username}</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            {error}
          </div>
        )}

        {/* New Workspace Form */}
        {showNewWorkspaceForm && (
          <div className="mb-8 bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4">
              Create a new workspace
            </h2>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Workspace name
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  placeholder="My new workspace"
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
                  onClick={() => setShowNewWorkspaceForm(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">My Workspaces</h2>
            {!showNewWorkspaceForm && (
              <button
                onClick={() => setShowNewWorkspaceForm(true)}
                className="px-4 py-2 bg-trello-green hover:bg-green-600 text-white rounded-lg transition"
              >
                + New Workspace
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600">Loading...</p>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600">No workspaces yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map(workspace => (
                <div
                  key={workspace._id}
                  onClick={() => handleWorkspaceClick(workspace._id)}
                  className="bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition transform hover:scale-105 p-6"
                >
                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {workspace.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {workspace.description || 'No description'}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                    Created on{' '}
                    {new Date(workspace.createdAt).toLocaleDateString()}
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

export default Dashboard;
