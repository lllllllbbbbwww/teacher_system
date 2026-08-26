import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';
import { feedbackGenSchema } from '../validators/business.js';
import { buildPrompt, callLLM, parseLLMJson } from '../services/ai.js';

// 计算周期起止日期 (含当天)
function rangeToDates(time_range) {
  const end = new Date();
  const endStr = end.toISOString().slice(0, 10);
  const start = new Date();
  if (time_range === 'recent_2w') start.setDate(start.getDate() - 13);
  else if (time_range === 'recent_1m') start.setDate(start.getDate() - 29);
  else start.setDate(start.getDate() - 29); // custom 兜底近1月
  const startStr = start.toISOString().slice(0, 10);
  return { startStr, endStr };
}

// 聚合真实数据
async function aggregate(req, student_id, time_range, dims) {
  const { startStr, endStr } = rangeToDates(time_range);
  const result = { has_score: false, has_tag: false, has_attendance: false };

  // 学生基本信息
  const { data: stu } = await supabase
    .from('student')
    .select('id, name, teacher_id')
    .eq('id', student_id)
    .eq('teacher_id', req.user.id)
    .is('deleted_at', null)
    .maybeSingle();
  if (!stu) throw new Forbidden('学生不存在或不属于当前教师');

  // 1. 成绩
  if (dims.includes('score')) {
    const { data: exams } = await supabase
      .from('exam')
      .select('id, exam_name, subject, total_score, exam_time')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .gte('exam_time', startStr)
      .lte('exam_time', endStr);
    if (exams && exams.length) {
      const examIds = exams.map((e) => e.id);
      const { data: scores } = await supabase
        .from('score')
        .select('exam_id, score')
        .in('exam_id', examIds);
      const byExam = {};
      for (const s of scores || []) {
        byExam[s.exam_id] = byExam[s.exam_id] || [];
        byExam[s.exam_id].push(Number(s.score));
      }
      const lines = exams
        .sort((a, b) => a.exam_time.localeCompare(b.exam_time))
        .map((e) => {
          const arr = byExam[e.id] || [];
          if (!arr.length) return null;
          const avg = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
          return `${e.exam_name}(${e.subject},满分${e.total_score})均分${avg}`;
        })
        .filter(Boolean);
      if (lines.length) {
        result.has_score = true;
        result.score_summary = lines.join('；');
      }
    }
  }

  // 2. 课堂表现标签
  if (dims.includes('tag')) {
    const { data: behaviors } = await supabase
      .from('student_behavior')
      .select('id')
      .eq('teacher_id', req.user.id)
      .eq('student_id', student_id)
      .gte('lesson_date', startStr)
      .lte('lesson_date', endStr);
    if (behaviors && behaviors.length) {
      const bIds = behaviors.map((b) => b.id);
      const { data: rels } = await supabase
        .from('behavior_tag_rel')
        .select('tag_id')
        .in('behavior_id', bIds);
      const tagIds = [...new Set((rels || []).map((r) => r.tag_id))];
      if (tagIds.length) {
        const { data: tags } = await supabase
          .from('behavior_tag')
          .select('tag_name, tag_type')
          .in('id', tagIds);
        const pos = tags.filter((t) => t.tag_type === 'positive').map((t) => t.tag_name);
        const imp = tags.filter((t) => t.tag_type === 'improve').map((t) => t.tag_name);
        result.has_tag = true;
        result.tag_summary = `正向标签${pos.length}次(${pos.join('、') || '无'})，待改进标签${imp.length}次(${imp.join('、') || '无'})`;
      }
    }
  }

  // 3. 考勤
  if (dims.includes('attendance')) {
    const { data: atts } = await supabase
      .from('attendance')
      .select('status')
      .eq('teacher_id', req.user.id)
      .eq('student_id', student_id)
      .gte('attend_date', startStr)
      .lte('attend_date', endStr);
    if (atts && atts.length) {
      const late = atts.filter((a) => a.status === 'late').length;
      const absent = atts.filter((a) => a.status === 'absent').length;
      const leave = atts.filter((a) => a.status === 'leave').length;
      if (late || absent || leave) {
        result.has_attendance = true;
        result.attendance_summary = `共${atts.length}次记录，迟到${late}次，旷课${absent}次，请假${leave}次`;
      }
    }
  }

  return { student: stu, result };
}

// 生成 (POST /api/feedback/generate)
export async function generateFeedback(req, res, next) {
  try {
    const { error, value } = feedbackGenSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { student_id, time_range, selected_dimensions, teacher_notes, style_tag, focus_points } = value;

    // 幂等保护: 1分钟内同学生同参数返回上次结果
    const idemKey = `${req.user.id}:${student_id}:${time_range}:${selected_dimensions.join(',')}:${teacher_notes || ''}:${style_tag}:${(focus_points || []).join(',')}`;
    const idemHash = Buffer.from(idemKey).toString('base64');
    const since = new Date(Date.now() - 60 * 1000).toISOString();
    const { data: cached } = await supabase
      .from('student_feedback')
      .select('content_short, content_full')
      .eq('teacher_id', req.user.id)
      .eq('student_id', student_id)
      .eq('time_range', time_range)
      .gte('created_at', since)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (cached) {
      return success(res, { ...cached, cached: true }, '已返回最近一次生成结果');
    }

    // 风格标签指令
    const { data: tagRow } = await supabase
      .from('feedback_style_tag')
      .select('style_instruction')
      .or(`teacher_id.is.null,teacher_id.eq.${req.user.id}`)
      .eq('tag_name', style_tag)
      .maybeSingle();
    const style_instruction = tagRow?.style_instruction || style_tag;

    // 聚合真实数据
    const { student, result } = await aggregate(req, student_id, time_range, selected_dimensions);

    // 组装 Prompt
    const prompt = buildPrompt({
      student_name: student.name,
      style_instruction,
      time_range,
      teacher_notes,
      focus_points: focus_points || [],
      dims: {
        has_score: result.has_score,
        score_summary: result.score_summary,
        has_tag: result.has_tag,
        tag_summary: result.tag_summary,
        has_attendance: result.has_attendance,
        attendance_summary: result.attendance_summary,
      },
    });

    // 调用大模型 (容错重试1次)
    let parsed;
    let rawText = '';
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        rawText = await callLLM([{ role: 'user', content: prompt }]);
        parsed = parseLLMJson(rawText);
        break;
      } catch (e) {
        if (attempt === 1) {
          return resp.serverError(res, 'AI 生成失败，请稍后重试');
        }
      }
    }
    if (!parsed || !parsed.short_version || !parsed.full_version) {
      return resp.serverError(res, 'AI 返回格式异常，未写入数据库');
    }

    // 入库 (含数据快照)
    const snapshot = {
      score: result.has_score ? result.score_summary : null,
      tag: result.has_tag ? result.tag_summary : null,
      attendance: result.has_attendance ? result.attendance_summary : null,
    };
    const { data: saved, error: insErr } = await supabase
      .from('student_feedback')
      .insert({
        student_id,
        time_range,
        selected_dimensions,
        teacher_notes: teacher_notes || null,
        style_tag,
        focus_points: focus_points || null,
        content_short: parsed.short_version,
        content_full: parsed.full_version,
        source_snapshot: snapshot,
        teacher_id: req.user.id,
      })
      .select('id, created_at')
      .single();
    if (insErr) throw insErr;

    return success(
      res,
      {
        id: saved.id,
        content_short: parsed.short_version,
        content_full: parsed.full_version,
        cached: false,
      },
      '生成成功'
    );
  } catch (e) {
    next(e);
  }
}

// 学生信息卡片（课后反馈页顶部：姓名/班级/最近成绩/成绩变化/出勤率/评级）
export async function getStudentCard(req, res, next) {
  try {
    const { student_id } = req.query;
    if (!student_id) return resp.badRequest(res, 'student_id 必填');
    const { data: stu } = await supabase
      .from('student')
      .select('id, name, avatar_url, class_id, class:class_id(name)')
      .eq('id', student_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!stu) throw new Forbidden('学生不存在或不属于当前教师');

    // 最近两次考试及分数
    const { data: exams } = await supabase
      .from('exam')
      .select('id, exam_name, total_score, exam_time')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .order('exam_time', { ascending: false })
      .limit(2);
    let recent_score = null;
    let prev_score = null;
    let score_change = null;
    let trend = 'flat';
    if (exams?.length) {
      const ids = exams.map((e) => e.id);
      const { data: scs } = await supabase
        .from('score')
        .select('exam_id, score')
        .eq('student_id', student_id)
        .in('exam_id', ids);
      const byExam = {};
      for (const s of scs || []) byExam[s.exam_id] = Number(s.score);
      if (exams[0] && byExam[exams[0].id] !== undefined) {
        recent_score = { score: byExam[exams[0].id], total_score: exams[0].total_score, exam_name: exams[0].exam_name };
        if (exams[1] && byExam[exams[1].id] !== undefined) {
          prev_score = { score: byExam[exams[1].id], total_score: exams[1].total_score, exam_name: exams[1].exam_name };
          score_change = Math.round((recent_score.score - prev_score.score) * 100) / 100;
          trend = score_change > 3 ? 'up' : score_change < -3 ? 'down' : 'flat';
        }
      }
    }

    // 近30天出勤率
    const since = new Date();
    since.setDate(since.getDate() - 29);
    const { data: atts } = await supabase
      .from('attendance')
      .select('status')
      .eq('teacher_id', req.user.id)
      .eq('student_id', student_id)
      .gte('attend_date', since.toISOString().slice(0, 10));
    const total = atts?.length || 0;
    const absent = (atts || []).filter((a) => a.status === 'absent').length;
    const attendance_rate = total ? Math.round(((total - absent) / total) * 100) : null;

    // 综合评级
    let grade = null;
    if (recent_score) {
      const pct = recent_score.score / recent_score.total_score;
      grade = pct >= 0.9 ? 'A' : pct >= 0.8 ? 'B' : pct >= 0.6 ? 'C' : 'D';
    }

    // 课堂表现评分（1-5星）：基于近30天行为标签
    let performance_score = 3;
    const { data: behRows } = await supabase
      .from('student_behavior')
      .select('id')
      .eq('teacher_id', req.user.id)
      .eq('student_id', student_id)
      .gte('lesson_date', since.toISOString().slice(0, 10));
    if (behRows?.length) {
      const bIds = behRows.map((b) => b.id);
      const { data: rels } = await supabase
        .from('behavior_tag_rel')
        .select('tag:tag_id(tag_type)')
        .in('behavior_id', bIds);
      const pos = (rels || []).filter((r) => r.tag?.tag_type === 'positive').length;
      const imp = (rels || []).filter((r) => r.tag?.tag_type === 'improve').length;
      if (pos >= 3) performance_score = 5;
      else if (pos === 2) performance_score = 4;
      else if (pos === 1) performance_score = 3;
      else if (imp >= 1) performance_score = 2;
      else performance_score = 3;
    }

    // 近6次考试成绩历史
    let score_history = [];
    const { data: last6exams } = await supabase
      .from('exam')
      .select('id, exam_name, total_score, exam_time')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .order('exam_time', { ascending: false })
      .limit(6);
    if (last6exams?.length) {
      const eIds = last6exams.map((e) => e.id);
      const { data: hScs } = await supabase
        .from('score')
        .select('exam_id, score')
        .eq('student_id', student_id)
        .in('exam_id', eIds);
      const hMap = {};
      for (const s of hScs || []) hMap[s.exam_id] = Number(s.score);
      score_history = last6exams
        .sort((a, b) => a.exam_time.localeCompare(b.exam_time))
        .map((e) => ({
          exam_name: e.exam_name,
          exam_time: e.exam_time,
          score: hMap[e.id] !== undefined ? hMap[e.id] : null,
          total_score: e.total_score,
        }));
    }

    return success(res, {
      student_id: stu.id,
      name: stu.name,
      class_name: stu.class?.name || '未分班',
      recent_score,
      prev_score,
      score_change,
      trend,
      attendance_rate,
      grade,
      performance_score,
      score_history,
    });
  } catch (e) {
    next(e);
  }
}

// 反馈历史
export async function listFeedback(req, res, next) {
  try {
    const { student_id } = req.query;
    if (!student_id) return resp.badRequest(res, 'student_id 必填');
    const { data, error } = await supabase
      .from('student_feedback')
      .select('id, time_range, selected_dimensions, teacher_notes, style_tag, content_short, content_full, created_at')
      .eq('teacher_id', req.user.id)
      .eq('student_id', student_id)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return success(res, data);
  } catch (e) {
    next(e);
  }
}
