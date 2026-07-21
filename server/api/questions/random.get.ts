import { getQuery } from 'h3'
import type { Question, QuestionCategory } from '~/types'
import { CATEGORY_INFO } from '~/server/data/questions'
import { ok, fail } from '~/server/utils/response'

// 洗牌
function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const count = Math.min(Math.max(Number(q.count) || 10, 1), 50)
  const category = (q.category as QuestionCategory | undefined) || undefined
  const storage = useStorage('db')
  const index = (await storage.getItem<string[]>('db:questions:index')) || []
  if (!index.length) return fail('题库尚未初始化')

  // 加载全部题目（题库量小，直接内存过滤）
  const all: Question[] = []
  for (const id of index) {
    const q0 = await storage.getItem<Question>(`db:questions:item:${id}`)
    if (q0) all.push(q0)
  }

  let picked: Question[]
  if (category) {
    picked = shuffle(all.filter(x => x.category === category)).slice(0, count)
  } else {
    // 按分类权重抽取
    const bucketCounts = CATEGORY_INFO.map(c => ({ c, n: Math.round(c.weight * count) }))
    // 调整余数
    let diff = count - bucketCounts.reduce((s, b) => s + b.n, 0)
    while (diff !== 0) {
      const target = bucketCounts[diff > 0 ? 0 : bucketCounts.length - 1]
      target.n += diff > 0 ? 1 : -1
      diff += diff > 0 ? -1 : 1
    }
    picked = bucketCounts.flatMap(({ c, n }) =>
      shuffle(all.filter(x => x.category === c.key)).slice(0, n)
    )
    picked = shuffle(picked)
  }

  // 出题时不带 answer 直接返回？为演示与前端立即校验一致，保留 answer 字段。
  // 生产可将 answer 剥离，通过 /api/questions/verify 校验。
  return ok(picked)
})
