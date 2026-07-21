import type { RankingItem } from '~/types'
import { rankingRepo } from '~/server/utils/store'
import { getWeekKey } from '~/server/utils/week'
import { calcLevel } from '~/utils/level'
import { ok } from '~/server/utils/response'

export default defineEventHandler(async () => {
  const wk = getWeekKey()
  const rows = await rankingRepo.list(wk)
  const sorted = rows.sort((a, b) => {
    if (b.weeklyBest !== a.weeklyBest) return b.weeklyBest - a.weeklyBest
    if (a.costMs !== b.costMs) return a.costMs - b.costMs
    return a.submittedAt - b.submittedAt
  })
  const list: RankingItem[] = sorted.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    nickname: r.nickname,
    weeklyBest: r.weeklyBest,
    attempts: r.attempts,
    level: calcLevel(r.weeklyBest),
    costMs: r.costMs,
    submittedAt: r.submittedAt
  }))
  return ok(list)
})
