<template>
  <div class="page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><UserFilled /></el-icon></div>
        <div>
          <div class="page-header-tag">基础数据</div>
          <div class="page-header-title">学生管理</div>
          <div class="page-header-desc">维护学生档案，支持单条录入与批量导入</div>
        </div>
      </div>
      <el-button type="primary" size="large" :icon="Plus" @click="openDialog()">新增学生</el-button>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-icon blue"><el-icon><User /></el-icon></div>
        <div>
          <div class="stat-value">{{ totalStudents }}</div>
          <div class="stat-label">学生总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><el-icon><Male /></el-icon></div>
        <div>
          <div class="stat-value">{{ maleCount }}</div>
          <div class="stat-label">男生</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><el-icon><Female /></el-icon></div>
        <div>
          <div class="stat-value">{{ femaleCount }}</div>
          <div class="stat-label">女生</div>
        </div>
      </div>
    </div>

    <div class="panel" v-if="studentStore.list.length">
      <div class="chart-grid">
        <div>
          <div class="chart-title">性别分布</div>
          <MiniChart :option="genderChartOption" height="240px" />
        </div>
        <div>
          <div class="chart-title">各班人数分布</div>
          <MiniChart :option="classCountChartOption" height="240px" />
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="filter-bar">
        <el-select v-model="filter.class_id" placeholder="全部班级" clearable style="width:200px" @change="load">
          <el-option v-for="c in classStore.list" :key="c.id" :label="c.class_name" :value="c.id" />
        </el-select>
        <el-button :icon="Upload" @click="openBatch">批量导入</el-button>
      </div>
      <div class="table-wrap">
        <el-table :data="studentStore.list" stripe>
          <el-table-column prop="student_no" label="学号" width="140" />
          <el-table-column label="姓名" width="110">
            <template #default="{ row }">
              <el-link type="primary" :underline="false" class="stu-link" @click="router.push(`/students/${row.id}`)">
                {{ row.name }}
              </el-link>
            </template>
          </el-table-column>
          <el-table-column prop="gender" label="性别" width="80" />
          <el-table-column label="班级" width="140">
            <template #default="{ row }">{{ className(row.class_id) }}</template>
          </el-table-column>
          <el-table-column prop="enroll_date" label="入学时间" width="120" />
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
          <el-table-column label="操作" width="220">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button link type="success" :icon="View" @click="router.push(`/students/${row.id}`)">档案</el-button>
                <el-button link type="primary" :icon="Edit" @click="openDialog(row)">编辑</el-button>
                <el-popconfirm title="确认删除该学生？" @confirm="onDelete(row)">
                  <template #reference><el-button link type="danger" :icon="Delete">删除</el-button></template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无学生数据" />
          </template>
        </el-table>
      </div>
    </div>

    <!-- 单条/编辑 -->
    <el-dialog v-model="visible" :title="editing ? '编辑学生' : '新增学生'" width="460px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="姓名" prop="name"><el-input v-model="form.name" /></el-form-item>
        <el-form-item label="学号" prop="student_no"><el-input v-model="form.student_no" /></el-form-item>
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="form.gender"><el-radio value="男">男</el-radio><el-radio value="女">女</el-radio><el-radio value="其他">其他</el-radio></el-radio-group>
        </el-form-item>
        <el-form-item label="班级" prop="class_id">
          <el-select v-model="form.class_id" style="width:100%"><el-option v-for="c in classStore.list" :key="c.id" :label="c.class_name" :value="c.id" /></el-select>
        </el-form-item>
        <el-form-item label="入学时间" prop="enroll_date"><el-date-picker v-model="form.enroll_date" type="date" value-format="YYYY-MM-DD" /></el-form-item>
        <el-form-item label="备注" prop="remark"><el-input v-model="form.remark" type="textarea" :rows="2" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 批量导入 -->
    <el-dialog v-model="batchVisible" title="批量导入学生" width="520px">
      <el-alert type="info" :closable="false" title="每行一个学生: 姓名,学号,性别,班级名" description="示例: 张三,20240101,男,高一(3)班" style="margin-bottom:12px" />
      <el-input v-model="batchText" type="textarea" :rows="8" placeholder="张三,20240101,男,高一(3)班&#10;李四,20240102,女,高一(3)班" />
      <template #footer>
        <el-button @click="batchVisible = false">取消</el-button>
        <el-button type="primary" :loading="batchLoading" @click="onBatchSubmit">导入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { Plus, Upload, UserFilled, User, Male, Female, Edit, Delete, View } from '@element-plus/icons-vue';
import { useClassStore } from '../stores/class';
import { useStudentStore } from '../stores/student';
import { ElMessage } from 'element-plus';
import MiniChart from '../components/MiniChart.vue';
import { getChartColors } from '../utils/chartTheme';

const router = useRouter();
const classStore = useClassStore();
const studentStore = useStudentStore();
const filter = reactive({ class_id: '' });
const visible = ref(false);
const editing = ref(null);
const loading = ref(false);
const formRef = ref();
const form = reactive({ name: '', student_no: '', gender: '男', class_id: '', enroll_date: '', remark: '' });
const rules = {
  name: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  student_no: [{ required: true, message: '请输入学号', trigger: 'blur' }],
  gender: [{ required: true, message: '请选择性别', trigger: 'change' }],
  class_id: [{ required: true, message: '请选择班级', trigger: 'change' }],
};
const batchVisible = ref(false);
const batchText = ref('');
const batchLoading = ref(false);

const classMap = computed(() => Object.fromEntries(classStore.list.map((c) => [c.id, c.class_name])));
function className(id) { return classMap.value[id] || '-'; }

const totalStudents = computed(() => studentStore.list.length);
const maleCount = computed(() => studentStore.list.filter((s) => s.gender === '男').length);
const femaleCount = computed(() => studentStore.list.filter((s) => s.gender === '女').length);

const genderChartOption = computed(() => {
  const m = maleCount.value, f = femaleCount.value;
  const o = studentStore.list.filter((s) => s.gender !== '男' && s.gender !== '女').length;
  const c = getChartColors();
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    legend: { bottom: 0, icon: 'circle', itemWidth: 10, itemHeight: 10 },
    color: ['#3b82f6', '#f472b6', '#94a3b8'],
    series: [{
      type: 'pie', radius: ['48%', '72%'], center: ['50%', '44%'],
      avoidLabelOverlap: true,
      itemStyle: { borderRadius: 6, borderColor: c.bg, borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontWeight: 600, formatter: '{b}\n{c}人' } },
      data: [
        { name: '男', value: m },
        { name: '女', value: f },
        ...(o ? [{ name: '其他', value: o }] : []),
      ],
    }],
  };
});

const classCountChartOption = computed(() => {
  const map = {};
  studentStore.list.forEach((s) => { const n = className(s.class_id); map[n] = (map[n] || 0) + 1; });
  const names = Object.keys(map);
  const c = getChartColors();
  return {
    grid: { left: 40, right: 16, top: 20, bottom: 40 },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: names.length > 4 ? 25 : 0, color: c.textSub }, axisLine: { lineStyle: { color: c.border } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: c.textSub }, splitLine: { lineStyle: { color: c.borderLight } } },
    series: [{
      type: 'bar', data: names.map((n) => map[n]), barWidth: '50%',
      itemStyle: { borderRadius: [6, 6, 0, 0], color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: '#34d399' }, { offset: 1, color: '#059669' }] } },
    }],
  };
});

onMounted(async () => {
  await classStore.fetchList();
  await load();
});
function load() {
  return studentStore.fetchList(filter.class_id ? { class_id: filter.class_id } : {});
}

function openDialog(row) {
  editing.value = row || null;
  form.name = row?.name || '';
  form.student_no = row?.student_no || '';
  form.gender = row?.gender || '男';
  form.class_id = row?.class_id || classStore.list[0]?.id || '';
  form.enroll_date = row?.enroll_date || '';
  form.remark = row?.remark || '';
  visible.value = true;
}
async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    if (editing.value) await studentStore.update(editing.value.id, form);
    else await studentStore.create(form);
    ElMessage.success('保存成功');
    visible.value = false;
  } finally {
    loading.value = false;
  }
}
async function onDelete(row) {
  await studentStore.remove(row.id);
  ElMessage.success('删除成功');
}

function openBatch() { batchText.value = ''; batchVisible.value = true; }
async function onBatchSubmit() {
  const lines = batchText.value.trim().split('\n').filter(Boolean);
  if (!lines.length) return ElMessage.warning('请填写数据');
  const payload = [];
  for (const line of lines) {
    const [name, student_no, gender, className] = line.split(',').map((s) => s.trim());
    const cls = classStore.list.find((c) => c.class_name === className);
    if (!cls) return ElMessage.error(`未找到班级: ${className}`);
    payload.push({ name, student_no, gender: gender || '男', class_id: cls.id });
  }
  batchLoading.value = true;
  try {
    await studentStore.create(payload);
    ElMessage.success('导入成功');
    batchVisible.value = false;
    await load();
  } finally {
    batchLoading.value = false;
  }
}
</script>

<style scoped>
.stu-link { font-weight: 600; }
</style>
