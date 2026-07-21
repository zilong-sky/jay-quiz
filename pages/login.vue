<template>
  <section>
    <h2 class="title-brush">🔐 登录</h2>
    <div class="card">
      <input v-model="account" class="input" placeholder="账号（≥3 位）" />
      <input v-model="password" class="input" type="password" placeholder="密码（≥6 位）" />
      <button class="btn block" :disabled="loading" @click="onSubmit">{{ loading ? '登录中...' : '登录' }}</button>
      <p v-if="err" class="subtle" style="color:#8b1e2b">{{ err }}</p>
      <p class="subtle" style="margin-top:.5rem">还没有账号？<NuxtLink to="/register">去注册</NuxtLink></p>
    </div>
  </section>
</template>

<script setup lang="ts">
import { getWeekKey } from '~/utils/week'

const auth = useAuth()
const route = useRoute()
const router = useRouter()
const account = ref('')
const password = ref('')
const loading = ref(false)
const err = ref('')

async function onSubmit() {
  err.value = ''
  loading.value = true
  const res = await auth.login(account.value.trim(), password.value)
  loading.value = false
  if (res.code !== 0) { err.value = res.message; return }

  // 登录成功后，若带 uploadBest 参数则自动上传本周本地最高分
  if (route.query.uploadBest === '1') {
    const currentWeek = getWeekKey()
    const localBest = useStorage().get<{ score: number; costMs: number; week: string }>('localBestScore')
    // 只上传本周的成绩，跨周历史成绩不参与本周排名
    if (localBest && localBest.week === currentWeek) {
      await useRequest('/api/rankings/submit', {
        method: 'POST',
        body: { score: localBest.score, costMs: localBest.costMs }
      })
    }
  }

  const redirect = (route.query.redirect as string) || '/'
  router.replace(redirect)
}
</script>
