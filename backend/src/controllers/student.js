import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { NotFound, Conflict, Forbidden } from '../utils/errors.js';
import { studentSchema, studentBatchSchema, uuidParam } from '../validators/common.js';

// 列表 (带班级筛选, 仅当前教师, 排除软删除)
export async function listStudents(req, res, next) {
  try {
    const { class_id } = req.query;
    let query = supabase
      .from('student')
      .select('id, name, student_no, gender, class_id, enroll_date, remark, created_at')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null);
    if (class_id) query = query.eq('class_id', class_id);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return success(res, data);
  } catch (e) {
    next(e);
  }
}

// 新增单条 / 批量
export async function createStudents(req, res, next) {
  try {
    // 支持数组批量或单对象
    const body = Array.isArray(req.body) ? req.body : [req.body];
    const { error, value } = studentBatchSchema.validate(body);
    if (error) return resp.badRequest(res, error.message);

    // 校验班级归属当前教师
    const classIds = [...new Set(value.map((s) => s.class_id))];
    const { data: cls } = await supabase
      .from('class')
      .select('id')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .in('id', classIds);
    if (!cls || cls.length !== classIds.length) {
      throw new Forbidden('存在不属于当前教师的班级');
    }

    // 学号唯一性预校验 (同一教师下)
    const { data: dup } = await supabase
      .from('student')
      .select('student_no')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .in('student_no', value.map((s) => s.student_no));
    if (dup && dup.length > 0) {
      throw new Conflict(`学号已存在: ${dup.map((d) => d.student_no).join(', ')}`);
    }

    const rows = value.map((s) => ({
      ...s,
      teacher_id: req.user.id,
      enroll_date: s.enroll_date || null,
      remark: s.remark || null,
    }));
    const { data, error: insertErr } = await supabase
      .from('student')
      .insert(rows)
      .select('id, name, student_no');
    if (insertErr) throw insertErr;
    return success(res, data, `成功录入 ${data.length} 名学生`);
  } catch (e) {
    next(e);
  }
}

// 编辑
export async function updateStudent(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);
    const { error, value } = studentSchema.validate(req.body);
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

    // 学号唯一 (排除自身)
    const { data: dup } = await supabase
      .from('student')
      .select('id')
      .eq('teacher_id', req.user.id)
      .eq('student_no', value.student_no)
      .is('deleted_at', null)
      .neq('id', req.params.id)
      .maybeSingle();
    if (dup) throw new Conflict('学号已存在');

    const { data, error: updErr } = await supabase
      .from('student')
      .update({ ...value, enroll_date: value.enroll_date || null, remark: value.remark || null })
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id)
      .select('id, name, student_no, gender, class_id, enroll_date, remark')
      .single();
    if (updErr) throw updErr;
    if (!data) throw new NotFound('学生不存在');
    return success(res, data, '更新成功');
  } catch (e) {
    next(e);
  }
}

// 学生 360° 档案聚合
export async function studentProfile(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);
    const { id } = req.params;

    const { data: student, error: sErr } = await supabase
      .from('student')
      .select('id, name, student_no, gender, class_id, enroll_date, remark, created_at')
      .eq('id', id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (sErr) throw sErr;
    if (!student) throw new NotFound('学生不存在');

    // 班级信息
    let class_name = '';
    if (student.class_id) {
      const { data: cls } = await supabase
        .from('class')
        .select('class_name, grade')
        .eq('id', student.class_id)
        .maybeSingle();
      if (cls) class_name = `${cls.grade || ''}${cls.class_name || ''}`;
    }

    // 成绩轨迹（含考试信息）
    const { data: scoreRows } = await supabase
      .from('score')
      .select('exam_id, score')
      .eq('student_id', id);
    let scores = [];
    if (scoreRows && scoreRows.length) {
      const examIds = [...new Set(scoreRows.map((s) => s.exam_id))];
      const { data: exams } = await supabase
        .from('exam')
        .select('id, exam_name, subject, total_score, exam_time')
        .in('id', examIds)
        .is('deleted_at', null);
      const examMap = Object.fromEntries((exams || []).map((e) => [e.id, e]));
      scores = scoreRows
        .filter((s) => examMap[s.exam_id])
        .map((s) => ({
          score: Number(s.score),
          exam_name: examMap[s.exam_id].exam_name,
          subject: examMap[s.exam_id].subject,
          total_score: examMap[s.exam_id].total_score,
          exam_time: examMap[s.exam_id].exam_time,
        }))
        .sort((a, b) => a.exam_time.localeCompare(b.exam_time));
    }

    // 考勤
    const { data: atts } = await supabase
      .from('attendance')
      .select('attend_date, status, remark')
      .eq('student_id', id)
      .order('attend_date', { ascending: false });
    const attSummary = { total: 0, normal: 0, late: 0, leave: 0, absent: 0 };
    for (const a of atts || []) {
      attSummary.total++;
      if (attSummary[a.status] !== undefined) attSummary[a.status]++;
    }

    // 行为记录（含标签）
    const { data: behaviors } = await supabase
      .from('student_behavior')
      .select('id, lesson_date, teacher_remark, created_at')
      .eq('student_id', id)
      .eq('teacher_id', req.user.id)
      .order('lesson_date', { ascending: false });
    let behList = behaviors || [];
    if (behList.length) {
      const bIds = behList.map((b) => b.id);
      const { data: rels } = await supabase
        .from('behavior_tag_rel')
        .select('behavior_id, tag_id')
        .in('behavior_id', bIds);
      const tagIds = [...new Set((rels || []).map((r) => r.tag_id))];
      let tagMap = {};
      if (tagIds.length) {
        const { data: tags } = await supabase
          .from('behavior_tag')
          .select('id, tag_name, tag_type')
          .in('id', tagIds);
        tagMap = Object.fromEntries((tags || []).map((t) => [t.id, t]));
      }
      const relMap = {};
      for (const r of rels || []) {
        relMap[r.behavior_id] = relMap[r.behavior_id] || [];
        relMap[r.behavior_id].push(tagMap[r.tag_id]);
      }
      behList = behList.map((b) => ({ ...b, tags: (relMap[b.id] || []).filter(Boolean) }));
    }

    // 反馈历史
    const { data: feedbacks } = await supabase
      .from('student_feedback')
      .select('id, time_range, style_tag, content_short, created_at')
      .eq('student_id', id)
      .eq('teacher_id', req.user.id)
      .order('created_at', { ascending: false });

    return success(res, {
      student: { ...student, class_name },
      scores,
      attendance: { list: atts || [], summary: attSummary },
      behaviors: behList,
      feedbacks: feedbacks || [],
    });
  } catch (e) {
    next(e);
  }
}

// 软删除
export async function deleteStudent(req, res, next) {
  try {
    const { error: pErr } = uuidParam.validate(req.params);
    if (pErr) return resp.badRequest(res, pErr.message);

    const { data, error } = await supabase
      .from('student')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFound('学生不存在');
    return success(res, null, '删除成功');
  } catch (e) {
    next(e);
  }
}
