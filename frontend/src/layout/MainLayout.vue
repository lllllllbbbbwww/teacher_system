<template>
  <div class="layout">
    <aside class="sidebar">
      <div class="logo">
        <span class="logo-mark">师</span>
        <div class="logo-text">
          <span class="logo-name">教师工作台</span>
          <span class="logo-sub">Teacher Workbench</span>
        </div>
      </div>
      <el-menu class="menu" :default-active="activeMenu" router>
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon><span>工作台</span>
        </el-menu-item>

        <div class="menu-group-label">教学数据</div>
        <el-menu-item index="/score-manage"><el-icon><EditPen /></el-icon><span>成绩管理</span></el-menu-item>
        <el-menu-item index="/attendance-manage"><el-icon><Calendar /></el-icon><span>考勤管理</span></el-menu-item>

        <div class="menu-group-label">学员档案</div>
        <el-menu-item index="/classes"><el-icon><School /></el-icon><span>班级管理</span></el-menu-item>
        <el-menu-item index="/students"><el-icon><User /></el-icon><span>学生管理</span></el-menu-item>

        <el-menu-item index="/feedback"><el-icon><MagicStick /></el-icon><span>课后反馈</span></el-menu-item>

        <template v-if="auth.isAdmin">
          <div class="menu-group-label">系统管理</div>
          <el-menu-item index="/admin/users"><el-icon><Setting /></el-icon><span>用户管理</span></el-menu-item>
        </template>
      </el-menu>
      <div class="sidebar-foot">
        <div class="user-chip">
          <span class="user-avatar">{{ auth.username?.charAt(0)?.toUpperCase() || 'T' }}</span>
          <div class="user-meta">
            <span class="user-name">{{ auth.username }}</span>
            <span class="user-role">{{ auth.isAdmin ? '管理员' : '教师账号' }}</span>
          </div>
        </div>
      </div>
    </aside>

    <div class="main">
      <header class="main-header">
        <div class="crumb">
          <span class="crumb-root">教师工作台</span>
          <span class="crumb-sep">/</span>
          <span class="crumb-cur">{{ currentTitle }}</span>
        </div>
        <div class="header-right">
          <div class="theme-toggle" :title="theme === 'dark' ? '切换到亮色模式' : '切换到暗色模式'" @click="toggleTheme">
            <el-icon><Sunny v-if="theme === 'dark'" /><Moon v-else /></el-icon>
          </div>
        </div>
        <el-dropdown @command="onCommand">
          <span class="header-user">
            <span class="header-avatar">{{ auth.username?.charAt(0)?.toUpperCase() || 'T' }}</span>
            <span class="header-name">{{ auth.username }}</span>
            <el-icon class="header-caret"><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="logout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </header>
      <div class="main-content">
        <router-view />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import {
  ArrowDown, Odometer, EditPen, Calendar, School, User, MagicStick, Setting,
  Sunny, Moon,
} from '@element-plus/icons-vue';

const route = useRoute();
const router = useRouter();
const auth = useAuthStore();
const theme = ref(localStorage.getItem('tf_theme') || 'dark');
function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', theme.value);
  localStorage.setItem('tf_theme', theme.value);
}
document.documentElement.setAttribute('data-theme', theme.value);
const activeMenu = computed(() => {
  // 学生档案动态路由 /students/:id 高亮"学生管理"
  if (route.path.startsWith('/students/')) return '/students';
  return route.path;
});
const currentTitle = computed(() => route.meta.title || '工作台');

function onCommand(cmd) {
  if (cmd === 'logout') {
    auth.logout();
    router.replace('/landing');
  }
}
</script>

<style scoped>
.header-right { display: flex; align-items: center; gap: 10px; }
.theme-toggle {
  width: 34px; height: 34px; border-radius: 10px; cursor: pointer;
  display: flex; align-items: center; justify-content: center; font-size: 16px;
  color: var(--text-sub); border: 1px solid var(--border); background: var(--panel-2);
  transition: all 0.18s ease;
}
.theme-toggle:hover { color: var(--primary); border-color: rgba(99, 102, 241, 0.5); }

.logo-mark {
  width: 38px;
  height: 38px;
  border-radius: 12px;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff;
  font-size: 19px;
  font-weight: 800;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 6px 16px -4px rgba(99, 102, 241, 0.6);
  flex: none;
}
.logo-text { display: flex; flex-direction: column; line-height: 1.2; }
.logo-name { font-size: 15px; font-weight: 700; color: var(--text); letter-spacing: 0.01em; }
.logo-sub { font-size: 10px; color: var(--text-muted); letter-spacing: 0.08em; }

.sidebar-foot { margin-top: auto; padding: 16px 14px; border-top: 1px solid rgba(148, 163, 184, 0.08); }
.user-chip {
  display: flex; align-items: center; gap: 10px;
  padding: 8px 10px; border-radius: 10px;
  background: rgba(99, 102, 241, 0.08);
  border: 1px solid rgba(99, 102, 241, 0.14);
}
.user-avatar {
  width: 32px; height: 32px; border-radius: 50%; flex: none;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 14px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.user-meta { display: flex; flex-direction: column; line-height: 1.25; min-width: 0; }
.user-name { font-size: 13px; font-weight: 600; color: var(--text); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.user-role { font-size: 11px; color: var(--text-muted); }

.crumb { display: flex; align-items: center; gap: 8px; font-size: 14px; }
.crumb-root { color: var(--text-muted); }
.crumb-sep { color: var(--text-sub); }
.crumb-cur { color: var(--text); font-weight: 600; }

.header-user { display: flex; align-items: center; gap: 8px; cursor: pointer; padding: 6px 10px; border-radius: 10px; transition: background 0.15s; }
.header-user:hover { background: rgba(148, 163, 184, 0.08); }
.header-avatar {
  width: 30px; height: 30px; border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: #fff; font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}
.header-name { font-size: 14px; font-weight: 600; color: var(--text); }
.header-caret { font-size: 12px; color: var(--text-muted); }
</style>
