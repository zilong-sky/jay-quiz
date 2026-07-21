// 统一 API 响应结构
import type { ApiResponse } from '~/types'

export function ok<T>(data: T, message = 'ok'): ApiResponse<T> {
  return { code: 0, message, data }
}
export function fail(message: string, code = 1): ApiResponse<null> {
  return { code, message, data: null }
}
