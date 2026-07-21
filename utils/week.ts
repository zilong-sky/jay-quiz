// 时间/周次工具（与后端一致）
// 周计算规则：每周一 00:00:00 (本地) 起为新一周
export function getWeekKey(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay() || 7   // 周日=0 → 视作 7
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - (day - 1))
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${y}${m}${dd}`
}

export function isExpired(weekKey: string, now = new Date()): boolean {
  return weekKey !== getWeekKey(now)
}
