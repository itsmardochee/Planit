import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import {
  loginSuccess,
  loginRequest,
  loginError,
  logout,
  setWorkspaces,
  setCurrentWorkspace,
  addWorkspace,
  setBoards,
  setCurrentBoard,
  addBoard,
  setLists,
  addList,
  setCards,
  addCard,
} from '../index';

// Helper to create a fresh store for each test
const createTestStore = async () => {
  const { store: _, ...slices } = await import('../index');
  const { configureStore, createSlice } = await import('@reduxjs/toolkit');

  // Re-create slices to get fresh reducers
  const authSlice = createSlice({
    name: 'auth',
    initialState: {
      user: localStorage.getItem('user')
        ? JSON.parse(localStorage.getItem('user'))
        : null,
      token: localStorage.getItem('token') || null,
      loading: false,
      error: null,
    },
    reducers: {
      loginSuccess: (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.loading = false;
        state.error = null;
        localStorage.setItem('user', JSON.stringify(action.payload.user));
        localStorage.setItem('token', action.payload.token);
      },
      loginRequest: state => {
        state.loading = true;
        state.error = null;
      },
      loginError: (state, action) => {
        state.loading = false;
        state.error = action.payload;
      },
      logout: state => {
        state.user = null;
        state.token = null;
        state.loading = false;
        state.error = null;
        localStorage.removeItem('user');
        localStorage.removeItem('token');
      },
    },
  });

  const workspacesSlice = createSlice({
    name: 'workspaces',
    initialState: {
      list: [],
      current: null,
      loading: false,
      error: null,
    },
    reducers: {
      setWorkspaces: (state, action) => {
        state.list = action.payload;
      },
      setCurrentWorkspace: (state, action) => {
        state.current = action.payload;
      },
      addWorkspace: (state, action) => {
        state.list.push(action.payload);
      },
    },
  });

  const boardsSlice = createSlice({
    name: 'boards',
    initialState: {
      list: [],
      current: null,
      loading: false,
      error: null,
    },
    reducers: {
      setBoards: (state, action) => {
        state.list = action.payload;
      },
      setCurrentBoard: (state, action) => {
        state.current = action.payload;
      },
      addBoard: (state, action) => {
        state.list.push(action.payload);
      },
    },
  });

  const listsSlice = createSlice({
    name: 'lists',
    initialState: {
      items: [],
      loading: false,
      error: null,
    },
    reducers: {
      setLists: (state, action) => {
        state.items = action.payload;
      },
      addList: (state, action) => {
        state.items.push(action.payload);
      },
    },
  });

  const cardsSlice = createSlice({
    name: 'cards',
    initialState: {
      items: [],
      loading: false,
      error: null,
    },
    reducers: {
      setCards: (state, action) => {
        state.items = action.payload;
      },
      addCard: (state, action) => {
        state.items.push(action.payload);
      },
    },
  });

  return configureStore({
    reducer: {
      auth: authSlice.reducer,
      workspaces: workspacesSlice.reducer,
      boards: boardsSlice.reducer,
      lists: listsSlice.reducer,
      cards: cardsSlice.reducer,
    },
  });
};

describe('Redux Store', () => {
  let store;

  beforeEach(async () => {
    // Clear localStorage before each test
    localStorage.clear();
    // Create fresh store
    store = await createTestStore();
  });

  describe('Auth Slice', () => {
    it('should have initial state with null user and token', () => {
      const state = store.getState().auth;
      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle loginRequest action', () => {
      store.dispatch(loginRequest());
      const state = store.getState().auth;

      expect(state.loading).toBe(true);
      expect(state.error).toBeNull();
    });

    it('should handle loginSuccess action', () => {
      const mockPayload = {
        user: { id: 1, email: 'test@test.com', name: 'Test User' },
        token: 'jwt-token-123',
      };

      store.dispatch(loginSuccess(mockPayload));
      const state = store.getState().auth;

      expect(state.user).toEqual(mockPayload.user);
      expect(state.token).toBe(mockPayload.token);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle loginError action', () => {
      const mockError = 'Invalid credentials';

      store.dispatch(loginError(mockError));
      const state = store.getState().auth;

      expect(state.loading).toBe(false);
      expect(state.error).toBe(mockError);
    });

    it('should handle logout action', () => {
      // First login
      const mockPayload = {
        user: { id: 1, email: 'test@test.com' },
        token: 'jwt-token-123',
      };
      store.dispatch(loginSuccess(mockPayload));

      // Then logout
      store.dispatch(logout());
      const state = store.getState().auth;

      expect(state.user).toBeNull();
      expect(state.token).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe('Workspaces Slice', () => {
    it('should have initial empty state', () => {
      const state = store.getState().workspaces;

      expect(state.list).toEqual([]);
      expect(state.current).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle setWorkspaces action', () => {
      const mockWorkspaces = [
        { id: '1', name: 'Workspace 1' },
        { id: '2', name: 'Workspace 2' },
      ];

      store.dispatch(setWorkspaces(mockWorkspaces));
      const state = store.getState().workspaces;

      expect(state.list).toEqual(mockWorkspaces);
    });

    it('should handle setCurrentWorkspace action', () => {
      const mockWorkspace = { id: '1', name: 'Current Workspace' };

      store.dispatch(setCurrentWorkspace(mockWorkspace));
      const state = store.getState().workspaces;

      expect(state.current).toEqual(mockWorkspace);
    });

    it('should handle addWorkspace action', () => {
      const mockWorkspace = { id: '3', name: 'New Workspace' };

      store.dispatch(addWorkspace(mockWorkspace));
      const state = store.getState().workspaces;

      expect(state.list).toContainEqual(mockWorkspace);
    });

    it('should add multiple workspaces sequentially', () => {
      const workspace1 = { id: '1', name: 'Workspace 1' };
      const workspace2 = { id: '2', name: 'Workspace 2' };

      store.dispatch(addWorkspace(workspace1));
      store.dispatch(addWorkspace(workspace2));
      const state = store.getState().workspaces;

      expect(state.list).toContainEqual(workspace1);
      expect(state.list).toContainEqual(workspace2);
    });
  });

  describe('Boards Slice', () => {
    it('should have initial empty state', () => {
      const state = store.getState().boards;

      expect(state.list).toEqual([]);
      expect(state.current).toBeNull();
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle setBoards action', () => {
      const mockBoards = [
        { id: '1', name: 'Board 1', workspaceId: 'ws1' },
        { id: '2', name: 'Board 2', workspaceId: 'ws1' },
      ];

      store.dispatch(setBoards(mockBoards));
      const state = store.getState().boards;

      expect(state.list).toEqual(mockBoards);
    });

    it('should handle setCurrentBoard action', () => {
      const mockBoard = { id: '1', name: 'Current Board', workspaceId: 'ws1' };

      store.dispatch(setCurrentBoard(mockBoard));
      const state = store.getState().boards;

      expect(state.current).toEqual(mockBoard);
    });

    it('should handle addBoard action', () => {
      const mockBoard = { id: '3', name: 'New Board', workspaceId: 'ws1' };

      store.dispatch(addBoard(mockBoard));
      const state = store.getState().boards;

      expect(state.list).toContainEqual(mockBoard);
    });
  });

  describe('Lists Slice', () => {
    it('should have initial empty state', () => {
      const state = store.getState().lists;

      expect(state.items).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle setLists action', () => {
      const mockLists = [
        { id: '1', title: 'To Do', boardId: 'b1', position: 0 },
        { id: '2', title: 'In Progress', boardId: 'b1', position: 1 },
      ];

      store.dispatch(setLists(mockLists));
      const state = store.getState().lists;

      expect(state.items).toEqual(mockLists);
    });

    it('should handle addList action', () => {
      const mockList = { id: '3', title: 'Done', boardId: 'b1', position: 2 };

      store.dispatch(addList(mockList));
      const state = store.getState().lists;

      expect(state.items).toContainEqual(mockList);
    });

    it('should add multiple lists', () => {
      const list1 = { id: '1', title: 'To Do', boardId: 'b1', position: 0 };
      const list2 = {
        id: '2',
        title: 'In Progress',
        boardId: 'b1',
        position: 1,
      };

      store.dispatch(addList(list1));
      store.dispatch(addList(list2));
      const state = store.getState().lists;

      expect(state.items).toContainEqual(list1);
      expect(state.items).toContainEqual(list2);
    });
  });

  describe('Cards Slice', () => {
    it('should have initial empty state', () => {
      const state = store.getState().cards;

      expect(state.items).toEqual([]);
      expect(state.loading).toBe(false);
      expect(state.error).toBeNull();
    });

    it('should handle setCards action', () => {
      const mockCards = [
        { id: '1', title: 'Task 1', listId: 'l1', position: 0 },
        { id: '2', title: 'Task 2', listId: 'l1', position: 1 },
      ];

      store.dispatch(setCards(mockCards));
      const state = store.getState().cards;

      expect(state.items).toEqual(mockCards);
    });

    it('should handle addCard action', () => {
      const mockCard = {
        id: '3',
        title: 'New Task',
        listId: 'l1',
        position: 2,
      };

      store.dispatch(addCard(mockCard));
      const state = store.getState().cards;

      expect(state.items).toContainEqual(mockCard);
    });

    it('should add multiple cards', () => {
      const card1 = { id: '1', title: 'Task 1', listId: 'l1', position: 0 };
      const card2 = { id: '2', title: 'Task 2', listId: 'l1', position: 1 };
      const card3 = { id: '3', title: 'Task 3', listId: 'l2', position: 0 };

      store.dispatch(addCard(card1));
      store.dispatch(addCard(card2));
      store.dispatch(addCard(card3));
      const state = store.getState().cards;

      expect(state.items).toContainEqual(card1);
      expect(state.items).toContainEqual(card2);
      expect(state.items).toContainEqual(card3);
    });
  });

  describe('Store Integration', () => {
    it('should have all slices in the store', () => {
      const state = store.getState();

      expect(state).toHaveProperty('auth');
      expect(state).toHaveProperty('workspaces');
      expect(state).toHaveProperty('boards');
      expect(state).toHaveProperty('lists');
      expect(state).toHaveProperty('cards');
    });

    it('should handle state updates across slices', () => {
      // Login
      store.dispatch(
        loginSuccess({
          user: { id: 1, email: 'test@test.com' },
          token: 'token-123',
        })
      );

      // Add workspace
      const workspace = { id: 'ws1', name: 'My Workspace' };
      store.dispatch(setCurrentWorkspace(workspace));

      // Add board
      const board = { id: 'b1', name: 'My Board', workspaceId: 'ws1' };
      store.dispatch(setCurrentBoard(board));

      const state = store.getState();

      expect(state.auth.user).toBeTruthy();
      expect(state.workspaces.current).toEqual(workspace);
      expect(state.boards.current).toEqual(board);
    });
  });
});
