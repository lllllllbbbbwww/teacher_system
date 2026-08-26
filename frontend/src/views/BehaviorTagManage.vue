<template>
  <div class="page">
    <h3 v-if="!embedded" class="page-title">行为标签库</h3>
    <div class="panel">
      <div class="toolbar">
        <el-button type="primary" :icon="Plus" @click="openDialog()">新增自定义标签</el-button>
        <el-radio-group v-model="filter" size="small">
          <el-radio-button value="all">全部</el-radio-button>
          <el-radio-button value="positive">正向</el-radio-button>
          <el-radio-button value="improve">待改进</el-radio-button>
        </el-radio-group>
      </div>
      <div class="table-wrap">
        <el-table :data="filtered" border stripe>
          <el-table-column prop="tag_name" label="标签名" width="140" />
          <el-table-column label="类型" width="100">
            <template #default="{ row }">
              <span :class="row.tag_type === 'positive' ? 'tag-pos' : 'tag-imp'">
                {{ row.tag_type === 'positive' ? '正向' : '待改进' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column label="来源" width="100">
            <template #default="{ row }">{{ row.is_system ? '系统' : '自定义' }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <div class="table-actions">
                <el-popconfirm v-if="!row.is_system" title="确认删除？" @confirm="onDelete(row)">
                  <template #reference><el-button link type="danger" :icon="Delete">删除</el-button></template>
                </el-popconfirm>
                <span v-else class="text-sub">不可操作</span>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <el-dialog v-model="visible" title="新增自定义标签" width="420px">
      <el-form :model="form" :rules="rules" ref="formRef" label-width="80px">
        <el-form-item label="标签名" prop="tag_name"><el-input v-model="form.tag_name" maxlength="20" /></el-form-item>
        <el-form-item label="类型" prop="tag_type">
          <el-radio-group v-model="form.tag_type">
            <el-radio value="positive">正向</el-radio><el-radio value="improve">待改进</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="visible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="onSubmit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { Plus, Delete } from '@element-plus/icons-vue';
import { useCommonStore } from '../stores/common';
import request from '../utils/request';
import { ElMessage } from 'element-plus';

defineProps({ embedded: Boolean });

const commonStore = useCommonStore();
const filter = ref('all');
const visible = ref(false);
const loading = ref(false);
const formRef = ref();
const form = reactive({ tag_name: '', tag_type: 'positive' });
const rules = {
  tag_name: [{ required: true, message: '请输入标签名', trigger: 'blur' }],
  tag_type: [{ required: true, message: '请选择类型', trigger: 'change' }],
};
const filtered = computed(() =>
  filter.value === 'all' ? commonStore.behaviorTags : commonStore.behaviorTags.filter((t) => t.tag_type === filter.value)
);

onMounted(() => commonStore.fetchBehaviorTags());

function openDialog() { form.tag_name = ''; form.tag_type = 'positive'; visible.value = true; }
async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    await request.post('/behaviors/tags', form);
    ElMessage.success('保存成功');
    visible.value = false;
    await commonStore.fetchBehaviorTags();
  } finally {
    loading.value = false;
  }
}
async function onDelete(row) {
  await request.delete(`/behaviors/tags/${row.id}`);
  ElMessage.success('删除成功');
  await commonStore.fetchBehaviorTags();
}
</script>
