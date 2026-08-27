// 统一响应格式: { code, data, msg }
// code = 0 成功, 非 0 业务/错误码

export function success(res, data = null, msg = 'success') {
  return res.json({ code: 0, data, msg });
}

export function fail(res, httpStatus, code, msg) {
  return res.status(httpStatus).json({ code, data: null, msg });
}

// 常用错误快捷方法
export const resp = {
  badRequest: (res, msg = '请求参数错误') => fail(res, 400, 400, msg),
  unauthorized: (res, msg = '未登录或登录已过期') => fail(res, 401, 401, msg),
  forbidden: (res, msg = '权限不足') => fail(res, 403, 403, msg),
  notFound: (res, msg = '资源不存在') => fail(res, 404, 404, msg),
  conflict: (res, msg = '数据已存在') => fail(res, 409, 409, msg),
  serverError: (res, msg = '服务器内部错误') => fail(res, 500, 500, msg),
};
