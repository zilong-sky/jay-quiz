<template>
  <section>
    <h2 class="title-brush">🏆 本周名人榜</h2>
    <p class="subtle">数据来自后端，每周一 00:00 自动重置。同分则用时更短者优先。</p>

    <div class="card">
      <div v-if="ranking.loading.value">加载中...</div>
      <div v-else-if="!ranking.list.value.length" class="subtle">本周还没人上榜，快去答题冲榜 🎤</div>
      <div v-else>
        <div v-for="row in ranking.list.value" :key="row.userId" class="rank-row">
          <div class="rk" :class="rankClass(row.rank)">#{{ row.rank }}</div>
          <div>
            <div><b>{{ row.nickname }}</b> <span class="badge" style="margin-left:.35rem">{{ row.level }}</span></div>
            <div class="subtle">场次 {{ row.attempts }} · 用时 {{ (row.costMs/1000).toFixed(1) }}s · {{ formatTime(row.submittedAt) }}</div>
          </div>
          <div style="text-align:right"><b style="color:#8b1e2b;font-size:1.15rem">{{ row.weeklyBest }}</b></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
const auth = useAuth()
const router = useRouter()
const ranking = useRanking()

onMounted(async () => {
  await auth.fetchMe()
  if (!auth.isLoggedIn.value) {
    router.replace('/login?redirect=/ranking')
    return
  }
  await ranking.fetchRankings()
})

function rankClass(rank: number) {
  return rank === 1 ? 'top1' : rank === 2 ? 'top2' : rank === 3 ? 'top3' : ''
}
function formatTime(t: number) {
  const d = new Date(t)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${m}-${dd} ${hh}:${mm}`
}
</script>
