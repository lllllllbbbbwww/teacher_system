<template>
  <div class="login-page">
    <!-- 左侧品牌视觉区 -->
    <div class="brand-panel">
      <div class="brand-inner">
        <div class="brand-top">
          <div class="brand-logo">师</div>
          <span class="brand-name">教师智能工作台</span>
        </div>
        <h1 class="brand-slogan">
          让每一次教学反馈<br />都有<span class="grad-text">数据支撑</span>
        </h1>
        <p class="brand-desc">班级 · 成绩 · 考勤 · 行为 · AI 反馈，教师一站式工作台</p>
        <ul class="brand-features">
          <li>
            <div class="feat-ic"><el-icon :size="18"><DataAnalysis /></el-icon></div>
            <div>
              <div class="feat-t">数据看板</div>
              <div class="feat-d">班级学情可视化，一键掌握</div>
            </div>
          </li>
          <li>
            <div class="feat-ic"><el-icon :size="18"><MagicStick /></el-icon></div>
            <div>
              <div class="feat-t">AI 智能反馈</div>
              <div class="feat-d">基于学情自动生成个性化评语</div>
            </div>
          </li>
          <li>
            <div class="feat-ic"><el-icon :size="18"><FolderChecked /></el-icon></div>
            <div>
              <div class="feat-t">一键导出</div>
              <div class="feat-d">成绩单 / PDF 反馈，快速归档</div>
            </div>
          </li>
        </ul>
      </div>
      <div class="deco deco-1"></div>
      <div class="deco deco-2"></div>
      <div class="deco deco-3"></div>
    </div>

    <!-- 右侧登录表单区 -->
    <div class="form-panel">
      <div class="form-card">
        <div class="form-head">
          <h2>欢迎回来</h2>
          <p class="form-sub">请登录你的教师账号</p>
        </div>
        <el-form :model="form" :rules="rules" ref="formRef" label-position="top" size="large">
          <el-form-item label="用户名" prop="username">
            <el-input v-model="form.username" placeholder="请输入用户名" :prefix-icon="User" />
          </el-form-item>
          <el-form-item label="密码" prop="password">
            <el-input v-model="form.password" type="password" show-password placeholder="请输入密码" :prefix-icon="Lock" @keyup.enter="onSubmit" />
          </el-form-item>
          <el-button type="primary" class="login-btn" :loading="loading" @click="onSubmit">登 录</el-button>
        </el-form>
        <div class="form-foot">
          <span>还没有账号？</span>
          <el-link type="primary" :underline="false" @click="goRegister">立即注册</el-link>
        </div>
      </div>
      <p class="page-foot">© {{ year }} 教师智能工作台</p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock, DataAnalysis, MagicStick, FolderChecked } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const auth = useAuthStore();
const formRef = ref();
const loading = ref(false);
const year = new Date().getFullYear();
const form = reactive({ username: '', password: '' });
const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
};

async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    await auth.login(form);
    ElMessage.success('登录成功');
    router.replace('/dashboard');
  } catch (e) {
    ElMessage.error(e.message || '登录失败');
  } finally {
    loading.value = false;
  }
}
function goRegister() {
  router.push('/register');
}
</script>

<style scoped>
.login-page {
  display: flex;
  min-height: 100vh;
  background: var(--bg);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Microsoft YaHei", sans-serif;
}

/* 左侧品牌区 */
.brand-panel {
  flex: 1.1;
  position: relative;
  background: linear-gradient(160deg, #0a1120 0%, #131d36 55%, #1c2b52 100%);
  color: #fff;
  display: flex;
  align-items: center;
  padding: 0 8%;
  overflow: hidden;
}
.brand-inner { position: relative; z-index: 2; max-width: 520px; }

.brand-top {
  display: flex; align-items: center; gap: 12px; margin-bottom: 56px;
}
.brand-logo {
  width: 42px; height: 42px; border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  box-shadow: 0 6px 18px -4px rgba(99, 102, 241, 0.6);
  display: flex; align-items: center; justify-content: center;
  font-size: 20px; font-weight: 700;
}
.brand-name { font-size: 15px; font-weight: 600; letter-spacing: 0.02em; opacity: 0.95; }

.brand-slogan {
  font-size: 44px; line-height: 1.25; font-weight: 800; letter-spacing: -0.02em; margin: 0 0 18px;
}
.grad-text {
  background: linear-gradient(90deg, #a5b4fc, #c4b5fd);
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.brand-desc { font-size: 16px; color: rgba(226, 232, 240, 0.66); margin: 0 0 48px; line-height: 1.7; }

.brand-features { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 26px; }
.brand-features li { display: flex; gap: 14px; align-items: flex-start; }
.feat-ic {
  width: 40px; height: 40px; flex: none; border-radius: 10px;
  background: rgba(99, 102, 241, 0.16); border: 1px solid rgba(99, 102, 241, 0.28);
  display: flex; align-items: center; justify-content: center; color: #a5b4fc;
}
.feat-t { font-size: 15px; font-weight: 600; margin-bottom: 2px; }
.feat-d { font-size: 13px; color: rgba(226, 232, 240, 0.55); }

/* 几何装饰 */
.deco { position: absolute; border-radius: 50%; filter: blur(2px); z-index: 1; }
.deco-1 {
  width: 420px; height: 420px; right: -140px; top: -120px;
  background: radial-gradient(circle, rgba(99,102,241,0.32), transparent 70%);
}
.deco-2 {
  width: 300px; height: 300px; left: -100px; bottom: -80px;
  background: radial-gradient(circle, rgba(139,92,246,0.22), transparent 70%);
}
.deco-3 {
  width: 200px; height: 200px; right: 10%; bottom: 15%;
  background: radial-gradient(circle, rgba(34,211,238,0.18), transparent 70%);
}

/* 右侧表单区 */
.form-panel {
  flex: 1;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  padding: 40px 24px; position: relative;
}
.form-card {
  width: 100%; max-width: 400px;
  background: var(--panel);
  border: 1px solid rgba(148, 163, 184, 0.14);
  border-radius: 18px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  padding: 40px 36px 32px;
}
.form-head { margin-bottom: 28px; }
.form-head h2 { margin: 0 0 6px; font-size: 26px; font-weight: 800; color: var(--text); letter-spacing: -0.01em; }
.form-sub { margin: 0; color: var(--text-muted); font-size: 14px; }

::deep(.el-form-item__label) { font-weight: 600; color: var(--text-sub); padding-bottom: 6px !important; }
.login-btn {
  width: 100%; height: 46px; margin-top: 8px;
  font-size: 15px; font-weight: 700; letter-spacing: 0.06em;
  border-radius: 10px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none;
  box-shadow: 0 6px 18px rgba(99, 102, 241, 0.45);
  transition: all .2s;
}
.login-btn:hover { box-shadow: 0 10px 26px rgba(99, 102, 241, 0.6); transform: translateY(-1px); }
.login-btn:active { transform: translateY(0); }

.form-foot {
  margin-top: 22px; text-align: center; font-size: 13px; color: var(--text-muted);
  display: flex; justify-content: center; gap: 6px; align-items: center;
}
.page-foot { position: absolute; bottom: 24px; font-size: 12px; color: var(--text-muted); }

@media (max-width: 900px) {
  .brand-panel { display: none; }
  .login-page { background: var(--bg); }
  .form-card { box-shadow: 0 20px 60px rgba(0,0,0,0.4); }
}
</style>
