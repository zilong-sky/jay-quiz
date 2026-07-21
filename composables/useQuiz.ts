// 答题业务 composable —— 视图层仅负责调用与展示
import type { Question, QuestionCategory, AnswerRecord, QuizSession } from '~/types'
import { useRequest } from '~/utils/request'
import { calcLevel } from '~/utils/level'
import { useMyRecord } from '~/composables/useMyRecord'

export const useQuiz = () => {
  const questions = ref<Question[]>([])
  const currentIndex = ref(0)
  const records = ref<AnswerRecord[]>([])
  const startedAt = ref(0)
  const currentQuestionStart = ref(0)
  const finished = ref(false)
  const session = ref<QuizSession | null>(null)

  const current = computed(() => questions.value[currentIndex.value] || null)
  const totalScore = computed(() => records.value.reduce((s, r) => s + r.scoreGained, 0))

  async function loadQuestions(count = 10, category?: QuestionCategory) {
    const res = await useRequest<Question[]>('/api/questions/random', {
      query: { count, ...(category ? { category } : {}) }
    })
    if (res.code === 0 && res.data) {
      questions.value = res.data
      currentIndex.value = 0
      records.value = []
      finished.value = false
      startedAt.value = Date.now()
      currentQuestionStart.value = Date.now()
    }
    return res
  }

  function submitAnswer(userAnswer: string) {
    const q = current.value
    if (!q) return null
    const correct = userAnswer.trim() === q.answer.trim()
    const scoreGained = correct ? (q.score ?? 10) : 0
    const record: AnswerRecord = {
      questionId: q.id,
      category: q.category,
      type: q.type,
      userAnswer,
      correct,
      scoreGained,
      costMs: Date.now() - currentQuestionStart.value,
      answeredAt: Date.now()
    }
    records.value.push(record)
    return record
  }

  function next() {
    if (currentIndex.value < questions.value.length - 1) {
      currentIndex.value++
      currentQuestionStart.value = Date.now()
    } else {
      finish()
    }
  }

  function finish(saveToRecord = true) {
    finished.value = true
    const finishedAt = Date.now()
    const sess: QuizSession = {
      id: 's_' + finishedAt,
      startedAt: startedAt.value,
      finishedAt,
      totalScore: totalScore.value,
      totalCostMs: finishedAt - startedAt.value,
      records: [...records.value],
      level: calcLevel(totalScore.value)
    }
    session.value = sess
    // 保存战绩到本地（休闲模式不保存，仅冒险模式保存）
    if (saveToRecord) {
      useMyRecord().saveSession(sess)
    }
    return sess
  }

  async function uploadScore() {
    if (!session.value) return null
    const res = await useRequest<{ updated: boolean; weeklyBest: number }>('/api/rankings/submit', {
      method: 'POST',
      body: {
        score: session.value.totalScore,
        costMs: session.value.totalCostMs
      }
    })
    return res
  }

  return {
    questions, currentIndex, current, records, totalScore,
    finished, session,
    loadQuestions, submitAnswer, next, finish, uploadScore
  }
}
