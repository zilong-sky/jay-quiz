// 预留：听歌识曲片段列表（入口开关 app.config.ts -> features.enableMusicRecognition）
import type { MusicClip } from '~/types'
import { ok } from '~/server/utils/response'

// 生产环境中 answer 字段不应下发，请通过 /api/music/verify 校验
const CLIPS: Omit<MusicClip, 'answer'>[] = [
  { id: 'm1', url: '/audio/clip1.mp3', duration: 8, hint: '2003 年发行' },
  { id: 'm2', url: '/audio/clip2.mp3', duration: 8, hint: '2008 年灾后作品' },
  { id: 'm3', url: '/audio/clip3.mp3', duration: 8, hint: '与阿信合作' }
]

export default defineEventHandler(() => ok(CLIPS))
