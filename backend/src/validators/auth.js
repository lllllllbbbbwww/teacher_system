import Joi from 'joi';

// 注册: 用户名唯一, 密码>=8位且含字母+数字
export const registerSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多50个字符',
    'any.required': '用户名必填',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).*$/)
    .required()
    .messages({
      'string.min': '密码至少8位',
      'string.pattern.base': '密码需包含字母和数字',
      'any.required': '密码必填',
    }),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required().messages({
    'any.only': '两次密码不一致',
    'any.required': '确认密码必填',
  }),
});

export const loginSchema = Joi.object({
  username: Joi.string().required().messages({ 'any.required': '用户名必填' }),
  password: Joi.string().required().messages({ 'any.required': '密码必填' }),
});

// 管理员创建用户
export const createUserSchema = Joi.object({
  username: Joi.string().min(3).max(50).required().messages({
    'string.min': '用户名至少3个字符',
    'string.max': '用户名最多50个字符',
    'any.required': '用户名必填',
  }),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).*$/)
    .required()
    .messages({
      'string.min': '密码至少8位',
      'string.pattern.base': '密码需包含字母和数字',
      'any.required': '密码必填',
    }),
  role: Joi.string().valid('admin', 'teacher').default('teacher'),
  display_name: Joi.string().max(50).allow('', null),
});

// 管理员更新用户
export const updateUserSchema = Joi.object({
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Za-z])(?=.*\d).*$/)
    .messages({
      'string.min': '密码至少8位',
      'string.pattern.base': '密码需包含字母和数字',
    }),
  role: Joi.string().valid('admin', 'teacher'),
  display_name: Joi.string().max(50).allow('', null),
  disabled: Joi.boolean(),
}).min(1);
