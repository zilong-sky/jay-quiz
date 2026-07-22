// 导出所有题目
import type { Question } from '~/types'

export default defineEventHandler(async (event) => {
  const keys = await useStorage('db').getKeys('questions:')
  const questions: Question[] = []
  
  for (const key of keys) {
    const q = await useStorage('db').getItem<Question>(key)
    if (q) questions.push(q)
  }
  
  // 按 sort 排序
  questions.sort((a, b) => a.sort - b.sort)
  
  return {
    code: 0,
    data: questions,
    version: Date.now()
  }
})
