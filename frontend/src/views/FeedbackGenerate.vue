<template>
  <div class="page">
    <div v-if="!embedded" class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><MagicStick /></el-icon></div>
        <div>
          <div class="page-header-tag">智能</div>
          <div class="page-header-title">反馈生成</div>
          <div class="page-header-desc">基于学情数据，一键生成个性化家校反馈</div>
        </div>
      </div>
    </div>

    <div class="gen-layout">
      <!-- 左：表单 -->
      <div class="panel gen-form">
        <div class="panel-title">生成配置</div>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top">
          <el-form-item label="学生" prop="student_id">
            <el-select v-model="form.student_id" filterable style="width:100%" placeholder="选择学生" @change="onStudentChange">
              <el-option v-for="s in studentStore.list" :key="s.id" :label="`${s.name}(${s.student_no})`" :value="s.id" />
            </el-select>
          </el-form-item>

          <!-- 学生信息卡 -->
          <div v-if="studentCard" class="stu-card">
            <div class="stu-card-head">
              <span class="avatar-grad" :style="{ width: '44px', height: '44px', fontSize: '18px' }">{{ studentCard.name[0] }}</span>
              <div class="stu-card-info">
                <div class="stu-card-name">
                  {{ studentCard.name }}
                  <span class="grade-badge" :class="gradeCls">{{ studentCard.grade || '—' }}</span>
                </div>
                <div class="stu-card-sub">{{ studentCard.class_name }} · 近30天数据</div>
              </div>
              <div class="stu-card-star">
                <div class="star-label">课堂表现</div>
                <div class="star-row">
                  <el-icon v-for="n in 5" :key="n" :size="16" :color="n <= (studentCard.performance_score || 3) ? '#fbbf24' : 'var(--text-muted)'">
                    <Star />
                  </el-icon>
                </div>
              </div>
            </div>
            <div class="stu-card-stats">
              <div class="sc-item" v-if="studentCard.recent_score">
                <span class="sc-label">本次成绩</span>
                <span class="sc-value">{{ studentCard.recent_score.score }}<i>/{{ studentCard.recent_score.total_score }}</i></span>
              </div>
              <div class="sc-item">
                <span class="sc-label">出勤率</span>
                <span class="sc-value">{{ studentCard.attendance_rate ?? '—' }}<i v-if="studentCard.attendance_rate !== null">%</i></span>
              </div>
              <div class="sc-item" v-if="studentCard.score_change !== null">
                <span class="sc-label">月度进步</span>
                <span class="sc-value" :class="studentCard.trend === 'up' ? 'sc-up' : studentCard.trend === 'down' ? 'sc-down' : ''">
                  {{ studentCard.score_change > 0 ? '+' : '' }}{{ studentCard.score_change }}
                </span>
              </div>
            </div>
            <!-- 近6次成绩变化 -->
            <div class="score-history" v-if="studentCard.score_history?.length">
              <div class="score-history-title">近6次成绩变化</div>
              <MiniChart :option="scoreHistoryOption" height="140px" />
            </div>
          </div>
          <el-form-item label="反馈周期" prop="time_range">
            <el-select v-model="form.time_range" style="width:100%">
              <el-option label="近2周" value="recent_2w" />
              <el-option label="近1个月" value="recent_1m" />
              <el-option label="自定义周期" value="custom" />
            </el-select>
          </el-form-item>
          <el-form-item label="反馈维度" prop="selected_dimensions">
            <el-checkbox-group v-model="form.selected_dimensions">
              <el-checkbox value="score">成绩</el-checkbox>
              <el-checkbox value="tag">课堂表现</el-checkbox>
              <el-checkbox value="attendance">考勤</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          <el-form-item label="反馈风格" prop="style_tag">
            <el-select v-model="form.style_tag" style="width:100%">
              <el-option v-for="t in commonStore.styleTags" :key="t.id" :label="t.tag_name" :value="t.tag_name" />
            </el-select>
          </el-form-item>
          <el-form-item label="快捷关注点（点击选择，将重点反馈）">
            <div class="focus-chips">
              <span
                v-for="p in focusPresets"
                :key="p"
                class="focus-chip"
                :class="{ active: form.focus_points.includes(p) }"
                @click="toggleFocus(p)"
              >{{ p }}</span>
            </div>
          </el-form-item>
          <el-form-item label="补充备注">
            <el-input v-model="form.teacher_notes" type="textarea" :rows="3" maxlength="200" show-word-limit placeholder="可选，将作为最高优先级纳入反馈" />
          </el-form-item>
          <el-button type="primary" size="large" class="gen-btn" :loading="generating" :icon="MagicStick" @click="onGenerate">
            {{ generating ? '生成中…' : '生成反馈' }}
          </el-button>
        </el-form>
      </div>

      <!-- 右：结果 -->
      <div class="panel gen-result">
        <div class="panel-title">生成结果</div>

        <div v-if="generating" class="gen-loading">
          <el-skeleton :rows="6" animated />
          <p class="gen-loading-text">正在分析学情数据，请稍候…</p>
        </div>

        <el-empty v-else-if="!result" description="填写左侧配置后点击「生成反馈」" :image-size="90" />

        <div v-else class="gen-content">
          <div class="result-block">
            <div class="result-label short">简短微信版</div>
            <div class="result-card short-card">{{ result.content_short }}</div>
          </div>
          <div class="result-block">
            <div class="result-label">完整版</div>
            <div class="result-sec">
              <div class="result-sec-label adv">优点与亮点</div>
              <div class="result-sec-text">{{ result.content_full.advantages }}</div>
            </div>
            <div class="result-sec">
              <div class="result-sec-label prob">待改进问题</div>
              <div class="result-sec-text">{{ result.content_full.problems }}</div>
            </div>
            <div class="result-sec">
              <div class="result-sec-label sugg">家校共育建议</div>
              <div class="result-sec-text">{{ result.content_full.suggestions }}</div>
            </div>
          </div>
          <div class="gen-actions">
            <el-button :icon="CopyDocument" @click="copyShort">复制微信版</el-button>
            <el-button type="primary" :icon="Download" @click="exportPdf">导出学生PDF</el-button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
defineProps({ embedded: Boolean });
import { useRoute } from 'vue-router';
import { MagicStick, CopyDocument, Download, Star } from '@element-plus/icons-vue';
import { useStudentStore } from '../stores/student';
import { useCommonStore } from '../stores/common';
import request, { API_BASE } from '../utils/request';
import { ElMessage } from 'element-plus';
import MiniChart from '../components/MiniChart.vue';

const route = useRoute();
const studentStore = useStudentStore();
const commonStore = useCommonStore();
const formRef = ref();
const generating = ref(false);
const result = ref(null);
const studentCard = ref(null);
const focusPresets = [
  '注意力分散', '逻辑思维弱', '表达能力待提升', '课堂参与度低', '作业完成度差',
  '粗心大意', '基础薄弱', '学习习惯差', '缺乏自信', '情绪波动', '时间管理', '与人交往',
];
const form = reactive({
  student_id: '', time_range: 'recent_1m', selected_dimensions: ['score', 'tag', 'attendance'],
  style_tag: '', teacher_notes: '', focus_points: [],
});
const gradeCls = computed(() => {
  const g = studentCard.value?.grade;
  return { A: 'g-a', B: 'g-b', C: 'g-c', D: 'g-d' }[g] || '';
});
const scoreHistoryOption = computed(() => {
  const data = studentCard.value?.score_history || [];
  return {
    tooltip: { trigger: 'axis', formatter: '{b}<br/>{a}: {c}分' },
    grid: { left: 10, right: 10, top: 10, bottom: 20 },
    xAxis: {
      type: 'category', data: data.map((d) => d.exam_name.slice(0, 4)),
      axisLine: { lineStyle: { color: 'var(--el-border-color)' } },
      axisLabel: { color: 'var(--text-muted)', fontSize: 10 },
    },
    yAxis: {
      type: 'value', min: (v) => Math.max(0, Math.floor(v.min - 5)),
      axisLine: { show: false }, splitLine: { lineStyle: { color: 'var(--el-border-color-lighter)' } },
      axisLabel: { color: 'var(--text-muted)', fontSize: 10 },
    },
    series: [{
      type: 'line', smooth: true, showSymbol: true,
      data: data.map((d) => d.score),
      lineStyle: { width: 2.5, color: '#6366f1' },
      itemStyle: { color: '#6366f1' },
      areaStyle: {
        color: {
          type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(99, 102, 241, 0.30)' },
            { offset: 1, color: 'rgba(99, 102, 241, 0.02)' },
          ],
        },
      },
    }],
  };
});
const rules = {
  student_id: [{ required: true, message: '请选择学生', trigger: 'change' }],
  time_range: [{ required: true, message: '请选择周期', trigger: 'change' }],
  selected_dimensions: [{ required: true, type: 'array', min: 1, message: '至少选择1个维度', trigger: 'change' }],
  style_tag: [{ required: true, message: '请选择风格', trigger: 'change' }],
};

onMounted(async () => {
  await studentStore.fetchList();
  await commonStore.fetchStyleTags();
  if (commonStore.styleTags[0]) form.style_tag = commonStore.styleTags[0].tag_name;
  // 从学员档案跳转时可带学生
  const sid = route.query.student_id;
  if (sid && studentStore.list.some((s) => s.id === sid)) {
    form.student_id = sid;
    onStudentChange();
  }
});
function toggleFocus(p) {
  const i = form.focus_points.indexOf(p);
  if (i >= 0) form.focus_points.splice(i, 1);
  else if (form.focus_points.length < 8) form.focus_points.push(p);
}
async function onStudentChange() {
  result.value = null;
  studentCard.value = null;
  if (!form.student_id) return;
  try {
    studentCard.value = await request.get('/feedback/student-card', { params: { student_id: form.student_id } });
  } catch {
    studentCard.value = null;
  }
}
async function onGenerate() {
  await formRef.value.validate();
  generating.value = true;
  result.value = null;
  try {
    const d = await request.post('/feedback/generate', form);
    result.value = d;
    if (d.cached) ElMessage.info('返回了最近一次生成结果');
    else if (d.degraded) ElMessage.warning('AI 暂时不可用，已生成基础反馈');
    else ElMessage.success('生成成功');
  } finally {
    generating.value = false;
  }
}
function copyShort() {
  navigator.clipboard.writeText(result.value.content_short);
  ElMessage.success('已复制');
}
function exportPdf() {
  const token = localStorage.getItem('token') || '';
  const p = new URLSearchParams({ student_id: form.student_id, token });
  // 生产环境必须用完整后端地址, 避免 Vercel rewrite 导致跳到首页
  const url = `${API_BASE}/export/student-pdf?${p.toString()}`;
  window.open(url, '_blank');
}
</script>

<style scoped>
.gen-layout { display: grid; grid-template-columns: 380px 1fr; gap: 20px; align-items: start; }
@media (max-width: 1000px) { .gen-layout { grid-template-columns: 1fr; } }

.panel-title { font-size: 15px; font-weight: 700; color: var(--text); margin-bottom: 18px; letter-spacing: -0.01em; }

.gen-form { position: sticky; top: 20px; }
.gen-btn { width: 100%; height: 44px; font-size: 15px; margin-top: 4px; }

.gen-loading { padding: 12px 4px; }
.gen-loading-text { text-align: center; color: var(--text-sub); font-size: 13px; margin-top: 16px; }

.result-block { margin-bottom: 20px; }
.result-label { font-size: 13px; font-weight: 700; color: var(--text); margin-bottom: 10px; padding-left: 10px; border-left: 3px solid var(--primary); }
.result-label.short { border-left-color: #34d399; }
.short-card {
  background: rgba(16, 185, 129, 0.12); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399;
  border-radius: 10px; padding: 14px 16px; font-size: 14px; line-height: 1.7;
}
.result-sec { margin-bottom: 14px; }
.result-sec-label { font-size: 12.5px; font-weight: 700; margin-bottom: 6px; }
.result-sec-label.adv { color: #34d399; }
.result-sec-label.prob { color: #fb7185; }
.result-sec-label.sugg { color: #818cf8; }
.result-sec-text {
  background: var(--panel-2); border: 1px solid var(--border); border-radius: 10px;
  padding: 12px 16px; font-size: 13.5px; line-height: 1.7; color: var(--text);
}
.gen-actions { display: flex; gap: 12px; margin-top: 20px; padding-top: 18px; border-top: 1px solid var(--border); }

.stu-card {
  margin-bottom: 18px; border: 1px solid var(--border);
  background: var(--panel);
  border-radius: 14px; padding: 14px;
}
.stu-card-head { display: flex; align-items: center; gap: 12px; }
.stu-card-info { min-width: 0; flex: 1; }
.stu-card-name { font-size: 15px; font-weight: 800; color: var(--text); display: flex; align-items: center; gap: 8px; }
.stu-card-sub { font-size: 12px; color: var(--text-muted); margin-top: 3px; }
.stu-card-star { text-align: right; }
.star-label { font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }
.star-row { display: flex; gap: 2px; justify-content: flex-end; }
.grade-badge { font-size: 11px; font-weight: 800; padding: 1px 8px; border-radius: 999px; color: #fff; }
.g-a { background: linear-gradient(135deg, #10b981, #059669); }
.g-b { background: linear-gradient(135deg, #6366f1, #4f46e5); }
.g-c { background: linear-gradient(135deg, #f59e0b, #d97706); }
.g-d { background: linear-gradient(135deg, #fb7185, #e11d48); }
.stu-card-stats { display: flex; gap: 10px; margin-top: 12px; }
.sc-item { flex: 1; background: var(--panel-hover); border-radius: 10px; padding: 8px 10px; text-align: center; }
.sc-label { display: block; font-size: 11px; color: var(--text-muted); margin-bottom: 2px; }
.sc-value { font-size: 15px; font-weight: 800; color: var(--text); font-variant-numeric: tabular-nums; }
.sc-value i { font-style: normal; font-size: 11px; color: var(--text-muted); font-weight: 500; margin-left: 2px; }
.sc-value.sc-up { color: #34d399; }
.sc-value.sc-down { color: #fb7185; }
.score-history { margin-top: 12px; }
.score-history-title { font-size: 12px; color: var(--text-muted); margin-bottom: 6px; }

.focus-chips { display: flex; flex-wrap: wrap; gap: 8px; }
.focus-chip {
  font-size: 12px; padding: 4px 11px; border-radius: 999px; cursor: pointer;
  border: 1px solid var(--border); color: var(--text-sub); background: var(--panel-2);
  transition: all 0.15s ease; user-select: none;
}
.focus-chip:hover { border-color: rgba(99, 102, 241, 0.5); color: var(--text); }
.focus-chip.active {
  background: rgba(99, 102, 241, 0.18); border-color: var(--primary);
  color: var(--primary); font-weight: 600;
}
</style>
