-- =============================================================================
-- 教师学情智能管理系统 v2.1 - 数据库建表脚本
-- 数据库: PostgreSQL (Supabase)
-- 规范:
--   1. 所有主键使用 UUID
--   2. 业务表冗余 teacher_id 实现数据隔离
--   3. 删除统一使用软删除 (deleted_at)
--   4. 使用 @supabase/supabase-js 链式调用 (pgcrypto 生成 UUID)
-- =============================================================================

-- 启用 UUID 生成扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. teacher_user (教师用户表, 表名避开 SQL 保留字 user)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "teacher_user" (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    role            VARCHAR(20) NOT NULL DEFAULT 'teacher',
    display_name    VARCHAR(50),
    disabled        BOOLEAN NOT NULL DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 用户名唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_user_username ON "teacher_user" (username);

-- =============================================================================
-- 2. class (班级表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "class" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_name  VARCHAR(50) NOT NULL,
    grade       VARCHAR(20) NOT NULL,
    teacher_id  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_class_teacher_id ON "class" (teacher_id);

-- =============================================================================
-- 3. student (学生表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "student" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(20) NOT NULL,
    student_no  VARCHAR(30) NOT NULL,
    gender      VARCHAR(10) NOT NULL,
    class_id    UUID NOT NULL,
    teacher_id  UUID NOT NULL,
    enroll_date DATE,
    remark      VARCHAR(200),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_student_teacher_id ON "student" (teacher_id);
CREATE INDEX IF NOT EXISTS idx_student_class_id ON "student" (class_id);
-- 同一教师下学号唯一 (忽略已软删除)
CREATE UNIQUE INDEX IF NOT EXISTS idx_student_teacher_no
    ON "student" (teacher_id, student_no) WHERE deleted_at IS NULL;

-- =============================================================================
-- 4. exam (考试场次表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "exam" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_name   VARCHAR(50) NOT NULL,
    subject     VARCHAR(20) NOT NULL,
    total_score NUMERIC(5,2) NOT NULL,
    exam_time   DATE NOT NULL,
    class_id    UUID NOT NULL,
    teacher_id  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    deleted_at  TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_exam_teacher_id ON "exam" (teacher_id);
CREATE INDEX IF NOT EXISTS idx_exam_class_id ON "exam" (class_id);

-- =============================================================================
-- 5. score (成绩表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "score" (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    exam_id    UUID NOT NULL,
    student_id UUID NOT NULL,
    score      NUMERIC(5,2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 同一考试同一学生仅一条成绩
CREATE UNIQUE INDEX IF NOT EXISTS idx_score_exam_student
    ON "score" (exam_id, student_id);
CREATE INDEX IF NOT EXISTS idx_score_exam_id ON "score" (exam_id);
CREATE INDEX IF NOT EXISTS idx_score_student_id ON "score" (student_id);

-- =============================================================================
-- 6. attendance (考勤表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "attendance" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id    UUID NOT NULL,
    student_id  UUID NOT NULL,
    attend_date DATE NOT NULL,
    status      VARCHAR(20) NOT NULL,  -- normal / late / leave / absent
    remark      VARCHAR(100),
    teacher_id  UUID NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 同一天同一学生仅一条考勤 (重复提交覆盖)
CREATE UNIQUE INDEX IF NOT EXISTS idx_attend_student_date
    ON "attendance" (student_id, attend_date);
CREATE INDEX IF NOT EXISTS idx_attend_teacher_id ON "attendance" (teacher_id);
CREATE INDEX IF NOT EXISTS idx_attend_class_id ON "attendance" (class_id);
CREATE INDEX IF NOT EXISTS idx_attend_date ON "attendance" (attend_date);

-- =============================================================================
-- 7. feedback_style_tag (反馈风格标签表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "feedback_style_tag" (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name          VARCHAR(20) NOT NULL,
    style_instruction TEXT NOT NULL,
    is_system         BOOLEAN NOT NULL DEFAULT false,
    teacher_id        UUID,  -- 系统标签为 null
    created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_style_tag_teacher_id ON "feedback_style_tag" (teacher_id);

-- =============================================================================
-- 8. behavior_tag (行为标签库表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "behavior_tag" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag_name    VARCHAR(20) NOT NULL,
    tag_type    VARCHAR(20) NOT NULL,  -- positive / improve
    is_system   BOOLEAN NOT NULL DEFAULT false,
    teacher_id  UUID,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behavior_tag_teacher_id ON "behavior_tag" (teacher_id);
CREATE INDEX IF NOT EXISTS idx_behavior_tag_type ON "behavior_tag" (tag_type);

-- =============================================================================
-- 9. student_behavior (学生行为记录表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "student_behavior" (
    id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    class_id       UUID NOT NULL,
    student_id     UUID NOT NULL,
    lesson_date    DATE NOT NULL,
    teacher_remark VARCHAR(200),
    teacher_id     UUID NOT NULL,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_behavior_teacher_id ON "student_behavior" (teacher_id);
CREATE INDEX IF NOT EXISTS idx_behavior_student_id ON "student_behavior" (student_id);
CREATE INDEX IF NOT EXISTS idx_behavior_lesson_date ON "student_behavior" (lesson_date);

-- =============================================================================
-- 10. behavior_tag_rel (行为-标签关联表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "behavior_tag_rel" (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    behavior_id UUID NOT NULL,
    tag_id      UUID NOT NULL
);

-- 防止同一行为重复打同一标签
CREATE UNIQUE INDEX IF NOT EXISTS idx_behavior_tag_rel_unique
    ON "behavior_tag_rel" (behavior_id, tag_id);

-- =============================================================================
-- 11. student_feedback (AI反馈记录表)
-- =============================================================================
CREATE TABLE IF NOT EXISTS "student_feedback" (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id          UUID NOT NULL,
    time_range          VARCHAR(20) NOT NULL,   -- recent_2w / recent_1m / custom
    selected_dimensions JSONB NOT NULL,         -- ['score','tag','attendance']
    teacher_notes       TEXT,
    style_tag           VARCHAR(50) NOT NULL,
    content_short       TEXT NOT NULL,
    content_full        JSONB NOT NULL,         -- {advantages, problems, suggestions}
    source_snapshot     JSONB NOT NULL,         -- 数据快照
    teacher_id          UUID NOT NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_feedback_teacher_id ON "student_feedback" (teacher_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student_id ON "student_feedback" (student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON "student_feedback" (created_at);

-- 兼容迁移: 教师指定关注点(快捷标签)
ALTER TABLE "student_feedback" ADD COLUMN IF NOT EXISTS focus_points JSONB;

-- =============================================================================
-- 种子数据 (Seed Data)
-- =============================================================================

-- 系统默认反馈风格标签 (is_system=true, teacher_id=null)
INSERT INTO "feedback_style_tag" (id, tag_name, style_instruction, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '温和鼓励型',
       '语气温暖、富有同理心，多用鼓励和肯定的语言，先扬后抑，保护学生自尊心，适合敏感型学生与家长沟通。',
       true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "feedback_style_tag" WHERE tag_name = '温和鼓励型');

INSERT INTO "feedback_style_tag" (id, tag_name, style_instruction, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '直白客观型',
       '语气直接、客观冷静，不绕弯子，直接指出问题事实与改进方向，适合需要明确警示的情形。',
       true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "feedback_style_tag" WHERE tag_name = '直白客观型');

INSERT INTO "feedback_style_tag" (id, tag_name, style_instruction, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '数据详实型',
       '以数据和事实为支撑，引用具体分数、排名、次数等量化指标，条理清晰，适合注重细节的家长。',
       true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "feedback_style_tag" WHERE tag_name = '数据详实型');

INSERT INTO "feedback_style_tag" (id, tag_name, style_instruction, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '简洁高效型',
       '语言精炼、抓重点，去掉冗余修饰，用最少的文字传递核心信息，适合快节奏沟通。',
       true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "feedback_style_tag" WHERE tag_name = '简洁高效型');

-- 系统默认行为标签库
INSERT INTO "behavior_tag" (id, tag_name, tag_type, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '积极发言', 'positive', true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "behavior_tag" WHERE tag_name = '积极发言');

INSERT INTO "behavior_tag" (id, tag_name, tag_type, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '作业认真', 'positive', true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "behavior_tag" WHERE tag_name = '作业认真');

INSERT INTO "behavior_tag" (id, tag_name, tag_type, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '乐于助人', 'positive', true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "behavior_tag" WHERE tag_name = '乐于助人');

INSERT INTO "behavior_tag" (id, tag_name, tag_type, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '专注力强', 'positive', true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "behavior_tag" WHERE tag_name = '专注力强');

INSERT INTO "behavior_tag" (id, tag_name, tag_type, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '上课走神', 'improve', true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "behavior_tag" WHERE tag_name = '上课走神');

INSERT INTO "behavior_tag" (id, tag_name, tag_type, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '作业拖拉', 'improve', true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "behavior_tag" WHERE tag_name = '作业拖拉');

INSERT INTO "behavior_tag" (id, tag_name, tag_type, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '注意力分散', 'improve', true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "behavior_tag" WHERE tag_name = '注意力分散');

INSERT INTO "behavior_tag" (id, tag_name, tag_type, is_system, teacher_id, created_at)
SELECT gen_random_uuid(), '课堂纪律差', 'improve', true, NULL, now()
WHERE NOT EXISTS (SELECT 1 FROM "behavior_tag" WHERE tag_name = '课堂纪律差');
