import { userRepo, rankingRepo } from '~/server/utils/store'
import { requireAuth } from '~/server/utils/auth'
import { getWeekKey } from '~/server/utils/week'
import { ok, fail } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const payload = requireAuth(event)
  const user = await userRepo.findById(payload.uid)
  if (!user) return fail('用户不存在', 401)
  const wk = getWeekKey()
  const mine = await rankingRepo.getMine(wk, user.id)
  return ok({
    user: { id: user.id, account: user.account, nickname: user.nickname, createdAt: user.createdAt },
    weeklyBest: mine?.weeklyBest ?? 0,
    attempts: mine?.attempts ?? 0
  })
})
