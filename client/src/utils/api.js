import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL,
  withCredentials: false,
});

// Example interceptor (extend later for auth)
api.interceptors.response.use(
  response => response,
  error => Promise.reject(error)
);
