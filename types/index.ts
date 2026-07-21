// 全局 TypeScript 类型定义（前后端共用）

export type QuestionCategory = 'lyrics' | 'creation' | 'life'
export type QuestionType = 'single' | 'judge' | 'blank'

export interface Question {
  id: string
  category: QuestionCategory
  type: QuestionType
  content: string
  options?: string[]          // 单选题 4 选项 / 判断题 ["正确","错误"]
  answer: string              // 单选题存 A/B/C/D；判断题存 "正确"/"错误"；填空题存标准文本
  explanation: string         // 知识点解析
  score?: number              // 单题分值（默认 10）
}

export interface QuestionCategoryInfo {
  key: QuestionCategory
  label: string
  desc: string
  weight: number              // 出题权重占比
}

export interface AnswerRecord {
  questionId: string
  category: QuestionCategory
  type: QuestionType       // 题目类型（单选/判断/填空）
  userAnswer: string
  correct: boolean
  scoreGained: number
  costMs: number
  answeredAt: number
}

export interface QuizSession {
  id: string
  startedAt: number
  finishedAt: number
  totalScore: number
  totalCostMs: number
  records: AnswerRecord[]
  level: FanLevel
  category?: QuestionCategory
}

export type FanLevel = '路人粉' | '普通粉' | '资深粉' | '骨灰铁粉'

export interface User {
  id: string
  account: string
  nickname: string
  createdAt: number
}

export interface AuthTokenPayload {
  uid: string
  account: string
  iat?: number
  exp?: number
}

export interface RankingItem {
  rank: number
  userId: string
  nickname: string
  weeklyBest: number
  attempts: number
  level: FanLevel
  costMs: number
  submittedAt: number
}

export interface ApiResponse<T> {
  code: number                // 0 表示成功
  message: string
  data: T | null
}

export interface PuzzleImage {
  id: string
  url: string
  title: string
  pieces: number
}

export interface MusicClip {
  id: string
  url: string
  duration: number
  hint?: string
  answer: string              // 服务端校验时使用；返回给前端可省略
}
