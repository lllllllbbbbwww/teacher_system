<template>
  <div class="page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><OfficeBuilding /></el-icon></div>
        <div>
          <div class="page-header-tag">基础数据</div>
          <div class="page-header-title">班级管理</div>
          <div class="page-header-desc">维护班级基础信息，支持新增、编辑与删除</div>
        </div>
      </div>
      <el-button type="primary" size="large" :icon="Plus" @click="openDialog()">新增班级</el-button>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-icon blue"><el-icon><School /></el-icon></div>
        <div>
          <div class="stat-value">{{ totalClasses }}</div>
          <div class="stat-label">班级总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><el-icon><Collection /></el-icon></div>
        <div>
          <div class="stat-value">{{ totalGrades }}</div>
          <div class="stat-label">年级数量</div>
        </div>
      </div>
    </div>

    <div class="panel" v-if="classStore.list.length">
      <div class="chart-title">各年级班级数量分布</div>
      <MiniChart :option="gradeChartOption" height="240px" />
    </div>

    <div class="panel">
      <div class="table-wrap">
        <el-table :data="classStore.list" stripe>
          <el-table-column prop="class_name" label="班级名称" />
          <el-table-column prop="grade" label="年级" />
          <el-table-column prop="created_at" label="创建时间" width="180" />
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button link type="primary" :icon="Edit" @click="openDialog(row)">编辑</el-button>
                <el-popconfirm title="确认删除该班级？" @confirm="onDelete(row)">
                  <template #reference>
                    <el-button link type="danger" :icon="Delete">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无班级数据，点击右上角“新增班级”创建" />
          </template>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="visible" :title="editing ? '编辑班级' : '新增班级'" width="420px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="班级名称" prop="class_name">
          <el-input v-model="form.class_name" placeholder="如：高一(3)班" />
        </el-form-item>
        <el-form-item label="年级" prop="grade">
          <el-input v-model="form.grade" placeholder="如：高一" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Plus, OfficeBuilding, School, Collection, Edit, Delete } from '@element-plus/icons-vue';
import { useClassStore } from '../stores/class';
import { ElMessage } from 'element-plus';
import MiniChart from '../components/MiniChart.vue';
import { getChartColors } from '../utils/chartTheme';

const classStore = useClassStore();
const totalClasses = computed(() => classStore.list.length);
const totalGrades = computed(() => new Set(classStore.list.map(c => c.grade)).size);

const gradeChartOption = computed(() => {
  const map = {};
  classStore.list.forEach((c) => { map[c.grade] = (map[c.grade] || 0) + 1; });
  const grades = Object.keys(map);
  const c = getChartColors();
  return {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: grades, axisLabel: { color: c.textSub }, axisLine: { lineStyle: { color: c.border } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: c.textSub }, splitLine: { lineStyle: { color: c.borderLight } } },
    series: [{
      type: 'bar', data: grades.map((g) => map[g]), barWidth: '45%',
      itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#60a5fa' }, { offset: 1, color: '#2563eb' }] } },
    }],
  };
});
const visible = ref(false);
const editing = ref(null);
const loading = ref(false);
const formRef = ref();
const form = reactive({ class_name: '', grade: '' });
const rules = {
  class_name: [{ required: true, message: '请输入班级名称', trigger: 'blur' }],
  grade: [{ required: true, message: '请输入年级', trigger: 'blur' }],
};

onMounted(() => classStore.fetchList());

function openDialog(row) {
  editing.value = row || null;
  form.class_name = row?.class_name || '';
  form.grade = row?.grade || '';
  visible.value = true;
}
async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    if (editing.value) await classStore.update(editing.value.id, form);
    else await classStore.create(form);
    ElMessage.success('保存成功');
    visible.value = false;
  } finally {
    loading.value = false;
  }
}
async function onDelete(row) {
  await classStore.remove(row.id);
  ElMessage.success('删除成功');
}
</script>

<style scoped>
/* 班级管理页特有微调 */
</style>
