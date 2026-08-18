// JWT 解析工具

// 解码 base64url 段
function base64UrlDecode(str) {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64.padEnd(Math.ceil(b64.length / 4) * 4, '=')
  const binary = atob(padded)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('latin1').decode(bytes)
  }
}

// 解析 JWT，返回 { header, payload, signature, valid }
export function parseJwt(token) {
  const parts = String(token).trim().split('.')
  if (parts.length !== 3) {
    throw new Error('JWT 必须包含三段（header.payload.signature）')
  }
  let header = null
  let payload = null
  let parseError = null
  try {
    header = JSON.parse(base64UrlDecode(parts[0]))
  } catch (e) {
    parseError = 'header 解析失败'
  }
  try {
    payload = JSON.parse(base64UrlDecode(parts[1]))
  } catch (e) {
    parseError = parseError || 'payload 解析失败'
  }
  // 解析 exp 过期时间
  let expired = null
  let expTime = null
  if (payload && typeof payload.exp === 'number') {
    expTime = payload.exp * 1000
    expired = Date.now() > expTime
  }
  return {
    header,
    payload,
    signature: parts[2],
    raw: token.trim(),
    parseError,
    expired,
    expTime,
  }
}

// 格式化 payload 显示（含 exp/iat 等时间字段的友好展示）
export function formatJwtPayload(payload) {
  if (!payload || typeof payload !== 'object') return payload
  const out = {}
  const timeFields = ['exp', 'iat', 'nbf', 'auth_time', 'updated_at']
  for (const [k, v] of Object.entries(payload)) {
    if (timeFields.includes(k) && typeof v === 'number' && v > 1000000000 && v < 9999999999) {
      const d = new Date(v * 1000)
      out[`${k} (${d.toISOString()})`] = v
    } else {
      out[k] = v
    }
  }
  return out
}
