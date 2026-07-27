import { getQuery } from 'h3'
import type { Question, QuestionCategory } from '~/types'
import { CATEGORY_INFO, LYRICS, CREATION, LIFE } from '~/server/data/questions'
import { ok, fail } from '~/server/utils/response'
import { kv } from '~/server/utils/kv'

// 洗牌（固定种子，保证所有人的混合顺序一致）
function fixedShuffle<T>(arr: T[]): T[] {
  const a = arr.slice()
  // 固定种子：20260727，保证每次洗牌结果完全一致
  let seed = 20260727
  function random() {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
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

// 获取混合模式的全局固定顺序索引（只生成一次，永久保存）
async function getMixedOrderIndex(all: Question[]): Promise<string[]> {
  const cached = await kv.get<string[]>('db:questions:mixed-order')
  if (cached && cached.length > 0) {
    return cached
  }
  // 生成全局固定的混合顺序，所有人共用
  const allIds = all.map(q => q.id)
  const mixedIds = fixedShuffle(allIds)
  await kv.set('db:questions:mixed-order', mixedIds)
  return mixedIds
}

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const offset = Math.max(Number(q.offset) || 0, 0)
  const limit = Math.min(Math.max(Number(q.limit) || 10, 1), 50)
  const category = (q.category as QuestionCategory | undefined) || undefined

  const all = await getAllQuestions()
  if (!all.length) return fail('题库尚未初始化')

  let orderedIds: string[] = []

  if (!category) {
    // 混合模式：使用全局固定的混合顺序
    orderedIds = await getMixedOrderIndex(all)
  } else {
    // 单分类模式：按分类顺序答题
    const categoryQuestions = all.filter(q => q.category === category)
    // 按题目ID排序，保证顺序固定
    categoryQuestions.sort((a, b) => a.id.localeCompare(b.id))
    orderedIds = categoryQuestions.map(q => q.id)
  }

  // 按偏移量取题
  const questionMap = new Map(all.map(q => [q.id, q]))
  const pickedIds = orderedIds.slice(offset, offset + limit)
  const picked = pickedIds.map(id => questionMap.get(id)!).filter(Boolean)

  return ok({
    questions: picked,
    total: orderedIds.length,
    hasMore: offset + limit < orderedIds.length,
    nextOffset: offset + picked.length
  })
})
