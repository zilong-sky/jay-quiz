// 周榜业务 composable
import type { RankingItem } from '~/types'
import { useRequest } from '~/utils/request'

export const useRanking = () => {
  const list = ref<RankingItem[]>([])
  const loading = ref(false)

  async function fetchRankings() {
    loading.value = true
    const res = await useRequest<RankingItem[]>('/api/rankings')
    if (res.code === 0 && res.data) list.value = res.data
    loading.value = false
    return res
  }

  return { list, loading, fetchRankings }
}
