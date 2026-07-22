// 批量重排题目顺序
import type { Question } from '~/types'

export default defineEventHandler(async (event) => {
  const { ids } = await readBody(event)
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 1, message: '参数错误' }
  }
  
  // 按顺序更新 sort
  for (let i = 0; i < ids.length; i++) {
    const id = ids[i]
    const q = await useStorage('db').getItem<Question>(`questions:${id}`)
    if (q) {
      q.sort = i + 1
      q.updatedAt = Date.now()
      await useStorage('db').setItem(`questions:${id}`, q)
    }
  }
  
  return { code: 0, message: '排序更新成功' }
})
