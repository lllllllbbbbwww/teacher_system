import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { NotFound, Forbidden } from '../utils/errors.js';
import { classSchema, uuidParam } from '../validators/common.js';

// 列表 (仅当前教师, 排除软删除)
export async function listClasses(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('class')
      .select('id, class_name, grade, created_at')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

// 新增
export async function createClass(req, res, next) {
  try {
    const { error, value } = classSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { data, error: insertErr } = await supabase
      .from('class')
      .insert({ ...value, teacher_id: req.user.id })
      .select('id, class_name, grade, created_at')
      .single();
    if (insertErr) throw insertErr;
    return success(res, data, '创建成功');
  } catch (e) {
    next(e);
  }
}

// 编辑
export async function updateClass(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);
    const { error, value } = classSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    // 先确认归属 (强制 teacher_id 隔离, 不允许间接校验)
    const { data: existing } = await supabase
      .from('class')
      .select('id')
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!existing) throw new NotFound('班级不存在');

    const { data, error: updErr } = await supabase
      .from('class')
      .update({ ...value, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id)
      .select('id, class_name, grade')
      .single();
    if (updErr) throw updErr;
    return success(res, data, '更新成功');
  } catch (e) {
    next(e);
  }
}

// 软删除
export async function deleteClass(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);

    const { data, error } = await supabase
      .from('class')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFound('班级不存在');
    return success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}
