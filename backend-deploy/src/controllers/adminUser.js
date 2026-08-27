import bcrypt from 'bcryptjs';
import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { Conflict, BadRequest, NotFound } from '../utils/errors.js';
import { createUserSchema, updateUserSchema } from '../validators/auth.js';

// 列表（分页 + 用户名搜索），不返回密码
export async function listUsers(req, res, next) {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(req.query.pageSize) || 10));
    const keyword = (req.query.keyword || '').trim();
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from('teacher_user').select('id, username, role, display_name, disabled, created_at', { count: 'exact' });
    if (keyword) query = query.ilike('username', `%${keyword}%`);
    query = query.order('created_at', { ascending: true }).range(from, to);

    const { data, count, error } = await query;
    if (error) throw error;

    return success(res, {
      list: data,
      total: count || 0,
      page,
      pageSize,
    });
  } catch (e) {
    next(e);
  }
}

// 创建用户
export async function createUser(req, res, next) {
  try {
    const { error, value } = createUserSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { username, password, role, display_name } = value;
    const { data: exist } = await supabase
      .from('teacher_user')
      .select('id')
      .eq('username', username)
      .maybeSingle();
    if (exist) throw new Conflict('用户名已存在');

    const passwordHash = await bcrypt.hash(password, 10);
    const { data, error: insertErr } = await supabase
      .from('teacher_user')
      .insert({ username, password_hash: passwordHash, role, display_name: display_name || null })
      .select('id, username, role, display_name, disabled, created_at')
      .single();
    if (insertErr) throw insertErr;

    return success(res, data, '创建成功');
  } catch (e) {
    next(e);
  }
}

// 更新用户（重置密码 / 改角色 / 启禁用）
export async function updateUser(req, res, next) {
  try {
    const id = req.params.id;
    if (id === req.user.id) {
      // 禁止自己改角色或禁用自己
      const { value } = updateUserSchema.validate(req.body);
      if (value && (value.role || value.disabled !== undefined)) {
        return resp.forbidden(res, '不能修改自己的角色或禁用自己');
      }
    }

    const { error, value } = updateUserSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const patch = {};
    if (value.password) patch.password_hash = await bcrypt.hash(value.password, 10);
    if (value.role) patch.role = value.role;
    if (value.display_name !== undefined) patch.display_name = value.display_name || null;
    if (value.disabled !== undefined) patch.disabled = value.disabled;

    const { data, error: updateErr } = await supabase
      .from('teacher_user')
      .update(patch)
      .eq('id', id)
      .select('id, username, role, display_name, disabled, created_at')
      .single();
    if (updateErr) throw updateErr;
    if (!data) throw new NotFound('用户不存在');

    return success(res, data, '更新成功');
  } catch (e) {
    next(e);
  }
}

// 删除用户（软删由 disabled 代替，这里做硬删，禁止删自己）
export async function deleteUser(req, res, next) {
  try {
    const id = req.params.id;
    if (id === req.user.id) return resp.forbidden(res, '不能删除自己');

    const { data, error } = await supabase
      .from('teacher_user')
      .delete()
      .eq('id', id)
      .select('id')
      .single();
    if (error) throw error;
    if (!data) throw new NotFound('用户不存在');

    return success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}
