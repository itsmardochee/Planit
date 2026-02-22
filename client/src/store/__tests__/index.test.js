import { describe, it, expect, beforeEach } from 'vitest';
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
  await import('../index');
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

// Tests for exported actions and store (improves coverage)
describe('Store Exports', () => {
  let store;

  beforeEach(async () => {
    localStorage.clear();
    // Import the actual exported store
    const storeModule = await import('../index');
    store = storeModule.store;
  });

  it('should export all action creators', () => {
    expect(loginSuccess).toBeDefined();
    expect(loginRequest).toBeDefined();
    expect(loginError).toBeDefined();
    expect(logout).toBeDefined();
    expect(setWorkspaces).toBeDefined();
    expect(setCurrentWorkspace).toBeDefined();
    expect(addWorkspace).toBeDefined();
    expect(setBoards).toBeDefined();
    expect(setCurrentBoard).toBeDefined();
    expect(addBoard).toBeDefined();
    expect(setLists).toBeDefined();
    expect(addList).toBeDefined();
    expect(setCards).toBeDefined();
    expect(addCard).toBeDefined();
  });

  it('should have working store with all reducers', () => {
    expect(store).toBeDefined();
    expect(store.getState).toBeDefined();
    expect(store.dispatch).toBeDefined();

    const state = store.getState();
    expect(state.auth).toBeDefined();
    expect(state.workspaces).toBeDefined();
    expect(state.boards).toBeDefined();
    expect(state.lists).toBeDefined();
    expect(state.cards).toBeDefined();
  });

  // Auth reducer tests - directly test the reducer functions
  it('should execute loginSuccess reducer', () => {
    const mockUser = { id: 1, email: 'test@test.com', name: 'Test' };
    const mockToken = 'jwt-token-xyz';

    store.dispatch(loginSuccess({ user: mockUser, token: mockToken }));

    const authState = store.getState().auth;
    expect(authState.user).toEqual(mockUser);
    expect(authState.token).toBe(mockToken);
    expect(authState.loading).toBe(false);
    expect(authState.error).toBeNull();
  });

  it('should execute loginRequest reducer', () => {
    store.dispatch(loginRequest());

    const authState = store.getState().auth;
    expect(authState.loading).toBe(true);
    expect(authState.error).toBeNull();
  });

  it('should execute loginError reducer', () => {
    const errorMessage = 'Authentication failed';

    store.dispatch(loginError(errorMessage));

    const authState = store.getState().auth;
    expect(authState.loading).toBe(false);
    expect(authState.error).toBe(errorMessage);
  });

  it('should execute logout reducer', () => {
    // First login
    store.dispatch(
      loginSuccess({
        user: { id: 1, email: 'test@test.com' },
        token: 'token-123',
      })
    );

    // Then logout
    store.dispatch(logout());

    const authState = store.getState().auth;
    expect(authState.user).toBeNull();
    expect(authState.token).toBeNull();
    expect(authState.loading).toBe(false);
    expect(authState.error).toBeNull();
  });

  // Workspaces reducer tests
  it('should execute setWorkspaces reducer', () => {
    const workspaces = [
      { id: 'ws1', name: 'Workspace 1' },
      { id: 'ws2', name: 'Workspace 2' },
    ];

    store.dispatch(setWorkspaces(workspaces));

    const workspacesState = store.getState().workspaces;
    expect(workspacesState.list).toEqual(workspaces);
  });

  it('should execute setCurrentWorkspace reducer', () => {
    const workspace = { id: 'ws1', name: 'Current Workspace' };

    store.dispatch(setCurrentWorkspace(workspace));

    const workspacesState = store.getState().workspaces;
    expect(workspacesState.current).toEqual(workspace);
  });

  it('should execute addWorkspace reducer', () => {
    const workspace = { id: 'ws3', name: 'New Workspace' };

    store.dispatch(addWorkspace(workspace));

    const workspacesState = store.getState().workspaces;
    expect(workspacesState.list).toContainEqual(workspace);
  });

  // Boards reducer tests
  it('should execute setBoards reducer', () => {
    const boards = [
      { id: 'b1', name: 'Board 1', workspaceId: 'ws1' },
      { id: 'b2', name: 'Board 2', workspaceId: 'ws1' },
    ];

    store.dispatch(setBoards(boards));

    const boardsState = store.getState().boards;
    expect(boardsState.list).toEqual(boards);
  });

  it('should execute setCurrentBoard reducer', () => {
    const board = { id: 'b1', name: 'Current Board', workspaceId: 'ws1' };

    store.dispatch(setCurrentBoard(board));

    const boardsState = store.getState().boards;
    expect(boardsState.current).toEqual(board);
  });

  it('should execute addBoard reducer', () => {
    const board = { id: 'b3', name: 'New Board', workspaceId: 'ws1' };

    store.dispatch(addBoard(board));

    const boardsState = store.getState().boards;
    expect(boardsState.list).toContainEqual(board);
  });

  // Lists reducer tests
  it('should execute setLists reducer', () => {
    const lists = [
      { id: 'l1', title: 'To Do', boardId: 'b1' },
      { id: 'l2', title: 'In Progress', boardId: 'b1' },
    ];

    store.dispatch(setLists(lists));

    const listsState = store.getState().lists;
    expect(listsState.items).toEqual(lists);
  });

  it('should execute addList reducer', () => {
    const list = { id: 'l3', title: 'Done', boardId: 'b1' };

    store.dispatch(addList(list));

    const listsState = store.getState().lists;
    expect(listsState.items).toContainEqual(list);
  });

  // Cards reducer tests
  it('should execute setCards reducer', () => {
    const cards = [
      { id: 'c1', title: 'Task 1', listId: 'l1' },
      { id: 'c2', title: 'Task 2', listId: 'l1' },
    ];

    store.dispatch(setCards(cards));

    const cardsState = store.getState().cards;
    expect(cardsState.items).toEqual(cards);
  });

  it('should execute addCard reducer', () => {
    const card = { id: 'c3', title: 'New Task', listId: 'l1' };

    store.dispatch(addCard(card));

    const cardsState = store.getState().cards;
    expect(cardsState.items).toContainEqual(card);
  });

  // Integration test
  it('should handle complete workflow through all reducers', () => {
    // Login
    store.dispatch(
      loginSuccess({
        user: { id: 1, email: 'user@test.com' },
        token: 'token-abc',
      })
    );

    // Create workspace
    const workspace = { id: 'ws-integration', name: 'Integration Workspace' };
    store.dispatch(addWorkspace(workspace));
    store.dispatch(setCurrentWorkspace(workspace));

    // Create board
    const board = {
      id: 'b-integration',
      name: 'Integration Board',
      workspaceId: 'ws-integration',
    };
    store.dispatch(addBoard(board));
    store.dispatch(setCurrentBoard(board));

    // Create list
    const list = {
      id: 'l-integration',
      title: 'To Do',
      boardId: 'b-integration',
    };
    store.dispatch(addList(list));

    // Create card
    const card = {
      id: 'c-integration',
      title: 'Task 1',
      listId: 'l-integration',
    };
    store.dispatch(addCard(card));

    const state = store.getState();
    expect(state.auth.user).toBeTruthy();
    expect(state.auth.token).toBe('token-abc');
    expect(state.workspaces.list).toContainEqual(workspace);
    expect(state.workspaces.current).toEqual(workspace);
    expect(state.boards.list).toContainEqual(board);
    expect(state.boards.current).toEqual(board);
    expect(state.lists.items).toContainEqual(list);
    expect(state.cards.items).toContainEqual(card);
  });
});
