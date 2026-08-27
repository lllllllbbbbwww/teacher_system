import { supabase } from '../config/env.js';
import { success } from '../utils/response.js';

// 工作台总览：核心数字 + 本周考勤 + 最近考试
export async function dashboardSummary(req, res, next) {
  try {
    const teacherId = req.user.id;

    // 基础计数
    const [cls, stu, exam] = await Promise.all([
      supabase
        .from('class')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .is('deleted_at', null),
      supabase
        .from('student')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .is('deleted_at', null),
      supabase
        .from('exam')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId)
        .is('deleted_at', null),
    ]);
    const class_count = cls.count || 0;
    const student_count = stu.count || 0;
    const exam_count = exam.count || 0;

    // 近 7 天考勤
    const since = new Date();
    since.setDate(since.getDate() - 6);
    const sinceStr = since.toISOString().slice(0, 10);
    const { data: atts } = await supabase
      .from('attendance')
      .select('status')
      .eq('teacher_id', teacherId)
      .gte('attend_date', sinceStr);
    const week_attendance = { total: 0, normal: 0, late: 0, leave: 0, absent: 0 };
    for (const a of atts || []) {
      week_attendance.total++;
      if (week_attendance[a.status] !== undefined) week_attendance[a.status]++;
    }

    // 最近一次考试 + 均分/及格率
    let recent_exam = null;
    const { data: exams } = await supabase
      .from('exam')
      .select('id, exam_name, subject, total_score, exam_time, class_id')
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)
      .order('exam_time', { ascending: false })
      .limit(1);
    if (exams && exams[0]) {
      const e = exams[0];
      const { data: scs } = await supabase.from('score').select('score').eq('exam_id', e.id);
      const arr = (scs || []).map((s) => Number(s.score));
      if (arr.length) {
        const avg = Math.round((arr.reduce((a, b) => a + b, 0) / arr.length) * 100) / 100;
        const pass = arr.filter((v) => v >= e.total_score * 0.6).length;
        recent_exam = {
          ...e,
          avg,
          pass_rate: Math.round((pass / arr.length) * 1000) / 10,
          count: arr.length,
        };
      }
    }

    // 行为 / 反馈记录数
    const [beh, fb] = await Promise.all([
      supabase
        .from('student_behavior')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId),
      supabase
        .from('student_feedback')
        .select('id', { count: 'exact', head: true })
        .eq('teacher_id', teacherId),
    ]);

    // 本月考试数
    const monthStart = new Date();
    monthStart.setDate(1);
    const monthStartStr = monthStart.toISOString().slice(0, 10);
    const { count: month_exam_count } = await supabase
      .from('exam')
      .select('id', { count: 'exact', head: true })
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)
      .gte('exam_time', monthStartStr);

    // 近8次考试班级成绩趋势（每次考试平均分 + 对应时段出勤率）
    const class_trend = [];
    const { data: trendExams } = await supabase
      .from('exam')
      .select('id, exam_name, exam_time, class_id')
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)
      .order('exam_time', { ascending: true })
      .limit(8);
    if (trendExams?.length) {
      const examIds = trendExams.map((e) => e.id);
      const { data: trendScores } = await supabase
        .from('score')
        .select('exam_id, score')
        .in('exam_id', examIds);
      const { data: trendAtts } = await supabase
        .from('attendance')
        .select('attend_date, status')
        .eq('teacher_id', teacherId);

      const scoreMap = {};
      for (const s of trendScores || []) {
        scoreMap[s.exam_id] = (scoreMap[s.exam_id] || []).concat(Number(s.score));
      }
      const attMap = {};
      for (const a of trendAtts || []) {
        attMap[a.attend_date] = attMap[a.attend_date] || { total: 0, normal: 0 };
        attMap[a.attend_date].total++;
        if (a.status === 'normal') attMap[a.attend_date].normal++;
      }

      for (const e of trendExams) {
        const scores = scoreMap[e.id] || [];
        const avg = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null;
        // 取考试前后3天内的出勤率
        const examDate = new Date(e.exam_time);
        let attTotal = 0, attNormal = 0;
        for (let d = -3; d <= 3; d++) {
          const dt = new Date(examDate);
          dt.setDate(dt.getDate() + d);
          const key = dt.toISOString().slice(0, 10);
          if (attMap[key]) {
            attTotal += attMap[key].total;
            attNormal += attMap[key].normal;
          }
        }
        const attendanceRate = attTotal ? Math.round((attNormal / attTotal) * 100) : null;
        class_trend.push({
          label: e.exam_name || e.exam_time.slice(0, 10),
          avg,
          attendance_rate: attendanceRate,
        });
      }
    }

    // 最近一次考试的ABCD段分布
    let grade_dist = { A: 0, B: 0, C: 0, D: 0 };
    if (recent_exam) {
      const { data: recentScores } = await supabase.from('score').select('score').eq('exam_id', recent_exam.id);
      for (const s of recentScores || []) {
        const pct = Number(s.score) / recent_exam.total_score;
        if (pct >= 0.9) grade_dist.A++;
        else if (pct >= 0.8) grade_dist.B++;
        else if (pct >= 0.6) grade_dist.C++;
        else grade_dist.D++;
      }
    }

    // 班级名称映射 (单独查询 class 表, 避免嵌入关联依赖外键)
    const { data: clsRows } = await supabase
      .from('class')
      .select('id, class_name')
      .eq('teacher_id', teacherId)
      .is('deleted_at', null);
    const classMap = {};
    for (const c of clsRows || []) classMap[c.id] = c.class_name;

    // 学员成绩进度看板：每生最近两场考试对比
    let student_progress = [];
    const { data: lastExams } = await supabase
      .from('exam')
      .select('id, exam_name, total_score')
      .eq('teacher_id', teacherId)
      .is('deleted_at', null)
      .order('exam_time', { ascending: false })
      .limit(2);
    if (lastExams && lastExams.length) {
      const ids = lastExams.map((e) => e.id);
      const { data: allScs } = await supabase
        .from('score')
        .select('student_id, exam_id, score')
        .in('exam_id', ids);
      const scoreMap = {};
      for (const sc of allScs || []) {
        scoreMap[`${sc.student_id}:${sc.exam_id}`] = Number(sc.score);
      }
      const { data: students } = await supabase
        .from('student')
        .select('id, name, class_id')
        .eq('teacher_id', teacherId)
        .is('deleted_at', null);
      const cur = lastExams[0].id;
      const prev = lastExams.length > 1 ? lastExams[1].id : null;
      for (const st of students || []) {
        const curSc = scoreMap[`${st.id}:${cur}`];
        if (curSc === undefined) continue;
        let prevSc = null;
        let diff = null;
        let trend = 'flat';
        if (prev) {
          prevSc = scoreMap[`${st.id}:${prev}`];
          if (prevSc !== undefined) {
            diff = Math.round((curSc - prevSc) * 100) / 100;
            trend = diff > 3 ? 'up' : diff < -3 ? 'down' : 'flat';
          }
        }
        student_progress.push({
          student_id: st.id,
          name: st.name,
          class_id: st.class_id,
          class_name: classMap[st.class_id] || '未分班',
          exam_name: lastExams[0].exam_name,
          cur_score: curSc,
          prev_score: prevSc,
          diff,
          trend,
        });
      }
      student_progress.sort((a, b) => (a.diff ?? 0) - (b.diff ?? 0));
    }

    // ===== 在籍学员卡片：按班级统计人数 + 最近一次考试平均分 =====
    let class_overview = [];
    const { data: classRows } = await supabase
      .from('class')
      .select('id, class_name')
      .eq('teacher_id', teacherId)
      .is('deleted_at', null);
    if (classRows?.length) {
      const cIds = classRows.map((c) => c.id);
      const { data: stus } = await supabase
        .from('student')
        .select('id, class_id')
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .in('class_id', cIds);
      const byClass = {};
      for (const st of stus || []) byClass[st.class_id] = (byClass[st.class_id] || 0) + 1;
      const { data: allExams } = await supabase
        .from('exam')
        .select('id, class_id, total_score')
        .eq('teacher_id', teacherId)
        .is('deleted_at', null)
        .order('exam_time', { ascending: false });
      const latestByClass = {};
      for (const e of allExams || []) {
        if (latestByClass[e.class_id] === undefined) latestByClass[e.class_id] = e.id;
      }
      const lIds = Object.values(latestByClass);
      const sumMap = {};
      const cntMap = {};
      if (lIds.length) {
        const { data: scs } = await supabase.from('score').select('exam_id, score').in('exam_id', lIds);
        for (const s of scs || []) {
          sumMap[s.exam_id] = (sumMap[s.exam_id] || 0) + Number(s.score);
          cntMap[s.exam_id] = (cntMap[s.exam_id] || 0) + 1;
        }
      }
      class_overview = classRows.map((c) => ({
        class_id: c.id,
        class_name: c.class_name,
        count: byClass[c.id] || 0,
        avg:
          latestByClass[c.id] && cntMap[latestByClass[c.id]]
            ? Math.round((sumMap[latestByClass[c.id]] / cntMap[latestByClass[c.id]]) * 100) / 100
            : null,
      }));
    }

    // ===== 关注提醒 =====
    const alerts = [];
    const { data: attRiskRows } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('teacher_id', teacherId)
      .gte('attend_date', sinceStr);
    const attRisk = {};
    for (const a of attRiskRows || []) {
      if (a.status === 'absent' || a.status === 'late') attRisk[a.student_id] = (attRisk[a.student_id] || 0) + 1;
    }
    const attRiskList = Object.entries(attRisk).sort((a, b) => b[1] - a[1]);
    const { data: allStus } = await supabase
      .from('student')
      .select('id, name, class_id')
      .eq('teacher_id', teacherId)
      .is('deleted_at', null);
    const stuMap = {};
    for (const st of allStus || []) stuMap[st.id] = st;
    // 1) 成绩下滑
    for (const p of student_progress) {
      if (p.trend === 'down') {
        alerts.push({
          type: 'score_down',
          student_id: p.student_id,
          name: p.name,
          class_name: p.class_name,
          title: `${p.name} 成绩下滑`,
          desc: `「${p.exam_name}」较上次下降 ${Math.abs(p.diff)} 分`,
        });
      }
    }
    // 2) 最近考试低分
    if (recent_exam) {
      for (const p of student_progress) {
        if (p.cur_score !== undefined && p.cur_score < recent_exam.total_score * 0.6) {
          alerts.push({
            type: 'low_score',
            student_id: p.student_id,
            name: p.name,
            class_name: p.class_name,
            title: `${p.name} 本次考试偏弱`,
            desc: `「${p.exam_name}」${p.cur_score} 分，低于及格线`,
          });
        }
      }
    }
    // 3) 出勤异常（近7天迟到/旷课≥2次）
    for (const [sid, cnt] of attRiskList) {
      const st = stuMap[sid];
      if (st && cnt >= 2) {
        alerts.push({
          type: 'attendance',
          student_id: sid,
          name: st.name,
          class_name: classMap[st.class_id] || '未分班',
          title: `${st.name} 出勤异常`,
          desc: `近7天迟到/旷课 ${cnt} 次`,
        });
      }
    }

    return success(res, {
      class_count,
      student_count,
      exam_count,
      month_exam_count: month_exam_count || 0,
      week_attendance,
      recent_exam,
      behavior_count: beh.count || 0,
      feedback_count: fb.count || 0,
      student_progress,
      class_overview,
      alerts,
      class_trend,
      grade_dist,
    });
  } catch (e) {
    next(e);
  }
}
