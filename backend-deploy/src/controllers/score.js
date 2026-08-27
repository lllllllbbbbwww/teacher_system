import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';
import { scoreBatchSchema } from '../validators/business.js';

// 批量录入 (事务性: 要么全成功, 要么全失败)
export async function batchEnterScores(req, res, next) {
  try {
    const { error, value } = scoreBatchSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { exam_id, scores } = value;

    // 1. 考试归属校验 + 取满分
    const { data: exam } = await supabase
      .from('exam')
      .select('id, total_score, class_id, teacher_id')
      .eq('id', exam_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!exam) throw new NotFound('考试不存在');

    // 2. 学生归属校验 (同一班级 + 当前教师)
    const studentIds = scores.map((s) => s.student_id);
    const { data: students } = await supabase
      .from('student')
      .select('id, class_id')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .in('id', studentIds);
    if (!students || students.length !== studentIds.length) {
      throw new Forbidden('存在不属于当前教师的学生');
    }
    const notInClass = students.filter((s) => s.class_id !== exam.class_id);
    if (notInClass.length > 0) throw new BadRequest('存在学生不属于该考试班级');

    // 3. 分数范围校验 0 <= score <= total_score
    for (const s of scores) {
      if (s.score > exam.total_score) {
        throw new BadRequest(`分数 ${s.score} 超出满分 ${exam.total_score}`);
      }
    }

    // 4. 使用 upsert 保证事务原子性 (Supabase 单条 RPC 内 batch)
    const rows = scores.map((s) => ({
      exam_id,
      student_id: s.student_id,
      score: s.score,
    }));
    const { error: upsertErr } = await supabase
      .from('score')
      .upsert(rows, { onConflict: 'exam_id,student_id', ignoreDuplicates: false });
    if (upsertErr) throw upsertErr;

    // 5. 统计: 均分/最高/最低/及格率/优秀率
    const { data: all } = await supabase
      .from('score')
      .select('score')
      .eq('exam_id', exam_id);
    const stats = computeStats(all.map((r) => Number(r.score)), Number(exam.total_score));

    return success(res, { stats }, `成功录入 ${rows.length} 条成绩`);
  } catch (e) {
    next(e);
  }
}

// 某考试的成绩列表
export async function listScores(req, res, next) {
  try {
    const { exam_id } = req.query;
    if (!exam_id) return resp.badRequest(res, 'exam_id 必填');

    const { data: exam } = await supabase
      .from('exam')
      .select('id, total_score, teacher_id')
      .eq('id', exam_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!exam) throw new NotFound('考试不存在');

    const { data, error } = await supabase
      .from('score')
      .select('id, student_id, score, created_at')
      .eq('exam_id', exam_id)
      .order('score', { ascending: false });
    if (error) throw error;

    // 关联学生姓名
    const stuIds = data.map((d) => d.student_id);
    const { data: stus } = await supabase
      .from('student')
      .select('id, name, student_no')
      .in('id', stuIds);
    const stuMap = Object.fromEntries((stus || []).map((s) => [s.id, s]));

    const list = data.map((d) => ({
      ...d,
      student_name: stuMap[d.student_id]?.name || '',
      student_no: stuMap[d.student_id]?.student_no || '',
    }));
    const stats = computeStats(list.map((d) => Number(d.score)), Number(exam.total_score));
    return success(res, { list, stats });
  } catch (e) {
    next(e);
  }
}

function computeStats(arr, total) {
  if (!arr.length) {
    return { count: 0, avg: 0, max: 0, min: 0, passRate: 0, excellentRate: 0 };
  }
  const sum = arr.reduce((a, b) => a + b, 0);
  const passLine = total * 0.6;
  const excelLine = total * 0.8;
  const pass = arr.filter((v) => v >= passLine).length;
  const excel = arr.filter((v) => v >= excelLine).length;
  return {
    count: arr.length,
    avg: Math.round((sum / arr.length) * 100) / 100,
    max: Math.max(...arr),
    min: Math.min(...arr),
    passRate: Math.round((pass / arr.length) * 1000) / 10,
    excellentRate: Math.round((excel / arr.length) * 1000) / 10,
  };
}
