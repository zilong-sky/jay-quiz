// 全局功能开关（对齐小程序 app.json 思路）
export default defineAppConfig({
  features: {
    enablePuzzle: false,              // 拼图功能入口开关（预留）
    enableMusicRecognition: false     // 听歌识曲入口开关（预留）
  },
  theme: {
    primary: '#0f3d2e',   // 墨绿
    accent: '#8b1e2b',    // 酒红
    ink: '#1a1a1a',
    paper: '#f4e9d0'
  }
})
