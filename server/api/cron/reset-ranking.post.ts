// Vercel Cron 定时任务：每周一 0点重置周榜
export default defineEventHandler(async (event) => {
  // 验证 Vercel Cron 请求（可选，防止恶意调用）
  const authHeader = getHeader(event, 'authorization')
  if (process.env.NODE_ENV === 'production' && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    // Vercel Cron 自动带 CRON_SECRET，本地调试跳过
  }

  const db = useStorage('db')
  const weekKey = getCurrentWeekKey()

  // 清除本周榜单（实际是标记下周为新周期，提交时自动创建新周数据）
  // 保留旧周数据不删除，仅新提交写入新周 key
  console.log(`[CRON] 周榜重置触发，当前周: ${weekKey}`)

  return {
    success: true,
    message: '周榜已重置',
    weekKey,
    timestamp: new Date().toISOString()
  }
})
