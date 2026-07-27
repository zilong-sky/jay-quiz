import { getQuery } from 'h3'
import type { Question, QuestionCategory } from '~/types'
import { CATEGORY_INFO, LYRICS, CREATION, LIFE } from '~/server/data/questions'
import { ok, fail } from '~/server/utils/response'
import { kv } from '~/server/utils/kv'

// 洗牌
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// 获取全部题目（优先 KV，兜底用种子数据）
async function getAllQuestions(): Promise<Question[]> {
  const index = (await kv.get<string[]>('db:questions:index')) || []
  if (index.length > 0) {
    // KV 有数据，从 KV 加载
    const all: Question[] = []
    for (const id of index) {
      const q0 = await kv.get<Question>(`db:questions:item:${id}`)
      if (q0) all.push(q0)
    }
    return all
  }
  // KV 为空，直接用种子数据
  return [...LYRICS, ...CREATION, ...LIFE]
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const count = Math.min(Math.max(Number(q.count) || 10, 1), 50)
  const category = (q.category as QuestionCategory | undefined) || undefined

  const all = await getAllQuestions()
  if (!all.length) return fail('题库尚未初始化')

  let picked: Question[] = []

  // 按分类筛选
  let pool = category ? all.filter(q => q.category === category) : all

  // 区分拼图题和普通题
  const puzzleQuestions = pool.filter(q => q.puzzleImage && q.puzzleEnabled)
  const normalQuestions = pool.filter(q => !q.puzzleImage || !q.puzzleEnabled)

  // 随机打乱普通题
  const shuffled = shuffle(normalQuestions)
  picked = shuffled.slice(0, count)

  // 拼图题分布规则：
  // 1. 前10道题不出现拼图
  // 2. 10道题之后，每10道题的区间里随机出现1次
  if (puzzleQuestions.length > 0 && count > 10) {
    const shuffledPuzzles = shuffle(puzzleQuestions)
    // 计算有多少个10题区间（从第10题开始算）
    const sections = Math.floor((count - 10) / 10)
    const puzzleCount = Math.min(sections, shuffledPuzzles.length)

    for (let i = 0; i < puzzleCount; i++) {
      // 每个10题区间内随机找一个位置插入
      // 第1个区间：10-19题位置，第2个区间：20-29题位置，以此类推
      const sectionStart = 10 + i * 10
      const insertPos = sectionStart + Math.floor(Math.random() * 10)
      if (insertPos < picked.length) {
        picked.splice(insertPos, 0, shuffledPuzzles[i])
      }
    }

    // 保证总题数不变
    if (picked.length > count) {
      picked = picked.slice(0, count)
    }
  }

  // 去重
  const seen = new Set<string>()
  picked = picked.filter(q => {
    if (seen.has(q.id)) return false
    seen.add(q.id)
    return true
  })

  // 如果不够数量，继续补
  while (picked.length < count && shuffled.length > picked.length) {
    const remaining = shuffled.find(q => !seen.has(q.id))
    if (remaining) {
      picked.push(remaining)
      seen.add(remaining.id)
    } else {
      break
    }
  }

  return ok(picked)
})
