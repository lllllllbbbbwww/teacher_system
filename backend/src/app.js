import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRouter } from './routes/auth.js';
import { classRouter } from './routes/class.js';
import { studentRouter } from './routes/student.js';
import { examRouter } from './routes/exam.js';
import { scoreRouter } from './routes/score.js';
import { attendanceRouter } from './routes/attendance.js';
import { behaviorRouter } from './routes/behavior.js';
import { styleTagRouter } from './routes/styleTag.js';
import { feedbackRouter } from './routes/feedback.js';
import { exportRouter } from './routes/export.js';
import { dashboardRouter } from './routes/dashboard.js';
import { analyticsRouter } from './routes/analytics.js';
import { adminUserRouter } from './routes/adminUser.js';

const app = express();

app.use(cors());
app.use(express.json());

// 路由挂载
app.get('/health', (req, res) => res.json({ code: 0, data: 'ok', msg: 'success' }));
app.use('/api/auth', authRouter);
app.use('/api/classes', classRouter);
app.use('/api/students', studentRouter);
app.use('/api/exams', examRouter);
app.use('/api/scores', scoreRouter);
app.use('/api/attendance', attendanceRouter);
app.use('/api/behaviors', behaviorRouter);
app.use('/api/style-tags', styleTagRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/export', exportRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/admin/users', adminUserRouter);

// 404 兜底
app.use(notFoundHandler);

// 全局异常捕获 (必须放在最后)
app.use(errorHandler);

export default app;
