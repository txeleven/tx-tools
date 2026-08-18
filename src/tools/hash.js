// 哈希工具：MD5（纯 JS 实现）+ SHA 系列（WebCrypto）
// MD5 实现基于经典公域算法，支持 UTF-8 中文

function utf8Encode(str) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    let code = str.codePointAt(i)
    if (code > 0xffff) i++ // 处理代理对
    if (code < 0x80) bytes.push(code)
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
  }
  return bytes
}

const MD5_S = [
  7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
  5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
  4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
  6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
]

const MD5_K = []
for (let i = 0; i < 64; i++) MD5_K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296)

function md5(input) {
  const bytes = typeof input === 'string' ? utf8Encode(input) : input
  const msg = [...bytes]
  const originalLen = msg.length

  // padding（长度字段用 BigInt 保证 64 位正确性，JS 位移对 32 取模）
  msg.push(0x80)
  while (msg.length % 64 !== 56) msg.push(0)
  const bitLen = BigInt(originalLen) * 8n
  for (let i = 0; i < 8; i++) msg.push(Number((bitLen >> BigInt(i * 8)) & 0xffn))

  let a0 = 0x67452301
  let b0 = 0xefcdab89
  let c0 = 0x98badcfe
  let d0 = 0x10325476

  const toInt32 = (offset) =>
    msg[offset] | (msg[offset + 1] << 8) | (msg[offset + 2] << 16) | (msg[offset + 3] << 24)
  const leftRotate = (x, c) => (x << c) | (x >>> (32 - c))

  for (let offset = 0; offset < msg.length; offset += 64) {
    const M = []
    for (let i = 0; i < 16; i++) M[i] = toInt32(offset + i * 4)
    let A = a0, B = b0, C = c0, D = d0

    for (let i = 0; i < 64; i++) {
      let F, g
      if (i < 16) { F = (B & C) | (~B & D); g = i }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16 }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16 }
      else { F = C ^ (B | ~D); g = (7 * i) % 16 }
      F = (F + A + MD5_K[i] + M[g]) | 0
      A = D; D = C; C = B
      B = (B + leftRotate(F, MD5_S[i])) | 0
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0
  }

  // MD5 规范要求 32 位字按 little-endian 字节序输出
  const toHex = (n) => {
    let s = ''
    for (let i = 0; i < 4; i++) {
      s += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0')
    }
    return s
  }
  return toHex(a0) + toHex(b0) + toHex(c0) + toHex(d0)
}

// SHA-1 / SHA-256 / SHA-512 通过 WebCrypto 实现
async function sha(algorithm, input) {
  const data = new TextEncoder().encode(input)
  const buf = await crypto.subtle.digest(algorithm, data)
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function md5Hex(text) {
  return md5(text)
}

export function sha1Hex(text) {
  return sha('SHA-1', text)
}

export function sha256Hex(text) {
  return sha('SHA-256', text)
}

export function sha512Hex(text) {
  return sha('SHA-512', text)
}

// 计算文本哈希，algo: MD5 | SHA-1 | SHA-256 | SHA-512
export async function hashText(text, algo = 'MD5') {
  if (algo === 'MD5') return md5Hex(text)
  const map = { 'SHA-1': 'SHA-1', 'SHA-256': 'SHA-256', 'SHA-512': 'SHA-512' }
  return sha(map[algo] || 'SHA-256', text)
}
