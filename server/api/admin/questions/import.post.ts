// 导入种子数据到 KV
import { LYRICS, CREATION, LIFE } from '~/server/data/questions'
import type { Question } from '~/types'

export default defineEventHandler(async (event) => {
  const { mode = 'increment' } = await readBody(event)
  
  const seedQuestions = [...LYRICS, ...CREATION, ...LIFE]
  
  // 覆盖模式：先清空
  if (mode === 'overwrite') {
    const keys = await useStorage('db').getKeys('questions:')
    for (const key of keys) {
      await useStorage('db').removeItem(key)
    }
  }
  
  // 获取现有最大 sort
  const existingKeys = await useStorage('db').getKeys('questions:')
  let maxSort = 0
  for (const key of existingKeys) {
    const q = await useStorage('db').getItem<Question>(key)
    if (q && q.sort > maxSort) maxSort = q.sort
  }
  
  // 导入种子数据
  let importedCount = 0
  const now = Date.now()
  
  for (let i = 0; i < seedQuestions.length; i++) {
    const seed = seedQuestions[i]
    const newId = `q${String(existingKeys.length + i + 1).padStart(4, '0')}`
    
    // 增量模式跳过已存在的 id（如果种子数据 id 格式一致）
    if (mode === 'increment') {
      const exists = await useStorage('db').hasItem(`questions:${seed.id}`)
      if (exists) continue
    }
    
    const question: Question = {
      id: mode === 'overwrite' ? seed.id : newId,
      sort: maxSort + i + 1,
      category: seed.category,
      type: seed.type,
      content: seed.content,
      options: seed.options || [],
      answer: seed.answer,
      explanation: seed.explanation || '',
      puzzleImage: seed.puzzleImage || '',
      puzzleEnabled: !!seed.puzzleImage,
      createdAt: now,
      updatedAt: now
    }
    
    await useStorage('db').setItem(`questions:${question.id}`, question)
    importedCount++
  }
  
  return { 
    code: 0, 
    importedCount, 
    message: `成功导入 ${importedCount} 道题` 
  }
})
