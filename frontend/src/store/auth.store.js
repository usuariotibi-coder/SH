import { create } from 'zustand';
import api from '../api/axios.config';

const useAuthStore = create((set) => ({
  user: null,
  token: localStorage.getItem('sh_token'),
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, user } = res.data;
      localStorage.setItem('sh_token', token);
      set({ token, user, isLoading: false });
      return user;
    } catch (err) {
      const message = err.response?.data?.message || 'Error al iniciar sesión';
      set({ isLoading: false, error: message });
      throw new Error(message);
    }
  },

  logout: () => {
    localStorage.removeItem('sh_token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    try {
      const res = await api.get('/auth/me');
      set({ user: res.data });
    } catch {
      localStorage.removeItem('sh_token');
      set({ user: null, token: null });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
