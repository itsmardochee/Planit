import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired or invalid - only redirect if not already on login page
      const currentPath = window.location.pathname;
      if (currentPath !== '/login' && currentPath !== '/') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: data => api.post('/auth/register', data),
  login: data => api.post('/auth/login', data),
};

// Workspace API calls
export const workspaceAPI = {
  getAll: () => api.get('/workspaces'),
  getById: id => api.get(`/workspaces/${id}`),
  create: data => api.post('/workspaces', data),
  update: (id, data) => api.put(`/workspaces/${id}`, data),
  delete: id => api.delete(`/workspaces/${id}`),
};

// Board API calls
export const boardAPI = {
  getByWorkspace: workspaceId => api.get(`/workspaces/${workspaceId}/boards`),
  getById: boardId => api.get(`/boards/${boardId}`),
  create: (workspaceId, data) =>
    api.post(`/workspaces/${workspaceId}/boards`, data),
  update: (boardId, data) => api.put(`/boards/${boardId}`, data),
  delete: boardId => api.delete(`/boards/${boardId}`),
};

// List API calls
export const listAPI = {
  getByBoard: boardId => api.get(`/boards/${boardId}/lists`),
  getById: listId => api.get(`/lists/${listId}`),
  create: (boardId, data) => api.post(`/boards/${boardId}/lists`, data),
  update: (listId, data) => api.put(`/lists/${listId}`, data),
  reorder: (listId, data) => api.put(`/lists/${listId}/reorder`, data),
  delete: listId => api.delete(`/lists/${listId}`),
};

// Card API calls
export const cardAPI = {
  getByList: listId => api.get(`/lists/${listId}/cards`),
  getById: cardId => api.get(`/cards/${cardId}`),
  create: (listId, data) => api.post(`/lists/${listId}/cards`, data),
  update: (cardId, data) => api.put(`/cards/${cardId}`, data),
  reorder: (cardId, data) => api.put(`/cards/${cardId}/reorder`, data),
  delete: cardId => api.delete(`/cards/${cardId}`),
  assign: (cardId, userId) => api.post(`/cards/${cardId}/assign`, { userId }),
  unassign: (cardId, userId) =>
    api.delete(`/cards/${cardId}/unassign/${userId}`),
};

// Member API calls (Workspace Members)
export const memberAPI = {
  getByWorkspace: workspaceId => api.get(`/workspaces/${workspaceId}/members`),
  invite: (workspaceId, data) =>
    api.post(`/workspaces/${workspaceId}/invite`, data),
  remove: (workspaceId, userId) =>
    api.delete(`/workspaces/${workspaceId}/members/${userId}`),
};
