# 周杰伦粉丝知识答题（Web 先行版）

Nuxt3 + TypeScript + Nitro 实现的移动端答题应用，面向周杰伦粉丝群体，具备答题、周榜、账号体系与本地战绩。架构完整对齐微信小程序迁移。

## 快速开始

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # 生产构建
```

## 目录结构

```
├─ pages/            视图层（Nuxt 页面）
├─ components/       通用组件
├─ layouts/          布局
├─ composables/      业务逻辑（用户/答题/周榜/战绩/分类）
├─ utils/            平台适配层（storage/request/level）
├─ types/            全局 TypeScript 类型
├─ server/
│  ├─ api/           Nitro 后端接口
│  ├─ utils/         auth / week / store（unstorage 抽象）
│  ├─ data/          题库种子（每类 20+ 题）
│  └─ plugins/       启动初始化 & 周榜清理
├─ assets/css/       主题样式（复古国风）
├─ docs/MIGRATION.md 微信小程序迁移指南
├─ app.config.ts     功能开关（拼图 / 听歌识曲）
├─ vercel.json       Vercel 部署配置
```

## 功能

- **首页**：功能宫格 + 规则弹窗；未登录用户点击「周榜」跳转登录。
- **答题**：10 题 / 局，单选 + 判断 + 填空；可选倒计时；答后展示解析；结算自动计算粉丝等级。
- **周榜**：后端驱动排序（分数降序 → 用时 → 时间）；已登录用户答题后自动上传最高分。
- **我的战绩**：仅本地存储，包含每一场记录、正确率统计。
- **题库分类**：混合出题 / 单类刷题，规则说明弹窗。
- **登录/注册**：账号 + 密码 + 昵称（bcrypt 加密 + JWT）。
- **预留功能**（入口隐藏）：拼图、听歌识曲。修改 `app.config.ts` 即可开启。

## API

| Method | Path | 说明 |
| --- | --- | --- |
| POST | `/api/auth/register` | 注册 |
| POST | `/api/auth/login` | 登录，返回 Token |
| GET  | `/api/auth/me` | 当前用户信息 |
| POST | `/api/auth/logout` | 退出登录 |
| GET  | `/api/questions/random` | 随机抽题（`count`, `category`） |
| GET  | `/api/questions/categories` | 分类列表 |
| GET  | `/api/rankings` | 本周榜单 |
| POST | `/api/rankings/submit` | 上传本次成绩 |
| GET  | `/api/puzzle/images` | 拼图资源（预留） |
| GET  | `/api/music/clips` | 音频片段（预留） |
| POST | `/api/music/verify` | 识曲校验（预留） |

## 部署

- 前端 + 后端 一体部署到 **Vercel**（`vercel.json` 已配置 `NITRO_PRESET=vercel`）。
- 持久化默认使用 Nitro `fs` 驱动，切换到 Vercel KV 只需改 `nuxt.config.ts` 中 `nitro.storage.db.driver`。
- 详细迁移到微信小程序请参考 [`docs/MIGRATION.md`](docs/MIGRATION.md)。
