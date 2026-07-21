import { CATEGORY_INFO } from '~/server/data/questions'
import { ok } from '~/server/utils/response'
import type { QuestionCategoryInfo } from '~/types'

export default defineEventHandler(() => {
  const list: QuestionCategoryInfo[] = CATEGORY_INFO.map(c => ({ ...c }))
  return ok(list)
})
