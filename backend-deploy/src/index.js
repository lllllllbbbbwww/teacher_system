import 'dotenv/config';
import { validateEnv } from './config/env.js';
import { ensureInitAdmin } from './controllers/auth.js';
import app from './app.js';

// 启动前校验关键环境变量, 缺失直接报错退出
validateEnv();

const PORT = process.env.PORT || 3000;

// 若配置了 INIT_ADMIN，自动创建初始管理员账号
ensureInitAdmin().finally(() => {
  app.listen(PORT, () => {
    console.log(`[Server] 教师学情系统后端已启动: http://localhost:${PORT}`);
  });
});
