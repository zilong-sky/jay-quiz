// 粉丝等级计算
import type { FanLevel } from '~/types'

export function calcLevel(score: number): FanLevel {
  if (score >= 91) return '骨灰铁粉'
  if (score >= 71) return '资深粉'
  if (score >= 41) return '普通粉'
  return '路人粉'
}

export const LEVEL_RULES: { level: FanLevel; range: string; desc: string }[] = [
  { level: '路人粉',   range: '0-40 分',   desc: '偶尔听过几首歌，等你入坑' },
  { level: '普通粉',   range: '41-70 分',  desc: '熟悉主打歌，粉丝身份初现' },
  { level: '资深粉',   range: '71-90 分',  desc: '专辑如数家珍，故事信手拈来' },
  { level: '骨灰铁粉', range: '91-100 分', desc: '哥哥的每一句歌词都刻进 DNA' }
]
