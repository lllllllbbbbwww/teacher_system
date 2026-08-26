# 免费部署指南（GitHub + 免费平台，国内可较好打开）

目标：把代码放 GitHub，前后端免费部署，给朋友发链接就能打开提意见。

> 数据库你已经用 Supabase 云库了，**部署后不用改**，这篇只讲前后端。

---

## 一、整体方案

| 部分 | 平台 | 费用 | 国内访问 |
| --- | --- | --- | --- |
| 代码 | GitHub 仓库 | 免费 | 你传代码用 |
| 前端 | **Vercel** 或 **Cloudflare Pages** | 免费 | 国内基本能开 |
| 后端 | **Render** / **Koyeb**（新加坡节点） | 免费 | 比美国快 |
| 数据库 | Supabase 云库（已有） | 免费 | 新加坡节点 |

> 备选：若 Vercel 国内偶尔抽风，前端换 **Cloudflare Pages**（国内更稳，同样免费）。

---

## 二、前端部署（Vercel，最简单）

1. 打开 https://vercel.com ，用 GitHub 登录
2. **New Project** → 导入你的 GitHub 仓库
3. 配置：
   - Framework Preset: `Vite`
   - Root Directory: `frontend`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables** 添加一项：
   - `VITE_API_BASE` = 你后端的公网地址（部署后端后会得到，例如 `https://teacher-backend.onrender.com`）
   - 先不填也能部署，但页面打开后调接口会失败，所以**拿到后端地址后再回来填一次并红 Deploy**
5. Deploy → 得到前端地址 `https://xxx.vercel.app`

> 用 Cloudflare Pages 同理：连接仓库 → 构建命令 `npm run build`、输出 `dist`、加 `VITE_API_BASE` 变量。

---

## 三、后端部署（Render，免费）

1. 打开 https://render.com ，用 GitHub 登录
2. **New** → **Blueprint** → 导入仓库，Render 会自动读 `backend/render.yaml`
3. 在 Render 控制台给后端服务填 **Environment Variables**（把本地 `.env` 的值原样填进去）：
   - `SUPABASE_URL`、`SUPABASE_SERVICE_ROLE_KEY`
   - `JWT_SECRET`（随便一段复杂字符串）
   - `AI_API_KEY`、`AI_API_BASE`、`AI_MODEL`
   - `INIT_ADMIN=admin`、`INIT_ADMIN_PASSWORD=Admin123456`
   - 其他保持默认
4. Deploy → 得到后端地址 `https://teacher-backend.onrender.com`
5. **把后端地址回填到前端的 `VITE_API_BASE`**（见上一步 4），红 Deploy 前端

> ⚠️ Render 免费版 **15 分钟无访问会休眠**，朋友第一次打开要等 ~15 秒唤醒，正常现象。

---

## 四、验证

1. 打开前端地址 `https://xxx.vercel.app`
2. 点登录 → 用 `admin / Admin123456` 登录
3. 能进工作台 = 前后端 + 数据库全部打通 ✅

---

## 五、本地开发（不受影响）

- 前端本地：`npm run dev`，走 `vite.config.js` 的 `/api` 代理到 `localhost:3000`
- 生产才需要 `VITE_API_BASE`，本地不用设

---

## 六、部署注意事项（必看）

1. **密钥别提交**：`.env`、`.env.production` 已在 `.gitignore` 屏蔽，只提交 `.env.example`（占位，无真实值）
2. **改了代码就 push**：Vercel / Render 连了 GitHub，push 到 `main` 会自动重新部署
3. **后端地址变了**：改 Render 部署后，记得去 Vercel 改 `VITE_API_BASE` 并重部署前端
4. **CORS**：后端 `app.use(cors())` 已放开，跨域没问题
5. **502 / 调接口失败**：
   - 检查 Vercel 的 `VITE_API_BASE` 是否填对（必须是 `https://` 开头、能浏览器直接打开后端 `/health` 返回 ok）
   - 后端是否休眠（等 15 秒再试）
6. **AI 功能用不了**：检查 `AI_API_KEY` 是否填对，与本地 `.env` 一致
7. **数据库连不上**：确认 Supabase 的 `SUPABASE_SERVICE_ROLE_KEY` 填的是 service_role（不是 anon key）

---

## 七、目录改动说明（为部署新增的文件）

- `frontend/src/utils/request.js`：API 地址改读 `VITE_API_BASE`，未配置时走 `/api`
- `frontend/.env.production` / `.env.example`：生产环境变量（已 gitignore 生产文件）
- `frontend/vercel.json`：SPA 路由回退
- `frontend/.github/workflows/deploy.yml`：可选，GitHub Pages 自动部署
- `frontend/vite.config.js`：增加 `base` 支持子路径
- `backend/render.yaml` / `backend/Procfile`：Render 一键部署
- `backend/.env.example`：后端环境变量示例
