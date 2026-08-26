<template>
  <div class="page">
    <h3 v-if="!embedded" class="page-title">考勤统计</h3>
    <div class="panel">
      <div class="toolbar">
        <el-select v-model="classId" placeholder="选择班级" style="width:200px" @change="load">
          <el-option v-for="c in classStore.list" :key="c.id" :label="c.class_name" :value="c.id" />
        </el-select>
        <el-date-picker v-model="range" type="daterange" value-format="YYYY-MM-DD" @change="load" />
        <el-button :icon="Download" @click="exportExcel">导出Excel</el-button>
      </div>

      <div v-if="records.length" class="chart-grid" style="margin-bottom:8px">
        <div>
          <div class="chart-title">考勤状态占比</div>
          <MiniChart :option="statusPieOption" height="240px" />
        </div>
        <div>
          <div class="chart-title">每日出勤趋势</div>
          <MiniChart :option="dailyTrendOption" height="240px" />
        </div>
      </div>

      <h4 class="text-sub" style="margin:16px 0 8px">近30天异常预警（迟到+旷课≥3次）</h4>
      <div class="table-wrap" v-if="abnormal.length">
        <el-table :data="abnormal" border stripe>
          <el-table-column prop="student_no" label="学号" width="140" />
          <el-table-column prop="student_name" label="姓名" width="100" />
          <el-table-column prop="count" label="异常次数" />
        </el-table>
      </div>
      <el-empty v-else description="近30天无异常预警学生" />

      <h4 class="text-sub" style="margin:16px 0 8px">考勤明细</h4>
      <div class="table-wrap" v-if="records.length">
        <el-table :data="records" border stripe>
          <el-table-column prop="student_no" label="学号" width="140" />
          <el-table-column prop="student_name" label="姓名" width="100" />
          <el-table-column prop="attend_date" label="日期" width="140" />
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="statusType(row.status)">{{ statusText(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="remark" label="备注" show-overflow-tooltip />
        </el-table>
      </div>
      <el-empty v-else description="暂无考勤记录" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Download } from '@element-plus/icons-vue';
import { useClassStore } from '../stores/class';
import request from '../utils/request';
import { ElMessage } from 'element-plus';
import MiniChart from '../components/MiniChart.vue';
import { getChartColors } from '../utils/chartTheme';

defineProps({ embedded: Boolean });
const classStore = useClassStore();
const classId = ref('');
const range = ref([]);
const records = ref([]);
const abnormal = ref([]);

const statusPieOption = computed(() => {
  const cnt = { normal: 0, late: 0, leave: 0, absent: 0 };
  records.value.forEach((r) => { if (cnt[r.status] !== undefined) cnt[r.status]++; });
  const c = getChartColors();
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}次 ({d}%)', backgroundColor: c.bgOverlay, borderColor: c.border, textStyle: { color: c.text } },
    legend: { bottom: 0, icon: 'circle', itemWidth: 10, itemHeight: 10, textStyle: { color: c.textSub } },
    color: ['#34d399', '#f59e0b', '#818cf8', '#fb7185'],
    series: [{
      type: 'pie', radius: ['48%', '72%'], center: ['50%', '44%'],
      itemStyle: { borderRadius: 6, borderColor: c.bg, borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontWeight: 600, formatter: '{b}\n{c}次', color: c.text } },
      data: [
        { name: '正常', value: cnt.normal },
        { name: '迟到', value: cnt.late },
        { name: '请假', value: cnt.leave },
        { name: '旷课', value: cnt.absent },
      ],
    }],
  };
});

const dailyTrendOption = computed(() => {
  const byDate = {};
  records.value.forEach((r) => {
    byDate[r.attend_date] = byDate[r.attend_date] || { normal: 0, abnormal: 0 };
    if (r.status === 'normal') byDate[r.attend_date].normal++;
    else byDate[r.attend_date].abnormal++;
  });
  const dates = Object.keys(byDate).sort();
  const c = getChartColors();
  return {
    grid: { left: 40, right: 16, top: 30, bottom: 40 },
    tooltip: { trigger: 'axis', backgroundColor: c.bgOverlay, borderColor: c.border, textStyle: { color: c.text } },
    legend: { top: 0, icon: 'circle', itemWidth: 10, itemHeight: 10, textStyle: { color: c.textSub } },
    xAxis: { type: 'category', data: dates, axisLabel: { rotate: 30, color: c.textSub }, axisLine: { lineStyle: { color: c.border } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: c.textSub }, splitLine: { lineStyle: { color: c.borderLight } } },
    series: [
      { name: '正常', type: 'line', smooth: true, data: dates.map((d) => byDate[d].normal), itemStyle: { color: '#34d399' }, areaStyle: { color: 'rgba(52,211,153,0.12)' } },
      { name: '异常', type: 'line', smooth: true, data: dates.map((d) => byDate[d].abnormal), itemStyle: { color: '#fb7185' }, areaStyle: { color: 'rgba(251,113,133,0.12)' } },
    ],
  };
});

const statusText = (s) => ({ normal: '正常', late: '迟到', leave: '请假', absent: '旷课' }[s] || s);
const statusType = (s) => ({ normal: 'success', late: 'warning', leave: 'info', absent: 'danger' }[s] || '');

onMounted(() => classStore.fetchList());

async function load() {
  if (!classId.value) return;
  const params = { class_id: classId.value };
  if (range.value?.length === 2) { params.start_date = range.value[0]; params.end_date = range.value[1]; }
  records.value = await request.get('/attendance', { params });
  abnormal.value = await request.get('/attendance/summary', { params: { class_id: classId.value } });
}
function exportExcel() {
  if (!classId.value) return ElMessage.warning('请选择班级');
  const params = new URLSearchParams({ class_id: classId.value });
  if (range.value?.length === 2) { params.append('start_date', range.value[0]); params.append('end_date', range.value[1]); }
  window.open(`/api/export/attendance-excel?${params.toString()}`, '_blank');
}
</script>
