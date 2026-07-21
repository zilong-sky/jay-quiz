// 题目列表（支持分页）
import type { Question } from '~/types'
import { LYRICS, CREATION, LIFE } from '~/server/data/questions'
import { kv } from '~/server/utils/kv'
import { ok } from '~/server/utils/response'

const SEED_QUESTIONS = [...LYRICS, ...CREATION, ...LIFE]

// 获取全部题目（优先 KV，兜底用种子数据）
async function getAllQuestions(): Promise<Question[]> {
  const index = (await kv.get<string[]>('db:questions:index')) || []
  if (index.length > 0) {
    const all: Question[] = []
    for (const id of index) {
      const q0 = await kv.get<Question>(`db:questions:item:${id}`)
      if (q0) all.push(q0)
    }
    return all
  }
  return SEED_QUESTIONS
}

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100)
  const category = query.category as string | undefined

  let list = await getAllQuestions()
  if (category) {
    list = list.filter(q => q.category === category)
  }

  const total = list.length
  const start = (page - 1) * pageSize
  const data = list.slice(start, start + pageSize)

  return ok({ list: data, total, page, pageSize })
})
