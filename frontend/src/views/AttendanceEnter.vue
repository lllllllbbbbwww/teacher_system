<template>
  <div class="page">
    <h3 v-if="!embedded" class="page-title">考勤录入</h3>
    <div class="panel">
      <div class="toolbar">
        <el-select v-model="form.class_id" placeholder="选择班级" style="width:200px" @change="loadStudents">
          <el-option v-for="c in classStore.list" :key="c.id" :label="c.class_name" :value="c.id" />
        </el-select>
        <el-date-picker v-model="form.attend_date" type="date" value-format="YYYY-MM-DD" placeholder="考勤日期" />
        <el-button type="primary" :disabled="!form.class_id" :loading="saving" @click="onSubmit">保存考勤</el-button>
      </div>

      <div class="table-wrap" v-if="students.length">
        <el-table :data="students" border stripe>
          <el-table-column prop="student_no" label="学号" width="140" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column label="考勤状态">
            <template #default="{ row }">
              <el-radio-group v-model="row.status">
                <el-radio-button value="normal">正常</el-radio-button>
                <el-radio-button value="late">迟到</el-radio-button>
                <el-radio-button value="leave">请假</el-radio-button>
                <el-radio-button value="absent">旷课</el-radio-button>
              </el-radio-group>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else description="请先选择班级" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useClassStore } from '../stores/class';
import { useStudentStore } from '../stores/student';
import request from '../utils/request';
import { ElMessage } from 'element-plus';

defineProps({ embedded: Boolean });
const classStore = useClassStore();
const studentStore = useStudentStore();
const form = ref({ class_id: '', attend_date: new Date().toISOString().slice(0, 10) });
const students = ref([]);
const saving = ref(false);

onMounted(() => classStore.fetchList());

async function loadStudents() {
  if (!form.value.class_id) return;
  await studentStore.fetchList({ class_id: form.value.class_id });
  const list = await request.get('/attendance', {
    params: { class_id: form.value.class_id, start_date: form.value.attend_date, end_date: form.value.attend_date },
  });
  const map = Object.fromEntries(list.map((a) => [a.student_id, a.status]));
  students.value = studentStore.list.map((s) => ({ ...s, status: map[s.id] || 'normal' }));
}
async function onSubmit() {
  const records = students.value.map((s) => ({ student_id: s.id, status: s.status }));
  if (!records.length) return ElMessage.warning('无学生数据');
  saving.value = true;
  try {
    await request.post('/attendance/batch', { ...form.value, records });
    ElMessage.success('考勤已保存');
    await loadStudents();
  } finally {
    saving.value = false;
  }
}
</script>
