<template>
  <div class="page">
    <h3 v-if="!embedded" class="page-title">成绩分析</h3>
    <div class="panel">
      <div class="toolbar">
        <el-select v-model="examId" placeholder="选择考试" style="width:280px" filterable @change="query">
          <el-option v-for="e in commonStore.exams" :key="e.id" :label="`${e.exam_name}(${e.subject})`" :value="e.id" />
        </el-select>
        <el-button :icon="Download" :disabled="!examId" @click="exportExam">导出成绩 Excel</el-button>
      </div>

      <!-- 统计卡 -->
      <div v-if="stats" class="stat-grid">
        <div class="m-stat">
          <div class="m-top">
            <div>
              <div class="m-value">{{ stats.avg }}</div>
              <div class="m-label">全班平均分</div>
            </div>
          </div>
          <div class="m-change up">↗ 较上月 +{{ stats.avgChange ?? 0 }}</div>
        </div>
        <div class="m-stat">
          <div class="m-top">
            <div>
              <div class="m-value" style="color:#34d399">{{ avgAttendance }}%</div>
              <div class="m-label">平均出勤率</div>
            </div>
          </div>
          <div class="m-change neutral">本月统计</div>
        </div>
        <div class="m-stat">
          <div class="m-top">
            <div>
              <div class="m-value" style="color:#22d3ee">{{ stats.max }}</div>
              <div class="m-label">最高分</div>
            </div>
          </div>
          <div class="m-change neutral">{{ topStudentName }}</div>
        </div>
        <div class="m-stat">
          <div class="m-top">
            <div>
              <div class="m-value" style="color:#fb7185">{{ stats.min }}</div>
              <div class="m-label">最低分</div>
            </div>
          </div>
          <div class="m-change down">需重点关注</div>
        </div>
      </div>

      <!-- 图表区 -->
      <div class="charts-grid" v-if="examId">
        <div class="chart-box" v-if="list.length">
          <div class="chart-title">成绩分布</div>
          <div ref="chartRef" style="width:100%;height:300px"></div>
        </div>
        <div class="chart-box" v-if="classCompare.length">
          <div class="chart-title">各班级成绩对比</div>
          <div class="chart-sub">本月均分横向对比</div>
          <MiniChart :option="classCompOption" height="300px" />
        </div>
        <div class="chart-box" v-if="list.length">
          <div class="chart-title">分数段分布</div>
          <MiniChart :option="distOption" height="240px" />
        </div>
        <!-- 学科能力热力图 -->
        <div class="chart-box" v-if="subjectAbility.length">
          <div class="chart-title">知识点掌握热力图</div>
          <div class="chart-sub">各知识模块掌握程度分布</div>
          <div class="ability-list">
            <div class="ability-row" v-for="(s, i) in subjectAbility" :key="s.subject">
              <span class="ability-name">{{ s.subject }}</span>
              <div class="ability-bar-bg">
                <div class="ability-bar" :style="{ width: Math.min(100, (s.avg / 100) * 100) + '%', background: abilityColors[i % abilityColors.length] }"></div>
              </div>
              <span class="ability-pct">{{ s.avg }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 优秀 / 待提升 -->
      <div class="rank-row" v-if="topStudents.length || lowStudents.length">
        <div class="rank-card">
          <div class="rank-head good"><span class="rank-dot"></span>优秀学员 Top {{ topStudents.length }}</div>
          <div v-for="(r, i) in topStudents" :key="r.student_id" class="rank-item" @click="goProfile(r)">
            <span class="rank-no" :class="{ one: i === 0 }">{{ i + 1 }}</span>
            <span class="avatar-grad" :style="{ width: '30px', height: '30px', fontSize: '13px' }">{{ r.name[0] }}</span>
            <span class="rank-name">{{ r.name }}</span>
            <b class="rank-score">{{ r.score }} 分</b>
          </div>
        </div>
        <div class="rank-card">
          <div class="rank-head warn"><span class="rank-dot"></span>待提升学员</div>
          <div v-for="(r, i) in lowStudents" :key="r.student_id" class="rank-item" @click="goProfile(r)">
            <span class="rank-no">{{ i + 1 }}</span>
            <span class="avatar-grad" :style="{ width: '30px', height: '30px', fontSize: '13px' }">{{ r.name[0] }}</span>
            <span class="rank-name">{{ r.name }}</span>
            <b class="rank-score">{{ r.score }} 分</b>
          </div>
        </div>
      </div>

      <!-- 学员成绩进度看板 -->
      <div class="progress-box" v-if="progressRows.length">
        <div class="progress-header">
          <div>
            <div class="chart-title">学员成绩进度看板</div>
            <div class="chart-sub">全班学员月度变化一览</div>
          </div>
          <div class="progress-filters">
            <span
              v-for="f in progressFilters"
              :key="f.key"
              class="pf-tag"
              :class="{ active: progressFilter === f.key }"
              @click="progressFilter = f.key"
            >
              <span class="pf-dot" :class="f.key"></span>{{ f.label }} {{ progressCounts[f.key] }}人
            </span>
          </div>
        </div>
        <el-table :data="filteredProgress" size="small" @row-click="goProfileRow">
          <el-table-column label="学员" min-width="200">
            <template #default="{ row }">
              <div class="stu-cell">
                <span class="avatar-grad" :style="{ width: '28px', height: '28px', fontSize: '12px' }">{{ row.name[0] }}</span>
                <span>{{ row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="class_name" label="班级" width="140" />
          <el-table-column label="上次均分" width="110">
            <template #default="{ row }">{{ row.prev_score ?? '—' }}</template>
          </el-table-column>
          <el-table-column label="本次均分" width="110">
            <template #default="{ row }"><b>{{ row.cur_score }}</b></template>
          </el-table-column>
          <el-table-column label="变化" width="110">
            <template #default="{ row }">
              <span v-if="row.diff !== null" :class="row.trend === 'up' ? 'tag-pos' : row.trend === 'down' ? 'tag-imp' : 'text-sub'">
                {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}
              </span>
              <span v-else class="text-muted">—</span>
            </template>
          </el-table-column>
          <el-table-column label="出勤率" width="100">
            <template #default="{ row }">{{ row.attendance_rate ?? '—' }}<span v-if="row.attendance_rate !== null">%</span></template>
          </el-table-column>
          <el-table-column label="能力评级" width="120">
            <template #default="{ row }">
              <div class="star-cell">
                <el-icon v-for="n in 5" :key="n" :size="14" :color="n <= (row.gradeScore || 3) ? '#fbbf24' : 'var(--text-muted)'">
                  <Star />
                </el-icon>
              </div>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <span class="badge" :class="row.trend === 'up' ? 'green' : row.trend === 'down' ? 'red' : 'gray'">
                {{ row.trend === 'up' ? '进步' : row.trend === 'down' ? '下滑' : '稳定' }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </div>

      <!-- 排名明细 -->
      <div class="table-wrap" v-if="list.length">
        <div class="chart-title">成绩排名明细</div>
        <el-table :data="list" border stripe>
          <el-table-column prop="rank" label="排名" width="70" />
          <el-table-column prop="student_no" label="学号" width="130" />
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="score" label="分数" width="100" sortable />
          <el-table-column label="等级" width="100">
            <template #default="{ row }">
              <el-tag v-if="row.score >= totalScore * 0.8" type="success">优秀</el-tag>
              <el-tag v-else-if="row.score >= totalScore * 0.6" type="warning">及格</el-tag>
              <el-tag v-else type="danger">待提升</el-tag>
            </template>
          </el-table-column>
        </el-table>
      </div>
      <el-empty v-else-if="examId" description="暂无成绩数据" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick, watch } from 'vue';
import * as echarts from 'echarts';
import { useRouter } from 'vue-router';
import { Download, Star } from '@element-plus/icons-vue';
import { useCommonStore } from '../stores/common';
import { useAuthStore } from '../stores/auth';
import request from '../utils/request';
import MiniChart from '../components/MiniChart.vue';
import { ElMessage } from 'element-plus';

defineProps({ embedded: Boolean });
const router = useRouter();
const commonStore = useCommonStore();
const authStore = useAuthStore();
const examId = ref('');
const list = ref([]);
const stats = ref(null);
const topStudents = ref([]);
const lowStudents = ref([]);
const classCompare = ref([]);
const progressRows = ref([]);
const subjectAbility = ref([]);
const chartRef = ref(null);
let chart = null;

const totalScore = computed(() => commonStore.exams.find((e) => e.id === examId.value)?.total_score || 100);
const topStudentName = computed(() => topStudents.value[0]?.name || '—');
const avgAttendance = computed(() => {
  const arr = progressRows.value.map((r) => r.attendance_rate).filter((v) => v !== null && v !== undefined);
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : '—';
});

const progressFilter = ref('all');
const progressFilters = [
  { key: 'all', label: '全部' },
  { key: 'up', label: '进步' },
  { key: 'down', label: '下滑' },
  { key: 'flat', label: '稳定' },
];
const progressCounts = computed(() => ({
  all: progressRows.value.length,
  up: progressRows.value.filter((r) => r.trend === 'up').length,
  down: progressRows.value.filter((r) => r.trend === 'down').length,
  flat: progressRows.value.filter((r) => r.trend === 'flat').length,
}));
const filteredProgress = computed(() => {
  if (progressFilter.value === 'all') return progressRows.value;
  return progressRows.value.filter((r) => r.trend === progressFilter.value);
});

const abilityColors = ['#818cf8', '#22d3ee', '#f59e0b', '#34d399', '#fb7185', '#c4b5fd'];

onMounted(() => commonStore.fetchExams());

async function query() {
  if (!examId.value) return;
  const d = await request.get('/analytics/exam-overview', { params: { exam_id: examId.value } });
  list.value = d.list || [];
  stats.value = d.stats || null;
  topStudents.value = d.top_students || [];
  lowStudents.value = d.low_students || [];
  progressRows.value = (d.student_progress || []).map((r) => ({
    ...r,
    attendance_rate: null,
    gradeScore: r.cur_score >= totalScore.value * 0.9 ? 5 : r.cur_score >= totalScore.value * 0.8 ? 4 : r.cur_score >= totalScore.value * 0.6 ? 3 : r.cur_score >= totalScore.value * 0.4 ? 2 : 1,
  }));
  subjectAbility.value = d.subject_ability || [];
  // 查一下每个学员的出勤率
  if (progressRows.value.length) {
    const sids = progressRows.value.map((r) => r.student_id);
    const since = new Date();
    since.setDate(since.getDate() - 30);
    const { data: attData } = await request.get('/attendance/stats', {
      params: { student_ids: sids.join(','), start: since.toISOString().slice(0, 10), end: new Date().toISOString().slice(0, 10) },
    }).catch(() => ({ data: [] }));
    const attMap = {};
    for (const a of attData || []) attMap[a.student_id] = a.rate;
    for (const r of progressRows.value) r.attendance_rate = attMap[r.student_id] ?? null;
  }
  // 班级对比数据
  const dash = await request.get('/dashboard/summary').catch(() => null);
  classCompare.value = dash?.class_overview || [];
  await nextTick();
  renderChart();
}

function renderChart() {
  if (!chartRef.value) return;
  if (!chart) chart = echarts.init(chartRef.value);
  const names = list.value.map((s) => s.name);
  const scores = list.value.map((s) => s.score);
  const tc = 'var(--text-sub)';
  const gridC = 'var(--el-border-color-lighter)';
  chart.setOption({
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    tooltip: { trigger: 'axis', backgroundColor: 'var(--el-bg-color-overlay)', borderColor: 'var(--el-border-color)', textStyle: { color: 'var(--text)' } },
    xAxis: { type: 'category', data: names, axisLabel: { interval: 0, rotate: 30, color: tc }, axisLine: { lineStyle: { color: gridC } } },
    yAxis: { type: 'value', max: totalScore.value, axisLabel: { color: tc }, splitLine: { lineStyle: { color: gridC } } },
    series: [{
      type: 'bar', data: scores, barWidth: '50%',
      itemStyle: {
        borderRadius: [6, 6, 0, 0],
        color: (p) => {
          const v = scores[p.dataIndex];
          return v >= totalScore.value * 0.8 ? '#34d399' : v >= totalScore.value * 0.6 ? '#818cf8' : '#fb7185';
        },
      },
    }],
  });
}

const classCompOption = computed(() => {
  const tc = 'var(--text-sub)';
  const gridC = 'var(--el-border-color-lighter)';
  return {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: 'var(--el-bg-color-overlay)', borderColor: 'var(--el-border-color)', textStyle: { color: 'var(--text)' } },
    xAxis: { type: 'category', data: classCompare.value.map((c) => c.class_name), axisLabel: { color: tc }, axisLine: { lineStyle: { color: gridC } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: tc }, splitLine: { lineStyle: { color: gridC } } },
    series: [{
      type: 'bar', data: classCompare.value.map((c) => c.avg), barWidth: '45%',
      itemStyle: { borderRadius: [6, 6, 0, 0], color: '#6366f1' },
      label: { show: true, position: 'top', formatter: (p) => p.value ?? '—', color: tc },
      markLine: {
        data: [{ type: 'average', name: '均值' }],
        lineStyle: { type: 'dashed', color: '#f59e0b' },
        label: { formatter: '均值 {c}', color: tc },
      },
    }],
  };
});

const distOption = computed(() => {
  const total = totalScore.value;
  const bands = [
    { label: `<60%`, min: 0, max: total * 0.6 },
    { label: `60-70%`, min: total * 0.6, max: total * 0.7 },
    { label: `70-80%`, min: total * 0.7, max: total * 0.8 },
    { label: `80-90%`, min: total * 0.8, max: total * 0.9 },
    { label: `90-100%`, min: total * 0.9, max: total + 0.001 },
  ];
  const counts = bands.map((b) => list.value.filter((s) => s.score >= b.min && s.score < b.max).length);
  const tc = 'var(--text-sub)';
  const gridC = 'var(--el-border-color-lighter)';
  return {
    grid: { left: 40, right: 20, top: 20, bottom: 30 },
    tooltip: { trigger: 'axis', backgroundColor: 'var(--el-bg-color-overlay)', borderColor: 'var(--el-border-color)', textStyle: { color: 'var(--text)' } },
    xAxis: { type: 'category', data: bands.map((b) => b.label), axisLabel: { color: tc }, axisLine: { lineStyle: { color: gridC } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: tc }, splitLine: { lineStyle: { color: gridC } } },
    series: [{
      type: 'bar', data: counts, barWidth: '55%',
      itemStyle: { borderRadius: [6, 6, 0, 0], color: (p) => ['#fb7185', '#f59e0b', '#fbbf24', '#818cf8', '#34d399'][p.dataIndex] },
      label: { show: true, position: 'top', color: tc },
    }],
  };
});

function goProfile(r) {
  router.push(`/students/${r.student_id}`);
}
function goProfileRow(row) {
  router.push(`/students/${row.student_id}`);
}
function exportExam() {
  if (!examId.value) return ElMessage.warning('请选择考试');
  const p = new URLSearchParams({ exam_id: examId.value, token: authStore.token });
  window.open(`/api/export/exam-excel?${p.toString()}`, '_blank');
}
watch(examId, () => { stats.value = null; list.value = []; });
</script>

<style scoped>
.toolbar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }

/* 统计卡 */
.stat-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin: 14px 0; }
@media (max-width: 900px) { .stat-grid { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 500px) { .stat-grid { grid-template-columns: 1fr; } }

.m-stat {
  background: var(--panel); border: 1px solid var(--border); border-radius: 16px;
  padding: 18px 20px; display: flex; flex-direction: column; gap: 10px;
}
.m-value { font-size: 32px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; line-height: 1.1; }
.m-label { font-size: 13px; color: var(--text-muted); margin-top: 4px; }
.m-change { font-size: 12px; font-weight: 600; }
.m-change.up { color: #34d399; }
.m-change.down { color: #fb7185; }
.m-change.neutral { color: var(--text-muted); }

/* 图表区 */
.charts-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 14px 0; }
@media (max-width: 1000px) { .charts-grid { grid-template-columns: 1fr; } }
.chart-box { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
.chart-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 4px; }
.chart-sub { font-size: 12.5px; color: var(--text-muted); margin-bottom: 10px; }

/* 学科能力热力图 */
.ability-list { display: flex; flex-direction: column; gap: 14px; margin-top: 8px; }
.ability-row { display: flex; align-items: center; gap: 12px; }
.ability-name { width: 90px; font-size: 13px; color: var(--text-sub); flex: none; }
.ability-bar-bg { flex: 1; height: 10px; border-radius: 999px; background: var(--panel-hover); overflow: hidden; }
.ability-bar { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
.ability-pct { width: 48px; text-align: right; font-size: 13px; font-weight: 700; color: var(--text); }

/* 优秀/待提升 */
.rank-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 14px 0; }
@media (max-width: 800px) { .rank-row { grid-template-columns: 1fr; } }
.rank-card { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 14px; }
.rank-head { display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 700; margin-bottom: 10px; }
.rank-head.good { color: #34d399; }
.rank-head.warn { color: #fbbf24; }
.rank-dot { width: 8px; height: 8px; border-radius: 50%; background: currentColor; }
.rank-item {
  display: flex; align-items: center; gap: 10px; padding: 8px 6px; border-radius: 10px;
  cursor: pointer; transition: background 0.15s ease;
}
.rank-item:hover { background: rgba(99, 102, 241, 0.08); }
.rank-no {
  width: 22px; height: 22px; border-radius: 7px; flex: none; font-size: 12px; font-weight: 800;
  display: flex; align-items: center; justify-content: center; background: var(--panel-hover); color: var(--text-sub);
}
.rank-no.one { background: linear-gradient(135deg, #f59e0b, #fbbf24); color: #1a1206; }
.rank-name { flex: 1; font-size: 13.5px; color: var(--text); }
.rank-score { font-size: 13px; color: var(--text); font-variant-numeric: tabular-nums; }

/* 进度看板 */
.progress-box { background: var(--panel); border: 1px solid var(--border); border-radius: 14px; padding: 14px; margin-top: 14px; }
.progress-header { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 12px; }
.progress-filters { display: flex; gap: 10px; flex-wrap: wrap; }
.pf-tag {
  display: flex; align-items: center; gap: 6px; padding: 5px 12px; border-radius: 999px;
  font-size: 12.5px; font-weight: 600; cursor: pointer; user-select: none;
  border: 1px solid var(--border); color: var(--text-sub); background: var(--panel-2);
  transition: all 0.15s ease;
}
.pf-tag:hover { border-color: rgba(99, 102, 241, 0.45); }
.pf-tag.active { background: rgba(99, 102, 241, 0.14); border-color: var(--primary); color: var(--primary); }
.pf-dot { width: 8px; height: 8px; border-radius: 50%; }
.pf-dot.up { background: #34d399; }
.pf-dot.down { background: #fb7185; }
.pf-dot.flat { background: #94a3b8; }

.stu-cell { display: flex; align-items: center; gap: 10px; font-weight: 500; }
.star-cell { display: flex; gap: 2px; }
.progress-box :deep(.el-table__row) { cursor: pointer; }
</style>
