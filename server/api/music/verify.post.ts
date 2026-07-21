// 预留：识曲校验
import { readBody } from 'h3'
import { ok, fail } from '~/server/utils/response'

const ANSWERS: Record<string, string[]> = {
  m1: ['以父之名'],
  m2: ['稻香'],
  m3: ['说好不哭']
}

export default defineEventHandler(async (event) => {
  const body = await readBody<{ clipId: string; guess: string }>(event)
  if (!body?.clipId || !body?.guess) return fail('参数错误')
  const list = ANSWERS[body.clipId]
  if (!list) return fail('片段不存在')
  const hit = list.some(name => body.guess.trim().includes(name))
  return ok({ correct: hit, answer: hit ? list[0] : undefined })
})
