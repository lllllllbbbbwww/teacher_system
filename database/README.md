# 数据库初始化

本目录 `schema.sql` 包含完整建表脚本：11 张业务表、索引、约束、种子数据。

## 执行方式（Supabase）

1. 登录 Supabase 控制台 → 打开目标项目的 **SQL Editor**。
2. 新建查询，粘贴 `schema.sql` 全文。
3. 点击 **Run**（或 Ctrl/Cmd+Enter）执行。

脚本会：
- 启用 `pgcrypto` 扩展（生成 UUID 主键）
- 创建 11 张表，含软删除字段 `deleted_at`、业务表 `teacher_id` 冗余
- 建立唯一约束：`(teacher_id, student_no)`（软删排除）、`(exam_id, student_id)`、`(student_id, attend_date)`、`(behavior_id, tag_id)`
- 写入种子数据：4 个系统风格标签 + 8 个系统行为标签（4 正向 / 4 待改进）

## 表清单

| 表 | 用途 |
| --- | --- |
| user | 教师账号 |
| class | 班级 |
| student | 学生 |
| exam | 考试场次 |
| score | 成绩 |
| attendance | 考勤 |
| feedback_style_tag | 反馈风格标签 |
| behavior_tag | 行为标签库 |
| student_behavior | 学生行为记录 |
| behavior_tag_rel | 行为-标签关联 |
| student_feedback | AI 反馈记录 |

## 本地 PostgreSQL（可选）
若不使用 Supabase，可在本地 Postgres 执行同样脚本，并在后端 `.env` 将
`SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` 替换为本地连接（需自行搭建兼容的 PostgreSQL 服务）。
注意：本系统强依赖 Supabase 的 `@supabase/supabase-js` 客户端，仅支持 PostgreSQL 数据库。
