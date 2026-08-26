<template>
  <div class="landing">
    <!-- 顶部导航 -->
    <nav class="nav" :class="{ 'nav-solid': scrolled }">
      <div class="nav-inner">
        <div class="nav-brand">
          <div class="brand-icon">
            <el-icon :size="18"><School /></el-icon>
          </div>
          <span>教师智能工作台</span>
        </div>
        <div class="nav-links">
          <a href="#features" @click.prevent="scrollTo('features')">功能</a>
          <a href="#preview" @click.prevent="scrollTo('preview')">预览</a>
        </div>
        <div class="nav-btns">
          <el-button text class="nav-login" @click="showLogin = true">登录</el-button>
          <el-button type="primary" class="nav-reg" @click="$router.push('/register')">免费注册</el-button>
        </div>
      </div>
    </nav>

    <!-- Hero 区域 -->
    <section class="hero">
      <div class="hero-glow hero-glow-1"></div>
      <div class="hero-glow hero-glow-2"></div>
      <div class="hero-inner" v-fade-up>
        <div class="hero-badge">
          <span class="badge-dot"></span>
          <span>专为一线教师打造 · 全流程数字化管理</span>
        </div>
        <h1 class="hero-title">
          让每一堂课的价值<br />
          <span class="grad">可见、可沉淀、可传递</span>
        </h1>
        <p class="hero-desc">
          数据记录 → 学员档案沉淀 → 课后反馈输出，三位一体的智能教学工作台，<br />
          让教学洞察驱动每一步成长。
        </p>
        <div class="hero-actions">
          <el-button type="primary" size="large" class="hero-btn-primary" @click="showLogin = true">
            <el-icon class="btn-icon"><Right /></el-icon>
            进入工作台
          </el-button>
          <el-button size="large" class="hero-btn-secondary" @click="scrollTo('features')">
            <el-icon class="btn-icon"><View /></el-icon>
            查看功能
          </el-button>
        </div>
      </div>
    </section>

    <!-- 数据看板预览 -->
    <section id="preview" class="preview-section">
      <div class="section-inner">
        <div class="preview-grid">
          <div class="preview-kpi" v-fade-up>
            <div class="kpi-head">
              <span class="kpi-label">本月学员</span>
              <el-icon class="kpi-icon" :size="18"><User /></el-icon>
            </div>
            <div class="kpi-num">48</div>
            <div class="kpi-trend up">
              <el-icon><TrendCharts /></el-icon>
              <span>较上月 +12%</span>
            </div>
            <div class="kpi-bars">
              <div class="kpi-bar" v-for="(h, i) in [0.4,0.6,0.5,0.8,0.7,0.9,0.85]" :key="i" :style="{ height: h * 100 + '%' }"></div>
            </div>
          </div>
          <div class="preview-kpi" v-fade-up>
            <div class="kpi-head">
              <span class="kpi-label">本月考试</span>
              <el-icon class="kpi-icon" :size="18"><EditPen /></el-icon>
            </div>
            <div class="kpi-num">6<span class="kpi-unit">场</span></div>
            <div class="kpi-trend up">
              <el-icon><TrendCharts /></el-icon>
              <span>较上月 +2</span>
            </div>
            <div class="kpi-bars">
              <div class="kpi-bar orange" v-for="(h, i) in [0.3,0.5,0.4,0.7,0.6,0.8,0.75]" :key="i" :style="{ height: h * 100 + '%' }"></div>
            </div>
          </div>
          <div class="preview-kpi" v-fade-up>
            <div class="kpi-head">
              <span class="kpi-label">班级平均分</span>
              <el-icon class="kpi-icon" :size="18"><Histogram /></el-icon>
            </div>
            <div class="kpi-num">86.5</div>
            <div class="kpi-trend up">
              <el-icon><TrendCharts /></el-icon>
              <span>较上次 +3.2</span>
            </div>
            <div class="kpi-bars">
              <div class="kpi-bar green" v-for="(h, i) in [0.5,0.55,0.6,0.65,0.7,0.75,0.8]" :key="i" :style="{ height: h * 100 + '%' }"></div>
            </div>
          </div>
          <div class="preview-kpi wide" v-fade-up>
            <div class="kpi-head">
              <span class="kpi-label">成绩趋势 · 近8次考试</span>
              <span class="preview-tag">实时数据</span>
            </div>
            <div class="kpi-chart-row">
              <div class="kpi-chart-item" v-for="(d, i) in previewTrend" :key="i">
                <div class="kpi-chart-bar-wrap">
                  <div class="kpi-chart-bar" :style="{ height: d.score + '%' }"></div>
                </div>
                <div class="kpi-chart-label">{{ d.name }}</div>
              </div>
            </div>
          </div>
          <div class="preview-kpi" v-fade-up>
            <div class="kpi-head">
              <span class="kpi-label">出勤率</span>
              <el-icon class="kpi-icon" :size="18"><Calendar /></el-icon>
            </div>
            <div class="kpi-num">96<span class="kpi-unit">%</span></div>
            <div class="kpi-trend">
              <span>全勤班级 3 个</span>
            </div>
            <div class="kpi-ring">
              <svg viewBox="0 0 60 60" class="kpi-ring-svg">
                <circle cx="30" cy="30" r="26" fill="none" stroke="rgba(148,163,184,0.1)" stroke-width="6"/>
                <circle cx="30" cy="30" r="26" fill="none" stroke="#34d399" stroke-width="6" stroke-dasharray="163.36" stroke-dashoffset="6.53" stroke-linecap="round" transform="rotate(-90 30 30)"/>
              </svg>
            </div>
          </div>

        </div>
      </div>
    </section>

    <!-- 功能卡片 -->
    <section id="features" class="features">
      <div class="section-inner">
        <div class="section-head" v-fade-up>
          <div class="section-tag">核心功能</div>
          <h2 class="section-title">教师日常所需，一站式解决</h2>
          <p class="section-desc">从学员管理到成绩分析，从考勤追踪到 AI 反馈，覆盖教学全场景</p>
        </div>
        <div class="feature-grid">
          <div class="feature-card" v-for="(f, i) in featureList" :key="i" v-fade-up :style="{ animationDelay: `${i * 80}ms` }">
            <div class="fc-icon" :class="f.color">
              <el-icon :size="22"><component :is="f.icon" /></el-icon>
            </div>
            <h3>{{ f.title }}</h3>
            <p>{{ f.desc }}</p>
            <div class="fc-tags">
              <span v-for="(t, j) in f.tags" :key="j" class="fc-tag">{{ t }}</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 底部 -->
    <footer class="footer">
      <div class="footer-inner">
        <div class="footer-brand">
          <div class="brand-icon">
            <el-icon :size="16"><School /></el-icon>
          </div>
          <span>教师智能工作台</span>
        </div>
        <p class="footer-copy">© {{ year }} 教师智能工作台 · 让教学更有数据</p>
      </div>
    </footer>

    <!-- 登录弹窗 -->
    <Teleport to="body">
      <Transition name="fade">
        <div v-if="showLogin" class="login-overlay" @click.self="showLogin = false">
          <div class="login-card" v-fade-up>
            <div class="login-logo">
              <div class="brand-icon large">
                <el-icon :size="22"><School /></el-icon>
              </div>
              <h2>欢迎回来</h2>
              <p>登录您的教师工作台</p>
            </div>
            <el-form ref="loginFormRef" :model="loginForm" :rules="loginRules" @keyup.enter="handleLogin" class="login-form">
              <el-form-item prop="username" class="login-field">
                <template #label>账号</template>
                <el-input v-model="loginForm.username" placeholder="请输入用户名" size="large" :prefix-icon="User" />
              </el-form-item>
              <el-form-item prop="password" class="login-field">
                <template #label>密码</template>
                <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" size="large" show-password :prefix-icon="Lock" />
              </el-form-item>
              <div class="login-options">
                <el-checkbox v-model="loginForm.remember">记住我</el-checkbox>
                <a class="login-forgot" @click="ElMessage.info('请联系管理员重置密码')">忘记密码？</a>
              </div>
              <el-button type="primary" size="large" class="login-submit" :loading="loginLoading" @click="handleLogin">
                <el-icon class="btn-icon"><Right /></el-icon>
                进入工作台
              </el-button>
            </el-form>
            <div class="login-foot">
              <span class="login-back" @click="showLogin = false">
                <el-icon><ArrowLeft /></el-icon> 返回首页
              </span>
            </div>
            <div class="login-register">
              还没有账号？<a @click="showLogin = false; $router.push('/register')">立即注册</a>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  School, Right, View, TrendCharts,
  EditPen, Calendar, ChatDotSquare, MagicStick, DataAnalysis, Warning, User, Lock, ArrowLeft, Histogram,
} from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../utils/request';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const auth = useAuthStore();
const year = new Date().getFullYear();
const scrolled = ref(false);
const showLogin = ref(false);
const loginLoading = ref(false);
const loginFormRef = ref();
const loginForm = ref({ username: '', password: '', remember: true });
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

const previewTrend = [
  { name: '月考1', score: 62 }, { name: '月考2', score: 58 }, { name: '期中', score: 72 },
  { name: '月考3', score: 68 }, { name: '月考4', score: 78 }, { name: '期末', score: 85 },
  { name: '摸底', score: 80 }, { name: '测验', score: 88 },
];

const featureList = [
  { title: '成绩考试管理', desc: '灵活创建多科目考试，批量录入成绩，自动生成班级排名与成绩分布分析。', icon: 'EditPen', color: 'blue', tags: ['考试录入', '成绩统计', '班级排名'] },
  { title: '考勤行为追踪', desc: '每日考勤一键打卡，实时统计出勤率，课堂行为标签化记录，异常及时提醒。', icon: 'Calendar', color: 'green', tags: ['考勤打卡', '出勤统计', '行为记录'] },
  { title: '班级学员管理', desc: '创建班级、录入学员信息，支持批量导入导出，一键查看学员全景档案。', icon: 'User', color: 'violet', tags: ['班级管理', '学生档案', '批量导入'] },
  { title: 'AI 课后反馈', desc: '基于成绩、出勤、行为数据，AI 自动生成个性化课后反馈，支持导出 PDF。', icon: 'MagicStick', color: 'pink', tags: ['一键生成', '数据图表', 'PDF 导出'] },
  { title: '数据分析看板', desc: '班级学情一目了然，成绩趋势、排名分布、下滑预警，让数据驱动教学决策。', icon: 'DataAnalysis', color: 'orange', tags: ['成绩趋势', '排名分布', '异常预警'] },
  { title: '学员成长档案', desc: '完整记录学员考试成绩、出勤情况与课堂行为，形成可追溯的成长轨迹。', icon: 'Histogram', color: 'teal', tags: ['成绩历史', '出勤记录', '行为标签'] },
];

function scrollTo(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
}

function onScroll() {
  scrolled.value = window.scrollY > 40;
}

async function handleLogin() {
  const valid = await loginFormRef.value.validate().catch(() => false);
  if (!valid) return;
  loginLoading.value = true;
  try {
    const res = await request.post('/auth/login', {
      username: loginForm.value.username,
      password: loginForm.value.password,
    });
    auth.token = res.token;
    auth.username = res.username || loginForm.value.username;
    auth.role = res.role || 'teacher';
    localStorage.setItem('token', res.token);
    localStorage.setItem('username', auth.username);
    localStorage.setItem('role', auth.role);
    ElMessage.success('登录成功');
    router.push('/dashboard');
  } catch (e) {
    ElMessage.error(e.message || '登录失败');
  } finally {
    loginLoading.value = false;
  }
}

onMounted(() => {
  window.addEventListener('scroll', onScroll, { passive: true });
  // IntersectionObserver for fade-up animations
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
      }
    });
  }, { threshold: 0.1 });
  document.querySelectorAll('[v-fade-up]').forEach((el) => observer.observe(el));
  // 从注册页跳转过来时自动打开登录弹窗
  if (route.query.login === '1') {
    showLogin.value = true;
  }
});

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
/* ===== 全局 ===== */
.landing { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif; color: #e2e8f0; background: #0b0f1a; min-height: 100vh; overflow-x: hidden; }

/* ===== 滚动动效 ===== */
[v-fade-up] { opacity: 0; transform: translateY(28px); transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1), transform 0.7s cubic-bezier(0.22, 1, 0.36, 1); }
[v-fade-up].in-view { opacity: 1; transform: translateY(0); }

/* ===== 导航 ===== */
.nav { position: fixed; top: 0; left: 0; right: 0; z-index: 100; transition: background 0.3s, border-color 0.3s; border-bottom: 1px solid transparent; }
.nav-solid { background: rgba(11, 15, 26, 0.85); backdrop-filter: blur(12px); border-bottom-color: rgba(148, 163, 184, 0.08); }
.nav-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; padding: 0 24px; height: 64px; }
.nav-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; font-size: 15px; color: #f8fafc; }
.brand-icon { width: 32px; height: 32px; border-radius: 10px; background: linear-gradient(135deg, #6366f1, #8b5cf6); display: flex; align-items: center; justify-content: center; color: #fff; }
.brand-icon.large { width: 48px; height: 48px; border-radius: 14px; }
.nav-links { display: flex; gap: 32px; }
.nav-links a { color: #94a3b8; text-decoration: none; font-size: 14px; transition: color 0.2s; cursor: pointer; }
.nav-links a:hover { color: #e2e8f0; }
.nav-btns { display: flex; gap: 8px; }
.nav-login { color: #cbd5e1; }
.nav-reg { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; font-weight: 600; }

/* ===== Hero ===== */
.hero { position: relative; padding: 150px 24px 80px; text-align: center; overflow: hidden; background: linear-gradient(180deg, #0b0f1a 0%, #0f172a 55%, #0b0f1a 100%); }
.hero-glow { position: absolute; border-radius: 50%; filter: blur(90px); opacity: 0.35; pointer-events: none; }
.hero-glow-1 { width: 700px; height: 700px; top: -250px; left: -150px; background: radial-gradient(circle, #6366f1, transparent 70%); }
.hero-glow-2 { width: 600px; height: 600px; top: -180px; right: -200px; background: radial-gradient(circle, #8b5cf6, transparent 70%); }
.hero-inner { position: relative; z-index: 2; max-width: 820px; margin: 0 auto; }
.hero-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 16px; border-radius: 999px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); font-size: 13px; color: #a5b4fc; margin-bottom: 24px; }
.badge-dot { width: 6px; height: 6px; border-radius: 50%; background: #6366f1; animation: pulse 2.5s infinite; }
@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.35; } }
.hero-title { font-size: 48px; font-weight: 800; line-height: 1.2; letter-spacing: -0.02em; margin: 0 0 20px; color: #f8fafc; }
.grad { background: linear-gradient(90deg, #a5b4fc, #c4b5fd, #22d3ee); -webkit-background-clip: text; background-clip: text; color: transparent; }
.hero-desc { font-size: 16px; color: #64748b; line-height: 1.8; margin: 0 0 36px; }
.hero-actions { display: flex; gap: 16px; justify-content: center; }
.hero-btn-primary { background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; font-size: 15px; font-weight: 600; padding: 0 28px; height: 48px; border-radius: 12px; box-shadow: 0 8px 28px rgba(99, 102, 241, 0.45); }
.hero-btn-primary:hover { box-shadow: 0 12px 36px rgba(99, 102, 241, 0.6); transform: translateY(-1px); }
.btn-icon { margin-right: 6px; vertical-align: middle; }
.hero-btn-secondary { background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(148, 163, 184, 0.15); color: #cbd5e1; font-size: 15px; font-weight: 600; padding: 0 28px; height: 48px; border-radius: 12px; }
.hero-btn-secondary:hover { background: rgba(255, 255, 255, 0.08); border-color: rgba(148, 163, 184, 0.3); }

/* ===== 预览 KPI 卡片 ===== */
.preview-section { padding: 0 24px 80px; }
.preview-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 1100px; margin: 0 auto; }
.preview-kpi { background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(148, 163, 184, 0.08); border-radius: 16px; padding: 24px; position: relative; overflow: hidden; transition: all 0.35s ease; }
.preview-kpi:hover { background: rgba(255, 255, 255, 0.045); border-color: rgba(99, 102, 241, 0.18); transform: translateY(-3px); box-shadow: 0 16px 40px rgba(0,0,0,0.3); }
.preview-kpi.wide { grid-column: span 2; }
.kpi-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
.kpi-label { font-size: 13px; color: #94a3b8; font-weight: 500; }
.kpi-icon { color: #64748b; }
.preview-tag { padding: 3px 10px; border-radius: 999px; background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2); font-size: 11px; color: #34d399; }
.kpi-num { font-size: 32px; font-weight: 800; color: #f8fafc; line-height: 1; margin-bottom: 6px; display: flex; align-items: baseline; gap: 4px; }
.kpi-unit { font-size: 14px; font-weight: 500; color: #64748b; }
.kpi-trend { display: flex; align-items: center; gap: 4px; font-size: 12px; color: #64748b; margin-bottom: 16px; }
.kpi-trend.up { color: #34d399; }
.kpi-trend.down { color: #f87171; }
.kpi-bars { display: flex; align-items: flex-end; gap: 4px; height: 32px; }
.kpi-bar { flex: 1; border-radius: 3px; background: linear-gradient(180deg, rgba(99,102,241,0.35), rgba(99,102,241,0.08)); min-height: 3px; }
.kpi-bar.orange { background: linear-gradient(180deg, rgba(245,158,11,0.35), rgba(245,158,11,0.08)); }
.kpi-bar.green { background: linear-gradient(180deg, rgba(16,185,129,0.35), rgba(16,185,129,0.08)); }
.kpi-bar.pink { background: linear-gradient(180deg, rgba(236,72,153,0.35), rgba(236,72,153,0.08)); }
.kpi-ring { width: 60px; height: 60px; position: absolute; right: 20px; bottom: 20px; }
.kpi-ring-svg { width: 100%; height: 100%; }

/* 宽卡片图表 */
.kpi-chart-row { display: flex; align-items: flex-end; gap: 12px; height: 90px; padding-top: 8px; }
.kpi-chart-item { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 6px; }
.kpi-chart-bar-wrap { width: 100%; height: 70px; display: flex; align-items: flex-end; }
.kpi-chart-bar { width: 100%; border-radius: 6px 6px 2px 2px; background: linear-gradient(180deg, rgba(99,102,241,0.5), rgba(99,102,241,0.1)); min-height: 4px; transition: height 1s cubic-bezier(0.22,1,0.36,1); }
.kpi-chart-label { font-size: 11px; color: #475569; text-align: center; white-space: nowrap; }

/* ===== 通用 section ===== */
.section-inner { max-width: 1200px; margin: 0 auto; padding: 0 24px; }
.section-head { text-align: center; margin-bottom: 56px; }
.section-tag { display: inline-block; padding: 4px 14px; border-radius: 999px; background: rgba(99, 102, 241, 0.1); border: 1px solid rgba(99, 102, 241, 0.2); font-size: 12px; font-weight: 600; color: #a5b4fc; margin-bottom: 14px; letter-spacing: 0.05em; }
.section-title { font-size: 32px; font-weight: 800; margin: 0 0 12px; color: #f8fafc; }
.section-desc { font-size: 16px; color: #64748b; margin: 0; }

/* ===== 功能卡片 ===== */
.features { padding: 80px 0 100px; background: linear-gradient(180deg, #0b0f1a, #0f172a); }
.feature-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
.feature-card { background: rgba(255, 255, 255, 0.025); border: 1px solid rgba(148, 163, 184, 0.07); border-radius: 16px; padding: 32px; transition: all 0.35s cubic-bezier(0.22, 1, 0.36, 1); }
.feature-card:hover { background: rgba(255, 255, 255, 0.04); border-color: rgba(99, 102, 241, 0.2); transform: translateY(-6px); box-shadow: 0 24px 56px rgba(0, 0, 0, 0.4); }
.fc-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin-bottom: 20px; color: #fff; font-size: 20px; box-shadow: 0 6px 14px -4px rgba(0,0,0,0.3); }
.fc-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.fc-icon.violet { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.fc-icon.green { background: linear-gradient(135deg, #10b981, #059669); }
.fc-icon.pink { background: linear-gradient(135deg, #ec4899, #db2777); }
.fc-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.fc-icon.teal { background: linear-gradient(135deg, #14b8a6, #0d9488); }
.feature-card h3 { font-size: 17px; font-weight: 700; margin: 0 0 10px; color: #f1f5f9; }
.feature-card p { font-size: 14px; color: #64748b; line-height: 1.7; margin: 0 0 16px; min-height: 48px; }
.fc-tags { display: flex; flex-wrap: wrap; gap: 8px; }
.fc-tag { padding: 4px 10px; border-radius: 6px; background: rgba(255,255,255,0.04); border: 1px solid rgba(148,163,184,0.1); font-size: 12px; color: #94a3b8; }

/* ===== 底部 ===== */
.footer { padding: 40px 24px; border-top: 1px solid rgba(148, 163, 184, 0.06); background: #0b0f1a; }
.footer-inner { max-width: 1200px; margin: 0 auto; display: flex; align-items: center; justify-content: space-between; }
.footer-brand { display: flex; align-items: center; gap: 10px; font-weight: 700; color: #f8fafc; }
.footer-copy { font-size: 13px; color: #475569; margin: 0; }

/* ===== 登录弹窗 ===== */
.login-overlay { position: fixed; inset: 0; z-index: 200; background: rgba(2, 6, 23, 0.75); backdrop-filter: blur(8px); display: flex; align-items: center; justify-content: center; padding: 24px; }
.login-card { background: #111827; border: 1px solid rgba(148, 163, 184, 0.1); border-radius: 20px; padding: 40px 36px; width: 100%; max-width: 400px; box-shadow: 0 32px 64px rgba(0,0,0,0.5); }
.login-logo { text-align: center; margin-bottom: 32px; }
.login-logo .brand-icon { margin: 0 auto 16px; }
.login-logo h2 { font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0 0 6px; }
.login-logo p { font-size: 13px; color: #64748b; margin: 0; }
.login-field { margin-bottom: 18px; }
.login-field :deep(.el-form-item__label) { color: #94a3b8; font-size: 13px; padding-bottom: 6px; }
.login-field :deep(.el-form-item__content) { line-height: 1; }
.login-field :deep(.el-form-item__error) { padding-top: 4px; }
.login-form :deep(.el-input__wrapper) { background: rgba(255,255,255,0.04) !important; box-shadow: 0 0 0 1px rgba(148,163,184,0.15) inset !important; border-radius: 10px; }
.login-form :deep(.el-input__wrapper.is-focus) { box-shadow: 0 0 0 1px rgba(99,102,241,0.5) inset !important; }
.login-form :deep(.el-input__inner) { color: #e2e8f0; }
.login-form :deep(.el-input__prefix-inner) { color: #64748b; }
.login-options { display: flex; align-items: center; justify-content: space-between; margin-bottom: 24px; }
.login-options :deep(.el-checkbox__label) { font-size: 13px; color: #94a3b8; }
.login-options :deep(.el-checkbox__input.is-checked + .el-checkbox__label) { color: #a5b4fc; }
.login-forgot { font-size: 13px; color: #a5b4fc; cursor: pointer; }
.login-forgot:hover { text-decoration: underline; }
.login-submit { width: 100%; background: linear-gradient(135deg, #6366f1, #8b5cf6); border: none; font-size: 15px; font-weight: 600; height: 44px; border-radius: 10px; box-shadow: 0 6px 20px rgba(99, 102, 241, 0.4); }
.login-submit:hover { box-shadow: 0 8px 28px rgba(99, 102, 241, 0.55); }
.login-foot { text-align: center; margin-top: 20px; }
.login-back { display: inline-flex; align-items: center; gap: 4px; font-size: 13px; color: #64748b; cursor: pointer; transition: color 0.2s; }
.login-back:hover { color: #94a3b8; }
.login-register { text-align: center; margin-top: 16px; font-size: 13px; color: #64748b; }
.login-register a { color: #a5b4fc; cursor: pointer; margin-left: 4px; }
.login-register a:hover { text-decoration: underline; }

/* fade transition */
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s; }
.fade-enter-from, .fade-leave-to { opacity: 0; }

@media (max-width: 900px) {
  .hero-title { font-size: 32px; }
  .feature-grid { grid-template-columns: 1fr; }
  .preview-grid { grid-template-columns: 1fr; }
  .preview-kpi.wide { grid-column: span 1; }
  .nav-links { display: none; }
}
</style>
