// 用户认证 composable —— UI 层通过它读写登录状态
import type { User, ApiResponse } from '~/types'
import { useRequest, setToken, clearToken, getToken } from '~/utils/request'

interface AuthState {
  user: User | null
  weeklyBest: number
  attempts: number
}

export const useAuth = () => {
  const state = useState<AuthState>('auth', () => ({ user: null, weeklyBest: 0, attempts: 0 }))

  const isLoggedIn = computed(() => !!state.value.user)

  async function fetchMe() {
    if (!getToken()) { state.value = { user: null, weeklyBest: 0, attempts: 0 }; return }
    const res = await useRequest<AuthState>('/api/auth/me')
    if (res.code === 0 && res.data) state.value = res.data
    else { clearToken(); state.value = { user: null, weeklyBest: 0, attempts: 0 } }
  }

  async function login(account: string, password: string) {
    const res = await useRequest<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST', body: { account, password }, auth: false
    })
    if (res.code === 0 && res.data) {
      setToken(res.data.token)
      await fetchMe()
    }
    return res
  }

  async function register(account: string, password: string, nickname: string) {
    const res = await useRequest<{ token: string; user: User }>('/api/auth/register', {
      method: 'POST', body: { account, password, nickname }, auth: false
    })
    if (res.code === 0 && res.data) {
      setToken(res.data.token)
      await fetchMe()
    }
    return res
  }

  async function logout() {
    await useRequest<null>('/api/auth/logout', { method: 'POST' })
    clearToken()
    state.value = { user: null, weeklyBest: 0, attempts: 0 }
  }

  return { state: readonly(state), isLoggedIn, fetchMe, login, register, logout }
}
