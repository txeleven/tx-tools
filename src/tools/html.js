// HTML 实体编解码 & Unicode 转义工具

// HTML 编码（转义特殊字符）
export function encodeHtml(text, { all = false } = {}) {
  if (all) {
    // 全部非 ASCII 字符转实体
    return [...text].map((c) => {
      const code = c.codePointAt(0)
      if (code < 128) {
        const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
        return map[c] || c
      }
      return `&#${code};`
    }).join('')
  }
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

// HTML 解码
export function decodeHtml(text) {
  const doc = new DOMParser().parseFromString(text, 'text/html')
  return doc.documentElement.textContent
}

// Unicode 转义（\uXXXX）
export function toUnicodeEscape(text) {
  return [...text]
    .map((c) => {
      const code = c.codePointAt(0)
      if (code > 0xffff) {
        // 代理对
        const hi = Math.floor((code - 0x10000) / 0x400) + 0xd800
        const lo = ((code - 0x10000) % 0x400) + 0xdc00
        return `\\u${hi.toString(16).padStart(4, '0')}\\u${lo.toString(16).padStart(4, '0')}`
      }
      if (code < 0x80 && /[A-Za-z0-9!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?\s]/.test(c)) return c
      return `\\u${code.toString(16).padStart(4, '0')}`
    })
    .join('')
}

// Unicode 反转义（\uXXXX / \u{XXXX}）
export function fromUnicodeEscape(text) {
  return text
    .replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\n/g, '\n')
    .replace(/\\t/g, '\t')
    .replace(/\\r/g, '\r')
    .replace(/\\\\/g, '\\')
}

// 字符串 -> 十六进制
export function strToHex(text, { separator = '' } = {}) {
  return [...new TextEncoder().encode(text)].map((b) => b.toString(16).padStart(2, '0')).join(separator)
}

// 十六进制 -> 字符串
export function hexToStr(hex) {
  const clean = hex.replace(/\s+/g, '').replace(/^0x/i, '')
  if (clean.length % 2 !== 0) throw new Error('hex length must be even')
  const bytes = new Uint8Array(clean.length / 2)
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(clean.substr(i * 2, 2), 16)
  return new TextDecoder().decode(bytes)
}

// 字符 -> Unicode 码点
export function charToCodePoint(ch) {
  const code = ch.codePointAt(0)
  return {
    codePoint: code,
    hex: code.toString(16).toUpperCase().padStart(4, '0'),
    utf8: [...new TextEncoder().encode(ch)].map((b) => '0x' + b.toString(16)).join(' '),
  }
}
