// 粉丝等级计算（休闲模式专用，加权算法）
import type { FanLevel, AnswerRecord, QuestionType } from '~/types'

// 题型权重：填空 > 单选 > 判断
const TYPE_WEIGHT: Record<QuestionType, number> = {
  blank: 0.40,   // 填空 40% 权重
  single: 0.35,  // 单选 35% 权重
  judge: 0.25    // 判断 25% 权重
}

// 取最近 N 道题计算等级
const RECENT_LIMIT = 50

export function calcLevelFromRecords(records: AnswerRecord[]): FanLevel {
  // 按时间倒序取最近50道
  const recent = records
    .sort((a, b) => b.answeredAt - a.answeredAt)
    .slice(0, RECENT_LIMIT)

  if (recent.length === 0) return '路人粉'

  // 按题型分组统计正确率
  const typeStats: Record<QuestionType, { correct: number; total: number }> = {
    blank: { correct: 0, total: 0 },
    single: { correct: 0, total: 0 },
    judge: { correct: 0, total: 0 }
  }

  for (const r of recent) {
    const type = r.type || 'single' // 兼容旧数据
    typeStats[type].total++
    if (r.correct) typeStats[type].correct++
  }

  // 加权计算总分（满分100）
  let totalScore = 0
  for (const type of ['blank', 'single', 'judge'] as QuestionType[]) {
    const stats = typeStats[type]
    if (stats.total > 0) {
      const accuracy = stats.correct / stats.total
      totalScore += accuracy * TYPE_WEIGHT[type] * 100
    }
  }

  return calcLevel(totalScore)
}

export function calcLevel(score: number): FanLevel {
  if (score >= 91) return '骨灰铁粉'
  if (score >= 71) return '资深粉'
  if (score >= 41) return '普通粉'
  return '路人粉'
}

export const LEVEL_RULES: { level: FanLevel; range: string; desc: string }[] = [
  { level: '路人粉',   range: '0-40 分',   desc: '偶尔听过几首歌，等你入坑' },
  { level: '普通粉',   range: '41-70 分',  desc: '熟悉主打歌，粉丝身份初现' },
  { level: '资深粉',   range: '71-90 分',  desc: '专辑如数家珍，故事信手拈来' },
  { level: '骨灰铁粉', range: '91-100 分', desc: '哥哥的每一句歌词都刻进 DNA' }
]

// 计算并返回等级详情
export function getLevelDetail(records: AnswerRecord[]) {
  const level = calcLevelFromRecords(records)
  const recent = records.sort((a, b) => b.answeredAt - a.answeredAt).slice(0, RECENT_LIMIT)
  const correct = recent.filter(r => r.correct).length
  const accuracy = recent.length ? Math.round((correct / recent.length) * 100) : 0
  return {
    level,
    correct,
    total: recent.length,
    accuracy
  }
}
