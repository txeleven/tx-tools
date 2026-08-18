// 时间戳转换工具

// 时间戳 -> 日期时间字符串
export function timestampToDate(ts, { ms = false, format = 'yyyy-MM-dd HH:mm:ss' } = {}) {
  const num = typeof ts === 'string' ? ts.trim() : ts
  let value = Number(num)
  if (Number.isNaN(value)) throw new Error('invalid timestamp')
  // 自动识别秒/毫秒：10 位为秒，13 位为毫秒
  const isMs = ms || String(Math.abs(Math.trunc(value))).length > 10
  if (!isMs && String(Math.abs(Math.trunc(value))).length === 13) value = value / 1000
  if (!isMs) value = value * 1000
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) throw new Error('invalid date')
  const pad = (n) => String(n).padStart(2, '0')
  const map = {
    'yyyy': d.getFullYear(),
    'MM': pad(d.getMonth() + 1),
    'dd': pad(d.getDate()),
    'HH': pad(d.getHours()),
    'mm': pad(d.getMinutes()),
    'ss': pad(d.getSeconds()),
    'SSS': String(d.getMilliseconds()).padStart(3, '0'),
  }
  return format.replace(/yyyy|MM|dd|HH|mm|ss|SSS/g, (m) => map[m])
}

// 日期时间字符串 -> 时间戳（秒）
export function dateToTimestamp(dateStr) {
  const d = new Date(dateStr)
  if (Number.isNaN(d.getTime())) throw new Error('invalid date string')
  return {
    seconds: Math.floor(d.getTime() / 1000),
    milliseconds: d.getTime(),
  }
}

// 相对时间描述
export function relativeTime(ts) {
  const now = Date.now()
  const diff = now - ts
  const abs = Math.abs(diff)
  const units = [
    [31536000000, '年', 'year'],
    [2592000000, '月', 'month'],
    [86400000, '天', 'day'],
    [3600000, '小时', 'hour'],
    [60000, '分钟', 'minute'],
    [1000, '秒', 'second'],
  ]
  for (const [ms, zh, en] of units) {
    if (abs >= ms) {
      const n = Math.floor(abs / ms)
      return `${diff >= 0 ? '' : '-'}${n} ${zh}${diff >= 0 ? '前' : '后'}`
    }
  }
  return '刚刚'
}

// ISO 8601 字符串转时间戳
export function isoToTimestamp(iso) {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) throw new Error('invalid ISO string')
  return { seconds: Math.floor(d.getTime() / 1000), milliseconds: d.getTime() }
}
