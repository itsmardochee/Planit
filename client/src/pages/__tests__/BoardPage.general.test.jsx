import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import BoardPage from '../../pages/BoardPage';
import * as api from '../../utils/api';

// Mock the API modules
vi.mock('../../utils/api', () => ({
  boardAPI: {
    getById: vi.fn(),
  },
  listAPI: {
    getByBoard: vi.fn(),
    create: vi.fn(),
  },
  cardAPI: {
    getByList: vi.fn(),
  },
  memberAPI: {
    getByWorkspace: vi.fn(),
  },
}));

// Mock react-router-dom
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useParams: () => ({ boardId: 'board123' }),
    useNavigate: () => vi.fn(),
  };
});

// Mock translation
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: key => key,
    i18n: { changeLanguage: vi.fn() },
  }),
}));

// Mock usePermissions to allow all actions by default
vi.mock('../../hooks/usePermissions', () => ({
  default: () => ({
    can: () => true,
    role: 'owner',
    loading: false,
    error: null,
    isAtLeast: () => true,
    canModifyUserRole: () => true,
  }),
}));

vi.mock('react-redux', () => ({
  useSelector: selector =>
    selector({ auth: { user: { _id: 'current-user-id' } } }),
}));

const Wrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

describe('BoardPage - General', () => {
  const mockBoard = {
    _id: 'board123',
    name: 'Test Board',
    description: 'Board Description',
    workspaceId: 'workspace123',
  };

  const mockBoardNoDesc = {
    _id: 'board123',
    name: 'Test Board',
    description: '',
    workspaceId: 'workspace123',
  };

  const mockBoardNoWorkspace = {
    _id: 'board123',
    name: 'Test Board',
    description: '',
    // no workspaceId
  };

  beforeEach(() => {
    vi.clearAllMocks();
    api.boardAPI.getById.mockResolvedValue({
      data: { success: true, data: mockBoard },
    });
    api.listAPI.getByBoard.mockResolvedValue({
      data: { success: true, data: [] },
    });
    api.cardAPI.getByList.mockResolvedValue({
      data: { success: true, data: [] },
    });
    api.memberAPI.getByWorkspace.mockResolvedValue({
      data: { success: true, data: [] },
    });
  });

  describe('Board Loading', () => {
    it('shows loading state before data is fetched', async () => {
      // Delay the board response so loading state is visible
      api.boardAPI.getById.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () => resolve({ data: { success: true, data: mockBoard } }),
              50
            )
          )
      );

      render(<BoardPage />, { wrapper: Wrapper });
      expect(screen.getByText('board:loading')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });
    });

    it('displays board name after loading', async () => {
      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });
    });

    it('displays board description when present', async () => {
      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Board Description')).toBeInTheDocument();
      });
    });

    it('does not render description when it is empty', async () => {
      api.boardAPI.getById.mockResolvedValue({
        data: { success: true, data: mockBoardNoDesc },
      });

      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      expect(screen.queryByText('Board Description')).not.toBeInTheDocument();
    });

    it('skips member fetch when board has no workspaceId', async () => {
      api.boardAPI.getById.mockResolvedValue({
        data: { success: true, data: mockBoardNoWorkspace },
      });

      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      expect(api.memberAPI.getByWorkspace).not.toHaveBeenCalled();
    });

    it('handles member fetch error gracefully', async () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      api.memberAPI.getByWorkspace.mockRejectedValue(
        new Error('Network error')
      );

      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading members',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Add List Form', () => {
    it('shows add list button initially', async () => {
      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      expect(screen.getByText(/board:addAnotherList/)).toBeInTheDocument();
    });

    it('shows create list form when add button is clicked', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      await user.click(screen.getByText(/board:addAnotherList/));
      expect(screen.getByText('board:addNewList')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('board:listTitlePlaceholder')
      ).toBeInTheDocument();
    });

    it('hides form when cancel is clicked', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      await user.click(screen.getByText(/board:addAnotherList/));
      await user.click(screen.getByText('board:cancel'));

      expect(screen.queryByText('board:addNewList')).not.toBeInTheDocument();
      expect(screen.getByText(/board:addAnotherList/)).toBeInTheDocument();
    });

    it('creates list successfully on form submit', async () => {
      const user = userEvent.setup();
      const newList = { _id: 'new-list', name: 'Sprint 1', position: 0 };
      api.listAPI.create.mockResolvedValue({
        data: { success: true, data: newList },
      });

      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      await user.click(screen.getByText(/board:addAnotherList/));
      const input = screen.getByPlaceholderText('board:listTitlePlaceholder');
      await user.type(input, 'Sprint 1');
      await user.click(screen.getByText('board:add'));

      await waitFor(() => {
        expect(api.listAPI.create).toHaveBeenCalledWith('board123', {
          name: 'Sprint 1',
          position: 0,
        });
      });

      // Form should be hidden after success
      expect(screen.queryByText('board:addNewList')).not.toBeInTheDocument();
    });

    it('does not submit when list name is empty', async () => {
      const user = userEvent.setup();
      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      await user.click(screen.getByText(/board:addAnotherList/));
      await user.click(screen.getByText('board:add'));

      expect(api.listAPI.create).not.toHaveBeenCalled();
    });

    it('handles create list error gracefully', async () => {
      const user = userEvent.setup();
      window.alert = vi.fn();
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      api.listAPI.create.mockRejectedValue(new Error('Server error'));

      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      await user.click(screen.getByText(/board:addAnotherList/));
      const input = screen.getByPlaceholderText('board:listTitlePlaceholder');
      await user.type(input, 'Test List');
      await user.click(screen.getByText('board:add'));

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error creating list',
          expect.any(Error)
        );
      });
      consoleSpy.mockRestore();
    });
  });

  describe('Label Manager', () => {
    it('displays Manage Labels button', async () => {
      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      expect(screen.getByText('board:manageLabels')).toBeInTheDocument();
    });
  });

  describe('Member Filter', () => {
    it('shows member filter when members are loaded', async () => {
      const mockMembers = [
        {
          userId: {
            _id: 'user1',
            username: 'Alice',
            email: 'alice@example.com',
          },
          role: 'member',
        },
      ];
      api.memberAPI.getByWorkspace.mockResolvedValue({
        data: { success: true, data: mockMembers },
      });

      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('board:filterByMember')).toBeInTheDocument();
      });

      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    it('does not show member filter when there are no members', async () => {
      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Test Board')).toBeInTheDocument();
      });

      expect(
        screen.queryByText('board:filterByMember')
      ).not.toBeInTheDocument();
    });

    it('filters cards by selected member', async () => {
      const user = userEvent.setup();
      const mockMembers = [
        {
          userId: {
            _id: 'user1',
            username: 'Alice',
            email: 'alice@example.com',
          },
          role: 'member',
        },
      ];
      const mockLists = [{ _id: 'list1', name: 'To Do', position: 0 }];
      const mockCards = [
        {
          _id: 'card1',
          title: 'Alice Card',
          assignedTo: [{ _id: 'user1' }],
          labels: [],
          status: null,
          dueDate: null,
        },
        {
          _id: 'card2',
          title: 'Unassigned Card',
          assignedTo: [],
          labels: [],
          status: null,
          dueDate: null,
        },
      ];

      api.memberAPI.getByWorkspace.mockResolvedValue({
        data: { success: true, data: mockMembers },
      });
      api.listAPI.getByBoard.mockResolvedValue({
        data: { success: true, data: mockLists },
      });
      api.cardAPI.getByList.mockResolvedValue({
        data: { success: true, data: mockCards },
      });

      render(<BoardPage />, { wrapper: Wrapper });
      await waitFor(() => {
        expect(screen.getByText('Alice Card')).toBeInTheDocument();
      });

      // Select "Unassigned" filter
      const select = screen.getByRole('combobox');
      await user.selectOptions(select, 'unassigned');

      await waitFor(() => {
        expect(screen.queryByText('Alice Card')).not.toBeInTheDocument();
        expect(screen.getByText('Unassigned Card')).toBeInTheDocument();
      });
    });
  });
});
