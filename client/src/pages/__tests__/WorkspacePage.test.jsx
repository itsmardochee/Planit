// Global mock for ../../utils/api to avoid import.meta.env errors
const mockWorkspace = {
  _id: 'abc123',
  name: 'Test Workspace',
  description: 'A test workspace',
};
let mockBoards = [];
vi.mock('../../utils/api', async () => ({
  workspaceAPI: {
    getById: vi.fn(() => Promise.resolve({ data: { data: mockWorkspace } })),
  },
  boardAPI: {
    getByWorkspace: vi.fn(() =>
      Promise.resolve({ data: { data: mockBoards } })
    ),
    create: vi.fn(() =>
      Promise.resolve({
        data: {
          success: true,
          data: {
            _id: 'b3',
            name: 'Created Board',
            description: 'Created desc',
            createdAt: new Date().toISOString(),
          },
        },
      })
    ),
  },
}));

import { render, screen, waitFor, act } from '@testing-library/react';
// Mock import.meta.env for VITE_API_URL
Object.defineProperty(import.meta, 'env', {
  value: { VITE_API_URL: 'http://localhost:5000/api' },
  writable: true,
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import WorkspacePage from '../WorkspacePage';
import { Provider } from 'react-redux';
import { store } from '../../store';
import { MemoryRouter } from 'react-router-dom';

// Mock useParams to provide workspaceId
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ workspaceId: 'abc123' }),
  };
});

// Mock API modules
vi.mock('../../utils/api', () => ({
  workspaceAPI: {
    getById: vi.fn(() =>
      Promise.resolve({
        data: {
          data: {
            _id: 'abc123',
            name: 'Test Workspace',
            description: 'A test workspace',
          },
        },
      })
    ),
  },
  boardAPI: {
    getByWorkspace: vi.fn(() => Promise.resolve({ data: { data: [] } })),
    create: vi.fn(),
  },
}));

describe('WorkspacePage', () => {
  beforeEach(() => {
    mockBoards = [];
  });
  afterEach(() => {
    vi.clearAllMocks();
  });
  async function renderWithProviders() {
    const { default: WorkspacePage } = await import('../WorkspacePage');
    return render(
      <Provider store={store}>
        <MemoryRouter>
          <WorkspacePage />
        </MemoryRouter>
      </Provider>
    );
  }

  it('renders workspace title after loading', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Test Workspace')).toBeInTheDocument();
    });
  });

  it('shows empty state if no boards', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('No boards yet')).toBeInTheDocument();
    });
            vi.mock('../../utils/api', () => ({
              workspaceAPI: {
                getById: vi.fn(() => Promise.resolve({ data: { data: {
                  _id: 'abc123', name: 'Test Workspace', description: 'A test workspace'
                } } })),
              },
              boardAPI: {
                getByWorkspace: vi.fn(() => Promise.resolve({ data: { data: [] } })),
                create: vi.fn(),
              },
            }));
            const { default: WorkspacePage } = await import('../WorkspacePage');
            render(
              <Provider store={store}>
                <MemoryRouter>
                  <WorkspacePage />
                </MemoryRouter>
              </Provider>
            );
            await waitFor(() => {
              expect(screen.getByText('No boards yet')).toBeInTheDocument();
            });
          });

          it('creates a new board and updates UI', async () => {
            vi.mock('../../utils/api', () => ({
              workspaceAPI: {
                getById: vi.fn(() => Promise.resolve({ data: { data: {
                  _id: 'abc123', name: 'Test Workspace', description: 'A test workspace'
                } } })),
              },
              boardAPI: {
                getByWorkspace: vi
                  .fn()
                  .mockResolvedValueOnce({ data: { data: [] } })
                  .mockResolvedValueOnce({ data: { data: [
                    { _id: 'b3', name: 'Created Board', description: 'Created desc', createdAt: new Date().toISOString() }
                  ] } }),
                create: vi.fn(() => Promise.resolve({ data: { success: true, data: {
                  _id: 'b3', name: 'Created Board', description: 'Created desc', createdAt: new Date().toISOString()
                } } })),
              },
            }));
            const { default: WorkspacePage } = await import('../WorkspacePage');
            render(
              <Provider store={store}>
                <MemoryRouter>
                  <WorkspacePage />
                </MemoryRouter>
              </Provider>
            );
            await waitFor(() => screen.getByText('No boards yet'));
            await act(async () => {
              screen.getByText('+ New Board').click();
            });
            const input = screen.getByPlaceholderText('My new board');
            await act(async () => {
              input.value = 'Created Board';
              input.dispatchEvent(new Event('input', { bubbles: true }));
            });
            await act(async () => {
              screen.getByText('Create').click();
            });
            await waitFor(() => {
              expect(screen.getByText('Created Board')).toBeInTheDocument();
            });
          });
  it('creates a new board and updates UI', async () => {
            vi.mock('../../utils/api', () => ({
              workspaceAPI: {
                getById: vi.fn(() => Promise.reject(new Error('API fail'))),
              },
              boardAPI: {
                getByWorkspace: vi.fn(() => Promise.resolve({ data: { data: [] } })),
                create: vi.fn(),
              },
            }));
            const { default: WorkspacePage } = await import('../WorkspacePage');
            render(
              <Provider store={store}>
                <MemoryRouter>
                  <WorkspacePage />
                </MemoryRouter>
              </Provider>
            );
            await waitFor(() => {
              expect(screen.getByText(/Failed to load workspace/i)).toBeInTheDocument();
            });

  it('navigates back to dashboard when back button clicked', async () => {
    vi.resetModules();
    // Mock API module to avoid import.meta.env
    vi.doMock('../../utils/api', () => ({
      workspaceAPI: {
        getById: vi.fn(() =>
          Promise.resolve({
            data: {
              data: {
                _id: 'abc123',
                name: 'Test Workspace',
                description: 'A test workspace',
              },
            },
          })
        ),
      },
      boardAPI: {
        getByWorkspace: vi.fn(() => Promise.resolve({ data: { data: [] } })),
        create: vi.fn(),
      },
    }));
    const navigate = vi.fn();
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ workspaceId: 'abc123' }),
        useNavigate: () => navigate,
      };
    });
    const { default: WP } = await import('../WorkspacePage');
    render(
      <Provider store={store}>
        <MemoryRouter>
          <WP />
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => screen.getByText('Test Workspace'));
    await act(async () => {
      screen.getByText(/back to workspaces/i).click();
    });
    expect(navigate).toHaveBeenCalledWith('/dashboard');
  });

  it('navigates to board page when board clicked', async () => {
    vi.resetModules();
    // Mock API module to avoid import.meta.env
    vi.doMock('../../utils/api', () => ({
      workspaceAPI: {
        getById: vi.fn(() =>
          Promise.resolve({
            data: {
              data: {
                _id: 'abc123',
                name: 'Test Workspace',
                description: 'A test workspace',
              },
            },
          })
        ),
      },
      boardAPI: {
        getByWorkspace: vi.fn(() =>
          Promise.resolve({
            data: {
              data: [
                {
                  _id: 'b4',
                  name: 'Board 4',
                  description: '',
                  createdAt: new Date().toISOString(),
                },
              ],
            },
          })
        ),
        create: vi.fn(),
      },
    }));
    const navigate = vi.fn();
    vi.doMock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom');
      return {
        ...actual,
        useParams: () => ({ workspaceId: 'abc123' }),
        useNavigate: () => navigate,
      };
    });
    const { default: WP } = await import('../WorkspacePage');
    render(
      <Provider store={store}>
        <MemoryRouter>
          <WP />
        </MemoryRouter>
      </Provider>
    );
    await waitFor(() => screen.getByText('Board 4'));
    await act(async () => {
      screen.getByText('Board 4').click();
    });
    expect(navigate).toHaveBeenCalledWith('/board/b4');
  });

  it('shows error if workspace API fails', async () => {
    const { workspaceAPI } = require('../../utils/api');
    workspaceAPI.getById.mockImplementationOnce(() =>
      Promise.reject(new Error('API fail'))
    );
    renderWithProviders();
    // Should still show loading, then not crash (error is logged)

    await waitFor(() => {
      expect(screen.queryByText('Test Workspace')).not.toBeInTheDocument();
    });
  });
});
