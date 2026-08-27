import jwt from 'jsonwebtoken';
import { resp } from '../utils/response.js';
import { config } from '../config/env.js';

// JWT 鉴权中间件: 校验 token 并挂载 req.user
export function authMiddleware(req, res, next) {
  const header = req.headers.authorization || '';
  // 支持 Authorization 头 或 下载场景下的 ?token= 查询参数
  let token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token && req.query.token) token = String(req.query.token);
  if (!token) {
    return resp.unauthorized(res);
  }
  try {
    const payload = jwt.verify(token, config.jwtSecret);
    req.user = { id: payload.sub, username: payload.username, role: payload.role || 'teacher' };
    next();
  } catch (e) {
    return resp.unauthorized(res, '登录已过期, 请重新登录');
  }
}

// 管理员权限中间件
export function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return resp.forbidden(res, '无权限，仅管理员可操作');
  }
  next();
}
