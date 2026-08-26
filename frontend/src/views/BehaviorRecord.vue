<template>
  <div :class="['page', { embedded }]">
    <h3 v-if="!embedded" class="page-title">行为记录</h3>
    <div class="panel">
      <div class="toolbar">
        <el-select v-model="filter.class_id" placeholder="班级" clearable style="width:180px" @change="load">
          <el-option v-for="c in classStore.list" :key="c.id" :label="c.class_name" :value="c.id" />
        </el-select>
        <el-select v-model="filter.student_id" placeholder="学生" clearable style="width:180px" @change="load">
          <el-option v-for="s in studentStore.list" :key="s.id" :label="s.name" :value="s.id" />
        </el-select>
        <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" @change="load" />
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增记录</el-button>
      </div>
      <div v-if="records.length" style="margin-bottom:16px">
        <div class="chart-title">行为标签出现频次 Top</div>
        <MiniChart :option="tagFreqOption" height="260px" />
      </div>
      <div class="table-wrap">
        <el-table :data="records" border stripe>
          <el-table-column prop="student_name" label="学生" width="100" />
          <el-table-column prop="lesson_date" label="日期" width="140" />
          <el-table-column label="标签">
            <template #default="{ row }">
              <el-tag v-for="t in row.tags" :key="t.id" :type="t.tag_type === 'positive' ? 'success' : 'danger'" style="margin-right:4px">
                {{ t.tag_name }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="teacher_remark" label="教师备注" show-overflow-tooltip />
        </el-table>
      </div>
    </div>

    <el-dialog v-model="visible" title="新增行为记录" width="460px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="班级" prop="class_id">
          <el-select v-model="form.class_id" style="width:100%" @change="onClassChange"><el-option v-for="c in classStore.list" :key="c.id" :label="c.class_name" :value="c.id" /></el-select>
        </el-form-item>
        <el-form-item label="学生" prop="student_id">
          <el-select v-model="form.student_id" style="width:100%"><el-option v-for="s in studentsOfClass" :key="s.id" :label="s.name" :value="s.id" /></el-select>
        </el-form-item>
        <el-form-item label="日期" prop="lesson_date"><el-date-picker v-model="form.lesson_date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="行为标签" prop="tag_ids">
          <el-select v-model="form.tag_ids" multiple style="width:100%">
            <el-option v-for="t in commonStore.behaviorTags" :key="t.id" :label="t.tag_name" :value="t.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="备注" prop="teacher_remark"><el-input v-model="form.teacher_remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus } from '@element-plus/icons-vue';
import { useClassStore } from '../stores/class';
import { useStudentStore } from '../stores/student';
import { useCommonStore } from '../stores/common';
import request from '../utils/request';
import { ElMessage } from 'element-plus';
import MiniChart from '../components/MiniChart.vue';
import { getChartColors } from '../utils/chartTheme';

const props = defineProps({ embedded: Boolean });

const classStore = useClassStore();
const studentStore = useStudentStore();
const commonStore = useCommonStore();
const filter = reactive({ class_id: '', student_id: '' });
const range = ref([]);
const records = ref([]);
const visible = ref(false);
const loading = ref(false);
const studentsOfClass = ref([]);
const formRef = ref();
const form = reactive({ class_id: '', student_id: '', lesson_date: '', tag_ids: [], teacher_remark: '' });

const tagFreqOption = computed(() => {
  const freq = {};
  records.value.forEach((r) => {
    (r.tags || []).forEach((t) => {
      freq[t.tag_name] = freq[t.tag_name] || { count: 0, type: t.tag_type };
      freq[t.tag_name].count++;
    });
  });
  const sorted = Object.entries(freq).sort((a, b) => b[1].count - a[1].count).slice(0, 10);
  const names = sorted.map(([n]) => n);
  const data = sorted.map(([, v]) => ({
    value: v.count,
    itemStyle: { color: v.type === 'positive' ? '#22c55e' : '#ef4444', borderRadius: [0, 6, 6, 0] },
  }));
  const c = getChartColors();
  return {
    grid: { left: 110, right: 30, top: 10, bottom: 20 },
    tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: c.bgOverlay, borderColor: c.border, textStyle: { color: c.text } },
    xAxis: { type: 'value', minInterval: 1, axisLabel: { color: c.textSub }, splitLine: { lineStyle: { color: c.borderLight } } },
    yAxis: { type: 'category', data: names, inverse: true, axisLabel: { color: c.textSub }, axisLine: { lineStyle: { color: c.border } } },
    series: [{ type: 'bar', data, barWidth: '55%' }],
  };
});
const rules = {
  class_id: [{ required: true, message: '请选择班级', trigger: 'change' }],
  student_id: [{ required: true, message: '请选择学生', trigger: 'change' }],
  lesson_date: [{ required: true, message: '请选择日期', trigger: 'change' }],
  tag_ids: [{ required: true, type: 'array', min: 1, message: '至少选择1个标签', trigger: 'change' }],
};

onMounted(async () => {
  await classStore.fetchList();
  await commonStore.fetchBehaviorTags();
  await load();
});
async function load() {
  const params = {};
  if (filter.class_id) params.class_id = filter.class_id;
  if (filter.student_id) params.student_id = filter.student_id;
  if (range.value?.length === 2) { params.start_date = range.value[0]; params.end_date = range.value[1]; }
  records.value = await request.get('/behaviors/records', { params });
}
async function onClassChange(id) {
  form.student_id = '';
  if (!id) { studentsOfClass.value = []; return; }
  await studentStore.fetchList({ class_id: id });
  studentsOfClass.value = studentStore.list;
}
function openDialog() { Object.assign(form, { class_id: '', student_id: '', lesson_date: '', tag_ids: [], teacher_remark: '' }); studentsOfClass.value = []; visible.value = true; }
async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    await request.post('/behaviors/records', form);
    ElMessage.success('记录成功');
    visible.value = false;
    await load();
  } finally {
    loading.value = false;
  }
}
</script>
