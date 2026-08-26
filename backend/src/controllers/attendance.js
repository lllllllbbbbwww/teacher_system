import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { BadRequest, Forbidden } from '../utils/errors.js';
import { attendanceBatchSchema } from '../validators/business.js';

// 批量录入考勤 (同一天同一学生重复提交 -> upsert 覆盖)
export async function batchEnterAttendance(req, res, next) {
  try {
    const { error, value } = attendanceBatchSchema.validate(req.body);
    if (error) return resp.badRequest(res, error.message);

    const { class_id, attend_date, records } = value;

    // 班级归属校验
    const { data: cls } = await supabase
      .from('class')
      .select('id')
      .eq('id', class_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!cls) throw new Forbidden('班级不存在或不属于当前教师');

    // 学生归属校验
    const stuIds = records.map((r) => r.student_id);
    const { data: stus } = await supabase
      .from('student')
      .select('id')
      .eq('teacher_id', req.user.id)
      .eq('class_id', class_id)
      .is('deleted_at', null)
      .in('id', stuIds);
    if (!stus || stus.length !== stuIds.length) {
      throw new BadRequest('存在学生不属于该班级');
    }

    const rows = records.map((r) => ({
      class_id,
      student_id: r.student_id,
      attend_date,
      status: r.status,
      remark: r.remark || null,
      teacher_id: req.user.id,
    }));
    // onConflict (student_id, attend_date) 保证同一天同一人覆盖
    const { error: upsertErr } = await supabase
      .from('attendance')
      .upsert(rows, { onConflict: 'student_id,attend_date', ignoreDuplicates: false });
    if (upsertErr) throw upsertErr;

    return success(res, { count: rows.length }, `成功录入 ${rows.length} 条考勤`);
  } catch (e) {
    next(e);
  }
}

// 考勤列表 (按班级+日期范围)
export async function listAttendance(req, res, next) {
  try {
    const { class_id, start_date, end_date } = req.query;
    if (!class_id) return resp.badRequest(res, 'class_id 必填');

    let q = supabase
      .from('attendance')
      .select('id, student_id, attend_date, status, remark')
      .eq('teacher_id', req.user.id);
    q = q.eq('class_id', class_id);
    if (start_date) q = q.gte('attend_date', start_date);
    if (end_date) q = q.lte('attend_date', end_date);
    const { data, error } = await q.order('attend_date', { ascending: false });
    if (error) throw error;

    const stuIds = [...new Set(data.map((d) => d.student_id))];
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
    return success(res, list);
  } catch (e) {
    next(e);
  }
}

// 近30天异常统计 (迟到+旷课)
export async function attendanceSummary(req, res, next) {
  try {
    const { class_id } = req.query;
    if (!class_id) return resp.badRequest(res, 'class_id 必填');

    const since = new Date();
    since.setDate(since.getDate() - 30);
    const sinceStr = since.toISOString().slice(0, 10);

    const { data, error } = await supabase
      .from('attendance')
      .select('student_id, status')
      .eq('teacher_id', req.user.id)
      .eq('class_id', class_id)
      .gte('attend_date', sinceStr);
    if (error) throw error;

    const abnormal = ['late', 'absent'];
    const map = {};
    for (const r of data) {
      if (abnormal.includes(r.status)) {
        map[r.student_id] = (map[r.student_id] || 0) + 1;
      }
    }
    // 仅返回异常>=3次
    const result = Object.entries(map)
      .filter(([, c]) => c >= 3)
      .map(([student_id, count]) => ({ student_id, count }));

    const stuIds = result.map((r) => r.student_id);
    const { data: stus } = await supabase
      .from('student')
      .select('id, name, student_no')
      .in('id', stuIds);
    const stuMap = Object.fromEntries((stus || []).map((s) => [s.id, s]));
    const list = result.map((r) => ({
      ...r,
      student_name: stuMap[r.student_id]?.name || '',
      student_no: stuMap[r.student_id]?.student_no || '',
    }));
    return success(res, list);
  } catch (e) {
    next(e);
  }
}
