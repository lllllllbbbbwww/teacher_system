<template>
  <div class="page">
    <div v-if="!embedded" class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Calendar /></el-icon></div>
        <div>
          <div class="page-header-tag">成绩与考勤</div>
          <div class="page-header-title">考试管理</div>
          <div class="page-header-desc">管理考试场次，为成绩录入提供基础数据</div>
        </div>
      </div>
      <el-button type="primary" size="large" :icon="Plus" @click="openDialog()">新增考试</el-button>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-icon blue"><el-icon><Document /></el-icon></div>
        <div>
          <div class="stat-value">{{ totalExams }}</div>
          <div class="stat-label">考试总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><el-icon><Collection /></el-icon></div>
        <div>
          <div class="stat-value">{{ subjectCount }}</div>
          <div class="stat-label">科目数量</div>
        </div>
      </div>
    </div>

    <div class="panel" v-if="commonStore.exams.length">
      <div class="chart-title">各科目考试数量</div>
      <MiniChart :option="subjectChartOption" height="230px" />
    </div>

    <div class="panel">
      <div class="filter-bar">
        <el-select v-model="filter.class_id" placeholder="全部班级" clearable style="width:200px" @change="load">
          <el-option v-for="c in classStore.list" :key="c.id" :label="c.class_name" :value="c.id" />
        </el-select>
      </div>
      <div class="table-wrap">
        <el-table :data="commonStore.exams" stripe>
          <el-table-column prop="exam_name" label="考试名称" />
          <el-table-column prop="subject" label="科目" width="100" />
          <el-table-column prop="total_score" label="满分" width="80" />
          <el-table-column prop="exam_time" label="考试时间" width="140" />
          <el-table-column label="班级" width="140">
            <template #default="{ row }">{{ className(row.class_id) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button link type="primary" :icon="Edit" @click="openDialog(row)">编辑</el-button>
                <el-popconfirm title="确认删除？" @confirm="onDelete(row)">
                  <template #reference><el-button link type="danger" :icon="Delete">删除</el-button></template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无考试数据" />
          </template>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="visible" :title="editing ? '编辑考试' : '新增考试'" width="460px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="考试名称" prop="exam_name"><el-input v-model="form.exam_name" /></el-form-item>
        <el-form-item label="科目" prop="subject"><el-input v-model="form.subject" /></el-form-item>
        <el-form-item label="满分" prop="total_score"><el-input-number v-model="form.total_score" :min="1" /></el-form-item>
        <el-form-item label="考试时间" prop="exam_time"><el-date-picker v-model="form.exam_time" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="班级" prop="class_id">
          <el-select v-model="form.class_id" style="width:100%"><el-option v-for="c in classStore.list" :key="c.id" :label="c.class_name" :value="c.id" /></el-select>
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
import { Plus, Calendar, Document, Collection, Edit, Delete } from '@element-plus/icons-vue';
import { useClassStore } from '../stores/class';
import { useCommonStore } from '../stores/common';
import { ElMessage } from 'element-plus';
import MiniChart from '../components/MiniChart.vue';
import { getChartColors } from '../utils/chartTheme';

defineProps({ embedded: Boolean });
const classStore = useClassStore();
const commonStore = useCommonStore();
const filter = reactive({ class_id: '' });
const visible = ref(false);
const editing = ref(null);
const loading = ref(false);
const formRef = ref();
const form = reactive({ exam_name: '', subject: '', total_score: 100, exam_time: '', class_id: '' });
const rules = {
  exam_name: [{ required: true, message: '请输入考试名称', trigger: 'blur' }],
  subject: [{ required: true, message: '请输入科目', trigger: 'blur' }],
  total_score: [{ required: true, message: '请输入满分', trigger: 'blur' }],
  exam_time: [{ required: true, message: '请选择时间', trigger: 'change' }],
  class_id: [{ required: true, message: '请选择班级', trigger: 'change' }],
};
const classMap = computed(() => Object.fromEntries(classStore.list.map((c) => [c.id, c.class_name])));
function className(id) { return classMap.value[id] || '-'; }

const totalExams = computed(() => commonStore.exams.length);
const subjectCount = computed(() => new Set(commonStore.exams.map((e) => e.subject)).size);

const subjectChartOption = computed(() => {
  const map = {};
  commonStore.exams.forEach((e) => { map[e.subject] = (map[e.subject] || 0) + 1; });
  const subjects = Object.keys(map);
  const c = getChartColors();
  return {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: c.bgOverlay, borderColor: c.border, textStyle: { color: c.text } },
    xAxis: { type: 'category', data: subjects, axisLabel: { color: c.textSub }, axisLine: { lineStyle: { color: c.border } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: c.textSub }, splitLine: { lineStyle: { color: c.borderLight } } },
    series: [{
      type: 'bar', data: subjects.map((s) => map[s]), barWidth: '45%',
      itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#a78bfa' }, { offset: 1, color: '#7c3aed' }] } },
    }],
  };
});

onMounted(async () => { await classStore.fetchList(); await load(); });
function load() { return commonStore.fetchExams(filter.class_id ? { class_id: filter.class_id } : {}); }

function openDialog(row) {
  editing.value = row || null;
  Object.assign(form, {
    exam_name: row?.exam_name || '',
    subject: row?.subject || '',
    total_score: row?.total_score || 100,
    exam_time: row?.exam_time || '',
    class_id: row?.class_id || classStore.list[0]?.id || '',
  });
  visible.value = true;
}
async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    if (editing.value) await commonStore.updateExam(editing.value.id, form);
    else await commonStore.createExam(form);
    ElMessage.success('保存成功');
    visible.value = false;
  } finally {
    loading.value = false;
  }
}
async function onDelete(row) {
  await commonStore.removeExam(row.id);
  ElMessage.success('删除成功');
}
</script>
