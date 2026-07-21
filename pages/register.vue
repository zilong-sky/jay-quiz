<template>
  <section>
    <h2 class="title-brush">📝 注册</h2>
    <div class="card">
      <input v-model="account" class="input" placeholder="账号（≥3 位）" />
      <input v-model="nickname" class="input" placeholder="昵称（榜单显示用）" />
      <input v-model="password" class="input" type="password" placeholder="密码（≥6 位）" />
      <button class="btn block" :disabled="loading" @click="onSubmit">{{ loading ? '提交中...' : '注册并登录' }}</button>
      <p v-if="err" class="subtle" style="color:#8b1e2b">{{ err }}</p>
      <p class="subtle" style="margin-top:.5rem">已有账号？<NuxtLink to="/login">去登录</NuxtLink></p>
    </div>
  </section>
</template>

<script setup lang="ts">
const auth = useAuth()
const router = useRouter()
const account = ref('')
const nickname = ref('')
const password = ref('')
const loading = ref(false)
const err = ref('')

async function onSubmit() {
  err.value = ''
  if (!account.value || !nickname.value || !password.value) { err.value = '请完整填写信息'; return }
  loading.value = true
  const res = await auth.register(account.value.trim(), password.value, nickname.value.trim())
  loading.value = false
  if (res.code !== 0) { err.value = res.message; return }
  router.replace('/')
}
</script>
