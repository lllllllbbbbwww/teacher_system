import Joi from 'joi';

// 考试场次
export const examSchema = Joi.object({
  exam_name: Joi.string().min(1).max(50).required().messages({ 'any.required': '考试名称必填' }),
  subject: Joi.string().min(1).max(20).required().messages({ 'any.required': '科目必填' }),
  total_score: Joi.number().positive().max(99999).required().messages({
    'number.positive': '满分必须为正数',
    'any.required': '满分必填',
  }),
  exam_time: Joi.date().iso().required().messages({
    'date.iso': '考试时间格式不正确',
    'any.required': '考试时间必填',
  }),
  class_id: Joi.string().uuid().required().messages({ 'string.uuid': '班级ID格式不正确' }),
});

// 成绩批量录入: 每项为 { student_id, score }
export const scoreBatchSchema = Joi.object({
  exam_id: Joi.string().uuid().required().messages({ 'string.uuid': '考试ID格式不正确' }),
  scores: Joi.array()
    .items(
      Joi.object({
        student_id: Joi.string().uuid().required().messages({ 'string.uuid': '学生ID格式不正确' }),
        score: Joi.number().min(0).required().messages({ 'number.min': '分数不能为负' }),
      })
    )
    .min(1)
    .max(500)
    .required()
    .messages({ 'array.min': '至少录入1条成绩' }),
});

// 考勤录入 (支持批量同一天)
export const attendanceBatchSchema = Joi.object({
  class_id: Joi.string().uuid().required().messages({ 'string.uuid': '班级ID格式不正确' }),
  attend_date: Joi.date().iso().required().messages({ 'date.iso': '考勤日期格式不正确' }),
  records: Joi.array()
    .items(
      Joi.object({
        student_id: Joi.string().uuid().required().messages({ 'string.uuid': '学生ID格式不正确' }),
        status: Joi.string().valid('normal', 'late', 'leave', 'absent').required().messages({
          'any.only': '考勤状态不正确',
          'any.required': '考勤状态必填',
        }),
        remark: Joi.string().max(100).allow(null, '').messages({ 'string.max': '备注最多100字符' }),
      })
    )
    .min(1)
    .max(500)
    .required(),
});

// 行为标签
export const behaviorTagSchema = Joi.object({
  tag_name: Joi.string().min(1).max(20).required().messages({ 'any.required': '标签名必填' }),
  tag_type: Joi.string().valid('positive', 'improve').required().messages({
    'any.only': '标签类型必须为 positive/improve',
    'any.required': '标签类型必填',
  }),
});

// 学生行为记录
export const studentBehaviorSchema = Joi.object({
  class_id: Joi.string().uuid().required().messages({ 'string.uuid': '班级ID格式不正确' }),
  student_id: Joi.string().uuid().required().messages({ 'string.uuid': '学生ID格式不正确' }),
  lesson_date: Joi.date().iso().required().messages({ 'date.iso': '日期格式不正确' }),
  tag_ids: Joi.array().items(Joi.string().uuid()).min(1).required().messages({
    'array.min': '至少选择1个标签',
  }),
  teacher_remark: Joi.string().max(200).allow(null, '').messages({ 'string.max': '备注最多200字符' }),
});

// 风格标签自定义
export const styleTagSchema = Joi.object({
  tag_name: Joi.string().min(1).max(20).required().messages({ 'any.required': '标签名必填' }),
  style_instruction: Joi.string().min(1).required().messages({ 'any.required': '风格指令必填' }),
});

// AI 反馈生成
export const feedbackGenSchema = Joi.object({
  student_id: Joi.string().uuid().required().messages({ 'string.uuid': '学生ID格式不正确' }),
  time_range: Joi.string().valid('recent_2w', 'recent_1m', 'custom').required().messages({
    'any.only': '周期取值不正确',
    'any.required': '周期必填',
  }),
  selected_dimensions: Joi.array()
    .items(Joi.string().valid('score', 'tag', 'attendance'))
    .min(1)
    .required()
    .messages({ 'array.min': '至少勾选1个维度' }),
  teacher_notes: Joi.string().max(200).allow(null, '').messages({ 'string.max': '备注最多200字' }),
  style_tag: Joi.string().min(1).max(50).required().messages({ 'any.required': '风格标签必填' }),
  focus_points: Joi.array().items(Joi.string().max(20)).max(12).allow(null).messages({
    'array.max': '关注点最多12个',
    'string.max': '关注点最多20字',
  }),
});

// UUID 参数
export const uuidParam = Joi.object({
  id: Joi.string().uuid().required().messages({ 'string.uuid': 'ID格式不正确' }),
});
