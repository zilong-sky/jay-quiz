// 题目列表（支持分页）
import { kv } from '~/server/utils/kv'
import { ok, fail } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Math.max(Number(query.page) || 1, 1)
  const pageSize = Math.min(Math.max(Number(query.pageSize) || 20, 1), 100)
  const category = query.category as string | undefined

  const index = (await kv.get<string[]>('db:questions:index')) || []
  let all = await Promise.all(
    index.map(id => kv.get<{ id: string; category: string; content: string; type: string }>(`db:questions:item:${id}`))
  )
  
  let list = all.filter(Boolean)
  if (category) {
    list = list.filter(q => q.category === category)
  }

  const total = list.length
  const start = (page - 1) * pageSize
  const data = list.slice(start, start + pageSize)

  return ok({ list: data, total, page, pageSize })
})
