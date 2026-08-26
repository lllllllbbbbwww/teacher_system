# 教师学情智能管理系统 v2.1

面向中小学班主任的学情管理工具：班级/学生/考试/成绩/考勤/行为标签管理，并基于真实数据生成家长沟通用的 AI 学情反馈（微信版 + 完整版），支持 Excel / PDF 导出。

## 技术栈（固定，不得变更）

| 层 | 技术 |
| --- | --- |
| 前端 | Vue 3 + Element Plus + ECharts + Pinia + Vue Router + Vite |
| 后端 | Node.js + Express + JWT |
| 数据库 | PostgreSQL（Supabase 托管） |
| 数据访问 | **@supabase/supabase-js 链式调用**（严禁拼接原生 SQL） |
| AI | 豆包 / OpenAI 兼容接口 |

## 开发铁律

1. **技术栈固定**：见上表，不得替换。
2. **数据隔离**：所有业务表冗余 `teacher_id`；所有查询第一条件必为 `eq('teacher_id', req.user.id)`；禁止通过关联表间接校验权限。
3. **不超范围**：PRD 之外的功能（作业、家长端、文件上传等）一律不做。
4. **接口规范**：所有接口入参校验、全局异常捕获、统一响应 `{ code, data, msg }`（`code=0` 成功）。
5. **视觉规范**：极简办公风，无花哨动画。
6. **分阶段交付**：Phase 1~5 顺序推进。

## 目录结构

```
vib_jiaoshi/
├── database/schema.sql      # 建表 SQL (11 表 + 索引 + 约束 + 种子数据)
├── backend/                 # Express 后端
├── frontend/                # Vue3 前端
└── README.md
```

## 快速启动

### 0. 准备数据库
在 Supabase 的 SQL Editor 中执行 `database/schema.sql`（含建表/索引/约束/种子数据）。
记录 Project URL 与 service_role key。

### 1. 启动后端
```bash
cd backend
cp .env.example .env        # 填入 SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY / JWT_SECRET / AI_*
npm install
npm run dev                 # 默认 :3000
```

### 2. 启动前端
```bash
cd frontend
cp .env.example .env        # 默认 VITE_API_BASE_URL=http://localhost:3000/api
npm install
npm run dev                 # 默认 :5173, 自动代理 /api 到后端
```
浏览器打开 http://localhost:5173 ，先注册账号再登录。

> 更简便：仓库根目录提供了 `start.bat`（Windows）一键先后启动前后端。

## 接口一览（全部需 JWT，路径前缀 `/api`）

- 鉴权：`POST /auth/register`、`POST /auth/login`
- 班级：`GET/POST /classes`、`PUT/DELETE /classes/:id`
- 学生：`GET/POST /students`、`PUT/DELETE /students/:id`
- 考试：`GET/POST /exams`、`PUT/DELETE /exams/:id`
- 成绩：`POST /scores/batch`、`GET /scores`
- 考勤：`POST /attendance/batch`、`GET /attendance`、`GET /attendance/summary`
- 行为：`GET/POST/DELETE /behaviors/tags`、`GET/POST /behaviors/records`
- 风格：`GET/POST/PUT/DELETE /style-tags`
- AI：`POST /feedback/generate`、`GET /feedback`
- 导出：`GET /export/exam-excel`、`/attendance-excel`、`/student-pdf`

## 验收
详见仓库根目录 [`验收自测清单.md`](./验收自测清单.md)。
