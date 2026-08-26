<template>
  <div class="page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><MagicStick /></el-icon></div>
        <div>
          <div class="page-header-tag">课后反馈</div>
          <div class="page-header-title">课后反馈</div>
          <div class="page-header-desc">基于学情数据一键生成个性化家校反馈，并管理历史记录</div>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="merge-tabs">
      <el-tab-pane label="反馈生成" name="generate"><FeedbackGenerate embedded /></el-tab-pane>
      <el-tab-pane label="反馈记录" name="records"><FeedbackRecords embedded /></el-tab-pane>
      <el-tab-pane label="反馈风格" name="style"><StyleTagManage embedded /></el-tab-pane>
      <el-tab-pane label="行为标签" name="tags"><BehaviorTagManage embedded /></el-tab-pane>
    </el-tabs>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute } from 'vue-router';
import { MagicStick } from '@element-plus/icons-vue';
import FeedbackGenerate from './FeedbackGenerate.vue';
import FeedbackRecords from './FeedbackRecords.vue';
import StyleTagManage from './StyleTagManage.vue';
import BehaviorTagManage from './BehaviorTagManage.vue';

const route = useRoute();
const tabMap = { records: 'records', style: 'style', tags: 'tags' };
const activeTab = ref(tabMap[route.query.tab] || 'generate');
</script>

<style scoped>
.merge-tabs :deep(.el-tabs__header) { margin-bottom: 20px; }
.merge-tabs :deep(.page) { padding: 4px 2px 28px; }
</style>
