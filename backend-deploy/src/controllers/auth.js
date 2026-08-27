import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { supabase, config } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { Conflict, BadRequest } from '../utils/errors.js';
import { registerSchema, loginSchema } from '../validators/auth.js';

// 注册
export async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { username, password } = value;

    // 用户名唯一性校验
    const { data: exist } = await supabase
      .from('teacher_user')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (exist) throw new Conflict('用户名已存在');

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error: insertErr } = await supabase
      .from('teacher_user')
      .insert({ username, password_hash: passwordHash })
      .select('id, username, created_at')
      .single();
    if (insertErr) throw insertErr;

    return success(res, { id: data.id, username: data.username }, '注册成功');
  } catch (e) {
    next(e);
  }
}

// 登录
export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { username, password } = value;
    const { data } = await supabase
      .from('teacher_user')
      .select('id, username, password_hash, role, disabled')
      .eq('username', username)
      .maybeSingle();
    if (!data) return resp.unauthorized(res, '用户名或密码错误');

    const ok = await bcrypt.compare(password, data.password_hash);
    if (!ok) return resp.unauthorized(res, '用户名或密码错误');
    if (data.disabled) return resp.unauthorized(res, '该账号已被禁用，请联系管理员');

    const token = jwt.sign(
      { sub: data.id, username: data.username, role: data.role || 'teacher' },
      config.jwtSecret,
      { expiresIn: config.jwtExpiresIn }
    );
    return success(res, { token, username: data.username, role: data.role || 'teacher' }, '登录成功');
  } catch (e) {
    next(e);
  }
}

// 系统初始化: 若设置了 INIT_ADMIN 环境变量，则自动创建或同步管理员账号
// 已存在则同步密码(方便通过 .env 修改密码后重启生效)，不存在则创建
export async function ensureInitAdmin() {
  try {
    const adminUser = process.env.INIT_ADMIN;
    const adminPass = process.env.INIT_ADMIN_PASSWORD;
    if (!adminUser || !adminPass) return;

    const passwordHash = await bcrypt.hash(adminPass, 10);
    const { data: exists } = await supabase
      .from('teacher_user')
      .select('id')
      .eq('username', adminUser)
      .maybeSingle();

    if (exists) {
      // 已存在：同步密码和角色，确保 .env 修改生效
      const { error } = await supabase
        .from('teacher_user')
        .update({ password_hash: passwordHash, role: 'admin', display_name: '系统管理员' })
        .eq('id', exists.id);
      if (error) throw error;
      console.log(`[init] 已同步初始管理员账号密码: ${adminUser}`);
    } else {
      const { error } = await supabase
        .from('teacher_user')
        .insert({ username: adminUser, password_hash: passwordHash, role: 'admin', display_name: '系统管理员' });
      if (error) throw error;
      console.log(`[init] 已创建初始管理员账号: ${adminUser}`);
    }
  } catch (e) {
    console.error('[init] 初始化管理员失败:', e.message);
  }
}
