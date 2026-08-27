import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { NotFound, Forbidden } from '../utils/errors.js';
import { styleTagSchema, uuidParam } from '../validators/business.js';

// 列表: 系统标签 + 当前教师自定义
export async function listStyleTags(req, res, next) {
  try {
    const { data, error } = await supabase
      .from('feedback_style_tag')
      .select('id, tag_name, style_instruction, is_system, teacher_id')
      .or(`teacher_id.is.null,teacher_id.eq.${req.user.id}`)
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function createStyleTag(req, res, next) {
  try {
    const { error, value } = styleTagSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { data, error: insertErr } = await supabase
      .from('feedback_style_tag')
      .insert({ ...value, is_system: false, teacher_id: req.user.id })
      .select('id, tag_name, style_instruction, is_system')
      .single();
    if (insertErr) throw insertErr;
    return success(res, data, '创建成功');
  } catch (e) {
    next(e);
  }
}

export async function updateStyleTag(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);
    const { error, value } = styleTagSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { data: tag } = await supabase
      .from('feedback_style_tag')
      .select('id, is_system, teacher_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!tag) throw new NotFound('标签不存在');
    if (tag.is_system) throw new Forbidden('系统标签不可编辑');
    if (tag.teacher_id !== req.user.id) throw new Forbidden('无权编辑该标签');

    const { data, error: updErr } = await supabase
      .from('feedback_style_tag')
      .update(value)
      .eq('id', req.params.id)
      .select('id, tag_name, style_instruction')
      .single();
    if (updErr) throw updErr;
    return success(res, data, '更新成功');
  } catch (e) {
    next(e);
  }
}

export async function deleteStyleTag(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);

    const { data: tag } = await supabase
      .from('feedback_style_tag')
      .select('id, is_system, teacher_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!tag) throw new NotFound('标签不存在');
    if (tag.is_system) throw new Forbidden('系统标签不可删除');
    if (tag.teacher_id !== req.user.id) throw new Forbidden('无权删除该标签');

    const { error } = await supabase.from('feedback_style_tag').delete().eq('id', req.params.id);
    if (error) throw error;
    return success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}
