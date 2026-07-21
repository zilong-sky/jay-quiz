// 统一网络请求封装
// 迁移小程序时：内部替换为 wx.request 即可，业务层无感

import type { ApiResponse } from '~/types'
import { useStorage } from '~/utils/storage'

const TOKEN_KEY = 'jay-quiz:token'

export function getToken(): string | null {
  return useStorage().get<string>(TOKEN_KEY)
}
export function setToken(token: string) {
  useStorage().set(TOKEN_KEY, token)
}
export function clearToken() {
  useStorage().remove(TOKEN_KEY)
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  body?: unknown
  query?: Record<string, unknown>
  auth?: boolean
}

export async function useRequest<T>(url: string, opts: RequestOptions = {}): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (opts.auth !== false) {
    const t = getToken()
    if (t) headers.Authorization = `Bearer ${t}`
  }

  const res = await $fetch<ApiResponse<T>>(url, {
    method: opts.method || 'GET',
    headers,
    body: opts.body,
    query: opts.query,
    // 忽略非 200 响应体，Nitro 端会给出结构化错误
    ignoreResponseError: true
  })
  return res
}

// 小程序适配位置（示例）：
// export function useRequest<T>(url, opts) {
//   return new Promise((resolve) => {
//     wx.request({
//       url: BASE_URL + url,
//       method: opts.method || 'GET',
//       header: { ...headers },
//       data: opts.body,
//       success: (r) => resolve(r.data as ApiResponse<T>)
//     })
//   })
// }
