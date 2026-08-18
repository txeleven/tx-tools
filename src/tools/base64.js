// Base64 编解码（支持 UTF-8 中文）
// 原生 btoa/atob 不支持中文，这里用 TextEncoder/TextDecoder + 二进制转换

function bytesToBase64(bytes) {
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

function base64ToBytes(b64) {
  const binary = atob(b64.replace(/\s+/g, ''))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

// 编码：字符串 -> Base64
export function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text)
  return bytesToBase64(bytes)
}

// 解码：Base64 -> 字符串（UTF-8，失败时回退 latin1）
export function decodeBase64(b64, { urlSafe = false } = {}) {
  let input = b64.replace(/\s+/g, '')
  if (urlSafe) {
    input = input.replace(/-/g, '+').replace(/_/g, '/')
  }
  const bytes = base64ToBytes(input)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('latin1').decode(bytes)
  }
}

// URL-safe Base64 编码
export function encodeBase64Url(text) {
  return encodeBase64(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

// Base64 -> 十六进制
export function base64ToHex(b64) {
  const bytes = base64ToBytes(b64.replace(/\s+/g, ''))
  return [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
}

// 十六进制 -> Base64
export function hexToBase64(hex) {
  const clean = hex.replace(/\s+/g, '').replace(/^0x/i, '')
  if (clean.length % 2 !== 0) throw new Error('hex length must be even')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  return bytesToBase64(bytes)
}

// 校验是否为合法 Base64
export function isValidBase64(str) {
  const clean = str.replace(/\s+/g, '')
  return /^[A-Za-z0-9+/]*={0,2}$/.test(clean) && clean.length % 4 === 0
}
