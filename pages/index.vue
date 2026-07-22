<template>
  <section>
    <!-- 粉丝等级大徽章 -->
    <div class="level-badge" :class="{ locked: !auth.isLoggedIn.value || levelDetail.total < 50 }" 
         @click="!auth.isLoggedIn.value ? goLogin() : (levelDetail.total < 50 && (showModeSelect = true))">
      <div class="level-icon">{{ auth.isLoggedIn.value && levelDetail.total >= 50 ? '🎖️' : '🔒' }}</div>
      <div class="level-text">
        {{ !auth.isLoggedIn.value ? '登录解锁等级' : (levelDetail.total >= 50 ? levelDetail.level : '等级待解锁') }}
      </div>
      <div class="level-label" v-if="auth.isLoggedIn.value && levelDetail.total >= 50">
        最近 {{ levelDetail.total }} 题 · 正确率 {{ levelDetail.accuracy }}%
      </div>
      <div class="level-label" v-else-if="auth.isLoggedIn.value">
        再答 {{ 50 - levelDetail.total }} 题即可揭晓你的粉丝身份
        <div class="unlock-hint">👆 点击开始答题</div>
      </div>
      <div class="level-label" v-else>
        登录后计算粉丝等级，查看你的排名
        <div class="unlock-hint">👆 点击去登录</div>
      </div>
    </div>

    <h2 class="title-brush" style="margin-top:1.5rem">🎧 哥哥的世界，等你来答</h2>
    <p class="subtle">歌词 · 创作背景 · 个人经历 —— 答题赢积分，冲榜名人堂！</p>

    <div class="grid">
      <div class="tile accent" @click="showModeSelect = true">
        <div class="icon">🎮</div><div class="name">休闲模式</div>
      </div>
      <NuxtLink to="/adventure" class="tile">
        <div class="icon">⚔️</div><div class="name">冒险模式</div>
      </NuxtLink>
      <a href="javascript:;" class="tile" @click="goRanking">
        <div class="icon">🏆</div><div class="name">本周名人榜</div>
      </a>
      <NuxtLink to="/record" class="tile">
        <div class="icon">📓</div><div class="name">我的战绩</div>
      </NuxtLink>
      <a href="javascript:;" class="tile" style="grid-column:span 2" @click="rulesShow=true">
        <div class="icon">📖</div><div class="name">规则说明</div>
      </a>
    </div>

    <!-- 选择题库类型弹窗 -->
    <div v-if="showModeSelect" class="modal-overlay" @click.self="showModeSelect = false">
      <div class="card modal-card">
        <h3 style="margin-top:0">📚 选择题库类型</h3>
        <div class="mode-list">
          <button class="btn block" @click="startQuiz('')">🎲 混合随机（推荐）</button>
          <button class="btn block" @click="startQuiz('lyrics')">🎵 歌词填空</button>
          <button class="btn block" @click="startQuiz('creation')">🎬 创作背景</button>
          <button class="btn block" @click="startQuiz('life')">🌟 个人经历</button>
          <button class="btn ghost block" style="margin-top:.5rem" @click="showModeSelect = false">取消</button>
        </div>
      </div>
    </div>

    <RulesModal :show="rulesShow" @close="rulesShow=false" />
  </section>
</template>

<script setup lang="ts">
import type { FanLevel } from '~/types'
import { getLevelDetail } from '~/utils/level'

const rulesShow = ref(false)
const showModeSelect = ref(false)
const auth = useAuth()
const router = useRouter()
const record = useMyRecord()

// 获取本周本地最高分计算粉丝等级（加权算法）
const levelDetail = ref({ level: '路人粉' as FanLevel, correct: 0, total: 0, accuracy: 0 })
onMounted(() => {
  // 只有登录了才显示等级详情
  if (auth.isLoggedIn.value) {
    const allRecords = record.all().flatMap(s => s.records)
    levelDetail.value = getLevelDetail(allRecords)
  }
})

function goRanking() {
  if (!auth.isLoggedIn.value) {
    router.push('/login?redirect=/ranking')
    return
  }
  router.push('/ranking')
}

function goLogin() {
  router.push('/login?redirect=/')
}

function startQuiz(category: string) {
  showModeSelect.value = false
  router.push(category ? `/quiz?cat=${category}` : '/quiz')
}
</script>

<style scoped>
.level-badge {
  text-align: center;
  padding: 2rem 1rem;
  background: linear-gradient(135deg, #8b1e2b 0%, #c93346 50%, #8b1e2b 100%);
  border-radius: 16px;
  color: #fff;
  box-shadow: 0 8px 32px rgba(139, 30, 43, 0.3);
  cursor: default;
  transition: all 0.3s;
}
.level-badge.locked {
  background: linear-gradient(135deg, #666 0%, #888 50%, #666 100%);
  cursor: pointer;
  opacity: 0.85;
}
.level-badge.locked:hover {
  opacity: 1;
  transform: translateY(-2px);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.3);
}
.level-icon {
  font-size: 4rem;
  line-height: 1;
  margin-bottom: 0.5rem;
}
.level-text {
  font-size: 3rem;
  font-weight: 800;
  line-height: 1.2;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
}
.level-label {
  font-size: 1rem;
  opacity: 0.85;
  margin-top: 0.5rem;
}
.unlock-hint {
  font-size: 0.9rem;
  margin-top: 0.75rem;
  opacity: 0.9;
  animation: pulse 2s infinite;
}
@keyframes pulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.mode-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  padding: 1rem;
}
.modal-card {
  width: 100%;
  max-width: 400px;
}
</style>
