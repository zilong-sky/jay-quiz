<template>
  <section>
    <!-- 挑战确认弹窗 -->
    <div v-if="showConfirm" class="modal-overlay">
      <div class="card modal-card">
        <h3 style="margin-top:0">⚔️ 冒险模式确认</h3>
        <p style="color:#8b1e2b;margin-bottom:1rem">
          检测到你当前粉丝等级为 <b>{{ levelDetail.level }}</b>
        </p>
        <p style="margin-bottom:.5rem">
          冒险模式规则：
        </p>
        <ul style="text-align:left;margin-bottom:1.5rem;color:#606266">
          <li>共 100 道题，限时 10 分钟</li>
          <li>中途退出视为放弃挑战</li>
          <li>成绩直接计入周榜排名</li>
          <li>只有资深粉以上才能从容应对哦～</li>
        </ul>
        <div style="display:flex;gap:.5rem">
          <button class="btn" @click="startAdventure">确认挑战</button>
          <button class="btn ghost" @click="goBack">返回首页</button>
        </div>
      </div>
    </div>

    <!-- 加载中 -->
    <div v-if="loading" class="card">冒险题库准备中...</div>
    <div v-else-if="loadError" class="card" style="color:#b33">
      {{ loadError }}
      <button class="btn" @click="goBack" style="margin-top:1rem">返回</button>
    </div>

    <!-- 答题中 -->
    <div v-else-if="!finished && current" class="card">
      <div class="subtle">
        第 {{ currentIndex + 1 }} / {{ questions.length }} 题
        <span style="float:right;color:#8b1e2b;font-weight:500">⏱ {{ formatTime(remainingTime) }}</span>
        <span v-if="current.puzzleImage" style="float:right;margin-right:.5rem;color:#8b1e2b">🧩 拼图题</span>
      </div>
      <div class="progress"><span :style="{width: progress + '%'}" /></div>

      <!-- 拼图游戏组件 -->
      <PuzzleGame
        v-if="current.puzzleImage && !puzzleCompleted"
        ref="puzzleRef"
        :image-url="current.puzzleImage"
        @complete="onPuzzleComplete"
      />

      <!-- 题目内容 -->
      <div class="question" :class="{ blurred: current.puzzleImage && !puzzleCompleted }">
        {{ current.content }}
      </div>

      <!-- 拼图未完成提示 -->
      <div v-if="current.puzzleImage && !puzzleCompleted" class="puzzle-mask">
        🧩 完成拼图才能解锁题目和选项
      </div>

      <!-- 单选/判断 -->
      <div v-if="current.type !== 'blank'" class="options" :class="{ disabled: current.puzzleImage && !puzzleCompleted }">
        <button
          v-for="(opt, i) in current.options"
          :key="i"
          class="opt"
          :class="optClass(opt)"
          :disabled="answered || (current.puzzleImage && !puzzleCompleted)"
          @click="chooseOption(opt)"
        >{{ opt }}</button>
      </div>
      <!-- 填空 -->
      <div v-else :class="{ disabled: current.puzzleImage && !puzzleCompleted }">
        <input
          v-model="blankInput"
          class="input"
          placeholder="请输入答案..."
          :disabled="answered || (current.puzzleImage && !puzzleCompleted)"
        />
        <button
          v-if="!answered"
          class="btn"
          @click="submitBlank"
          :disabled="current.puzzleImage && !puzzleCompleted"
        >提交</button>
      </div>

      <!-- 解析 -->
      <div v-if="answered" class="card" style="margin-top:1rem;border-color:rgba(200,162,83,0.35)">
        <b>{{ lastCorrect ? '✅ 答对了！' : '❌ 答错了' }}</b>
        <div class="subtle" style="margin-top:.3rem">正确答案：{{ current.answer }}</div>
        <div style="margin-top:.5rem">{{ current.explanation }}</div>
        <div style="text-align:right;margin-top:.75rem">
          <button class="btn" @click="nextQuestion">
            {{ currentIndex === questions.length - 1 ? '查看结果' : '下一题' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 结算 -->
    <div v-else-if="finished && session" class="card">
      <h3 style="margin-top:0;color:#0f3d2e">🎉 冒险模式挑战完成！</h3>
      <p>总分：<b style="font-size:1.5rem;color:#8b1e2b">{{ session.totalScore }}</b> / 100</p>
      <p>用时：{{ formatTime(600 - remainingTime) }}</p>
      <p>正确题数：{{ correctCount }} / {{ questions.length }}</p>

      <p v-if="uploadStatus" class="subtle">{{ uploadStatus }}</p>

      <div style="display:flex;gap:.5rem;margin-top:1rem">
        <button class="btn" @click="restart">再来一局</button>
        <NuxtLink to="/ranking" class="btn ghost">看看排行榜</NuxtLink>
        <NuxtLink to="/" class="btn ghost">返回首页</NuxtLink>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import PuzzleGame from '~/components/PuzzleGame.vue'
import type { Question, QuestionType } from '~/types'
import { getLevelDetail } from '~/utils/level'

const auth = useAuth()
const record = useMyRecord()
const router = useRouter()
const storage = useStorage()

// 等级判断
const levelDetail = ref({ level: '路人粉' as any, correct: 0, total: 0, accuracy: 0 })
const showConfirm = ref(true)

// 答题状态
const loading = ref(false)
const loadError = ref('')
const questions = ref<Question[]>([])
const currentIndex = ref(0)
const answered = ref(false)
const lastCorrect = ref(false)
const blankInput = ref('')
const selectedOpt = ref<string | null>(null)
const finished = ref(false)
const session = ref<any>(null)
const uploadStatus = ref('')

// 拼图
const puzzleRef = ref()
const puzzleCompleted = ref(false)

// 10分钟全局倒计时
const remainingTime = ref(600)
let timerId: any = null

const current = computed(() => questions.value[currentIndex.value] || null)
const progress = computed(() =>
  questions.value.length
    ? Math.round(((currentIndex.value + (answered.value ? 1 : 0)) / questions.value.length) * 100)
    : 0
)
const correctCount = computed(() =>
  session.value ? session.value.records.filter((r: any) => r.correct).length : 0
)

function formatTime(seconds: number) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}分${s.toString().padStart(2, '0')}秒`
}

// 拼图完成
function onPuzzleComplete() {
  puzzleCompleted.value = true
}

function optClass(opt: string) {
  if (!answered.value) return selectedOpt.value === opt ? 'selected' : ''
  const ans = current.value?.answer
  if (!ans) return ''
  const isChosen = selectedOpt.value === opt
  const isRight = current.value?.type === 'single'
    ? opt.trim().startsWith(ans + '.')
    : opt.trim() === ans.trim()
  if (isRight) return 'correct'
  if (isChosen && !isRight) return 'wrong'
  return ''
}

function chooseOption(opt: string) {
  // 拼图题需要先完成拼图
  if (current.value?.puzzleImage && !puzzleCompleted.value) {
    const toast = document.createElement('div')
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:1rem 1.5rem;border-radius:8px;z-index:9999;font-size:14px'
    toast.textContent = '🧩 请先完成拼图再答题！'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2000)
    return
  }

  if (answered.value) return
  selectedOpt.value = opt
  const q = current.value
  if (!q) return
  const t: QuestionType = q.type
  const userAnswer = t === 'single' ? opt.trim().charAt(0) : opt.trim()
  
  // 简单判断对错
  const correct = t === 'single'
    ? opt.trim().startsWith(q.answer + '.')
    : opt.trim() === q.answer.trim()
  
  // 保存答题记录
  if (!session.value) {
    session.value = {
      startTime: Date.now(),
      totalScore: 0,
      totalCostMs: 0,
      records: []
    }
  }
  
  session.value.records.push({
    questionId: q.id,
    category: q.category,
    type: q.type,
    correct,
    costMs: 0
  })
  
  session.value.totalScore = Math.round(
    (session.value.records.filter((r: any) => r.correct).length / questions.value.length) * 100
  )
  
  lastCorrect.value = correct
  answered.value = true
}

function submitBlank() {
  // 拼图题需要先完成拼图
  if (current.value?.puzzleImage && !puzzleCompleted.value) {
    const toast = document.createElement('div')
    toast.style.cssText = 'position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.8);color:#fff;padding:1rem 1.5rem;border-radius:8px;z-index:9999;font-size:14px'
    toast.textContent = '🧩 请先完成拼图再答题！'
    document.body.appendChild(toast)
    setTimeout(() => toast.remove(), 2000)
    return
  }

  const q = current.value
  if (!q) return
  
  const correct = blankInput.value.trim() === q.answer.trim()
  
  if (!session.value) {
    session.value = {
      startTime: Date.now(),
      totalScore: 0,
      totalCostMs: 0,
      records: []
    }
  }
  
  session.value.records.push({
    questionId: q.id,
    category: q.category,
    type: q.type,
    correct,
    costMs: 0
  })
  
  session.value.totalScore = Math.round(
    (session.value.records.filter((r: any) => r.correct).length / questions.value.length) * 100
  )
  
  lastCorrect.value = correct
  answered.value = true
}

async function nextQuestion() {
  answered.value = false
  selectedOpt.value = null
  blankInput.value = ''
  puzzleCompleted.value = false
  
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++
  } else {
    // 答题完成
    finished.value = true
    stopTimer()
    await handleFinish()
  }
}

async function handleFinish() {
  session.value.totalCostMs = (600 - remainingTime.value) * 1000
  
  // 保存到本地战绩
  record.save(session.value)
  
  // 自动上传成绩到排行榜
  if (auth.isLoggedIn.value) {
    uploadStatus.value = '成绩上传中...'
    try {
      const res = await $fetch('/api/rankings/submit', {
        method: 'POST',
        body: {
          score: session.value.totalScore,
          costMs: session.value.totalCostMs
        }
      })
      if (res.code === 0) {
        uploadStatus.value = res.data?.updated ? '✅ 已更新本周最高分' : '本次成绩未超本周最高分'
      } else {
        uploadStatus.value = '上传失败：' + (res.message ?? '')
      }
    } catch (e: any) {
      uploadStatus.value = '上传失败：' + e.message
    }
  } else {
    uploadStatus.value = '💡 登录后可自动上传成绩参与排名'
  }
}

// 开始倒计时
function startTimer() {
  stopTimer()
  timerId = setInterval(() => {
    remainingTime.value--
    if (remainingTime.value <= 0) {
      // 时间到，强制交卷
      stopTimer()
      if (!finished.value) {
        // 未答的题都算答错
        const unanswered = questions.value.length - currentIndex.value - (answered.value ? 0 : 1)
        for (let i = 0; i < unanswered; i++) {
          session.value?.records.push({
            questionId: '',
            category: '',
            type: '',
            correct: false,
            costMs: 0
          })
        }
        if (session.value) {
          session.value.totalScore = Math.round(
            (session.value.records.filter((r: any) => r.correct).length / questions.value.length) * 100
          )
        }
        finished.value = true
        handleFinish()
      }
    }
  }, 1000)
}

function stopTimer() {
  if (timerId) {
    clearInterval(timerId)
    timerId = null
  }
}

// 开始冒险
async function startAdventure() {
  showConfirm.value = false
  loading.value = true
  remainingTime.value = 600
  session.value = null
  answered.value = false
  finished.value = false
  currentIndex.value = 0
  
  try {
    // 加载 100 道题
    const res = await $fetch('/api/questions/random', {
      query: { count: 100 }
    })
    
    if (res.code === 0) {
      questions.value = res.data
      startTimer()
    } else {
      loadError.value = res.message || '题目加载失败'
    }
  } catch (e: any) {
    loadError.value = '题目加载失败：' + e.message
  } finally {
    loading.value = false
  }
}

function goBack() {
  router.push('/')
}

function restart() {
  showConfirm.value = true
}

onMounted(async () => {
  await auth.fetchMe()
  
  // 计算用户等级
  if (auth.isLoggedIn.value) {
    const allRecords = record.all().flatMap(s => s.records)
    levelDetail.value = getLevelDetail(allRecords)
  }
  
  // 未登录也显示提示
  if (!auth.isLoggedIn.value) {
    levelDetail.value.level = '未登录'
  }
})

onBeforeUnmount(stopTimer)
</script>

<style scoped>
.blurred {
  filter: blur(8px);
  user-select: none;
  pointer-events: none;
}

.puzzle-mask {
  text-align: center;
  padding: 1rem;
  color: #8b1e2b;
  font-weight: 500;
  background: rgba(139, 30, 43, 0.05);
  border-radius: 8px;
  margin: 0.5rem 0;
}

.options.disabled .opt {
  opacity: 0.5;
  cursor: not-allowed;
}

.disabled .input {
  opacity: 0.5;
  cursor: not-allowed;
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
  max-width: 420px;
}
</style>
