// 业务错误类: 携带 http 状态码, 由全局异常处理器统一转换
export class AppError extends Error {
  constructor(httpStatus, msg, code) {
    super(msg);
    this.httpStatus = httpStatus;
    this.code = code || httpStatus;
    this.isAppError = true;
  }
}

// 常用构造器
export const BadRequest = (msg) => new AppError(400, msg, 400);
export const Unauthorized = (msg) => new AppError(401, msg, 401);
export const Forbidden = (msg) => new AppError(403, msg, 403);
export const NotFound = (msg) => new AppError(404, msg, 404);
export const Conflict = (msg) => new AppError(409, msg, 409);
