import Joi from 'joi';

// 班级
export const classSchema = Joi.object({
  class_name: Joi.string().min(1).max(50).required().messages({
    'string.max': '班级名称最多50字符',
    'any.required': '班级名称必填',
  }),
  grade: Joi.string().min(1).max(20).required().messages({
    'string.max': '年级最多20字符',
    'any.required': '年级必填',
  }),
});

// 学生
export const studentSchema = Joi.object({
  name: Joi.string().min(1).max(20).required().messages({
    'string.max': '姓名最多20字符',
    'any.required': '姓名必填',
  }),
  student_no: Joi.string().min(1).max(30).required().messages({
    'string.max': '学号最多30字符',
    'any.required': '学号必填',
  }),
  gender: Joi.string().valid('男', '女', '其他').required().messages({
    'any.only': '性别取值不正确',
    'any.required': '性别必填',
  }),
  class_id: Joi.string().uuid().required().messages({
    'string.uuid': '班级ID格式不正确',
    'any.required': '班级必填',
  }),
  enroll_date: Joi.date().iso().allow(null, '').messages({
    'date.iso': '入学时间格式不正确',
  }),
  remark: Joi.string().max(200).allow(null, '').messages({
    'string.max': '备注最多200字符',
  }),
});

// 批量学生 (单个/批量通用)
export const studentBatchSchema = Joi.array()
  .items(studentSchema)
  .min(1)
  .max(200)
  .messages({
    'array.min': '至少提交1条学生数据',
    'array.max': '单次最多200条',
  });

// UUID 参数校验
export const uuidParam = Joi.object({
  id: Joi.string().uuid().required().messages({ 'string.uuid': 'ID格式不正确' }),
});
