<template>
  <div class="admin-login">
    <el-card class="login-card">
      <h2>🔐 管理后台登录</h2>
      <el-form ref="formRef" :model="form" label-width="80px">
        <el-form-item label="密码">
          <el-input v-model="form.password" type="password" show-password @keyup.enter="onLogin" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="onLogin" :loading="loading">登录</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const form = ref({ password: '' })
const loading = ref(false)

async function onLogin() {
  if (!form.value.password) {
    ElMessage.warning('请输入密码')
    return
  }
  
  loading.value = true
  try {
    const res = await $fetch('/api/admin/auth/login', {
      method: 'POST',
      body: { password: form.value.password }
    })
    
    if (res.code === 0) {
      ElMessage.success('登录成功')
      router.push('/admin/questions')
    } else {
      ElMessage.error(res.message || '登录失败')
    }
  } catch (e: any) {
    ElMessage.error(e.message || '登录失败')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.admin-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
}

.login-card {
  width: 400px;
  max-width: 90%;
}

h2 {
  text-align: center;
  margin: 0 0 1.5rem;
  color: #303133;
}
</style>
