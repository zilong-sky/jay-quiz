<!-- 预留：拼图功能页面骨架
     开启方式：修改 app.config.ts -> features.enablePuzzle = true 后，首页自动出现入口 -->
<template>
  <section>
    <h2 class="title-brush">🧩 拼图挑战（预留）</h2>
    <div class="card">
      <p class="subtle">此功能尚未开放。开启：修改 <code>app.config.ts</code> 中 <b>enablePuzzle: true</b>。</p>
      <div v-if="images.length" class="grid" style="margin-top:.5rem">
        <div v-for="img in images" :key="img.id" class="tile">
          <img :src="img.url" alt="" style="width:100%;border-radius:.5rem" />
          <div class="name">{{ img.title }}（{{ img.pieces }} 片）</div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { PuzzleImage } from '~/types'
import { useRequest } from '~/utils/request'
const cfg = useAppConfig()
const router = useRouter()
if (!cfg.features.enablePuzzle) router.replace('/')

const images = ref<PuzzleImage[]>([])
onMounted(async () => {
  const res = await useRequest<PuzzleImage[]>('/api/puzzle/images', { auth: false })
  if (res.code === 0 && res.data) images.value = res.data
})
</script>
