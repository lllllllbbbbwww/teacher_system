import { defineStore } from 'pinia';
import request from '../utils/request';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    token: localStorage.getItem('token') || '',
    username: localStorage.getItem('username') || '',
    role: localStorage.getItem('role') || '',
  }),
  getters: {
    isLogin: (s) => !!s.token,
    isAdmin: (s) => s.role === 'admin',
  },
  actions: {
    async login(payload) {
      const data = await request.post('/auth/login', payload);
      this.token = data.token;
      this.username = data.username;
      this.role = data.role || 'teacher';
      localStorage.setItem('token', data.token);
      localStorage.setItem('username', data.username);
      localStorage.setItem('role', this.role);
      return data;
    },
    async register(payload) {
      return await request.post('/auth/register', payload);
    },
    logout() {
      this.token = '';
      this.username = '';
      this.role = '';
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
    },
  },
});
