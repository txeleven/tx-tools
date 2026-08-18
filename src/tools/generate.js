// 生成器工具：UUID、随机密码、随机字符串

// UUID v4
export function uuidV4() {
  if (crypto.randomUUID) return crypto.randomUUID()
  // 兼容实现
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (crypto.getRandomValues(new Uint8Array(1))[0] & 0xf) | (c === 'y' ? 0x8 : 0x4)
    return r.toString(16)
  })
}

// UUID v1（基于时间）
export function uuidV1() {
  const t = Date.now()
  const timeHex = t.toString(16).padStart(12, '0')
  return `xxxxxxxx-xxxx-${timeHex.slice(6)}-8xxx-xxxxxxxxxxxx`.replace(/x/g, () =>
    Math.floor(Math.random() * 16).toString(16)
  )
}

// 随机密码
export function randomPassword({ length = 16, uppercase = true, lowercase = true, digits = true, symbols = true } = {}) {
  const pools = {
    uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lowercase: 'abcdefghijklmnopqrstuvwxyz',
    digits: '0123456789',
    symbols: '!@#$%^&*()-_=+[]{};:,.<>?',
  }
  let chars = ''
  if (uppercase) chars += pools.uppercase
  if (lowercase) chars += pools.lowercase
  if (digits) chars += pools.digits
  if (symbols) chars += pools.symbols
  if (!chars) chars = pools.lowercase + pools.digits

  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  let result = ''
  for (let i = 0; i < length; i++) result += chars[arr[i] % chars.length]

  // 确保至少包含每种选中类型的字符
  const ensure = []
  if (uppercase) ensure.push(pools.uppercase)
  if (lowercase) ensure.push(pools.lowercase)
  if (digits) ensure.push(pools.digits)
  if (symbols) ensure.push(pools.symbols)
  ensure.forEach((pool) => {
    const escaped = pool.replace(/[-\]\\/^]/g, '\\$&')
    if (!new RegExp(`[${escaped}]`).test(result)) {
      const i = Math.floor(Math.random() * result.length)
      result = result.slice(0, i) + pool[Math.floor(Math.random() * pool.length)] + result.slice(i + 1)
    }
  })
  return result
}

// 随机字符串
export function randomString(length = 16, charset = 'alnum') {
  const sets = {
    alnum: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789',
    alpha: 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
    numeric: '0123456789',
    hex: '0123456789abcdef',
  }
  const chars = sets[charset] || sets.alnum
  const arr = new Uint32Array(length)
  crypto.getRandomValues(arr)
  let result = ''
  for (let i = 0; i < length; i++) result += chars[arr[i] % chars.length]
  return result
}

// 密码强度评估 0-4
export function passwordStrength(pwd) {
  let score = 0
  if (pwd.length >= 8) score++
  if (pwd.length >= 12) score++
  if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++
  if (/\d/.test(pwd)) score++
  if (/[^A-Za-z0-9]/.test(pwd)) score++
  return score
}
