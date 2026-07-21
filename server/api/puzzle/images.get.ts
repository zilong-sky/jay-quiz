// 预留：拼图图片列表（入口开关 app.config.ts -> features.enablePuzzle）
import type { PuzzleImage } from '~/types'
import { ok } from '~/server/utils/response'

const IMAGES: PuzzleImage[] = [
  { id: 'p1', url: 'https://picsum.photos/seed/jay1/600/600',  title: '专辑意象·夜曲',   pieces: 9 },
  { id: 'p2', url: 'https://picsum.photos/seed/jay2/600/600',  title: '专辑意象·青花瓷', pieces: 16 },
  { id: 'p3', url: 'https://picsum.photos/seed/jay3/600/600',  title: '专辑意象·稻香',   pieces: 25 }
]

export default defineEventHandler(() => ok(IMAGES))
