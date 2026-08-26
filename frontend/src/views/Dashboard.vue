<template>
  <div class="page">
    <!-- 欢迎横幅 -->
    <div class="welcome">
      <div>
        <div class="welcome-title">你好，{{ auth.username }} <span class="wave">👋</span></div>
        <div class="welcome-desc">欢迎回来，今天也从一个好状态开始教学工作</div>
      </div>
      <el-button class="grad-btn" size="large" :icon="MagicStick" @click="router.push({ path: '/feedback', query: { tab: 'generate' } })">
        生成课后反馈
      </el-button>
    </div>

    <!-- 四张核心统计卡 -->
    <div class="kpi-row">
      <div class="kpi-card" v-for="(k, i) in kpiCards" :key="i">
        <div class="kpi-top">
          <div>
            <div class="kpi-value">{{ k.value }}</div>
            <div class="kpi-label">{{ k.label }}</div>
          </div>
          <div class="kpi-icon" :class="k.color">
            <el-icon :size="22"><component :is="k.icon" /></el-icon>
          </div>
        </div>
        <div class="kpi-trend" :class="k.trendType">
          <span v-if="k.trend">{{ k.trend }}</span>
          <span v-else class="muted">{{ k.trendText || '' }}</span>
        </div>
        <div class="kpi-bars">
          <div v-for="(h, idx) in k.bars" :key="idx" class="kpi-bar" :style="{ height: h + '%' }"></div>
        </div>
      </div>
    </div>

    <!-- 趋势 + 分布 -->
    <div class="dash-grid">
      <div class="panel">
        <div class="chart-title">班级成绩趋势</div>
        <div class="chart-sub">近8周平均分 & 出勤率变化</div>
        <MiniChart :option="trendOption" height="280px" />
      </div>
      <div class="panel">
        <div class="chart-title">成绩分布</div>
        <div class="chart-sub">全班学员等级占比</div>
        <MiniChart :option="gradePieOption" height="280px" />
        <div class="grade-legend">
          <div class="grade-item" v-for="(g, i) in gradeLegend" :key="i">
            <span class="grade-dot" :style="{ background: g.color }"></span>
            <span class="grade-name">{{ g.label }}</span>
            <span class="grade-count">{{ g.count }}人</span>
            <span class="grade-pct">{{ g.pct }}%</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 在籍学员 + 关注提醒 -->
    <div class="dash-row">
      <div class="panel enroll-panel">
        <div class="chart-title">在籍学员</div>
        <div class="enroll-grid" v-if="s.class_overview.length">
          <div class="enroll-card" v-for="c in s.class_overview" :key="c.class_id" @click="router.push(`/students?class_id=${c.class_id}`)">
            <div class="enroll-head">
              <span class="enroll-name">{{ c.class_name }}</span>
              <b class="enroll-count">{{ c.count }}</b>
            </div>
            <div class="enroll-bar">
              <div class="enroll-fill" :style="{ width: c.count ? Math.min(100, (c.count / maxClassCount) * 100) + '%' : '0%' }"></div>
            </div>
            <div class="enroll-sub">最近考试平均 <b>{{ c.avg ?? '—' }}</b> 分</div>
          </div>
        </div>
        <el-empty v-else description="暂无班级，先去创建班级吧" :image-size="70" />
      </div>

      <div class="panel alert-panel">
        <div class="chart-title">关注提醒</div>
        <div v-if="s.alerts.length" class="alert-list">
          <div v-for="(a, i) in s.alerts" :key="i" class="alert-item" @click="router.push(`/students/${a.student_id}`)">
            <span class="alert-icon" :class="a.type"><el-icon>
              <TrendCharts v-if="a.type === 'score_down'" />
              <Warning v-else-if="a.type === 'low_score'" />
              <Calendar v-else />
            </el-icon></span>
            <div class="alert-body">
              <div class="alert-title">{{ a.title }}</div>
              <div class="alert-desc">{{ a.desc }}</div>
            </div>
            <span class="alert-arrow"><el-icon><ArrowRight /></el-icon></span>
          </div>
        </div>
        <div v-else class="alert-empty">暂无需要关注的提醒，表现都很棒</div>
      </div>
    </div>

    <!-- 快捷操作 -->
    <div class="panel quick-panel">
      <div class="chart-title">快捷操作</div>
      <div class="quick-grid">
        <div class="quick-item" v-for="q in quickActions" :key="q.path" @click="router.push(q.path)">
          <span class="quick-icon" :class="q.color"><el-icon><component :is="q.icon" /></el-icon></span>
          <span class="quick-name">{{ q.name }}</span>
        </div>
      </div>
    </div>

    <!-- 学员成绩进度看板 -->
    <div class="panel progress-panel">
      <div class="chart-title">学员成绩进度看板</div>
      <div class="progress-sub" v-if="progressExamName">「{{ progressExamName }}」各学员成绩与上一场考试对比，点击学员查看完整档案</div>
      <el-table :data="progressRows" size="small" v-if="progressRows.length" @row-click="goProfile">
        <el-table-column label="学员" min-width="220">
          <template #default="{ row }">
            <div class="stu-cell">
              <span class="avatar-grad" :style="{ width: '28px', height: '28px', fontSize: '12px' }">{{ row.name[0] }}</span>
              <span>{{ row.name }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="class_name" label="班级" width="140" />
        <el-table-column label="本次成绩" width="120">
          <template #default="{ row }"><b>{{ row.cur_score }}</b></template>
        </el-table-column>
        <el-table-column label="上次成绩" width="120">
          <template #default="{ row }">{{ row.prev_score ?? '—' }}</template>
        </el-table-column>
        <el-table-column label="变化" width="120">
          <template #default="{ row }">
            <span v-if="row.diff !== null" :class="row.trend === 'up' ? 'tag-pos' : row.trend === 'down' ? 'tag-imp' : 'text-sub'">
              {{ row.diff > 0 ? '+' : '' }}{{ row.diff }}
            </span>
            <span v-else class="text-muted">—</span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="120">
          <template #default="{ row }">
            <span class="badge" :class="row.trend === 'up' ? 'green' : row.trend === 'down' ? 'red' : 'gray'">
              {{ row.trend === 'up' ? '进步' : row.trend === 'down' ? '下滑' : '稳定' }}
            </span>
          </template>
        </el-table-column>
      </el-table>
      <el-empty v-else description="暂无成绩数据，录入成绩后将自动生成学员进步看板" :image-size="80" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import request from '../utils/request';
import MiniChart from '../components/MiniChart.vue';
import { getChartColors } from '../utils/chartTheme';
import {
  MagicStick, School, User, Collection, ChatDotSquare,
  EditPen, Calendar, TrendCharts, Warning, ArrowRight,
  Histogram, DataLine, Suitcase,
} from '@element-plus/icons-vue';

const router = useRouter();
const auth = useAuthStore();
const s = ref({
  class_count: 0, student_count: 0, exam_count: 0, month_exam_count: 0,
  feedback_count: 0, behavior_count: 0,
  week_attendance: { total: 0, normal: 0, late: 0, leave: 0, absent: 0 },
  recent_exam: null,
  student_progress: [],
  class_overview: [],
  alerts: [],
  class_trend: [],
  grade_dist: { A: 0, B: 0, C: 0, D: 0 },
});

const kpiCards = computed(() => {
  const arr = [
    {
      label: '在籍学员', value: s.value.student_count, icon: User, color: 'indigo',
      trend: s.value.student_progress.filter((p) => p.trend === 'up').length
        ? `↗ 本月进步 ${s.value.student_progress.filter((p) => p.trend === 'up').length} 人`
        : '保持关注',
      trendType: 'up', bars: [35, 50, 40, 65, 55, 80, 70, 90],
    },
    {
      label: '本月考试', value: s.value.month_exam_count, icon: Collection, color: 'cyan',
      trend: s.value.month_exam_count ? `完成率 ${Math.round((s.value.month_exam_count / Math.max(1, s.value.class_count)) * 100)}%` : '暂无考试',
      trendType: 'neutral', bars: [20, 40, 30, 60, 50, 70, 65, 85],
    },
    {
      label: '平均成绩', value: s.value.recent_exam?.avg ?? '—', icon: Histogram, color: 'emerald',
      trend: s.value.recent_exam
        ? `及格率 ${s.value.recent_exam.pass_rate}%`
        : '暂无数据',
      trendType: 'up', bars: [30, 45, 55, 50, 70, 65, 75, 80],
    },
    {
      label: '已生成反馈', value: s.value.feedback_count, icon: ChatDotSquare, color: 'amber',
      trend: s.value.feedback_count ? '持续跟进中' : '开始生成第一条',
      trendType: 'neutral', bars: [25, 35, 45, 40, 60, 55, 70, 75],
    },
  ];
  return arr;
});

const trendOption = computed(() => {
  const data = s.value.class_trend || [];
  const c = getChartColors();
  return {
    tooltip: { trigger: 'axis' },
    legend: { top: 4, icon: 'circle', textStyle: { color: c.textSub } },
    grid: { left: 40, right: 20, top: 40, bottom: 50 },
    xAxis: {
      type: 'category', data: data.map((d) => d.label),
      axisLine: { lineStyle: { color: c.border } },
      axisLabel: { color: c.textSub, rotate: 35, interval: 0 },
    },
    yAxis: {
      type: 'value', max: 100,
      axisLine: { show: false },
      axisLabel: { color: c.textSub },
      splitLine: { lineStyle: { color: c.borderLight } },
    },
    series: [
      {
        name: '平均分', type: 'line', smooth: true, showSymbol: true,
        data: data.map((d) => d.avg),
        lineStyle: { width: 3, color: '#6366f1' },
        itemStyle: { color: '#6366f1' },
        areaStyle: {
          color: {
            type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(99, 102, 241, 0.35)' },
              { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
            ],
          },
        },
      },
      {
        name: '出勤率', type: 'line', smooth: true, showSymbol: false,
        data: data.map((d) => d.attendance_rate),
        lineStyle: { width: 2, type: 'dashed', color: '#22d3ee' },
        itemStyle: { color: '#22d3ee' },
      },
    ],
  };
});

const gradePieOption = computed(() => {
  const g = s.value.grade_dist || { A: 0, B: 0, C: 0, D: 0 };
  const total = g.A + g.B + g.C + g.D;
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c}人 ({d}%)' },
    series: [{
      type: 'pie', radius: ['55%', '78%'], center: ['50%', '48%'],
      avoidLabelOverlap: false,
      label: {
        show: true, position: 'center',
        formatter: () => `{total|${total}}\n{text|学员}`,
        rich: {
          total: { fontSize: 28, fontWeight: 800, color: 'var(--text)', lineHeight: 36 },
          text: { fontSize: 12, color: 'var(--text-muted)', lineHeight: 18 },
        },
      },
      labelLine: { show: false },
      itemStyle: { borderRadius: 6, borderColor: 'var(--bg)', borderWidth: 3 },
      data: [
        { name: 'A段', value: g.A, itemStyle: { color: '#818cf8' } },
        { name: 'B段', value: g.B, itemStyle: { color: '#22d3ee' } },
        { name: 'C段', value: g.C, itemStyle: { color: '#f59e0b' } },
        { name: 'D段', value: g.D, itemStyle: { color: '#fb7185' } },
      ],
    }],
  };
});

const gradeLegend = computed(() => {
  const g = s.value.grade_dist || { A: 0, B: 0, C: 0, D: 0 };
  const total = g.A + g.B + g.C + g.D || 1;
  return [
    { label: 'A段 (90-100)', count: g.A, pct: Math.round((g.A / total) * 100), color: '#818cf8' },
    { label: 'B段 (75-89)', count: g.B, pct: Math.round((g.B / total) * 100), color: '#22d3ee' },
    { label: 'C段 (60-74)', count: g.C, pct: Math.round((g.C / total) * 100), color: '#f59e0b' },
    { label: 'D段 (60以下)', count: g.D, pct: Math.round((g.D / total) * 100), color: '#fb7185' },
  ];
});

const progressRows = computed(() => s.value.student_progress || []);
const progressExamName = computed(() => s.value.student_progress?.[0]?.exam_name || '');
const maxClassCount = computed(() => Math.max(1, ...s.value.class_overview.map((c) => c.count || 0)));

const quickActions = [
  { name: '录入成绩', icon: EditPen, color: 'blue', path: { path: '/score-manage', query: { tab: 'enter' } } },
  { name: '记录考勤', icon: Calendar, color: 'green', path: { path: '/attendance-manage', query: { tab: 'enter' } } },
  { name: '班级管理', icon: School, color: 'orange', path: '/classes' },
  { name: '生成反馈', icon: MagicStick, color: 'violet', path: { path: '/feedback', query: { tab: 'generate' } } },
  { name: '学员档案', icon: User, color: 'pink', path: '/students' },
  { name: '成绩分析', icon: DataLine, color: 'teal', path: { path: '/score-manage', query: { tab: 'query' } } },
];

function goProfile(row) {
  router.push(`/students/${row.student_id}`);
}

onMounted(async () => {
  s.value = await request.get('/dashboard/summary');
});
</script>

<style scoped>
.welcome {
  display: flex; align-items: center; justify-content: space-between; gap: 16px;
  background:
    radial-gradient(800px 200px at 90% -40%, rgba(139, 92, 246, 0.28), transparent 60%),
    radial-gradient(600px 180px at 10% 120%, rgba(99, 102, 241, 0.24), transparent 60%),
    linear-gradient(120deg, #171a3a, #1f2052 55%, #2a2a66);
  border: 1px solid rgba(99, 102, 241, 0.3);
  border-radius: 16px; padding: 26px 30px; margin-bottom: 22px; color: #fff;
  box-shadow: 0 16px 40px -12px rgba(79, 70, 229, 0.45);
}
.welcome-title { font-size: 24px; font-weight: 800; letter-spacing: -0.02em; }
.wave { font-size: 22px; }
.welcome-desc { margin-top: 6px; font-size: 13.5px; color: rgba(226, 232, 240, 0.72); }

/* 四张统计卡 */
.kpi-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 22px; }
@media (max-width: 1100px) { .kpi-row { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 600px) { .kpi-row { grid-template-columns: 1fr; } }

.kpi-card {
  background: var(--panel); border: 1px solid var(--border); border-radius: 16px;
  padding: 20px 22px; display: flex; flex-direction: column; gap: 14px;
  transition: all 0.2s ease;
}
.kpi-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
.kpi-top { display: flex; align-items: flex-start; justify-content: space-between; }
.kpi-value { font-size: 32px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; line-height: 1.1; }
.kpi-label { font-size: 13px; color: var(--text-muted); margin-top: 6px; }
.kpi-icon {
  width: 44px; height: 44px; border-radius: 12px; flex: none;
  display: flex; align-items: center; justify-content: center;
  background: rgba(99, 102, 241, 0.12); color: var(--primary);
}
.kpi-icon.indigo { background: rgba(99, 102, 241, 0.12); color: #818cf8; }
.kpi-icon.cyan { background: rgba(34, 211, 238, 0.12); color: #22d3ee; }
.kpi-icon.emerald { background: rgba(52, 211, 153, 0.12); color: #34d399; }
.kpi-icon.amber { background: rgba(251, 191, 36, 0.12); color: #fbbf24; }
.kpi-trend { font-size: 12px; font-weight: 600; }
.kpi-trend.up { color: #34d399; }
.kpi-trend.down { color: #fb7185; }
.kpi-trend.neutral { color: var(--text-muted); }
.kpi-trend .muted { color: var(--text-muted); }
.kpi-bars { display: flex; align-items: flex-end; gap: 3px; height: 32px; margin-top: 2px; justify-content: flex-start; }
.kpi-bar { width: 6px; border-radius: 3px; background: linear-gradient(180deg, rgba(99,102,241,0.35), rgba(99,102,241,0.08)); min-height: 4px; flex: none; }

/* 图表区 */
.dash-grid { display: grid; grid-template-columns: 1.6fr 1fr; gap: 20px; margin-bottom: 20px; }
@media (max-width: 1100px) { .dash-grid { grid-template-columns: 1fr; } }

.chart-sub { font-size: 12.5px; color: var(--text-muted); margin: 2px 0 10px; }

.grade-legend { margin-top: 14px; display: flex; flex-direction: column; gap: 10px; }
.grade-item { display: flex; align-items: center; gap: 10px; font-size: 13px; }
.grade-dot { width: 10px; height: 10px; border-radius: 3px; flex: none; }
.grade-name { color: var(--text-sub); flex: 1; }
.grade-count { font-weight: 700; color: var(--text); }
.grade-pct { width: 44px; text-align: right; color: var(--text-muted); font-size: 12px; }

/* 快捷操作 */
.quick-panel { margin-top: 0; }
.quick-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 12px; }
@media (max-width: 900px) { .quick-grid { grid-template-columns: repeat(3, 1fr); } }
@media (max-width: 500px) { .quick-grid { grid-template-columns: repeat(2, 1fr); } }
.quick-item {
  display: flex; flex-direction: column; align-items: center; gap: 10px;
  padding: 18px 8px; border: 1px solid var(--border); border-radius: 12px;
  cursor: pointer; transition: all 0.18s ease; background: var(--panel-2);
}
.quick-item:hover { transform: translateY(-3px); border-color: rgba(99, 102, 241, 0.45); box-shadow: var(--shadow-md); }
.quick-icon {
  width: 48px; height: 48px; border-radius: 14px; font-size: 22px;
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
  box-shadow: 0 4px 14px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.1);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.quick-item:hover .quick-icon { transform: scale(1.08) rotate(-2deg); }
.quick-icon::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, rgba(255,255,255,0.22), transparent 55%);
  border-radius: inherit; pointer-events: none;
}
.quick-icon.blue { background: linear-gradient(135deg, #6366f1, #4f46e5); color: #fff; }
.quick-icon.green { background: linear-gradient(135deg, #10b981, #059669); color: #fff; }
.quick-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); color: #fff; }
.quick-icon.violet { background: linear-gradient(135deg, #8b5cf6, #7c3aed); color: #fff; }
.quick-icon.pink { background: linear-gradient(135deg, #ec4899, #db2777); color: #fff; }
.quick-icon.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); color: #fff; }
.quick-name { font-size: 13px; font-weight: 600; color: var(--text); }

/* 进度看板 */
.progress-panel { margin-top: 20px; }
.progress-sub { font-size: 12.5px; color: var(--text-muted); margin: 2px 0 14px; }
.stu-cell { display: flex; align-items: center; gap: 10px; font-weight: 500; }
.progress-panel :deep(.el-table__row) { cursor: pointer; }

/* 在籍学员 + 关注提醒 */
.dash-row { display: grid; grid-template-columns: 1.1fr 1fr; gap: 20px; margin-bottom: 20px; }
@media (max-width: 1100px) { .dash-row { grid-template-columns: 1fr; } }

.enroll-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; }
.enroll-card {
  background: var(--panel-2); border: 1px solid var(--border); border-radius: 12px;
  padding: 12px 14px; cursor: pointer; transition: all 0.18s ease;
}
.enroll-card:hover { transform: translateY(-2px); border-color: rgba(99, 102, 241, 0.45); box-shadow: var(--shadow-md); }
.enroll-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.enroll-name { font-size: 13px; font-weight: 700; color: var(--text); }
.enroll-count { font-size: 20px; font-weight: 800; color: var(--primary); font-variant-numeric: tabular-nums; }
.enroll-bar { height: 6px; border-radius: 999px; background: var(--panel-hover); overflow: hidden; }
.enroll-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #6366f1, #8b5cf6); }
.enroll-sub { margin-top: 8px; font-size: 11.5px; color: var(--text-muted); }
.enroll-sub b { color: var(--text); }

.alert-list { display: flex; flex-direction: column; gap: 10px; max-height: 380px; overflow: auto; }
.alert-item {
  display: flex; align-items: center; gap: 12px; padding: 10px 12px;
  background: var(--panel-2); border: 1px solid var(--border); border-radius: 12px; cursor: pointer;
  transition: all 0.15s ease;
}
.alert-item:hover { border-color: rgba(99, 102, 241, 0.45); transform: translateX(2px); }
.alert-icon {
  width: 38px; height: 38px; border-radius: 11px; flex: none; font-size: 19px;
  display: flex; align-items: center; justify-content: center;
}
.alert-icon.score_down { background: rgba(251, 113, 133, 0.15); color: #fb7185; }
.alert-icon.low_score { background: rgba(245, 158, 11, 0.15); color: #fbbf24; }
.alert-icon.attendance { background: rgba(129, 140, 248, 0.15); color: #a5b4fc; }
.alert-body { flex: 1; min-width: 0; }
.alert-title { font-size: 13px; font-weight: 700; color: var(--text); }
.alert-desc { font-size: 12px; color: var(--text-muted); margin-top: 2px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.alert-arrow { color: var(--text-muted); font-size: 13px; }
.alert-empty {
  padding: 40px 0; text-align: center; font-size: 13px; color: var(--text-muted);
  background: var(--panel-2); border: 1px dashed var(--border); border-radius: 12px;
}
</style>
