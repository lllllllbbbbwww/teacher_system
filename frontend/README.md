# 前端 (Vue 3)

## 环境要求
- Node.js ≥ 18
- 包管理器 npm

## 依赖安装
```bash
npm install
```

## 启动开发
```bash
npm run dev      # 默认 :5173
npm run build    # 生产构建到 dist/
npm run preview  # 预览构建产物
```

## 代理配置
开发期 `vite.config.js` 已配置 `/api` 代理到 `VITE_API_BASE_URL`（默认 http://localhost:3000），
无需后端开启 CORS 即可联调。生产部署时可将前端构建产物托管到 Vercel/静态服务器，并将
`VITE_API_BASE_URL` 指向后端公网地址。

## 目录
- `src/utils/request.js`：axios 封装，统一解包 `{code,data,msg}`，自动注入 token
- `src/stores/*`：Pinia（auth / class / student / common）
- `src/router/index.js`：路由 + 登录守卫
- `src/layout/MainLayout.vue`：侧边栏 + 顶栏主框架
- `src/views/*`：登录、注册 + 13 个功能页面
- `src/styles/main.css`：极简办公风全局样式

## 视觉规范
白底浅灰、主色 `#2f6fed`、圆角 6px、无花哨动画，符合办公场景使用习惯。
