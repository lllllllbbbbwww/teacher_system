<template>
  <div class="page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Calendar /></el-icon></div>
        <div>
          <div class="page-header-tag">教学数据</div>
          <div class="page-header-title">考勤管理</div>
          <div class="page-header-desc">每日考勤录入与出勤统计、异常预警分析</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="merge-tabs">
      <el-tab-pane label="考勤录入" name="enter"><AttendanceEnter embedded /></el-tab-pane>
      <el-tab-pane label="考勤统计" name="stats"><AttendanceStats embedded /></el-tab-pane>
      <el-tab-pane label="行为记录" name="behavior"><BehaviorRecord embedded /></el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { Calendar } from '@element-plus/icons-vue';
import AttendanceEnter from './AttendanceEnter.vue';
import AttendanceStats from './AttendanceStats.vue';
import BehaviorRecord from './BehaviorRecord.vue';

const route = useRoute();
const activeTab = ref(route.query.tab === 'stats' ? 'stats' : 'enter');
</script>

<style scoped>
.merge-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }
.merge-tabs :deep(.page) { padding: 4px 2px 28px; }
</style>
