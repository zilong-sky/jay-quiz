<template>
  <section>
    <h2 class="title-brush">🎧 哥哥的世界，等你来答</h2>
    <p class="subtle">歌词 · 创作背景 · 个人经历 —— 一次答题，10 题满分 100 分。</p>

    <div class="grid">
      <NuxtLink to="/quiz" class="tile accent">
        <div class="icon">▶︎</div><div class="name">开始答题</div>
      </NuxtLink>
      <a href="javascript:;" class="tile" @click="goRanking">
        <div class="icon">🏆</div><div class="name">周榜排行榜</div>
      </a>
      <NuxtLink to="/categories" class="tile">
        <div class="icon">🎼</div><div class="name">题库分类</div>
      </NuxtLink>
      <NuxtLink to="/record" class="tile">
        <div class="icon">📓</div><div class="name">我的战绩</div>
      </NuxtLink>
      <a href="javascript:;" class="tile" style="grid-column:span 2" @click="rulesShow=true">
        <div class="icon">📖</div><div class="name">规则说明</div>
      </a>

      <!-- 预留：拼图（app.config.ts -> features.enablePuzzle 开启） -->
      <NuxtLink v-if="features.enablePuzzle" to="/puzzle" class="tile">
        <div class="icon">🧩</div><div class="name">拼图挑战</div>
      </NuxtLink>
      <!-- 预留：听歌识曲（app.config.ts -> features.enableMusicRecognition 开启） -->
      <NuxtLink v-if="features.enableMusicRecognition" to="/music" class="tile">
        <div class="icon">🎵</div><div class="name">听歌识曲</div>
      </NuxtLink>
    </div>

    <RulesModal :show="rulesShow" @close="rulesShow=false" />
  </section>
</template>

<script setup lang="ts">
const rulesShow = ref(false)
const auth = useAuth()
const router = useRouter()
const cfg = useAppConfig()
const features = cfg.features

function goRanking() {
  if (!auth.isLoggedIn.value) {
    router.push('/login?redirect=/ranking')
    return
  }
  router.push('/ranking')
}
</script>
