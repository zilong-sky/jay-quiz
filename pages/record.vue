<template>
  <section>
    <h2 class="title-brush">📓 冒险战绩</h2>
    <p class="subtle">仅记录冒险模式成绩，保留积分和用时。</p>

    <div class="card">
      <div class="rank-row" style="grid-template-columns:1fr 1fr 1fr">
        <div><div class="subtle">最高分</div><b style="font-size:1.3rem;color:#8b1e2b">{{ stats.highest }}</b></div>
        <div><div class="subtle">总场次</div><b>{{ stats.totalSessions }}</b></div>
        <div><div class="subtle">正确率</div><b>{{ stats.accuracy }}%</b></div>
      </div>
      <div class="subtle" style="margin-top:.5rem">累计答题 {{ stats.totalAnswered }} 题，答对 {{ stats.totalCorrect }} 题。</div>
    </div>

    <h3 class="title-brush" style="font-size:1.2rem">历史记录</h3>
    <div v-if="!sessions.length" class="card subtle">还没有冒险战绩，去 <NuxtLink to="/adventure">开始挑战</NuxtLink> 吧。</div>
    <div v-for="s in sessions" :key="s.id" class="card" style="margin-bottom:.5rem">
      <div style="display:flex;justify-content:space-between;align-items:center">
        <b>{{ new Date(s.finishedAt).toLocaleString() }}</b>
        <span class="badge">{{ s.level }}</span>
      </div>
      <div class="subtle" style="margin-top:.25rem">
        得分 <b style="color:#8b1e2b">{{ s.totalScore }}</b> · 用时 {{ (s.totalCostMs/1000).toFixed(1) }}s · 答对 {{ s.records.filter(r=>r.correct).length }}/{{ s.records.length }}
      </div>
    </div>

    <div v-if="sessions.length" style="margin-top:1rem;text-align:center">
      <button class="btn ghost" @click="onClear">清除本地战绩</button>
    </div>
  </section>
</template>

<script setup lang="ts">
const record = useMyRecord()
const sessions = ref<any[]>([])
const stats = ref<any>({ highest: 0, totalSessions: 0, totalAnswered: 0, totalCorrect: 0, accuracy: 0 })

function refresh() {
  sessions.value = record.all()
  stats.value = record.stats()
}
onMounted(refresh)

function onClear() {
  if (!confirm('确定清除本地所有战绩？此操作不可恢复。')) return
  record.clearAll()
  refresh()
}
</script>
