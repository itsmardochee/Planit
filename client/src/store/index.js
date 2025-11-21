import { configureStore, createSlice } from '@reduxjs/toolkit';

// Auth slice
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

// Workspaces slice
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

// Boards slice
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

// Lists slice
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

// Cards slice
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

export const { loginSuccess, loginRequest, loginError, logout } =
  authSlice.actions;
export const { setWorkspaces, setCurrentWorkspace, addWorkspace } =
  workspacesSlice.actions;
export const { setBoards, setCurrentBoard, addBoard } = boardsSlice.actions;
export const { setLists, addList } = listsSlice.actions;
export const { setCards, addCard } = cardsSlice.actions;

export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    workspaces: workspacesSlice.reducer,
    boards: boardsSlice.reducer,
    lists: listsSlice.reducer,
    cards: cardsSlice.reducer,
  },
});
