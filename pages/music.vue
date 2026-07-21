<!-- 预留：听歌识曲页面骨架
     开启方式：修改 app.config.ts -> features.enableMusicRecognition = true 后入口出现 -->
<template>
  <section>
    <h2 class="title-brush">🎵 听歌识曲（预留）</h2>
    <div class="card">
      <p class="subtle">此功能尚未开放。开启：修改 <code>app.config.ts</code> 中 <b>enableMusicRecognition: true</b>。</p>
      <div v-for="c in clips" :key="c.id" class="card" style="margin-top:.5rem">
        <div><b>片段 {{ c.id }}</b> · 时长 {{ c.duration }}s · 提示：{{ c.hint }}</div>
        <audio :src="c.url" controls style="width:100%;margin-top:.5rem"></audio>
        <div style="display:flex;gap:.5rem;margin-top:.5rem">
          <input v-model="guesses[c.id]" class="input" placeholder="猜猜是哪首歌？" style="margin-bottom:0" />
          <button class="btn" @click="verify(c.id)">校验</button>
        </div>
        <p v-if="results[c.id]" class="subtle">{{ results[c.id] }}</p>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { MusicClip } from '~/types'
import { useRequest } from '~/utils/request'
const cfg = useAppConfig()
const router = useRouter()
if (!cfg.features.enableMusicRecognition) router.replace('/')

const clips = ref<Omit<MusicClip,'answer'>[]>([])
const guesses = reactive<Record<string, string>>({})
const results = reactive<Record<string, string>>({})
onMounted(async () => {
  const res = await useRequest<Omit<MusicClip,'answer'>[]>('/api/music/clips', { auth: false })
  if (res.code === 0 && res.data) clips.value = res.data
})
async function verify(clipId: string) {
  const res = await useRequest<{ correct: boolean; answer?: string }>('/api/music/verify', {
    method: 'POST', body: { clipId, guess: guesses[clipId] || '' }, auth: false
  })
  if (res.code === 0 && res.data) {
    results[clipId] = res.data.correct ? `✅ 猜对了：${res.data.answer}` : '❌ 再想想...'
  }
}
</script>
