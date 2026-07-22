// 新增/编辑题目
import type { Question } from '~/types'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id, category, type, content, options, answer, explanation, puzzleImage, puzzleEnabled } = body
  
  if (!category || !type || !content || !answer) {
    return { code: 1, message: '必填项不能为空' }
  }
  
  const now = Date.now()
  
  if (id) {
    // 编辑
    const existing = await useStorage('db').getItem<Question>(`questions:${id}`)
    if (!existing) {
      return { code: 1, message: '题目不存在' }
    }
    
    const updated: Question = {
      ...existing,
      category,
      type,
      content,
      options: options || [],
      answer,
      explanation: explanation || '',
      puzzleImage: puzzleImage || '',
      puzzleEnabled: !!puzzleEnabled,
      updatedAt: now
    }
    
    await useStorage('db').setItem(`questions:${id}`, updated)
    return { code: 0, data: updated, message: '更新成功' }
  } else {
    // 新增：获取最大 sort 值
    const keys = await useStorage('db').getKeys('questions:')
    let maxSort = 0
    for (const key of keys) {
      const q = await useStorage('db').getItem<Question>(key)
      if (q && q.sort > maxSort) maxSort = q.sort
    }
    
    const newId = `q${String(keys.length + 1).padStart(4, '0')}`
    const newQuestion: Question = {
      id: newId,
      sort: maxSort + 1,
      category,
      type,
      content,
      options: options || [],
      answer,
      explanation: explanation || '',
      puzzleImage: puzzleImage || '',
      puzzleEnabled: !!puzzleEnabled,
      createdAt: now,
      updatedAt: now
    }
    
    await useStorage('db').setItem(`questions:${newId}`, newQuestion)
    return { code: 0, data: newQuestion, message: '新增成功' }
  }
})
