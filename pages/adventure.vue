<template>
  <section>
    <h2 class="title-brush">⚔️ 冒险模式</h2>
    <p class="subtle">挑战极限，冲击名人榜！成绩计入冒险战绩。</p>

    <!-- 加载中 -->
    <div v-if="loading" class="card">题库准备中...</div>
    <div v-else-if="loadError" class="card" style="color:#b33">
      {{ loadError }}
      <button class="btn" @click="restart" style="margin-top:1rem">重试</button>
    </div>

    <!-- 答题中 -->
    <div v-else-if="!quiz.finished.value && quiz.current.value" class="card">
      <div class="subtle">
        第 {{ quiz.currentIndex.value + 1 }} / {{ quiz.questions.value.length }} 题
        <span v-if="timerEnabled" style="float:right">⏱ {{ remaining }}s</span>
      </div>
      <div class="progress"><span :style="{width: progress + '%'}" /></div>

      <div class="question">{{ quiz.current.value.content }}</div>

      <!-- 单选/判断 -->
      <div v-if="quiz.current.value.type !== 'blank'" class="options">
        <button
          v-for="(opt, i) in quiz.current.value.options"
          :key="i"
          class="opt"
          :class="optClass(opt)"
          :disabled="answered"
          @click="chooseOption(opt)"
        >{{ opt }}</button>
      </div>
      <!-- 填空 -->
      <div v-else>
        <input v-model="blankInput" class="input" placeholder="请输入答案..." :disabled="answered" />
        <button v-if="!answered" class="btn" @click="submitBlank">提交</button>
      </div>

      <!-- 解析 -->
      <div v-if="answered" class="card" style="margin-top:1rem;border-color:rgba(200,162,83,0.35)">
        <b>{{ lastCorrect ? '✅ 答对了！' : '❌ 答错了' }}</b>
        <div class="subtle" style="margin-top:.3rem">正确答案：{{ quiz.current.value.answer }}</div>
        <div style="margin-top:.5rem">{{ quiz.current.value.explanation }}</div>
        <div style="text-align:right;margin-top:.75rem">
          <button class="btn" @click="nextQuestion">
            {{ quiz.currentIndex.value === quiz.questions.value.length - 1 ? '查看结果' : '下一题' }}
          </button>
        </div>
      </div>

      <div style="margin-top:1rem" class="subtle">
        <label><input type="checkbox" v-model="timerEnabled" /> 开启答题倒计时（每题 30s）</label>
      </div>
    </div>

    <!-- 结算 -->
    <div v-else-if="quiz.finished.value && quiz.session.value" class="card">
      <h3 style="margin-top:0;color:#0f3d2e">🎉 冒险挑战完成！</h3>
      <p>总分：<b style="font-size:1.5rem;color:#8b1e2b">{{ quiz.session.value.totalScore }}</b> / 100</p>
      <p>粉丝等级：<span class="badge">{{ quiz.session.value.level }}</span></p>
      <p>用时：{{ (quiz.session.value.totalCostMs/1000).toFixed(1) }} 秒</p>
      <p>正确题数：{{ correctCount }} / {{ quiz.session.value.records.length }}</p>

      <p v-if="uploadStatus" class="subtle">{{ uploadStatus }}</p>

      <!-- 未登录：选择是否参与排行榜 -->
      <div v-if="!auth.isLoggedIn.value && !uploadChoiceMade" style="margin-top:1rem;padding:1rem;background:#f8f5e8;border-radius:8px">
        <p style="margin:0 0 .5rem 0;font-weight:500">📊 是否参与名人榜排名？</p>
        <div style="display:flex;gap:.5rem">
          <button class="btn" @click="uploadAndLogin">参与排名（需登录）</button>
          <button class="btn ghost" @click="saveLocalOnly">仅保存本地</button>
        </div>
      </div>

      <div style="display:flex;gap:.5rem;margin-top:.5rem">
        <button class="btn" @click="restart">再次挑战</button>
        <NuxtLink to="/ranking" class="btn ghost">查看名人榜</NuxtLink>
      </div>

      <p v-if="!auth.isLoggedIn.value && uploadChoiceMade" class="subtle" style="margin-top:.75rem">
        💡 <NuxtLink to="/login">登录</NuxtLink> 后可自动上传本周最高分参与排名。
      </p>
    </div>
  </section>
</template>

<script setup lang="ts">
import type { QuestionType } from '~/types'
import { getWeekKey } from '~/utils/week'

const route = useRoute()
const quiz = useQuiz()
const auth = useAuth()
const loading = ref(true)
const loadError = ref('')
const answered = ref(false)
const lastCorrect = ref(false)
const blankInput = ref('')
const uploadStatus = ref('')
const uploadChoiceMade = ref(false)

const timerEnabled = ref(false)
const remaining = ref(30)
let timerId: any = null

const progress = computed(() =>
  quiz.questions.value.length
    ? Math.round(((quiz.currentIndex.value + (answered.value ? 1 : 0)) / quiz.questions.value.length) * 100)
    : 0
)
const correctCount = computed(() =>
  quiz.session.value ? quiz.session.value.records.filter(r => r.correct).length : 0
)

const selectedOpt = ref<string | null>(null)

function optClass(opt: string) {
  if (!answered.value) return selectedOpt.value === opt ? 'selected' : ''
  const ans = quiz.current.value?.answer
  if (!ans) return ''
  // 单选题 opt 形如 "A. xxx"，answer 存 "A"；判断题 opt/answer 皆为文本
  const isChosen = selectedOpt.value === opt
  const isRight = quiz.current.value?.type === 'single'
    ? opt.trim().startsWith(ans + '.')
    : opt.trim() === ans.trim()
  if (isRight) return 'correct'
  if (isChosen && !isRight) return 'wrong'
  return ''
}

function chooseOption(opt: string) {
  if (answered.value) return
  selectedOpt.value = opt
  const q = quiz.current.value
  if (!q) return
  const t: QuestionType = q.type
  const userAnswer = t === 'single' ? opt.trim().charAt(0) : opt.trim()
  const rec = quiz.submitAnswer(userAnswer)
  lastCorrect.value = !!rec?.correct
  answered.value = true
  stopTimer()
}

function submitBlank() {
  const rec = quiz.submitAnswer(blankInput.value)
  lastCorrect.value = !!rec?.correct
  answered.value = true
  stopTimer()
}

function nextQuestion() {
  answered.value = false
  selectedOpt.value = null
  blankInput.value = ''
  quiz.next()
  if (quiz.finished.value) {
    stopTimer()
    handleFinish()
  } else {
    startTimer()
  }
}

async function handleFinish() {
  // 冒险模式：保存本周本地最高分（与排行榜周期一致）
  const currentWeek = getWeekKey()
  const currentScore = quiz.session.value?.totalScore || 0
  const currentCostMs = quiz.session.value?.totalCostMs || 0

  const localBest = useStorage().get<{ score: number; costMs: number; week: string }>('localBestScore')

  // 周过期或首次记录时，重置本周最高分
  if (!localBest || localBest.week !== currentWeek) {
    useStorage().set('localBestScore', {
      score: currentScore,
      costMs: currentCostMs,
      week: currentWeek
    })
  } else if (currentScore > localBest.score || (currentScore === localBest.score && currentCostMs < localBest.costMs)) {
    // 同周内更新最高分
    useStorage().set('localBestScore', {
      score: currentScore,
      costMs: currentCostMs,
      week: currentWeek
    })
  }

  if (auth.isLoggedIn.value) {
    uploadStatus.value = '成绩上传中...'
    const res = await quiz.uploadScore()
    if (res && res.code === 0) {
      uploadStatus.value = res.data?.updated ? '✅ 已更新本周最高分' : '本次成绩未超本周最高分，未更新'
    } else {
      uploadStatus.value = '上传失败：' + (res?.message ?? '')
    }
    uploadChoiceMade.value = true
  }
}

function saveLocalOnly() {
  uploadChoiceMade.value = true
  uploadStatus.value = '✅ 冒险成绩已保存到本地（未参与排名）'
}

async function uploadAndLogin() {
  uploadChoiceMade.value = true
  // 跳转登录页，登录后自动返回排行榜
  router.push('/login?redirect=/ranking&uploadBest=1')
}

function startTimer() {
  if (!timerEnabled.value) return
  remaining.value = 30
  stopTimer()
  timerId = setInterval(() => {
    remaining.value--
    if (remaining.value <= 0) {
      // 超时自动交卷本题（视为答错）
      if (!answered.value) {
        const rec = quiz.submitAnswer('__timeout__')
        lastCorrect.value = !!rec?.correct
        answered.value = true
      }
      stopTimer()
    }
  }, 1000)
}
function stopTimer() { if (timerId) { clearInterval(timerId); timerId = null } }

async function restart() {
  answered.value = false
  selectedOpt.value = null
  blankInput.value = ''
  uploadStatus.value = ''
  uploadChoiceMade.value = false
  loadError.value = ''
  loading.value = true
  // 冒险模式固定混合题库
  const res = await quiz.loadQuestions(10, undefined)
  if (res.code !== 0) {
    loadError.value = res.message || '题目加载失败'
  }
  loading.value = false
  startTimer()
}

onMounted(async () => {
  await auth.fetchMe()
  // 冒险模式固定混合题库
  const res = await quiz.loadQuestions(10, undefined)
  if (res.code !== 0) {
    loadError.value = res.message || '题目加载失败'
  }
  loading.value = false
  startTimer()
})
onBeforeUnmount(stopTimer)

watch(timerEnabled, (v) => { if (v && !answered.value) startTimer(); else stopTimer() })
</script>
