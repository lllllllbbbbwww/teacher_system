import { defineStore } from 'pinia';
import request from '../utils/request';

// 考试 / 行为标签 / 风格标签 等公共数据
export const useCommonStore = defineStore('common', {
  state: () => ({
    exams: [],
    behaviorTags: [],
    styleTags: [],
  }),
  actions: {
    async fetchExams(params = {}) {
      this.exams = await request.get('/exams', { params });
      return this.exams;
    },
    async createExam(payload) {
      const d = await request.post('/exams', payload);
      await this.fetchExams();
      return d;
    },
    async updateExam(id, payload) {
      const d = await request.put(`/exams/${id}`, payload);
      await this.fetchExams();
      return d;
    },
    async removeExam(id) {
      const d = await request.delete(`/exams/${id}`);
      await this.fetchExams();
      return d;
    },
    async fetchBehaviorTags() {
      this.behaviorTags = await request.get('/behaviors/tags');
      return this.behaviorTags;
    },
    async fetchStyleTags() {
      this.styleTags = await request.get('/style-tags');
      return this.styleTags;
    },
  },
});
