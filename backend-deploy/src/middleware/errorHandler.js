import { resp } from '../utils/response.js';
import { AppError } from '../utils/errors.js';

// 全局异常捕获: 任何错误都不得导致进程退出, 统一转友好提示
export function errorHandler(err, req, res, next) {
  // 业务错误
  if (err.isAppError) {
    console.error(`[AppError] ${req.method} ${req.originalUrl} ->`, err.message);
    return resp.serverError === undefined // 占位, 走下方分类
      ? res.status(err.httpStatus).json({ code: err.code, data: null, msg: err.message })
      : res.status(err.httpStatus).json({ code: err.code, data: null, msg: err.message });
  }

  // Supabase 唯一键冲突 (code 23505)
  const msg = err.message || '';
  if (msg.includes('23505') || /duplicate key/.test(msg)) {
    console.error('[DB Unique]', req.method, req.originalUrl, msg);
    return res.status(409).json({ code: 409, data: null, msg: '数据已存在' });
  }
  // 外键关联错误 (code 23503)
  if (msg.includes('23503') || /foreign key/.test(msg)) {
    console.error('[DB FK]', req.method, req.originalUrl, msg);
    return res.status(400).json({ code: 400, data: null, msg: '关联数据不存在' });
  }

  // 兜底: 数据库原始错误不直接暴露, 转友好提示
  console.error('[Unhandled]', req.method, req.originalUrl, err);
  const detail = process.env.NODE_ENV === 'production' ? '服务器内部错误' : (err && err.message) || '服务器内部错误';
  return res.status(500).json({ code: 500, data: null, msg: detail });
}

// 404 兜底
export function notFoundHandler(req, res) {
  return res.status(404).json({ code: 404, data: null, msg: '接口不存在' });
}
