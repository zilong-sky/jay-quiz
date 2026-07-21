// 新增/修改题目
import { kv } from '~/server/utils/kv'
import { ok, fail } from '~/server/utils/response'
import type { Question } from '~/types'

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event) as Partial<Question>

    if (!body.content || !body.type || !body.answer) {
      return fail('content/type/answer 必填')
    }

    const id = body.id || `q_${Date.now()}`
    const index = (await kv.get<string[]>('db:questions:index')) || []

    const question: Question = {
      id,
      category: body.category || 'lyrics',
      type: body.type,
      content: body.content,
      options: body.options || [],
      answer: body.answer,
      explanation: body.explanation || '',
      score: body.score || 10,
    }

    await kv.set(`db:questions:item:${id}`, question)

    if (!index.includes(id)) {
      index.push(id)
      await kv.set('db:questions:index', index)
    }

    return ok(question)
  } catch (e: any) {
    return fail(e.message || '操作失败')
  }
})
