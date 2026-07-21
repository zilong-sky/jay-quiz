// 时间/周次工具
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
  return weekKey !== getWeekKey(now) &&
    // 该 weekKey 起始时间 + 7 天 < now
    (weekKeyToDate(weekKey).getTime() + 7 * 24 * 3600 * 1000) < now.getTime()
}

export function weekKeyToDate(weekKey: string): Date {
  const y = Number(weekKey.slice(0, 4))
  const m = Number(weekKey.slice(4, 6)) - 1
  const d = Number(weekKey.slice(6, 8))
  return new Date(y, m, d, 0, 0, 0, 0)
}
