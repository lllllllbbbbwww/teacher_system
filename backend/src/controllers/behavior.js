import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { NotFound, Forbidden, Conflict } from '../utils/errors.js';
import { behaviorTagSchema, studentBehaviorSchema, styleTagSchema, uuidParam } from '../validators/business.js';

// ============ 行为标签库 ============
export async function listBehaviorTags(req, res, next) {
  try {
    // 系统标签 (teacher_id=null) + 当前教师自定义
    const { data, error } = await supabase
      .from('behavior_tag')
      .select('id, tag_name, tag_type, is_system, teacher_id')
      .or(`teacher_id.is.null,teacher_id.eq.${req.user.id}`)
      .order('is_system', { ascending: false })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

export async function createBehaviorTag(req, res, next) {
  try {
    const { error, value } = behaviorTagSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { data, error: insertErr } = await supabase
      .from('behavior_tag')
      .insert({ ...value, is_system: false, teacher_id: req.user.id })
      .select('id, tag_name, tag_type, is_system')
      .single();
    if (insertErr) throw insertErr;
    return success(res, data, '创建成功');
  } catch (e) {
    next(e);
  }
}

export async function deleteBehaviorTag(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);

    const { data: tag } = await supabase
      .from('behavior_tag')
      .select('id, is_system, teacher_id')
      .eq('id', req.params.id)
      .maybeSingle();
    if (!tag) throw new NotFound('标签不存在');
    if (tag.is_system) throw new Forbidden('系统标签不可删除');
    if (tag.teacher_id !== req.user.id) throw new Forbidden('无权删除该标签');

    const { error } = await supabase.from('behavior_tag').delete().eq('id', req.params.id);
    if (error) throw error;
    return success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}

// ============ 学生行为记录 ============
export async function createStudentBehavior(req, res, next) {
  try {
    const { error, value } = studentBehaviorSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { class_id, student_id, lesson_date, tag_ids, teacher_remark } = value;

    // 班级归属
    const { data: cls } = await supabase
      .from('class')
      .select('id')
      .eq('id', class_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!cls) throw new Forbidden('班级不存在或不属于当前教师');

    // 学生归属
    const { data: stu } = await supabase
      .from('student')
      .select('id')
      .eq('id', student_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!stu) throw new Forbidden('学生不存在或不属于当前教师');

    // 标签归属 (系统或当前教师)
    const { data: tags } = await supabase
      .from('behavior_tag')
      .select('id')
      .or(`teacher_id.is.null,teacher_id.eq.${req.user.id}`)
      .in('id', tag_ids);
    if (!tags || tags.length !== tag_ids.length) {
      throw new BadRequest('存在无效标签');
    }

    // 写入主记录
    const { data: behavior, error: bErr } = await supabase
      .from('student_behavior')
      .insert({
        class_id,
        student_id,
        lesson_date,
        teacher_remark: teacher_remark || null,
        teacher_id: req.user.id,
      })
      .select('id')
      .single();
    if (bErr) throw bErr;

    // 写入标签关联 (去重)
    const rels = [...new Set(tag_ids)].map((tid) => ({
      behavior_id: behavior.id,
      tag_id: tid,
    }));
    const { error: rErr } = await supabase.from('behavior_tag_rel').insert(rels);
    if (rErr) throw rErr;

    return success(res, { id: behavior.id }, '记录成功');
  } catch (e) {
    next(e);
  }
}

export async function listStudentBehavior(req, res, next) {
  try {
    const { student_id, class_id, start_date, end_date } = req.query;
    let q = supabase
      .from('student_behavior')
      .select('id, student_id, class_id, lesson_date, teacher_remark, created_at')
      .eq('teacher_id', req.user.id);
    if (student_id) q = q.eq('student_id', student_id);
    if (class_id) q = q.eq('class_id', class_id);
    if (start_date) q = q.gte('lesson_date', start_date);
    if (end_date) q = q.lte('lesson_date', end_date);
    const { data, error } = await q.order('lesson_date', { ascending: false });
    if (error) throw error;

    // 关联标签名
    const behaviorIds = data.map((d) => d.id);
    let tagsMap = {};
    if (behaviorIds.length) {
      const { data: rels } = await supabase
        .from('behavior_tag_rel')
        .select('behavior_id, tag_id')
        .in('behavior_id', behaviorIds);
      const tagIds = [...new Set((rels || []).map((r) => r.tag_id))];
      const { data: tags } = await supabase
        .from('behavior_tag')
        .select('id, tag_name, tag_type')
        .in('id', tagIds);
      const tagInfo = Object.fromEntries((tags || []).map((t) => [t.id, t]));
      tagsMap = Object.fromEntries(
        (rels || []).map((r) => [r.behavior_id, [...(tagsMap[r.behavior_id] || []), tagInfo[r.tag_id]]])
      );
    }
    const list = data.map((d) => ({ ...d, tags: tagsMap[d.id] || [] }));
    return success(res, list);
  } catch (e) {
    next(e);
  }
}
