<template>
  <section>
    <h2 class="title-brush">🔐 登录</h2>
    <div class="card">
      <!-- 微信小程序环境：一键登录 -->
      <template v-if="auth.isWechatMiniProgram">
        <p class="subtle" style="text-align:center;margin-bottom:1rem">微信一键登录，无需账号密码</p>
        <button class="btn block" :disabled="loading" @click="onWechatLogin">
          {{ loading ? '登录中...' : '微信一键登录' }}
        </button>
        <p v-if="err" class="subtle" style="color:#8b1e2b;margin-top:.5rem">{{ err }}</p>
      </template>
      
      <!-- Web 环境：账号密码登录 -->
      <template v-else>
        <input v-model="account" class="input" placeholder="账号（≥3 位）" />
        <input v-model="password" class="input" type="password" placeholder="密码（≥6 位）" />
        <button class="btn block" :disabled="loading" @click="onSubmit">{{ loading ? '登录中...' : '登录' }}</button>
        <p v-if="err" class="subtle" style="color:#8b1e2b">{{ err }}</p>
        <p class="subtle" style="margin-top:.5rem">还没有账号？<NuxtLink to="/register">去注册</NuxtLink></p>
      </template>
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
    await uploadLocalBest()
  }

  const redirect = (route.query.redirect as string) || '/'
  router.replace(redirect)
}

// 微信小程序登录处理
async function onWechatLogin() {
  err.value = ''
  loading.value = true
  const res = await auth.wechatLogin()
  loading.value = false
  if (res.code !== 0) { err.value = res.message; return }

  // 登录成功后，若带 uploadBest 参数则自动上传本周本地最高分
  if (route.query.uploadBest === '1') {
    await uploadLocalBest()
  }

  const redirect = (route.query.redirect as string) || '/'
  router.replace(redirect)
}

// 上传本地最高分（Web/小程序通用）
async function uploadLocalBest() {
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
</script>
