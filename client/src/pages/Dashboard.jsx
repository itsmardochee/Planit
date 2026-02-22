import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { logout, setWorkspaces } from '../store/index';
import { useAuth } from '../hooks/useAuth';
import { workspaceAPI } from '../utils/api';
import WorkspaceEditModal from '../components/WorkspaceEditModal';
import ConfirmModal from '../components/ConfirmModal';
import DarkModeToggle from '../components/DarkModeToggle';
import LanguageSelector from '../components/LanguageSelector';

const Dashboard = () => {
  const { t } = useTranslation(['dashboard', 'common']);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const workspaces = useSelector(state => state.workspaces.list);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showNewWorkspaceForm, setShowNewWorkspaceForm] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [editingWorkspace, setEditingWorkspace] = useState(null);
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState(null);

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
        setError(t('dashboard:errors.loadingWorkspaces'));
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaces();
  }, [isAuthenticated, navigate, dispatch, t]);

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
      setError(t('dashboard:errors.creatingWorkspace'));
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

  const handleEditWorkspace = (e, workspace) => {
    e.stopPropagation();
    setEditingWorkspace(workspace);
  };

  const handleSaveWorkspace = async updates => {
    const response = await workspaceAPI.update(editingWorkspace._id, updates);
    const updatedWorkspaces = workspaces.map(w =>
      w._id === editingWorkspace._id ? response.data.data : w
    );
    dispatch(setWorkspaces(updatedWorkspaces));
    setError('');
  };

  const handleDeleteWorkspace = (e, workspaceId, workspaceName) => {
    e.stopPropagation();
    setConfirmDeleteTarget({ id: workspaceId, name: workspaceName });
  };

  const handleConfirmDeleteWorkspace = async () => {
    try {
      await workspaceAPI.delete(confirmDeleteTarget.id);
      const updatedWorkspaces = workspaces.filter(
        w => w._id !== confirmDeleteTarget.id
      );
      dispatch(setWorkspaces(updatedWorkspaces));
      setError('');
    } catch (err) {
      setError(t('dashboard:errors.deletingWorkspace'));
      console.error(err);
    } finally {
      setConfirmDeleteTarget(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-trello-blue dark:text-blue-400">
              {t('dashboard:title')}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t('dashboard:welcome', { username: user?.username })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSelector />
            <DarkModeToggle />
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
            >
              {t('common:buttons.logout')}
            </button>
          </div>
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
          <div className="mb-8 bg-white dark:bg-gray-800 p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold mb-4 dark:text-white">
              {t('dashboard:createWorkspace')}
            </h2>
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('dashboard:workspaceName')}
                </label>
                <input
                  type="text"
                  value={newWorkspaceName}
                  onChange={e => setNewWorkspaceName(e.target.value)}
                  placeholder={t('dashboard:workspaceNamePlaceholder')}
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
                  onClick={() => setShowNewWorkspaceForm(false)}
                  className="px-4 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-800 dark:text-white rounded-lg transition"
                >
                  {t('common:buttons.cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Workspaces Grid */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">
              {t('dashboard:myWorkspaces')}
            </h2>
            {!showNewWorkspaceForm && (
              <button
                onClick={() => setShowNewWorkspaceForm(true)}
                className="px-4 py-2 bg-trello-green hover:bg-green-600 text-white rounded-lg transition"
              >
                + {t('dashboard:newWorkspace')}
              </button>
            )}
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p className="text-gray-600 dark:text-gray-400">
                {t('common:messages.loading')}
              </p>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg">
              <p className="text-gray-600 dark:text-gray-400">
                {t('dashboard:noWorkspaces')}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {workspaces.map(workspace => (
                <div
                  key={workspace._id}
                  onClick={() => handleWorkspaceClick(workspace._id)}
                  className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg cursor-pointer transition transform hover:scale-105 p-6 relative"
                >
                  <div className="absolute top-4 right-4 flex gap-1">
                    {(workspace.userRole === 'owner' ||
                      workspace.userRole === 'admin') && (
                      <button
                        onClick={e => handleEditWorkspace(e, workspace)}
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-gray-700 rounded-lg transition"
                        title="Edit workspace"
                      >
                        ✏️
                      </button>
                    )}
                    {workspace.userRole === 'owner' && (
                      <button
                        onClick={e =>
                          handleDeleteWorkspace(
                            e,
                            workspace._id,
                            workspace.name
                          )
                        }
                        className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-gray-700 rounded-lg transition"
                        title="Delete workspace"
                      >
                        🗑️
                      </button>
                    )}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2 pr-8">
                    {workspace.name}
                  </h3>
                  {/* Shared workspace indicator */}
                  {workspace.userId !== user?._id && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 mb-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 text-xs rounded-full">
                      👥 {t('dashboard:sharedWorkspace', 'Shared')}
                    </span>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {workspace.description ||
                      t('common:messages.noDescription')}
                  </p>
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                    {t('common:labels.createdAt')}{' '}
                    {new Date(workspace.createdAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Edit Workspace Modal */}
      <WorkspaceEditModal
        workspace={editingWorkspace}
        onClose={() => setEditingWorkspace(null)}
        onSave={handleSaveWorkspace}
      />

      {/* Delete Workspace Confirm Modal */}
      <ConfirmModal
        open={!!confirmDeleteTarget}
        title={t('common:messages.confirmDeleteTitle', {
          defaultValue: 'Delete Workspace',
        })}
        message={t('common:messages.confirmDeleteWorkspace', {
          name: confirmDeleteTarget?.name,
          defaultValue: `Delete workspace "${confirmDeleteTarget?.name}"?`,
        })}
        onConfirm={handleConfirmDeleteWorkspace}
        onCancel={() => setConfirmDeleteTarget(null)}
      />
    </div>
  );
};

export default Dashboard;
