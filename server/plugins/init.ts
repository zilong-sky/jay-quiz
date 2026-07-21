// 服务端启动初始化：
// 1. 首次启动写入题库种子（题库存在时跳过）
// 2. 启动一次性执行一次过期周榜清理，并注册每日检查
import { ALL_QUESTIONS } from '~/server/data/questions'
import { rankingRepo } from '~/server/utils/store'
import { kv } from '~/server/utils/kv'
import { getWeekKey, weekKeyToDate } from '~/server/utils/week'

export default defineNitroPlugin(async () => {
  // —— 题库初始化（仅首次启动写入种子，后续不覆盖）——
  const existing = await kv.get<string[]>('db:questions:index')
  if (!existing || existing.length === 0) {
    console.log('[INIT] 首次启动，写入题库种子...')
    for (const q of ALL_QUESTIONS) {
      await kv.set(`db:questions:item:${q.id}`, q)
    }
    await kv.set('db:questions:index', ALL_QUESTIONS.map(q => q.id))
    console.log(`[INIT] 题库初始化完成，共 ${ALL_QUESTIONS.length} 道题`)
  } else {
    console.log(`[INIT] 题库已存在（${existing.length} 道题），跳过种子写入`)
  }

  // —— 过期周榜清理 ——
  const cleanExpired = async () => {
    const now = new Date()
    const currentWeek = getWeekKey(now)
    const weeks = await rankingRepo.listWeekIndexes()
    for (const wk of weeks) {
      if (wk === currentWeek) continue
      const start = weekKeyToDate(wk).getTime()
      // 超过 7 天则清理
      if (now.getTime() - start >= 7 * 24 * 3600 * 1000) {
        await rankingRepo.clearWeek(wk)
      }
    }
  }
  await cleanExpired()

  // 每 6 小时轮询一次即可覆盖「周一 0 点自动清理」需求
  // 无状态部署（如 Vercel）中该定时器不生效；生产环境请使用 Vercel Cron
  const timer = setInterval(cleanExpired, 6 * 3600 * 1000)
  // Node 环境下不阻塞退出
  if (typeof (timer as any).unref === 'function') (timer as any).unref()
})
