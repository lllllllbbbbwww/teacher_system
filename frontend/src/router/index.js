import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  { path: '/login', name: 'login', component: () => import('../views/Login.vue'), meta: { public: true } },
  { path: '/register', name: 'register', component: () => import('../views/Register.vue'), meta: { public: true } },
  { path: '/landing', name: 'landing', component: () => import('../views/LandingPage.vue'), meta: { public: true } },
  {
    path: '/',
    component: () => import('../layout/MainLayout.vue'),
    children: [
      { path: 'dashboard', name: 'dashboard', component: () => import('../views/Dashboard.vue'), meta: { title: '工作台' } },
      { path: 'students/:id', name: 'studentProfile', component: () => import('../views/StudentProfile.vue'), meta: { title: '学员档案' } },
      { path: 'classes', name: 'classes', component: () => import('../views/ClassManage.vue'), meta: { title: '班级管理' } },
      { path: 'students', name: 'students', component: () => import('../views/StudentManage.vue'), meta: { title: '学生管理' } },
      { path: 'score-manage', name: 'scoreManage', component: () => import('../views/ScoreManage.vue'), meta: { title: '成绩管理' } },
      { path: 'attendance-manage', name: 'attendanceManage', component: () => import('../views/AttendanceManage.vue'), meta: { title: '考勤管理' } },
      { path: 'behavior/records', name: 'behaviorRecords', component: () => import('../views/BehaviorRecord.vue'), meta: { title: '行为记录' } },
      { path: 'feedback', name: 'feedbackManage', component: () => import('../views/FeedbackManage.vue'), meta: { title: '课后反馈' } },
      { path: 'admin/users', name: 'adminUsers', component: () => import('../views/AdminUsers.vue'), meta: { title: '用户管理' } },
    ],
  },
  { path: '/:pathMatch(.*)*', redirect: '/dashboard' },
];

const router = createRouter({ history: createWebHistory(), routes });

// 路由守卫
router.beforeEach((to) => {
  const auth = useAuthStore();
  // 已登录访问 / → 工作台
  if (to.path === '/' && auth.isLogin) {
    return { name: 'dashboard' };
  }
  // 未登录访问 / → landing
  if (to.path === '/' && !auth.isLogin) {
    return { name: 'landing' };
  }
  // 未登录访问非公开页 → 登录
  if (!to.meta.public && !auth.isLogin) {
    return { name: 'login' };
  }
  // 已登录访问 landing/login/register → 工作台
  if (auth.isLogin && ['landing', 'login', 'register'].includes(to.name)) {
    return { name: 'dashboard' };
  }
});

export default router;
