import { defineStore } from 'pinia';
import request from '../utils/request';

export const useClassStore = defineStore('class', {
  state: () => ({ list: [] }),
  actions: {
    async fetchList() {
      this.list = await request.get('/classes');
      return this.list;
    },
    async create(payload) {
      const d = await request.post('/classes', payload);
      await this.fetchList();
      return d;
    },
    async update(id, payload) {
      const d = await request.put(`/classes/${id}`, payload);
      await this.fetchList();
      return d;
    },
    async remove(id) {
      const d = await request.delete(`/classes/${id}`);
      await this.fetchList();
      return d;
    },
  },
});
