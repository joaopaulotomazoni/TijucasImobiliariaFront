import axios from 'axios';
import { STORAGE_KEYS } from '../constants/storage';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL,
});

api.interceptors.request.use((config) => {
  const storageUser = localStorage.getItem(STORAGE_KEYS.USER);
  if (storageUser) {
    try {
      const { token } = JSON.parse(storageUser);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // usuário salvo em formato inválido: segue sem header de auth
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(STORAGE_KEYS.USER);
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
