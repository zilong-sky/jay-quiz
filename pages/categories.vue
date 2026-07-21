<template>
  <section>
    <h2 class="title-brush">🎼 题库分类</h2>
    <p class="subtle">按类别刷题，或直接混合出题（默认按 5:3:2 比例）。</p>

    <NuxtLink to="/quiz" class="card" style="display:block;margin-bottom:.5rem;text-decoration:none;color:inherit">
      <b>🎲 混合出题</b>
      <div class="subtle">歌词 50% · 创作 30% · 经历 20%</div>
    </NuxtLink>

    <NuxtLink
      v-for="c in categories.list.value" :key="c.key"
      :to="`/quiz?cat=${c.key}`"
      class="card"
      style="display:block;margin-bottom:.5rem;text-decoration:none;color:inherit"
    >
      <b>{{ c.label }}</b>
      <span class="badge" style="margin-left:.4rem">占比 {{ Math.round(c.weight*100) }}%</span>
      <div class="subtle">{{ c.desc }}</div>
    </NuxtLink>

    <button class="btn ghost" @click="rulesShow=true" style="margin-top:.75rem">查看规则说明</button>
    <RulesModal :show="rulesShow" @close="rulesShow=false" />
  </section>
</template>

<script setup lang="ts">
const categories = useCategories()
const rulesShow = ref(false)
onMounted(() => categories.fetchCategories())
</script>
