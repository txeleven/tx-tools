// JS 简单压缩：移除注释与多余空白，不破坏语义
export function minifyJs(code) {
  let out = code

  // 移除行注释（保留字符串内）
  out = stripJsComments(out)

  // 移除多余空白（保留字符串）
  out = out.replace(/\s*([,;{}()[\]=+\-*/%<>&|!?:.])\s*/g, '$1')

  // 移除开头的 ; 与结尾空白
  out = out.replace(/^;+/, '').trim()
  return out
}

function stripJsComments(code) {
  let result = ''
  let i = 0
  const n = code.length
  let inString = null
  while (i < n) {
    const ch = code[i]
    const next = code[i + 1]
    if (inString) {
      result += ch
      if (ch === '\\') {
        result += code[i + 1]
        i += 2
        continue
      }
      if (ch === inString) inString = null
      i++
      continue
    }
    if (ch === '"' || ch === "'" || ch === '`') {
      inString = ch
      result += ch
      i++
      continue
    }
    if (ch === '/' && next === '/') {
      while (i < n && code[i] !== '\n') i++
      continue
    }
    if (ch === '/' && next === '*') {
      i += 2
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) i++
      i += 2
      continue
    }
    result += ch
    i++
  }
  return result
}

// CSS 简单压缩
export function minifyCss(css) {
  let out = stripBlockComments(css)
    .replace(/\s+/g, ' ')
    .replace(/\s*([{};:,])\s*/g, '$1')
    .replace(/;}/g, '}')
    .trim()
  return out
}

function stripBlockComments(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '')
}

// HTML 简单压缩：移除注释、多余空白、压缩标签间空白
export function minifyHtml(html) {
  let out = html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/>\s+</g, '><')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s*=\s*"/g, '="')
    .trim()
  return out
}
