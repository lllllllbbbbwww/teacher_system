<template>
  <div class="page">
    <div class="page-header">
      <div class="page-header-left">
        <div class="page-header-icon"><el-icon><Setting /></el-icon></div>
        <div>
          <div class="page-header-tag">系统管理</div>
          <div class="page-header-title">用户管理</div>
          <div class="page-header-desc">管理教师账号，支持创建、重置密码、启用禁用与删除</div>
        </div>
      </div>
      <el-button type="primary" size="large" :icon="Plus" @click="openCreate">新增用户</el-button>
    </div>

    <div class="stat-row">
      <div class="stat-card">
        <div class="stat-icon blue"><el-icon><User /></el-icon></div>
        <div>
          <div class="stat-value">{{ total }}</div>
          <div class="stat-label">账号总数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon violet"><el-icon><Star /></el-icon></div>
        <div>
          <div class="stat-value">{{ adminCount }}</div>
          <div class="stat-label">管理员</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><el-icon><Warning /></el-icon></div>
        <div>
          <div class="stat-value">{{ disabledCount }}</div>
          <div class="stat-label">已禁用</div>
        </div>
      </div>
    </div>

    <div class="panel">
      <div class="toolbar">
        <el-input v-model="keyword" placeholder="搜索用户名" clearable style="width: 220px" @keyup.enter="load" @clear="load" />
        <el-button :icon="Search" @click="load">查询</el-button>
      </div>
      <div class="table-wrap">
        <el-table :data="list" stripe v-loading="loading">
          <el-table-column prop="username" label="用户名" min-width="120" />
          <el-table-column prop="display_name" label="昵称" min-width="100">
            <template #default="{ row }">{{ row.display_name || '—' }}</template>
          </el-table-column>
          <el-table-column label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="row.role === 'admin' ? 'warning' : 'info'" effect="dark">{{ row.role === 'admin' ? '管理员' : '教师' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.disabled ? 'danger' : 'success'" effect="plain">{{ row.disabled ? '已禁用' : '正常' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="created_at" label="创建时间" width="180">
            <template #default="{ row }">{{ formatDate(row.created_at) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="260" fixed="right">
            <template #default="{ row }">
              <div class="table-actions">
                <el-button link type="primary" :icon="Key" @click="openResetPwd(row)">重置密码</el-button>
                <el-button link :type="row.disabled ? 'success' : 'warning'" @click="toggleDisable(row)">
                  {{ row.disabled ? '启用' : '禁用' }}
                </el-button>
                <el-popconfirm title="确认删除该账号？" @confirm="onDelete(row)">
                  <template #reference>
                    <el-button link type="danger" :icon="Delete">删除</el-button>
                  </template>
                </el-popconfirm>
              </div>
            </template>
          </el-table-column>
          <template #empty>
            <el-empty description="暂无账号数据" />
          </template>
        </el-table>
      </div>
      <div class="pager">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @current-change="load"
          @size-change="load"
        />
      </div>
    </div>

    <!-- 新增/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="dialogMode === 'create' ? '新增用户' : '编辑用户'" width="460px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="用户名" prop="username" v-if="dialogMode === 'create'">
          <el-input v-model="form.username" placeholder="登录用户名" />
        </el-form-item>
        <el-form-item :label="dialogMode === 'create' ? '初始密码' : '新密码'" prop="password" v-if="dialogMode === 'create' || dialogMode === 'reset'">
          <el-input v-model="form.password" type="password" show-password placeholder="至少8位，含字母和数字" />
        </el-form-item>
        <el-form-item label="角色" prop="role" v-if="dialogMode !== 'reset'">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="教师" value="teacher" />
            <el-option label="管理员" value="admin" />
          </el-select>
        </el-form-item>
        <el-form-item label="昵称" prop="display_name" v-if="dialogMode !== 'reset'">
          <el-input v-model="form.display_name" placeholder="可选" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="onSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { Plus, User, Star, Warning, Search, Key, Delete, Setting } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import request from '../utils/request';
import { useAuthStore } from '../stores/auth';

const auth = useAuthStore();
const list = ref([]);
const total = ref(0);
const adminCount = ref(0);
const disabledCount = ref(0);
const loading = ref(false);
const keyword = ref('');
const page = ref(1);
const pageSize = ref(10);

const dialogVisible = ref(false);
const dialogMode = ref('create'); // create | reset
const currentRow = ref(null);
const submitting = ref(false);
const formRef = ref();
const form = reactive({ username: '', password: '', role: 'teacher', display_name: '' });

const rules = {
  username: [{ required: true, min: 3, max: 20, message: '用户名3-20位', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 8, message: '至少8位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d).*$/, message: '需包含字母和数字', trigger: 'blur' },
  ],
};

function formatDate(d) {
  if (!d) return '—';
  return d.slice(0, 10);
}

async function load() {
  loading.value = true;
  try {
    const res = await request.get('/admin/users', {
      params: { page: page.value, pageSize: pageSize.value, keyword: keyword.value },
    });
    list.value = res.list || [];
    total.value = res.total || 0;
    adminCount.value = list.value.filter((u) => u.role === 'admin').length;
    disabledCount.value = list.value.filter((u) => u.disabled).length;
  } catch (e) {
    ElMessage.error(e.message || '加载失败');
  } finally {
    loading.value = false;
  }
}

function openCreate() {
  dialogMode.value = 'create';
  currentRow.value = null;
  Object.assign(form, { username: '', password: '', role: 'teacher', display_name: '' });
  dialogVisible.value = true;
}

function openResetPwd(row) {
  dialogMode.value = 'reset';
  currentRow.value = row;
  Object.assign(form, { password: '' });
  dialogVisible.value = true;
}

async function toggleDisable(row) {
  try {
    await request.put(`/admin/users/${row.id}`, { disabled: !row.disabled });
    ElMessage.success(row.disabled ? '已启用' : '已禁用');
    load();
  } catch (e) {
    ElMessage.error(e.message || '操作失败');
  }
}

async function onDelete(row) {
  try {
    await request.delete(`/admin/users/${row.id}`);
    ElMessage.success('删除成功');
    load();
  } catch (e) {
    ElMessage.error(e.message || '删除失败');
  }
}

async function onSubmit() {
  await formRef.value.validate(async (valid) => {
    if (!valid) return;
    submitting.value = true;
    try {
      if (dialogMode.value === 'create') {
        await request.post('/admin/users', {
          username: form.username,
          password: form.password,
          role: form.role,
          display_name: form.display_name,
        });
        ElMessage.success('创建成功');
      } else if (dialogMode.value === 'reset') {
        await request.put(`/admin/users/${currentRow.value.id}`, { password: form.password });
        ElMessage.success('密码已重置');
      }
      dialogVisible.value = false;
      load();
    } catch (e) {
      ElMessage.error(e.message || '操作失败');
    } finally {
      submitting.value = false;
    }
  });
}

onMounted(load);
</script>

<style scoped>
.page { padding: 24px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; }
.page-header-left { display: flex; align-items: center; gap: 14px; }
.page-header-icon { width: 44px; height: 44px; border-radius: 12px; background: rgba(99,102,241,0.16); color: #a5b4fc; display: flex; align-items: center; justify-content: center; font-size: 22px; }
.page-header-tag { font-size: 12px; color: #94a3b8; }
.page-header-title { font-size: 20px; font-weight: 700; color: var(--text); }
.page-header-desc { font-size: 13px; color: var(--text-sub); }

.stat-row { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-card { flex: 1; display: flex; align-items: center; gap: 14px; background: var(--panel); border: 1px solid rgba(148,163,184,0.14); border-radius: 12px; padding: 18px 20px; }
.stat-icon { width: 44px; height: 44px; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; }
.stat-icon.blue { background: linear-gradient(135deg, #3b82f6, #2563eb); }
.stat-icon.violet { background: linear-gradient(135deg, #8b5cf6, #7c3aed); }
.stat-icon.orange { background: linear-gradient(135deg, #f59e0b, #d97706); }
.stat-value { font-size: 24px; font-weight: 800; color: var(--text); line-height: 1; }
.stat-label { font-size: 13px; color: var(--text-sub); margin-top: 4px; }

.panel { background: var(--panel); border-radius: 12px; border: 1px solid rgba(148,163,184,0.14); padding: 20px; }
.toolbar { display: flex; gap: 10px; margin-bottom: 16px; }
.table-wrap { border-radius: 8px; overflow: hidden; }
.table-actions { display: flex; flex-wrap: wrap; gap: 4px; }
.pager { margin-top: 16px; display: flex; justify-content: flex-end; }
</style>
