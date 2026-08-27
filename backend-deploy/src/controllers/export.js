import ExcelJS from 'exceljs';
import PdfPrinter from 'pdfmake/src/printer.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { supabase } from '../config/env.js';
import { success, resp } from '../utils/response.js';
import { NotFound, Forbidden } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.join(__dirname, '../../fonts');

// ============ Excel: 班级成绩导出 ============
export async function exportExamExcel(req, res, next) {
  try {
    const { exam_id } = req.query;
    if (!exam_id) return resp.badRequest(res, 'exam_id 必填');

    const { data: exam } = await supabase
      .from('exam')
      .select('exam_name, subject, total_score, class_id, teacher_id')
      .eq('id', exam_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!exam) throw new NotFound('考试不存在');

    const { data: scores } = await supabase
      .from('score')
      .select('student_id, score')
      .eq('exam_id', exam_id);
    const stuIds = (scores || []).map((s) => s.student_id);
    const { data: stus } = await supabase
      .from('student')
      .select('id, name, student_no')
      .in('id', stuIds);
    const stuMap = Object.fromEntries((stus || []).map((s) => [s.id, s]));

    const { data: cls } = await supabase
      .from('class')
      .select('class_name')
      .eq('id', exam.class_id)
      .maybeSingle();

    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('成绩表');
    sheet.columns = [
      { header: '学号', key: 'student_no', width: 16 },
      { header: '姓名', key: 'name', width: 12 },
      { header: '分数', key: 'score', width: 10 },
      { header: '满分', key: 'total', width: 10 },
    ];
    for (const s of scores || []) {
      sheet.addRow({
        student_no: stuMap[s.student_id]?.student_no || '',
        name: stuMap[s.student_id]?.name || '',
        score: s.score,
        total: exam.total_score,
      });
    }

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `${cls?.class_name || '班级'}_${exam.exam_name}_成绩表_${date}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
}

// ============ Excel: 班级考勤汇总 ============
export async function exportAttendanceExcel(req, res, next) {
  try {
    const { class_id, start_date, end_date } = req.query;
    if (!class_id) return resp.badRequest(res, 'class_id 必填');

    const { data: cls } = await supabase
      .from('class')
      .select('class_name, teacher_id')
      .eq('id', class_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!cls) throw new NotFound('班级不存在');

    let q = supabase
      .from('attendance')
      .select('student_id, attend_date, status, remark')
      .eq('teacher_id', req.user.id)
      .eq('class_id', class_id);
    if (start_date) q = q.gte('attend_date', start_date);
    if (end_date) q = q.lte('attend_date', end_date);
    const { data: atts } = await q.order('attend_date', { ascending: true });

    const stuIds = [...new Set((atts || []).map((a) => a.student_id))];
    const { data: stus } = await supabase
      .from('student')
      .select('id, name, student_no')
      .in('id', stuIds);
    const stuMap = Object.fromEntries((stus || []).map((s) => [s.id, s]));

    const statusMap = { normal: '正常', late: '迟到', leave: '请假', absent: '旷课' };
    const wb = new ExcelJS.Workbook();
    const sheet = wb.addWorksheet('考勤汇总');
    sheet.columns = [
      { header: '学号', key: 'student_no', width: 16 },
      { header: '姓名', key: 'name', width: 12 },
      { header: '日期', key: 'attend_date', width: 14 },
      { header: '状态', key: 'status', width: 10 },
      { header: '备注', key: 'remark', width: 20 },
    ];
    for (const a of atts || []) {
      sheet.addRow({
        student_no: stuMap[a.student_id]?.student_no || '',
        name: stuMap[a.student_id]?.name || '',
        attend_date: a.attend_date,
        status: statusMap[a.status] || a.status,
        remark: a.remark || '',
      });
    }

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `${cls.class_name}_考勤汇总_${date}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    next(e);
  }
}

// ============ PDF: 学生个人学情 (中文字体) ============
export async function exportStudentPdf(req, res, next) {
  try {
    const { student_id } = req.query;
    if (!student_id) return resp.badRequest(res, 'student_id 必填');

    const { data: stu } = await supabase
      .from('student')
      .select('id, name, student_no, gender, teacher_id')
      .eq('id', student_id)
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null)
      .maybeSingle();
    if (!stu) throw new NotFound('学生不存在');

    // 成绩
    const { data: exams } = await supabase
      .from('exam')
      .select('id, exam_name, subject, total_score, exam_time')
      .eq('teacher_id', req.user.id)
      .is('deleted_at', null);
    const examMap = Object.fromEntries((exams || []).map((e) => [e.id, e]));
    const { data: scores } = await supabase
      .from('score')
      .select('exam_id, score')
      .in('exam_id', Object.keys(examMap));
    const scoreRows = (scores || [])
      .map((s) => ({ exam: examMap[s.exam_id], score: s.score }))
      .sort((a, b) => a.exam.exam_time.localeCompare(b.exam.exam_time));

    // 最近一条 AI 反馈
    const { data: fb } = await supabase
      .from('student_feedback')
      .select('content_short, content_full, created_at')
      .eq('teacher_id', req.user.id)
      .eq('student_id', student_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    // 中文字体 (思源黑体简体中文, 已随仓库提供): backend/fonts/NotoSansCJKsc-Regular.otf
    const candidates = [
      path.join(FONT_DIR, 'NotoSansCJKsc-Regular.otf'),
      path.join(FONT_DIR, 'SourceHanSansSC-Regular.ttf'),
    ];
    const fontPath = candidates.find((p) => fs.existsSync(p));
    if (!fontPath) throw new NotFound('未找到中文字体文件, 请参考 fonts/README.md 放置字体');
    const printer = new PdfPrinter({
      han: { normal: fontPath, bold: fontPath, italics: fontPath, bolditalics: fontPath },
    });
    const docDefinition = {
      defaultStyle: { font: 'han', fontSize: 12 },
      content: [
        { text: `${stu.name} 学情反馈`, fontSize: 18, bold: true, margin: [0, 0, 0, 12] },
        { text: `学号: ${stu.student_no}    性别: ${stu.gender || '-'}`, margin: [0, 0, 0, 8] },
        { text: '一、成绩记录', bold: true, margin: [0, 8, 0, 4] },
        scoreRows.length
          ? {
              table: {
                headerRows: 1,
                widths: ['*', 'auto', 'auto'],
                body: [
                  ['考试', '科目', '分数/满分'],
                  ...scoreRows.map((r) => [r.exam.exam_name, r.exam.subject, `${r.score}/${r.exam.total_score}`]),
                ],
              },
            }
          : { text: '暂无成绩记录' },
        { text: '二、学情反馈', bold: true, margin: [0, 12, 0, 4] },
        fb
          ? [
              { text: '【简短微信版】', bold: true },
              { text: fb.content_short, margin: [0, 2, 0, 6] },
              { text: '【完整版】', bold: true },
              { text: `优点：${fb.content_full.advantages}`, margin: [0, 2, 0, 4] },
              { text: `待改进：${fb.content_full.problems}`, margin: [0, 2, 0, 4] },
              { text: `建议：${fb.content_full.suggestions}`, margin: [0, 2, 0, 4] },
            ]
          : { text: '暂无反馈记录' },
      ],
    };

    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const fileName = `${stu.name}_学情反馈_${date}.pdf`;
    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.setHeader('Content-Type', 'application/pdf');
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (e) {
    next(e);
  }
}
