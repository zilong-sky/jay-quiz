// 批量删除题目
export default defineEventHandler(async (event) => {
  const { ids } = await readBody(event)
  
  if (!Array.isArray(ids) || ids.length === 0) {
    return { code: 1, message: '请选择要删除的题目' }
  }
  
  let deletedCount = 0
  for (const id of ids) {
    const exists = await useStorage('db').hasItem(`questions:${id}`)
    if (exists) {
      await useStorage('db').removeItem(`questions:${id}`)
      deletedCount++
    }
  }
  
  return { code: 0, deletedCount, message: `成功删除 ${deletedCount} 道题` }
})
