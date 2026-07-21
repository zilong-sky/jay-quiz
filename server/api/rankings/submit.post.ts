import { readBody } from 'h3'
import { userRepo, rankingRepo } from '~/server/utils/store'
import { requireAuth } from '~/server/utils/auth'
import { getWeekKey } from '~/server/utils/week'
import { ok, fail } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const body = await readBody<{ score: number; costMs: number }>(event)
  if (typeof body?.score !== 'number' || typeof body?.costMs !== 'number') {
    return fail('参数错误')
  }
  if (body.score < 0 || body.score > 100) return fail('分数非法')
  const user = await userRepo.findById(payload.uid)
  if (!user) return fail('用户不存在', 401)

  const wk = getWeekKey()
  const res = await rankingRepo.upsert(wk, {
    userId: user.id,
    nickname: user.nickname,
    weeklyBest: body.score,
    attempts: 1,
    costMs: body.costMs,
    submittedAt: Date.now()
  })
  const mine = await rankingRepo.getMine(wk, user.id)
  return ok({ updated: res.updated, weeklyBest: mine?.weeklyBest ?? body.score })
})
