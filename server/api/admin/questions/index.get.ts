// 管理端题目列表（分页+筛选）
import type { Question } from '~/types'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const page = Number(query.page) || 1
  const pageSize = Math.min(Number(query.pageSize) || 20, 100)
  const category = query.category as string | undefined
  const keyword = query.keyword as string | undefined
  
  // 从 KV 获取所有题目
  const keys = await useStorage('db').getKeys('questions:')
  const allQuestions: Question[] = []
  
  for (const key of keys) {
    const q = await useStorage('db').getItem<Question>(key)
    if (q) allQuestions.push(q)
  }
  
  // 按 sort 排序
  allQuestions.sort((a, b) => a.sort - b.sort)
  
  // 筛选
  let filtered = allQuestions
  if (category) {
    filtered = filtered.filter(q => q.category === category)
  }
  if (keyword) {
    const kw = keyword.toLowerCase()
    filtered = filtered.filter(q => 
      q.content.toLowerCase().includes(kw) ||
      q.explanation.toLowerCase().includes(kw)
    )
  }
  
  // 分页
  const start = (page - 1) * pageSize
  const list = filtered.slice(start, start + pageSize)
  
  return {
    code: 0,
    data: {
      list,
      total: filtered.length,
      page,
      pageSize
    }
  }
})
