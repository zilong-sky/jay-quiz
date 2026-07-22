// 用户认证 composable —— UI 层通过它读写登录状态
// ✅ 已预留微信小程序登录兼容：
//    - Web：账号密码登录
//    - 小程序：wx.login 获取 code → 后端换取 openid → 自动注册/登录
import type { User, ApiResponse } from '~/types'
import { useRequest, setToken, clearToken, getToken } from '~/utils/request'

interface AuthState {
  user: User | null
  weeklyBest: number
  attempts: number
}

// 环境判断：是否在微信小程序中
const isWechatMiniProgram = typeof wx !== 'undefined' && typeof wx.login === 'function'

export const useAuth = () => {
  const state = useState<AuthState>('auth', () => ({ user: null, weeklyBest: 0, attempts: 0 }))

  const isLoggedIn = computed(() => !!state.value.user)

  async function fetchMe() {
    if (!getToken()) { state.value = { user: null, weeklyBest: 0, attempts: 0 }; return }
    const res = await useRequest<AuthState>('/api/auth/me')
    if (res.code === 0 && res.data) state.value = res.data
    else { clearToken(); state.value = { user: null, weeklyBest: 0, attempts: 0 } }
  }

  // Web：账号密码登录
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

  // 📱 微信小程序登录（预留）
  // 迁移到小程序时直接启用此方法：
  // 1. 调用 wx.login 获取临时 code
  // 2. 传给后端，后端用 code 换取 openid + session_key
  // 3. 后端返回 token，前端存储即可
  async function wechatLogin() {
    if (!isWechatMiniProgram) {
      return { code: -1, message: '不在微信小程序环境中' }
    }
    
    return new Promise<ApiResponse<{ token: string; user: User }>>((resolve) => {
      wx.login({
        success: async (res) => {
          if (res.code) {
            const result = await useRequest<{ token: string; user: User }>('/api/auth/wechat', {
              method: 'POST', body: { code: res.code }, auth: false
            })
            if (result.code === 0 && result.data) {
              setToken(result.data.token)
              await fetchMe()
            }
            resolve(result)
          } else {
            resolve({ code: -1, message: '微信登录失败' })
          }
        },
        fail: () => {
          resolve({ code: -1, message: '微信授权失败' })
        }
      })
    })
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

  return { 
    state: readonly(state), 
    isLoggedIn, 
    isWechatMiniProgram,
    fetchMe, 
    login, 
    wechatLogin, // 小程序登录入口
    register, 
    logout 
  }
}
