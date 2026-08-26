<template>
  <div class="login-wrap">
    <div class="login-card">
      <h2>教师注册</h2>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="0">
        <el-form-item prop="username">
          <el-input v-model="form.username" placeholder="用户名(3-50位)" :prefix-icon="User" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="密码(至少8位,含字母和数字)" :prefix-icon="Lock" size="large" />
        </el-form-item>
        <el-form-item prop="confirmPassword">
          <el-input v-model="form.confirmPassword" type="password" show-password placeholder="确认密码" :prefix-icon="Lock" size="large" @keyup.enter="onSubmit" />
        </el-form-item>
        <el-button type="primary" size="large" style="width:100%" :loading="loading" @click="onSubmit">注册</el-button>
      </el-form>
      <div style="margin-top:12px;text-align:center">
        <el-link type="primary" @click="goLogin">已有账号？登录</el-link>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';
import { ElMessage } from 'element-plus';

const router = useRouter();
const auth = useAuthStore();
const formRef = ref();
const loading = ref(false);
const form = reactive({ username: '', password: '', confirmPassword: '' });
const rules = {
  username: [{ required: true, min: 3, max: 50, message: '用户名3-50位', trigger: 'blur' }],
  password: [{ required: true, pattern: /^(?=.*[A-Za-z])(?=.*\d).{8,}$/, message: '至少8位,含字母和数字', trigger: 'blur' }],
  confirmPassword: [{ required: true, validator: (r, v, cb) => v === form.password ? cb() : cb(new Error('两次密码不一致')), trigger: 'blur' }],
};

async function onSubmit() {
  await formRef.value.validate();
  loading.value = true;
  try {
    await auth.register(form);
    ElMessage.success('注册成功，请登录');
    router.replace('/landing?login=1');
  } finally {
    loading.value = false;
  }
}
function goLogin() {
  router.push('/landing?login=1');
}
</script>
