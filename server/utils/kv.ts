import type { NitroApp } from 'nitropack'

// 使用 Nitro unstorage（支持 fs / vercel-kv / redis 等多后端切换）
// 配置在 nuxt.config.ts 的 nitro.storage
const storage = useStorage('db')

type SetOpts = { ex?: number }

export const kv = {
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const raw = await storage.getItem(key)
      if (raw === null || raw === undefined) return null
      return raw as T
    } catch (e) {
      console.warn('[KV] get failed:', e)
      return null
    }
  },
  async set(key: string, value: unknown, opts?: SetOpts): Promise<'OK' | null> {
    try {
      await storage.setItem(key, value)
      if (opts?.ex && opts.ex > 0) {
        // unstorage 部分驱动不支持原生 TTL，用 setTimeout 简单模拟
        setTimeout(() => storage.removeItem(key), opts.ex * 1000)
      }
      return 'OK'
    } catch (e) {
      console.warn('[KV] set failed:', e)
      return null
    }
  },
  async del(key: string): Promise<number> {
    try {
      await storage.removeItem(key)
      return 1
    } catch {
      return 0
    }
  },
  async keys(pattern: string): Promise<string[]> {
    try {
      const allKeys = await storage.getKeys()
      const prefix = pattern.replace(/\*$/, '')
      return allKeys.filter(k => k.startsWith(prefix))
    } catch {
      return []
    }
  }
}
