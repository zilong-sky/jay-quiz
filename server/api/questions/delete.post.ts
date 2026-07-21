// 删除题目
import { kv } from '~/server/utils/kv'
import { ok, fail } from '~/server/utils/response'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { id } = body

  if (!id) return fail('id 必填')

  const index = (await kv.get<string[]>('db:questions:index')) || []
  if (!index.includes(id)) return fail('题目不存在')

  await kv.del(`db:questions:item:${id}`)
  await kv.set('db:questions:index', index.filter(i => i !== id))

  return ok({ deleted: id })
})
