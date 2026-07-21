<template>
  <div class="nav">
    <NuxtLink to="/" class="brand">Jay · 粉丝答题</NuxtLink>
    <div class="user">
      <template v-if="auth.isLoggedIn.value">
        <span style="margin-right:.5rem">Hi, {{ auth.state.value.user?.nickname }}</span>
        <button class="btn ghost" style="background:transparent;color:#f4e9d0;border-color:#f4e9d0" @click="onLogout">退出</button>
      </template>
      <template v-else>
        <NuxtLink to="/login" class="btn" style="background:transparent;color:#f4e9d0;border:1px solid #f4e9d0;padding:.3rem .8rem">登录</NuxtLink>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const auth = useAuth()
const router = useRouter()
onMounted(() => { auth.fetchMe() })

async function onLogout() {
  await auth.logout()
  router.push('/')
}
</script>
