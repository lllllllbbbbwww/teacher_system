<template>
  <div class="page">
    <div v-if="!embedded" class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><ChatDotSquare /></el-icon></div>
        <div>
          <div class="page-header-tag">AI 智能</div>
          <div class="page-header-title">反馈记录</div>
          <div class="page-header-desc">查看与导出已生成的学生学情反馈</div>
        </div>
      </div>
    </div>
    <div class="panel">
      <div class="toolbar">
        <el-select v-model="studentId" placeholder="选择学生" filterable clearable style="width:240px" @change="load">
          <el-option v-for="s in studentStore.list" :key="s.id" :label="`${s.name}(${s.student_no})`" :value="s.id" />
        </el-select>
      </div>
      <div class="table-wrap">
        <el-table :data="records" border stripe>
          <el-table-column prop="created_at" label="生成时间" width="180" />
          <el-table-column label="周期" width="100">
            <template #default="{ row }">{{ rangeText(row.time_range) }}</template>
          </el-table-column>
          <el-table-column prop="style_tag" label="风格" width="120" />
          <el-table-column label="简短版" show-overflow-tooltip>
            <template #default="{ row }">{{ row.content_short }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button link type="primary" :icon="View" @click="view(row)">查看</el-button>
                <el-button link type="primary" :icon="Download" @click="exportOne(row)">导出PDF</el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-if="!records.length" description="暂无反馈记录" />
    </div>

    <el-dialog v-model="visible" title="反馈详情" width="600px">
      <template v-if="current">
        <div class="detail-block">
          <div class="detail-label short">简短微信版</div>
          <div class="detail-short">{{ current.content_short }}</div>
        </div>
        <div class="detail-sec">
          <div class="detail-sec-label adv">优点与亮点</div>
          <div class="detail-text">{{ current.content_full.advantages }}</div>
        </div>
        <div class="detail-sec">
          <div class="detail-sec-label prob">待改进问题</div>
          <div class="detail-text">{{ current.content_full.problems }}</div>
        </div>
        <div class="detail-sec">
          <div class="detail-sec-label sugg">家校共育建议</div>
          <div class="detail-text">{{ current.content_full.suggestions }}</div>
        </div>
        <div class="detail-note">
          <span class="detail-note-label">教师备注：</span>{{ current.teacher_notes || '无' }}
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { View, Download, ChatDotSquare } from '@element-plus/icons-vue';
import { useStudentStore } from '../stores/student';
import { useAuthStore } from '../stores/auth';
import request from '../utils/request';

defineProps({ embedded: Boolean });
const studentStore = useStudentStore();
const authStore = useAuthStore();
const studentId = ref('');
const records = ref([]);
const visible = ref(false);
const current = ref(null);

const rangeText = (r) => ({ recent_2w: '近2周', recent_1m: '近1个月', custom: '自定义' }[r] || r);

onMounted(() => studentStore.fetchList());

async function load() {
  if (!studentId.value) return;
  records.value = await request.get('/feedback', { params: { student_id: studentId.value } });
}
function view(row) { current.value = row; visible.value = true; }
function exportOne(row) {
  const p = new URLSearchParams({ student_id: studentId.value, token: authStore.token });
  window.open(`/api/export/student-pdf?${p.toString()}`, '_blank');
}
</script>

<style scoped>
.detail-block { margin-bottom: 18px; }
.detail-label { font-size: 13px; font-weight: 700; margin-bottom: 10px; padding-left: 10px; border-left: 3px solid #34d399; }
.detail-short {
  background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399;
  border-radius: 10px; padding: 14px 16px; font-size: 14px; line-height: 1.7;
}
.detail-sec { margin-bottom: 14px; }
.detail-sec-label { font-size: 12.5px; font-weight: 700; margin-bottom: 6px; }
.detail-sec-label.adv { color: #34d399; }
.detail-sec-label.prob { color: #fb7185; }
.detail-sec-label.sugg { color: #818cf8; }
.detail-text {
  background: var(--panel-2); border: 1px solid var(--border); border-radius: 10px;
  padding: 12px 16px; font-size: 13.5px; line-height: 1.7; color: var(--text);
}
.detail-note { font-size: 13px; color: var(--text-sub); padding-top: 12px; border-top: 1px dashed var(--border); }
.detail-note-label { font-weight: 600; color: var(--text); }
</style>
