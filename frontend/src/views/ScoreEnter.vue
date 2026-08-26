<template>
  <div class="page">
    <h3 v-if="!embedded" class="page-title">成绩录入</h3>
    <div class="panel">
      <div class="toolbar">
        <el-select v-model="examId" placeholder="选择考试" style="width:280px" @change="loadStudents" filterable>
          <el-option v-for="e in commonStore.exams" :key="e.id" :label="`${e.exam_name}(${e.subject})`" :value="e.id" />
        </el-select>
        <el-upload :show-file-list="false" :before-upload="onFile" accept=".csv,.txt">
          <el-button :icon="Upload">导入CSV</el-button>
        </el-upload>
        <el-button type="primary" :disabled="!examId" :loading="saving" @click="onSubmit">保存成绩</el-button>
      </div>

      <div v-if="enteredCount" style="margin-bottom:16px">
        <div class="chart-title">已录入成绩分布（{{ enteredCount }}/{{ students.length }} 人）</div>
        <MiniChart :option="distOption" height="220px" />
      </div>

      <div class="table-wrap" v-if="students.length">
        <el-table :data="students" border stripe>
          <el-table-column prop="student_no" label="学号" width="140" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column :label="`分数 (满分 ${totalScore})`" width="160">
            <template #default="{ row }">
              <el-input-number v-model="row.score" :min="0" :max="totalScore" :step="1" controls-position="right" style="width:120px" />
            </template>
          </el-table-column>
          <el-table-column label="状态" width="120">
            <template #default="{ row }">
              <span v-if="row.score !== null && row.score !== ''" class="tag-pos">已录入</span>
              <span v-else class="text-sub">待录入</span>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="请先选择考试" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Upload } from '@element-plus/icons-vue';
import { useCommonStore } from '../stores/common';
import { useStudentStore } from '../stores/student';
import request from '../utils/request';
import { ElMessage } from 'element-plus';
import MiniChart from '../components/MiniChart.vue';
import { getChartColors } from '../utils/chartTheme';

defineProps({ embedded: Boolean });
const commonStore = useCommonStore();
const studentStore = useStudentStore();
const examId = ref('');
const students = ref([]);
const saving = ref(false);

const totalScore = computed(() => commonStore.exams.find((e) => e.id === examId.value)?.total_score || 100);

const enteredCount = computed(() => students.value.filter((s) => s.score !== null && s.score !== '').length);

const distOption = computed(() => {
  const total = totalScore.value;
  const bands = [
    { label: '<60%', min: 0, max: total * 0.6 },
    { label: '60-70%', min: total * 0.6, max: total * 0.7 },
    { label: '70-80%', min: total * 0.7, max: total * 0.8 },
    { label: '80-90%', min: total * 0.8, max: total * 0.9 },
    { label: '90-100%', min: total * 0.9, max: total + 0.001 },
  ];
  const entered = students.value.filter((s) => s.score !== null && s.score !== '');
  const counts = bands.map((b) => entered.filter((s) => s.score >= b.min && s.score < b.max).length);
  const c = getChartColors();
  return {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: c.bgOverlay, borderColor: c.border, textStyle: { color: c.text } },
    xAxis: { type: 'category', data: bands.map((b) => b.label), axisLabel: { color: c.textSub }, axisLine: { lineStyle: { color: c.border } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: c.textSub }, splitLine: { lineStyle: { color: c.borderLight } } },
    series: [{
      type: 'bar', data: counts, barWidth: '55%',
      itemStyle: { borderRadius: [6, 6, 0, 0], color: (p) => ['#ef4444', '#f59e0b', '#eab308', '#3b82f6', '#22c55e'][p.dataIndex] },
      label: { show: true, position: 'top', color: c.textMuted },
    }],
  };
});

onMounted(() => commonStore.fetchExams());

async function loadStudents() {
  if (!examId.value) return;
  const exam = commonStore.exams.find((e) => e.id === examId.value);
  await studentStore.fetchList({ class_id: exam.class_id });
  // 已录入成绩回填
  const scores = await request.get('/scores', { params: { exam_id: examId.value } });
  const map = Object.fromEntries(scores.list.map((s) => [s.student_id, s.score]));
  students.value = studentStore.list.map((s) => ({ ...s, score: map[s.id] ?? null }));
}
function onFile(file) {
  const reader = new FileReader();
  reader.onload = () => {
    const map = {};
    reader.result.split('\n').filter(Boolean).forEach((line) => {
      const [no, score] = line.split(',').map((x) => x.trim());
      if (no) map[no] = Number(score);
    });
    let hit = 0;
    students.value = students.value.map((s) => {
      if (map[s.student_no] !== undefined) { hit++; return { ...s, score: map[s.student_no] }; }
      return s;
    });
    ElMessage.success(`CSV已匹配 ${hit} 名学生`);
  };
  reader.readAsText(file);
  return false;
}
async function onSubmit() {
  const scores = students.value
    .filter((s) => s.score !== null && s.score !== '')
    .map((s) => ({ student_id: s.id, score: Number(s.score) }));
  if (!scores.length) return ElMessage.warning('请至少录入1条成绩');
  saving.value = true;
  try {
    const d = await request.post('/scores/batch', { exam_id: examId.value, scores });
    ElMessage.success(d.stats ? `均分${d.stats.avg} 录入完成` : '录入完成');
    await loadStudents();
  } finally {
    saving.value = false;
  }
}
</script>
