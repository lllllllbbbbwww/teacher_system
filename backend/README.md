# 后端 (Express)

## 环境要求
- Node.js ≥ 18（已使用内置 `fetch`，无需额外依赖）
- PostgreSQL（通过 Supabase 托管；也可用本地 Postgres，需自建表）

## 依赖安装
```bash
npm install
```
> Windows 注意：`bcrypt` 已替换为纯 JS 的 `bcryptjs`，无需 C++ 编译环境。

## 环境变量 (.env.example)
| 变量 | 说明 |
| --- | --- |
| PORT | 服务端口，默认 3000 |
| SUPABASE_URL | Supabase 项目 URL |
| SUPABASE_SERVICE_ROLE_KEY | service_role key（绕过 RLS，权限隔离由代码层保证） |
| JWT_SECRET | JWT 签名密钥（请使用复杂随机串） |
| JWT_EXPIRES_IN | 令牌有效期，默认 7d |
| AI_PROVIDER | doubao / openai |
| AI_API_KEY | 大模型 API Key |
| AI_API_BASE | 接口 Base（豆包填完整地址，openai 填 https://api.openai.com/v1） |
| AI_MODEL | 模型名 / 豆包 endpoint id |
| AI_TIMEOUT | 调用超时毫秒，默认 30000 |

## 启动
```bash
npm run dev      # 开发 (node --watch)
npm start        # 生产
```

## 接口约定
- 统一响应：`{ code, data, msg }`，`code=0` 成功，非 0 见错误信息。
- 鉴权：请求头 `Authorization: Bearer <token>`。
- 数据隔离：所有业务查询强制 `eq('teacher_id', req.user.id)`。

## 关键文件
- `src/config/env.js`：环境变量校验 + Supabase 客户端（缺失关键变量启动直接报错）
- `src/middleware/auth.js`：JWT 鉴权，挂载 `req.user`
- `src/middleware/errorHandler.js`：全局异常；唯一键→409，外键→400，其余转友好提示
- `src/utils/response.js`：统一响应工具
- `src/services/ai.js`：大模型调用 + Prompt 组装 + JSON 容错
- `src/controllers/*`、`src/routes/*`：业务逻辑与路由

## 字体（PDF 中文）
`fonts/NotoSansCJKsc-Regular.otf`（思源黑体简体中文）已随仓库提供，导出 PDF 自动使用，避免中文乱码。
