// 统一本地存储封装
// 迁移小程序时：仅需把内部实现替换为 wx.getStorageSync / wx.setStorageSync
// 前端业务代码调用方式保持不变

type StorageAdapter = {
  get<T = unknown>(key: string): T | null
  set<T = unknown>(key: string, value: T): void
  remove(key: string): void
  clear(): void
}

const memoryStore = new Map<string, string>()

const webAdapter: StorageAdapter = {
  get<T>(key: string): T | null {
    if (typeof window === 'undefined') {
      const v = memoryStore.get(key)
      return v ? (JSON.parse(v) as T) : null
    }
    const raw = window.localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : null
  },
  set<T>(key: string, value: T) {
    const raw = JSON.stringify(value)
    if (typeof window === 'undefined') {
      memoryStore.set(key, raw)
    } else {
      window.localStorage.setItem(key, raw)
    }
  },
  remove(key: string) {
    if (typeof window === 'undefined') memoryStore.delete(key)
    else window.localStorage.removeItem(key)
  },
  clear() {
    if (typeof window === 'undefined') memoryStore.clear()
    else window.localStorage.clear()
  }
}

// 小程序适配位置（示例，勿在 Web 端启用）：
// const mpAdapter: StorageAdapter = {
//   get: (k) => { try { return wx.getStorageSync(k) || null } catch { return null } },
//   set: (k, v) => wx.setStorageSync(k, v),
//   remove: (k) => wx.removeStorageSync(k),
//   clear: () => wx.clearStorageSync()
// }

export function useStorage(): StorageAdapter {
  return webAdapter
}
