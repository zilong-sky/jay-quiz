// 分类信息 composable
import type { QuestionCategoryInfo } from '~/types'
import { useRequest } from '~/utils/request'

export const useCategories = () => {
  const list = ref<QuestionCategoryInfo[]>([])
  async function fetchCategories() {
    const res = await useRequest<QuestionCategoryInfo[]>('/api/questions/categories', { auth: false })
    if (res.code === 0 && res.data) list.value = res.data
    return res
  }
  return { list, fetchCategories }
}
