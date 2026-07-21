import Redis from 'ioredis'
import type { NitroApp } from 'nitropack'

const url = process.env.REDIS_URL || ''

// 内存 fallback（本地开发无 Redis 时使用）
const memoryStore = new Map<string, string>()

let useRedis = true

declare global {
  var __redis__: Redis | undefined
}

function createClient(): Redis | null {
  if (!url) {
    console.warn('[KV] REDIS_URL not set, using in-memory fallback')
    useRedis = false
    return null
  }
  try {
    const isTls = url.startsWith('rediss://')
    return new Redis(url, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: false,
      lazyConnect: false,
      ...(isTls ? { tls: {} } : {}),
    })
  } catch (e) {
    console.warn('[KV] Redis connection failed, using in-memory fallback:', e)
    useRedis = false
    return null
  }
}

const redis: Redis | null = globalThis.__redis__ ?? createClient()
if (!globalThis.__redis__) globalThis.__redis__ = redis

type SetOpts = { ex?: number }

export const kv = {
  async get<T = unknown>(key: string): Promise<T | null> {
    if (useRedis && redis) {
      try {
        const raw = await redis.get(key)
        if (raw === null || raw === undefined) return null
        try {
          return JSON.parse(raw) as T
        } catch {
          return raw as unknown as T
        }
      } catch {
        // fallback to memory
      }
    }
    const raw = memoryStore.get(key)
    if (raw === undefined) return null
    try {
      return JSON.parse(raw) as T
    } catch {
      return raw as unknown as T
    }
  },
  async set(key: string, value: unknown, opts?: SetOpts): Promise<'OK' | null> {
    const payload = typeof value === 'string' ? value : JSON.stringify(value)
    if (useRedis && redis) {
      try {
        if (opts?.ex && opts.ex > 0) {
          return (await redis.set(key, payload, 'EX', opts.ex)) as 'OK' | null
        }
        return (await redis.set(key, payload)) as 'OK' | null
      } catch {
        // fallback to memory
      }
    }
    memoryStore.set(key, payload)
    if (opts?.ex && opts.ex > 0) {
      setTimeout(() => memoryStore.delete(key), opts.ex * 1000)
    }
    return 'OK'
  },
  async del(key: string): Promise<number> {
    if (useRedis && redis) {
      try {
        return await redis.del(key)
      } catch {
        // fallback to memory
      }
    }
    return memoryStore.delete(key) ? 1 : 0
  },
  async keys(pattern: string): Promise<string[]> {
    if (useRedis && redis) {
      try {
        return await redis.keys(pattern)
      } catch {
        // fallback to memory
      }
    }
    // simple pattern match for memory store (supports * at end only)
    const prefix = pattern.replace(/\*$/, '')
    return Array.from(memoryStore.keys()).filter(k => k.startsWith(prefix))
  }
}
