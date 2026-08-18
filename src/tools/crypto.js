// 纯手写加解密：XOR / RC4 / AES-128-CBC
// 三端互通约定（与 cryptoCode.js 中展示的 JS / PHP / Python 代码完全一致）：
//   XOR: 输出 = Base64( 明文UTF-8字节 XOR 密钥字节循环 )
//   RC4: 输出 = Base64( 密钥流异或后的字节 )（加解密过程相同）
//   AES: 输出 = Base64( 16字节随机IV + PKCS7填充后的密文 )
//
// 对外仅暴露两个单函数：
//   encrypt(algorithm, text, key)  -> string (Base64)
//   decrypt(algorithm, b64, key)   -> string (明文)

const B64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'

// ---------------- UTF-8 编解码（私有） ----------------
function utf8ToBytes(str) {
  const bytes = []
  for (let i = 0; i < str.length; i++) {
    let code = str.codePointAt(i)
    if (code > 0xffff) i++
    if (code < 0x80) bytes.push(code)
    else if (code < 0x800) bytes.push(0xc0 | (code >> 6), 0x80 | (code & 0x3f))
    else if (code < 0x10000) bytes.push(0xe0 | (code >> 12), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
    else bytes.push(0xf0 | (code >> 18), 0x80 | ((code >> 12) & 0x3f), 0x80 | ((code >> 6) & 0x3f), 0x80 | (code & 0x3f))
  }
  return bytes
}

function bytesToUtf8(bytes) {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  if (typeof TextDecoder !== 'undefined') return new TextDecoder('utf-8').decode(arr)
  let out = ''
  for (let i = 0; i < arr.length; i++) {
    let c = arr[i]
    if (c < 0x80) out += String.fromCharCode(c)
    else if (c < 0xe0) out += String.fromCharCode(((c & 0x1f) << 6) | (arr[++i] & 0x3f))
    else if (c < 0xf0) out += String.fromCharCode(((c & 0x0f) << 12) | ((arr[++i] & 0x3f) << 6) | (arr[++i] & 0x3f))
    else {
      const cp = ((c & 0x07) << 18) | ((arr[++i] & 0x3f) << 12) | ((arr[++i] & 0x3f) << 6) | (arr[++i] & 0x3f)
      out += String.fromCodePoint(cp)
    }
  }
  return out
}

// ---------------- Base64 编解码（私有） ----------------
function bytesToBase64(bytes) {
  let out = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i]
    const b1 = i + 1 < bytes.length ? bytes[i + 1] : 0
    const b2 = i + 2 < bytes.length ? bytes[i + 2] : 0
    out += B64_CHARS[b0 >> 2]
    out += B64_CHARS[((b0 & 3) << 4) | (b1 >> 4)]
    out += i + 1 < bytes.length ? B64_CHARS[((b1 & 15) << 2) | (b2 >> 6)] : '='
    out += i + 2 < bytes.length ? B64_CHARS[b2 & 63] : '='
  }
  return out
}

function base64ToBytes(b64) {
  b64 = String(b64).replace(/\s+/g, '')
  const bytes = []
  let buffer = 0
  let bits = 0
  for (let i = 0; i < b64.length; i++) {
    const ch = b64[i]
    if (ch === '=') break
    const val = B64_CHARS.indexOf(ch)
    if (val === -1) throw new Error('Invalid Base64 input')
    buffer = (buffer << 6) | val
    bits += 6
    if (bits >= 8) {
      bits -= 8
      bytes.push((buffer >> bits) & 0xff)
    }
  }
  return bytes
}

// ---------------- XOR + Base64（加解密同过程） ----------------
function xorCrypt(bytes, key) {
  const k = utf8ToBytes(key)
  if (!k.length) throw new Error('Key cannot be empty')
  return bytes.map((b, i) => b ^ k[i % k.length])
}

// ---------------- RC4 ----------------
function rc4Process(input, key) {
  const k = utf8ToBytes(key)
  if (!k.length) throw new Error('Key cannot be empty')
  const S = []
  for (let i = 0; i < 256; i++) S[i] = i
  let j = 0
  for (let i = 0; i < 256; i++) {
    j = (j + S[i] + k[i % k.length]) & 0xff
    ;[S[i], S[j]] = [S[j], S[i]]
  }
  let i = 0
  j = 0
  const out = new Array(input.length)
  for (let n = 0; n < input.length; n++) {
    i = (i + 1) & 0xff
    j = (j + S[i]) & 0xff
    ;[S[i], S[j]] = [S[j], S[i]]
    out[n] = input[n] ^ S[(S[i] + S[j]) & 0xff]
  }
  return out
}

// ---------------- AES-128-CBC（纯手写，私有） ----------------
const SBOX = [
  0x63, 0x7c, 0x77, 0x7b, 0xf2, 0x6b, 0x6f, 0xc5, 0x30, 0x01, 0x67, 0x2b, 0xfe, 0xd7, 0xab, 0x76,
  0xca, 0x82, 0xc9, 0x7d, 0xfa, 0x59, 0x47, 0xf0, 0xad, 0xd4, 0xa2, 0xaf, 0x9c, 0xa4, 0x72, 0xc0,
  0xb7, 0xfd, 0x93, 0x26, 0x36, 0x3f, 0xf7, 0xcc, 0x34, 0xa5, 0xe5, 0xf1, 0x71, 0xd8, 0x31, 0x15,
  0x04, 0xc7, 0x23, 0xc3, 0x18, 0x96, 0x05, 0x9a, 0x07, 0x12, 0x80, 0xe2, 0xeb, 0x27, 0xb2, 0x75,
  0x09, 0x83, 0x2c, 0x1a, 0x1b, 0x6e, 0x5a, 0xa0, 0x52, 0x3b, 0xd6, 0xb3, 0x29, 0xe3, 0x2f, 0x84,
  0x53, 0xd1, 0x00, 0xed, 0x20, 0xfc, 0xb1, 0x5b, 0x6a, 0xcb, 0xbe, 0x39, 0x4a, 0x4c, 0x58, 0xcf,
  0xd0, 0xef, 0xaa, 0xfb, 0x43, 0x4d, 0x33, 0x85, 0x45, 0xf9, 0x02, 0x7f, 0x50, 0x3c, 0x9f, 0xa8,
  0x51, 0xa3, 0x40, 0x8f, 0x92, 0x9d, 0x38, 0xf5, 0xbc, 0xb6, 0xda, 0x21, 0x10, 0xff, 0xf3, 0xd2,
  0xcd, 0x0c, 0x13, 0xec, 0x5f, 0x97, 0x44, 0x17, 0xc4, 0xa7, 0x7e, 0x3d, 0x64, 0x5d, 0x19, 0x73,
  0x60, 0x81, 0x4f, 0xdc, 0x22, 0x2a, 0x90, 0x88, 0x46, 0xee, 0xb8, 0x14, 0xde, 0x5e, 0x0b, 0xdb,
  0xe0, 0x32, 0x3a, 0x0a, 0x49, 0x06, 0x24, 0x5c, 0xc2, 0xd3, 0xac, 0x62, 0x91, 0x95, 0xe4, 0x79,
  0xe7, 0xc8, 0x37, 0x6d, 0x8d, 0xd5, 0x4e, 0xa9, 0x6c, 0x56, 0xf4, 0xea, 0x65, 0x7a, 0xae, 0x08,
  0xba, 0x78, 0x25, 0x2e, 0x1c, 0xa6, 0xb4, 0xc6, 0xe8, 0xdd, 0x74, 0x1f, 0x4b, 0xbd, 0x8b, 0x8a,
  0x70, 0x3e, 0xb5, 0x66, 0x48, 0x03, 0xf6, 0x0e, 0x61, 0x35, 0x57, 0xb9, 0x86, 0xc1, 0x1d, 0x9e,
  0xe1, 0xf8, 0x98, 0x11, 0x69, 0xd9, 0x8e, 0x94, 0x9b, 0x1e, 0x87, 0xe9, 0xce, 0x55, 0x28, 0xdf,
  0x8c, 0xa1, 0x89, 0x0d, 0xbf, 0xe6, 0x42, 0x68, 0x41, 0x99, 0x2d, 0x0f, 0xb0, 0x54, 0xbb, 0x16
]

const INV_SBOX = new Array(256)
for (let i = 0; i < 256; i++) INV_SBOX[SBOX[i]] = i

const RCON = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80, 0x1b, 0x36]

function xtime(x) {
  return ((x << 1) ^ (x & 0x80 ? 0x1b : 0)) & 0xff
}

function gmul(a, b) {
  let res = 0
  while (b) {
    if (b & 1) res ^= a
    a = xtime(a)
    b >>= 1
  }
  return res
}

// 16字节密钥 -> 176字节轮密钥
function expandKey(keyBytes) {
  const w = new Array(176)
  for (let i = 0; i < 16; i++) w[i] = keyBytes[i]
  let rcon = 0
  for (let i = 16; i < 176; i += 4) {
    let t0 = w[i - 4], t1 = w[i - 3], t2 = w[i - 2], t3 = w[i - 1]
    if (i % 16 === 0) {
      const tmp = t0
      t0 = t1; t1 = t2; t2 = t3; t3 = tmp
      t0 = SBOX[t0] ^ RCON[rcon++]
      t1 = SBOX[t1]
      t2 = SBOX[t2]
      t3 = SBOX[t3]
    }
    w[i] = w[i - 16] ^ t0
    w[i + 1] = w[i - 15] ^ t1
    w[i + 2] = w[i - 14] ^ t2
    w[i + 3] = w[i - 13] ^ t3
  }
  return w
}

function addRoundKey(state, w, round) {
  const off = round * 16
  for (let i = 0; i < 16; i++) state[i] ^= w[off + i]
}

function shiftRows(s, inv) {
  for (let r = 1; r < 4; r++) {
    const row = [s[r], s[r + 4], s[r + 8], s[r + 12]]
    for (let c = 0; c < 4; c++) {
      s[r + 4 * c] = inv ? row[(c - r + 4) % 4] : row[(c + r) % 4]
    }
  }
}

function mixColumns(s) {
  for (let c = 0; c < 4; c++) {
    const i = c * 4
    const a0 = s[i], a1 = s[i + 1], a2 = s[i + 2], a3 = s[i + 3]
    s[i] = xtime(a0) ^ (xtime(a1) ^ a1) ^ a2 ^ a3
    s[i + 1] = a0 ^ xtime(a1) ^ (xtime(a2) ^ a2) ^ a3
    s[i + 2] = a0 ^ a1 ^ xtime(a2) ^ (xtime(a3) ^ a3)
    s[i + 3] = (xtime(a0) ^ a0) ^ a1 ^ a2 ^ xtime(a3)
  }
}

function invMixColumns(s) {
  for (let c = 0; c < 4; c++) {
    const i = c * 4
    const a0 = s[i], a1 = s[i + 1], a2 = s[i + 2], a3 = s[i + 3]
    s[i] = gmul(a0, 14) ^ gmul(a1, 11) ^ gmul(a2, 13) ^ gmul(a3, 9)
    s[i + 1] = gmul(a0, 9) ^ gmul(a1, 14) ^ gmul(a2, 11) ^ gmul(a3, 13)
    s[i + 2] = gmul(a0, 13) ^ gmul(a1, 9) ^ gmul(a2, 14) ^ gmul(a3, 11)
    s[i + 3] = gmul(a0, 11) ^ gmul(a1, 13) ^ gmul(a2, 9) ^ gmul(a3, 14)
  }
}

function encryptBlock(state, w) {
  addRoundKey(state, w, 0)
  for (let round = 1; round < 10; round++) {
    for (let i = 0; i < 16; i++) state[i] = SBOX[state[i]]
    shiftRows(state, false)
    mixColumns(state)
    addRoundKey(state, w, round)
  }
  for (let i = 0; i < 16; i++) state[i] = SBOX[state[i]]
  shiftRows(state, false)
  addRoundKey(state, w, 10)
}

function decryptBlock(state, w) {
  addRoundKey(state, w, 10)
  for (let round = 9; round >= 1; round--) {
    shiftRows(state, true)
    for (let i = 0; i < 16; i++) state[i] = INV_SBOX[state[i]]
    addRoundKey(state, w, round)
    invMixColumns(state)
  }
  shiftRows(state, true)
  for (let i = 0; i < 16; i++) state[i] = INV_SBOX[state[i]]
  addRoundKey(state, w, 0)
}

function randomBytes(n) {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const arr = new Uint8Array(n)
    crypto.getRandomValues(arr)
    return Array.from(arr)
  }
  const arr = []
  for (let i = 0; i < n; i++) arr.push(Math.floor(Math.random() * 256))
  return arr
}

function getKeyBytes(key) {
  const k = utf8ToBytes(key)
  if (k.length !== 16) throw new Error('AES-128 requires a 16-byte (UTF-8) key')
  return k
}

function aesEncrypt(text, key) {
  const keyBytes = getKeyBytes(key)
  const data = utf8ToBytes(text)
  // PKCS7 填充
  const padLen = 16 - (data.length % 16)
  for (let i = 0; i < padLen; i++) data.push(padLen)
  const w = expandKey(keyBytes)
  const iv = randomBytes(16)
  const out = iv.slice()
  let prev = iv.slice()
  for (let i = 0; i < data.length; i += 16) {
    const block = data.slice(i, i + 16)
    const state = block.map((b, j) => b ^ prev[j])
    encryptBlock(state, w)
    out.push(...state)
    prev = state
  }
  return bytesToBase64(out)
}

function aesDecrypt(b64, key) {
  const keyBytes = getKeyBytes(key)
  const all = base64ToBytes(b64)
  if (all.length < 32 || (all.length - 16) % 16 !== 0) throw new Error('Invalid ciphertext length')
  const iv = all.slice(0, 16)
  const data = all.slice(16)
  const w = expandKey(keyBytes)
  const out = []
  let prev = iv
  for (let i = 0; i < data.length; i += 16) {
    const block = data.slice(i, i + 16)
    const state = block.slice()
    decryptBlock(state, w)
    for (let j = 0; j < 16; j++) state[j] ^= prev[j]
    out.push(...state)
    prev = block
  }
  const padLen = out[out.length - 1]
  if (padLen < 1 || padLen > 16) throw new Error('Invalid PKCS7 padding')
  out.length -= padLen
  return bytesToUtf8(out)
}

// ---------------- 统一单函数入口 ----------------
export const algorithms = ['xor', 'rc4', 'aes']

export function encrypt(algorithm, text, key) {
  switch (algorithm) {
    case 'xor':
      return bytesToBase64(xorCrypt(utf8ToBytes(text), key))
    case 'rc4':
      return bytesToBase64(rc4Process(utf8ToBytes(text), key))
    case 'aes':
      return aesEncrypt(text, key)
    default:
      throw new Error('Unknown algorithm: ' + algorithm)
  }
}

export function decrypt(algorithm, b64, key) {
  switch (algorithm) {
    case 'xor':
      return bytesToUtf8(xorCrypt(base64ToBytes(b64), key))
    case 'rc4':
      return bytesToUtf8(rc4Process(base64ToBytes(b64), key))
    case 'aes':
      return aesDecrypt(b64, key)
    default:
      throw new Error('Unknown algorithm: ' + algorithm)
  }
}
