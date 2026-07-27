import { getQuery } from 'h3'
import { ok } from '~/server/utils/response'
import { kv } from '~/server/utils/kv'

export default defineEventHandler(async (event) => {
  const q = getQuery(event)
  const userId = 'anonymous'
  const category = q.category as string | undefined

  const modeKey = category || 'mixed'
  const baseKey = `db:casual:${userId}:${modeKey}`

  const offset = await kv.get<number>(`${baseKey}:offset`) || 0
  const totalCorrect = await kv.get<number>(`${baseKey}:total`) || 0

  return ok({
    offset,
    totalCorrect,
    category
  })
})
