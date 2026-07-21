// 个人战绩（仅本地存储）
import type { QuizSession } from '~/types'
import { useStorage } from '~/utils/storage'

const KEY = 'jay-quiz:my-records'

export const useMyRecord = () => {
  const storage = useStorage()

  function all(): QuizSession[] {
    return storage.get<QuizSession[]>(KEY) || []
  }
  function saveSession(sess: QuizSession) {
    const list = all()
    list.unshift(sess)
    storage.set(KEY, list.slice(0, 200))    // 最多保留 200 条
  }
  function clearAll() {
    storage.remove(KEY)
  }
  function stats() {
    const list = all()
    const totalSessions = list.length
    const highest = list.reduce((m, s) => Math.max(m, s.totalScore), 0)
    const totalAnswered = list.reduce((s, x) => s + x.records.length, 0)
    const totalCorrect = list.reduce((s, x) => s + x.records.filter(r => r.correct).length, 0)
    return {
      totalSessions,
      highest,
      totalAnswered,
      totalCorrect,
      accuracy: totalAnswered ? Math.round((totalCorrect / totalAnswered) * 100) : 0
    }
  }
  return { all, saveSession, clearAll, stats }
}
