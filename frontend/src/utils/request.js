import axios from 'axios';
import { ElMessage } from 'element-plus';
import router from '../router';

// 后端 API 地址:
// - 生产环境: 使用环境变量 VITE_API_BASE, 未设置时回退到已部署的后端地址
// - 本地开发: 走 /api (由 vite 代理到 localhost:3000)
const PROD_API = 'https://teacher-backend01.onrender.com';
const API_BASE = import.meta.env.PROD ? (import.meta.env.VITE_API_BASE || PROD_API) : '/api';

const request = axios.create({
  baseURL: API_BASE,
  timeout: 60000, // 覆盖 AI 生成(后端30s)等慢接口
});

// 请求头注入 token
request.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 统一响应: 仅取 { code, data, msg }
request.interceptors.response.use(
  (resp) => {
    const body = resp.data;
    if (body && body.code === 0) {
      return body.data; // 直接返回 data
    }
    // 业务错误
    ElMessage.error(body?.msg || '请求失败');
    return Promise.reject(new Error(body?.msg || 'business error'));
  },
  (err) => {
    const status = err.response?.status;
    const msg = err.response?.data?.msg;
    if (status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('username');
      localStorage.removeItem('role');
      ElMessage.error(msg || '登录已过期，请重新登录');
      router.replace('/landing');
    } else if (err.code === 'ECONNABORTED' || /timeout/i.test(err.message || '')) {
      ElMessage.error('请求超时，AI 生成较耗时，请稍后重试');
    } else if (!err.response) {
      // 网络层失败（断网 / 后端未启动 / 跨域）
      ElMessage.error('无法连接服务器，请检查后端是否已启动');
    } else {
      ElMessage.error(msg || `请求失败（${status}）`);
    }
    return Promise.reject(err);
  }
);

export default request;
