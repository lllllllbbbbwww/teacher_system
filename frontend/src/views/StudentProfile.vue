<template>
  <div class="page" v-loading="loading">
    <!-- 返回 + 学生信息头卡 -->
    <div class="profile-head panel">
      <div class="profile-left">
        <el-button text :icon="ArrowLeft" @click="router.push('/students')">返回学生列表</el-button>
        <template v-if="profile">
          <div class="avatar">{{ profile.student.name?.charAt(0) }}</div>
          <div>
            <div class="p-name">{{ profile.student.name }}
              <el-tag size="small" effect="plain" round>{{ profile.student.gender }}</el-tag>
            </div>
            <div class="p-meta">
              <span>学号 {{ profile.student.student_no }}</span>
              <span v-if="profile.student.class_name">{{ profile.student.class_name }}</span>
              <span v-if="profile.student.enroll_date">入学 {{ profile.student.enroll_date }}</span>
            </div>
            <div v-if="profile.student.remark" class="p-remark">{{ profile.student.remark }}</div>
          </div>
        </template>
      </div>
      <div v-if="profile" class="profile-right">
        <el-button class="grad-btn" :icon="MagicStick" size="large" @click="goGenerate">
          生成课后反馈
        </el-button>
      </div>
    </div>

    <!-- 能力指标条 -->
    <div v-if="profile" class="ability-row">
      <div class="ability-item" v-for="a in abilities" :key="a.label">
        <div class="ability-head">
          <span>{{ a.label }}</span>
          <b>{{ a.pct }}%</b>
        </div>
        <div class="mb-track">
          <div class="mb-fill" :class="a.cls" :style="{ width: a.pct + '%' }"></div>
        </div>
      </div>
    </div>

    <template v-if="profile">
      <!-- 成绩趋势 + 考勤 -->
      <div class="two-col">
        <div class="panel">
          <div class="chart-title">成绩趋势</div>
          <MiniChart v-if="profile.scores.length" :option="scoreTrendOption" height="240px" />
          <el-empty v-else description="暂无成绩记录，去录入成绩吧" :image-size="70" />
        </div>
        <div class="panel">
          <div class="chart-title">考勤统计</div>
          <div class="att-wrap">
            <MiniChart :option="attPieOption" height="150px" />
            <div class="att-lines">
              <div class="att-row"><span class="d green"></span>正常 <b>{{ profile.attendance.summary.normal }}</b></div>
              <div class="att-row"><span class="d orange"></span>迟到 <b>{{ profile.attendance.summary.late }}</b></div>
              <div class="att-row"><span class="d blue"></span>请假 <b>{{ profile.attendance.summary.leave }}</b></div>
              <div class="att-row"><span class="d red"></span>旷课 <b>{{ profile.attendance.summary.absent }}</b></div>
            </div>
          </div>
          <el-empty v-if="!profile.attendance.summary.total" description="暂无考勤记录" :image-size="50" />
        </div>
      </div>

      <!-- 行为记录 + 反馈历史 -->
      <div class="two-col">
        <div class="panel">
          <div class="chart-title">课堂行为记录（{{ profile.behaviors.length }}）</div>
          <div v-if="profile.behaviors.length" class="beh-list">
            <div v-for="b in profile.behaviors" :key="b.id" class="beh-item">
              <div class="beh-top">
                <span class="beh-date">{{ b.lesson_date }}</span>
                <span v-for="t in b.tags" :key="t.id" class="beh-tag" :class="t.tag_type === 'positive' ? 'pos' : 'neg'">
                  {{ t.tag_name }}
                </span>
              </div>
              <div v-if="b.teacher_remark" class="beh-remark">{{ b.teacher_remark }}</div>
            </div>
          </div>
          <el-empty v-else description="暂无行为记录" :image-size="70" />
        </div>
        <div class="panel">
          <div class="chart-title">历史课后反馈（{{ profile.feedbacks.length }}）</div>
          <div v-if="profile.feedbacks.length" class="fb-list">
            <div v-for="f in profile.feedbacks" :key="f.id" class="fb-item">
              <div class="fb-top">
                <span class="fb-date">{{ f.created_at?.slice(0, 10) }}</span>
                <span class="fb-style">{{ f.style_tag }}</span>
              </div>
              <div class="fb-short">{{ f.content_short }}</div>
            </div>
          </div>
          <el-empty v-else description="还没有生成过反馈" :image-size="70" />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import request from '../utils/request';
import MiniChart from '../components/MiniChart.vue';
import { ArrowLeft, MagicStick } from '@element-plus/icons-vue';
import { getChartColors } from '../utils/chartTheme';

const route = useRoute();
const router = useRouter();
const loading = ref(true);
const profile = ref(null);

const scoreTrendOption = computed(() => {
  const list = profile.value.scores;
  const c = getChartColors();
  return {
    grid: { left: 40, right: 20, top: 30, bottom: 40 },
    tooltip: { trigger: 'axis', backgroundColor: c.bgOverlay, borderColor: c.border, textStyle: { color: c.text } },
    legend: { top: 0, icon: 'circle', itemWidth: 10, itemHeight: 10, textStyle: { color: c.textSub } },
    xAxis: { type: 'category', data: list.map((s) => s.exam_time), axisLabel: { rotate: 25, fontSize: 10, color: c.textSub }, axisLine: { lineStyle: { color: c.border } } },
    yAxis: { type: 'value', minInterval: 1, axisLabel: { color: c.textSub }, splitLine: { lineStyle: { color: c.borderLight } } },
    series: [
      {
        name: '得分', type: 'line', smooth: true, data: list.map((s) => s.score),
        itemStyle: { color: '#6366f1' },
        lineStyle: { width: 3 },
        areaStyle: { color: 'rgba(99,102,241,0.12)' },
        markLine: {
          data: [{ type: 'average', name: '平均' }],
          lineStyle: { type: 'dashed', color: c.textMuted },
          label: { formatter: '平均 {c}', color: c.textSub },
        },
      },
      {
        name: '满分', type: 'line', smooth: true, data: list.map((s) => s.total_score),
        itemStyle: { color: '#475569' }, lineStyle: { width: 1, type: 'dashed' }, symbol: 'none',
      },
    ],
  };
});

const attPieOption = computed(() => {
  const a = profile.value.attendance.summary;
  const c = getChartColors();
  return {
    tooltip: { trigger: 'item', formatter: '{b}: {c} 次 ({d}%)', backgroundColor: c.bgOverlay, borderColor: c.border, textStyle: { color: c.text } },
    color: ['#34d399', '#f59e0b', '#818cf8', '#fb7185'],
    series: [{
      type: 'pie', radius: ['55%', '78%'], center: ['50%', '50%'],
      itemStyle: { borderRadius: 6, borderColor: c.bg, borderWidth: 2 },
      label: { show: false },
      emphasis: { label: { show: true, fontWeight: 600, color: c.text } },
      data: [
        { name: '正常', value: a.normal },
        { name: '迟到', value: a.late },
        { name: '请假', value: a.leave },
        { name: '旷课', value: a.absent },
      ],
    }],
  };
});

const abilities = computed(() => {
  const p = profile.value;
  if (!p) return [];
  const att = p.attendance?.summary;
  const attendPct = att && att.total ? Math.round(((att.total - att.absent) / att.total) * 100) : 0;
  const lastScore = p.scores.length ? p.scores[p.scores.length - 1] : null;
  const scorePct = lastScore ? Math.min(100, Math.round((lastScore.score / lastScore.total_score) * 100)) : 0;
  let pos = 0, neg = 0;
  for (const b of p.behaviors) {
    for (const t of b.tags) { if (t.tag_type === 'positive') pos++; else neg++; }
  }
  const behPct = pos + neg ? Math.round((pos / (pos + neg)) * 100) : 0;
  return [
    { label: '出勤率', pct: attendPct, cls: 'green' },
    { label: '成绩达成', pct: scorePct, cls: '' },
    { label: '课堂表现', pct: behPct, cls: 'orange' },
  ];
});

function goGenerate() {
  router.push({ path: '/feedback', query: { tab: 'generate', student_id: profile.value.student.id } });
}

onMounted(async () => {
  profile.value = await request.get(`/students/${route.params.id}/profile`);
  loading.value = false;
});
</script>

<style scoped>
.profile-head { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.profile-left { display: flex; align-items: center; gap: 20px; min-width: 0; }
.avatar {
  width: 64px; height: 64px; border-radius: 50%; flex: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 26px; font-weight: 800;
  display: flex; align-items: center; justify-content: center;
  box-shadow: 0 8px 20px -4px rgba(99, 102, 241, 0.5);
}
.p-name { font-size: 22px; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 10px; letter-spacing: -0.02em; }
.p-meta { display: flex; gap: 16px; margin-top: 8px; font-size: 13px; color: var(--text-sub); }
.p-remark { margin-top: 8px; font-size: 12.5px; color: var(--text-sub); background: var(--panel-2); border: 1px solid var(--border); border-radius: 8px; padding: 6px 10px; display: inline-block; }

.ability-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 20px; }
@media (max-width: 700px) { .ability-row { grid-template-columns: 1fr; } }
.ability-item {
  background: var(--panel); border: 1px solid var(--border); border-radius: 14px;
  padding: 16px 18px; box-shadow: var(--shadow-sm);
}
.ability-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; color: var(--text-sub); margin-bottom: 10px; }
.ability-head b { color: var(--text); font-size: 15px; font-variant-numeric: tabular-nums; }

.two-col { display: grid; grid-template-columns: 1.4fr 1fr; gap: 20px; margin-bottom: 20px; }
@media (max-width: 1000px) { .two-col { grid-template-columns: 1fr; } }

.att-wrap { display: flex; align-items: center; gap: 8px; }
.att-lines { width: 140px; flex: none; }
.att-row { display: flex; align-items: center; gap: 8px; font-size: 13px; color: var(--text-sub); padding: 4px 0; }
.att-row b { margin-left: auto; color: var(--text); }
.d { width: 8px; height: 8px; border-radius: 50%; flex: none; }
.d.green { background: #34d399; }
.d.orange { background: #f59e0b; }
.d.blue { background: #818cf8; }
.d.red { background: #fb7185; }

.beh-list { max-height: 340px; overflow-y: auto; }
.beh-item { padding: 12px 0; border-bottom: 1px dashed var(--border); }
.beh-item:last-child { border-bottom: none; }
.beh-top { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.beh-date { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.beh-tag { font-size: 12px; font-weight: 600; padding: 2px 10px; border-radius: 999px; }
.beh-tag.pos { background: rgba(16, 185, 129, 0.15); color: #34d399; }
.beh-tag.neg { background: rgba(244, 63, 94, 0.15); color: #fb7185; }
.beh-remark { margin-top: 6px; font-size: 13px; color: var(--text-sub); }

.fb-list { max-height: 340px; overflow-y: auto; }
.fb-item { padding: 12px 0; border-bottom: 1px dashed var(--border); }
.fb-item:last-child { border-bottom: none; }
.fb-top { display: flex; align-items: center; gap: 10px; }
.fb-date { font-size: 12px; color: var(--text-muted); font-weight: 600; }
.fb-style { font-size: 11px; color: var(--primary); background: var(--el-color-primary-light-9); padding: 2px 10px; border-radius: 999px; font-weight: 600; }
.fb-short { margin-top: 6px; font-size: 13px; color: var(--text-sub); line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style>
