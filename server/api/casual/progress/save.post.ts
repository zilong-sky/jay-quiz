import { readBody } from 'h3'
import { ok, fail } from '~/server/utils/response'
import { kv } from '~/server/utils/kv'

interface ProgressSaveBody {
  category?: string
  offset: number
  correctCount: number
}

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody<ProgressSaveBody>(event)
    const userId = 'anonymous' // 暂时统一匿名，后续可以绑定用户

    // 键名规则：休闲模式单分类用 category，混合模式用 'mixed'
    const modeKey = body.category || 'mixed'
    const baseKey = `db:casual:${userId}:${modeKey}`

    // 获取历史进度
    const currentProgress = await kv.get<number>(`${baseKey}:offset`) || 0
    const currentTotal = await kv.get<number>(`${baseKey}:total`) || 0

    // 只允许向前推进，不允许回退
    if (body.offset > currentProgress) {
      await kv.set(`${baseKey}:offset`, body.offset)
    }

    // 累计答对题目数
    const newTotal = currentTotal + body.correctCount
    await kv.set(`${baseKey}:total`, newTotal)

    return ok({
      offset: Math.max(body.offset, currentProgress),
      totalCorrect: newTotal
    })
  } catch (e) {
    return fail('保存进度失败')
  }
})
