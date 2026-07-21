import { readBody } from 'h3'
import { userRepo } from '~/server/utils/store'
import { verifyPassword, signToken } from '~/server/utils/auth'
import { ok, fail } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ account: string; password: string }>(event)
  if (!body?.account || !body?.password) return fail('请输入账号密码')
  const user = await userRepo.findByAccount(body.account)
  if (!user) return fail('账号或密码错误')
  const okPw = await verifyPassword(body.password, user.passwordHash)
  if (!okPw) return fail('账号或密码错误')
  const token = signToken({ uid: user.id, account: user.account })
  return ok({ token, user: { id: user.id, account: user.account, nickname: user.nickname, createdAt: user.createdAt } })
})
