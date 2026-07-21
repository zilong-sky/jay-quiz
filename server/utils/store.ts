// 服务端持久化封装
// 使用 Nitro 提供的 unstorage（配置在 nuxt.config.ts nitro.storage.db）
// 生产环境可切换 driver 为 vercel-kv / redis / upstash，业务代码零改动

import type { User, RankingItem } from '~/types'

type StoredUser = User & { passwordHash: string }

const NS = 'db:'
const K = {
  userByAccount: (account: string) => `${NS}users:by-account:${account}`,
  user: (id: string) => `${NS}users:${id}`,
  userIndex: `${NS}users:index`,
  rankingKey: (weekKey: string, userId: string) => `${NS}rankings:${weekKey}:${userId}`,
  rankingIndex: (weekKey: string) => `${NS}rankings:${weekKey}:index`,
  attempts: (weekKey: string, userId: string) => `${NS}attempts:${weekKey}:${userId}`
}

function storage() {
  return useStorage('db')
}

export interface WeeklyRankingRecord {
  userId: string
  nickname: string
  weeklyBest: number
  attempts: number
  costMs: number
  submittedAt: number
}

export const userRepo = {
  async findByAccount(account: string): Promise<StoredUser | null> {
    const id = await storage().getItem<string>(K.userByAccount(account))
    if (!id) return null
    return await storage().getItem<StoredUser>(K.user(id))
  },
  async findById(id: string): Promise<StoredUser | null> {
    return await storage().getItem<StoredUser>(K.user(id))
  },
  async create(user: StoredUser) {
    await storage().setItem(K.user(user.id), user)
    await storage().setItem(K.userByAccount(user.account), user.id)
    const idx = (await storage().getItem<string[]>(K.userIndex)) || []
    if (!idx.includes(user.id)) {
      idx.push(user.id)
      await storage().setItem(K.userIndex, idx)
    }
  }
}

export const rankingRepo = {
  async upsert(weekKey: string, item: WeeklyRankingRecord): Promise<{ updated: boolean }> {
    const existing = await storage().getItem<WeeklyRankingRecord>(K.rankingKey(weekKey, item.userId))
    // 场次累计
    const attempts = ((existing?.attempts ?? 0)) + item.attempts
    if (!existing || item.weeklyBest > existing.weeklyBest ||
        (item.weeklyBest === existing.weeklyBest && item.costMs < existing.costMs)) {
      const merged: WeeklyRankingRecord = { ...item, attempts }
      await storage().setItem(K.rankingKey(weekKey, item.userId), merged)
      const idx = (await storage().getItem<string[]>(K.rankingIndex(weekKey))) || []
      if (!idx.includes(item.userId)) {
        idx.push(item.userId)
        await storage().setItem(K.rankingIndex(weekKey), idx)
      }
      return { updated: true }
    } else {
      // 仅刷新场次
      const merged: WeeklyRankingRecord = { ...existing, attempts }
      await storage().setItem(K.rankingKey(weekKey, item.userId), merged)
      return { updated: false }
    }
  },
  async getMine(weekKey: string, userId: string): Promise<WeeklyRankingRecord | null> {
    return await storage().getItem<WeeklyRankingRecord>(K.rankingKey(weekKey, userId))
  },
  async list(weekKey: string): Promise<WeeklyRankingRecord[]> {
    const idx = (await storage().getItem<string[]>(K.rankingIndex(weekKey))) || []
    const results: WeeklyRankingRecord[] = []
    for (const uid of idx) {
      const rec = await storage().getItem<WeeklyRankingRecord>(K.rankingKey(weekKey, uid))
      if (rec) results.push(rec)
    }
    return results
  },
  async clearWeek(weekKey: string) {
    const idx = (await storage().getItem<string[]>(K.rankingIndex(weekKey))) || []
    for (const uid of idx) await storage().removeItem(K.rankingKey(weekKey, uid))
    await storage().removeItem(K.rankingIndex(weekKey))
  },
  async listWeekIndexes(): Promise<string[]> {
    const keys = await storage().getKeys(`${NS}rankings:`)
    const set = new Set<string>()
    for (const k of keys) {
      const m = k.match(/rankings:([^:]+):index$/)
      if (m) set.add(m[1])
    }
    return [...set]
  }
}
