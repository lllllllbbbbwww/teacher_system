import { defineStore } from 'pinia';
import request from '../utils/request';

export const useStudentStore = defineStore('student', {
  state: () => ({ list: [] }),
  actions: {
    async fetchList(params = {}) {
      this.list = await request.get('/students', { params });
      return this.list;
    },
    async create(payload) {
      const d = await request.post('/students', payload);
      await this.fetchList();
      return d;
    },
    async update(id, payload) {
      const d = await request.put(`/students/${id}`, payload);
      await this.fetchList();
      return d;
    },
    async remove(id) {
      const d = await request.delete(`/students/${id}`);
      await this.fetchList();
      return d;
    },
  },
});
