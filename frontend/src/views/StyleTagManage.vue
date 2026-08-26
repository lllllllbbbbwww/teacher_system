<template>
  <div class="page">
    <h3 v-if="!embedded" class="page-title">反馈风格管理</h3>
    <div class="panel">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增自定义风格</el-button>
      </div>
      <div class="table-wrap">
        <el-table :data="commonStore.styleTags" border stripe>
          <el-table-column prop="tag_name" label="风格名" width="140" />
          <el-table-column prop="style_instruction" label="风格指令" show-overflow-tooltip />
          <el-table-column label="来源" width="100">
            <template #default="{ row }">{{ row.is_system ? '系统' : '自定义' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="160">
            <template #default="{ row }">
              <div class="table-actions">
                <template v-if="!row.is_system">
                  <el-button link type="primary" :icon="Edit" @click="openDialog(row)">编辑</el-button>
                  <el-popconfirm title="确认删除？" @confirm="onDelete(row)">
                    <template #reference><el-button link type="danger" :icon="Delete">删除</el-button></template>
                  </el-popconfirm>
                </template>
                <span v-else class="text-sub">不可操作</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="visible" :title="editing ? '编辑风格' : '新增风格'" width="460px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="风格名" prop="tag_name"><el-input v-model="form.tag_name" maxlength="20" /></el-form-item>
        <el-form-item label="风格指令" prop="style_instruction"><el-input v-model="form.style_instruction" type="textarea" :rows="4" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { Plus, Edit, Delete } from '@element-plus/icons-vue';
import { useCommonStore } from '../stores/common';
import request from '../utils/request';
import { ElMessage } from 'element-plus';

defineProps({ embedded: Boolean });

const commonStore = useCommonStore();
const visible = ref(false);
const editing = ref(null);
const loading = ref(false);
const formRef = ref();
const form = reactive({ tag_name: '', style_instruction: '' });
const rules = {
  tag_name: [{ required: true, message: '请输入风格名', trigger: 'blur' }],
  style_instruction: [{ required: true, message: '请输入风格指令', trigger: 'blur' }],
};

onMounted(() => commonStore.fetchStyleTags());

function openDialog(row) {
  editing.value = row || null;
  form.tag_name = row?.tag_name || '';
  form.style_instruction = row?.style_instruction || '';
  visible.value = true;
}
async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    if (editing.value) await request.put(`/style-tags/${editing.value.id}`, form);
    else await request.post('/style-tags', form);
    ElMessage.success('保存成功');
    visible.value = false;
    await commonStore.fetchStyleTags();
  } finally {
    loading.value = false;
  }
}
async function onDelete(row) {
  await request.delete(`/style-tags/${row.id}`);
  ElMessage.success('删除成功');
  await commonStore.fetchStyleTags();
}
</script>
