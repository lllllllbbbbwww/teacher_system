import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { NotFound, Forbidden } from '../utils/errors.js';
import { examSchema, uuidParam } from '../validators/business.js';

export async function listExams(req, res, next) {
  try {
    const { class_id } = req.query;
    let q = supabase
      .from('exam')
      .select('id, exam_name, subject, total_score, exam_time, class_id, created_at')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null);
    if (class_id) q = q.eq('class_id', class_id);
    const { data, error } = await q.order('exam_time', { ascending: false });
    if (error) throw error;
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function createExam(req, res, next) {
  try {
    const { error, value } = examSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    // 班级归属校验
    const { data: cls } = await supabase
      .from('class')
      .select('id')
      .eq('id', value.class_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!cls) throw new Forbidden('班级不存在或不属于当前教师');

    const { data, error: insertErr } = await supabase
      .from('exam')
      .insert({ ...value, teacher_id: req.user.id })
      .select('id, exam_name, subject, total_score, exam_time, class_id')
      .single();
    if (insertErr) throw insertErr;
    return success(res, data, '创建成功');
  } catch (e) {
    next(e);
  }
}

export async function updateExam(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);
    const { error, value } = examSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { data: cls } = await supabase
      .from('class')
      .select('id')
      .eq('id', value.class_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!cls) throw new Forbidden('班级不存在或不属于当前教师');

    const { data, error: updErr } = await supabase
      .from('exam')
      .update(value)
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .select('id, exam_name')
      .single();
    if (updErr) throw updErr;
    if (!data) throw new NotFound('考试不存在');
    return success(res, data, '更新成功');
  } catch (e) {
    next(e);
  }
}

export async function deleteExam(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);

    const { data, error } = await supabase
      .from('exam')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFound('考试不存在');
    return success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}
