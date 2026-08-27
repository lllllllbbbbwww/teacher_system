// 业务错误类: 携带 http 状态码, 由全局异常处理器统一转换
export class AppError extends Error {
  constructor(httpStatus, msg, code) {
    super(msg);
    this.httpStatus = httpStatus;
    this.code = code || httpStatus;
    this.isAppError = true;
  }
}

// 常用构造器 (普通函数声明: 兼容 new Xxx(...) 与 Xxx(...) 两种调用)
export function BadRequest(msg) { return new AppError(400, msg, 400); }
export function Unauthorized(msg) { return new AppError(401, msg, 401); }
export function Forbidden(msg) { return new AppError(403, msg, 403); }
export function NotFound(msg) { return new AppError(404, msg, 404); }
export function Conflict(msg) { return new AppError(409, msg, 409); }
