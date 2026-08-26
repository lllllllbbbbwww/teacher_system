<template>
  <div class="page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><EditPen /></el-icon></div>
        <div>
          <div class="page-header-tag">教学数据</div>
          <div class="page-header-title">成绩管理</div>
          <div class="page-header-desc">考试场次维护、成绩录入与查询分析</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="merge-tabs">
      <el-tab-pane label="考试管理" name="exams"><ExamManage embedded /></el-tab-pane>
      <el-tab-pane label="成绩录入" name="enter"><ScoreEnter embedded /></el-tab-pane>
      <el-tab-pane label="成绩查询" name="query"><ScoreQuery embedded /></el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { EditPen } from '@element-plus/icons-vue';
import ExamManage from './ExamManage.vue';
import ScoreEnter from './ScoreEnter.vue';
import ScoreQuery from './ScoreQuery.vue';

const route = useRoute();
const activeTab = ref(['enter', 'query'].includes(route.query.tab) ? route.query.tab : 'exams');
</script>

<style scoped>
.merge-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }
.merge-tabs :deep(.page) { padding: 4px 2px 28px; }
</style>
