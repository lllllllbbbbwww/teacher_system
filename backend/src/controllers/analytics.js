import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { NotFound } from '../utils/errors.js';

// 考试班级成绩总览：均分/高低分/学员排名（数据分析页）
export async function examOverview(req, res, next) {
  try {
    const { exam_id } = req.query;
    if (!exam_id) return resp.badRequest(res, 'exam_id 必填');

    const { data: exam } = await supabase
      .from('exam')
      .select('id, exam_name, subject, total_score, exam_time, class_id')
      .eq('id', exam_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!exam) throw new NotFound('考试不存在');
    // 班级名单独查询 (不依赖外键关联)
    let class_name = '未分班';
    if (exam.class_id) {
      const { data: cls } = await supabase
        .from('class')
        .select('class_name')
        .eq('id', exam.class_id)
        .maybeSingle();
      if (cls) class_name = cls.class_name;
    }

    const { data: scs } = await supabase
      .from('score')
      .select('student_id, score')
      .eq('exam_id', exam_id);
    if (!scs?.length) {
      return success(res, { exam: null, list: [], stats: null, top_students: [], low_students: [] });
    }

    const stuIds = scs.map((s) => s.student_id);
    const { data: stus } = await supabase
      .from('student')
      .select('id, name, student_no')
      .in('id', stuIds);
    const stuMap = Object.fromEntries((stus || []).map((s) => [s.id, s]));

    const rows = scs.map((s) => ({ student_id: s.student_id, score: Number(s.score) }));
    rows.sort((a, b) => b.score - a.score);
    const list = rows.map((r, i) => ({
      rank: i + 1,
      student_id: r.student_id,
      name: stuMap[r.student_id]?.name || '未知',
      student_no: stuMap[r.student_id]?.student_no || '',
      score: r.score,
    }));

    const total = Number(exam.total_score);
    const passLine = total * 0.6;
    const excelLine = total * 0.8;
    const arr = list.map((r) => r.score);
    const sum = arr.reduce((a, b) => a + b, 0);
    const stats = {
      count: arr.length,
      avg: Math.round((sum / arr.length) * 100) / 100,
      max: Math.max(...arr),
      min: Math.min(...arr),
      passRate: Math.round((arr.filter((v) => v >= passLine).length / arr.length) * 1000) / 10,
      excellentRate: Math.round((arr.filter((v) => v >= excelLine).length / arr.length) * 1000) / 10,
    };

    // 学员成绩变动看板：当前考试 vs 上一场
    let student_progress = [];
    const { data: prevExam } = await supabase
      .from('exam')
      .select('id, exam_name')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .lt('exam_time', exam.exam_time)
      .order('exam_time', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (prevExam) {
      const { data: prevScs } = await supabase.from('score').select('student_id, score').eq('exam_id', prevExam.id);
      const prevMap = {};
      for (const s of prevScs || []) prevMap[s.student_id] = Number(s.score);
      const { data: stuList } = await supabase
        .from('student')
        .select('id, name, class_id')
        .in('id', stuIds);
      const sMap = {};
      for (const s of stuList || []) sMap[s.id] = s;
      // 班级名称映射 (单独查询 class 表)
      const classIds = [...new Set((stuList || []).map((x) => x.class_id).filter(Boolean))];
      const classMap = {};
      if (classIds.length) {
        const { data: classes } = await supabase
          .from('class')
          .select('id, class_name')
          .in('id', classIds);
        for (const c of classes || []) classMap[c.id] = c.class_name;
      }
      for (const r of list) {
        const prev = prevMap[r.student_id];
        let diff = null;
        let trend = 'flat';
        if (prev !== undefined) {
          diff = Math.round((r.score - prev) * 100) / 100;
          trend = diff > 3 ? 'up' : diff < -3 ? 'down' : 'flat';
        }
        const st = sMap[r.student_id];
        student_progress.push({
          student_id: r.student_id,
          name: r.name,
          class_name: classMap[st?.class_id] || '未分班',
          cur_score: r.score,
          prev_score: prev !== undefined ? prev : null,
          diff,
          trend,
        });
      }
    }

    // 学科能力分布（各科目最近考试平均分）
    let subject_ability = [];
    const { data: subExams } = await supabase
      .from('exam')
      .select('id, subject, total_score')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .order('exam_time', { ascending: false });
    const latestSub = {};
    for (const e of subExams || []) {
      if (!latestSub[e.subject]) latestSub[e.subject] = e.id;
    }
    const subIds = Object.values(latestSub);
    if (subIds.length) {
      const { data: subScs } = await supabase.from('score').select('exam_id, score').in('exam_id', subIds);
      const subScoreMap = {};
      for (const s of subScs || []) {
        subScoreMap[s.exam_id] = (subScoreMap[s.exam_id] || []).concat(Number(s.score));
      }
      subject_ability = Object.entries(latestSub).map(([subject, eid]) => {
        const arr = subScoreMap[eid] || [];
        const avg = arr.length ? Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100 : 0;
        return { subject, avg };
      });
    }

    return success(res, {
      exam: {
        exam_name: exam.exam_name,
        subject: exam.subject,
        total_score: total,
        exam_time: exam.exam_time,
        class_name,
      },
      stats,
      list,
      top_students: list.filter((r) => r.score >= excelLine).slice(0, 5),
      low_students: list.filter((r) => r.score < passLine).slice(0, 5),
      student_progress,
      subject_ability,
    });
  } catch (e) {
    next(e);
  }
}
