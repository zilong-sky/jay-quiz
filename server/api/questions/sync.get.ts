// 前端同步接口：获取全量有序题目缓存
import type { Question } from '~/types'

export default defineEventHandler(async (event) => {
  const keys = await useStorage('db').getKeys('questions:')
  const questions: Question[] = []
  
  // 如果 KV 为空，返回种子数据兜底
  if (keys.length === 0) {
    const { LYRICS, CREATION, LIFE } = await import('~/server/data/questions')
    const all = [...LYRICS, ...CREATION, ...LIFE]
    return {
      code: 0,
      version: Date.now(),
      data: all.map((q, i) => ({
        ...q,
        sort: i + 1,
        puzzleEnabled: !!q.puzzleImage
      }))
    }
  }
  
  for (const key of keys) {
    const q = await useStorage('db').getItem<Question>(key)
    if (q) questions.push(q)
  }
  
  // 按 sort 排序
  questions.sort((a, b) => a.sort - b.sort)
  
  return {
    code: 0,
    version: Date.now(),
    data: questions
  }
})
