import { readBody, createError } from 'h3'
import { userRepo } from '~/server/utils/store'
import { hashPassword, signToken } from '~/server/utils/auth'
import { ok, fail } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ account: string; password: string; nickname: string }>(event)
  if (!body?.account || !body?.password || !body?.nickname) {
    return fail('账号、密码、昵称不能为空')
  }
  if (body.account.length < 3 || body.password.length < 6) {
    return fail('账号长度≥3，密码长度≥6')
  }
  const exist = await userRepo.findByAccount(body.account)
  if (exist) return fail('账号已存在')

  const id = 'u_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8)
  const passwordHash = await hashPassword(body.password)
  const user = {
    id,
    account: body.account,
    nickname: body.nickname,
    createdAt: Date.now(),
    passwordHash
  }
  await userRepo.create(user)
  const token = signToken({ uid: id, account: user.account })
  return ok({ token, user: { id, account: user.account, nickname: user.nickname, createdAt: user.createdAt } })
})
