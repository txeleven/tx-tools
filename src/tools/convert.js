// 命名风格转换 & 进制转换 & 颜色转换

// ---------- 命名风格 ----------
// 将任意输入拆分为单词数组
function splitWords(text) {
  return text
    .replace(/([a-z\d])([A-Z])/g, '$1 $2') // camelCase -> 拆分
    .replace(/[_\-\s.]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
}

export function toCamelCase(text) {
  const words = splitWords(text)
  return words.map((w, i) => (i === 0 ? w.toLowerCase() : w[0].toUpperCase() + w.slice(1).toLowerCase())).join('')
}

export function toPascalCase(text) {
  return splitWords(text).map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase()).join('')
}

export function toSnakeCase(text) {
  return splitWords(text).map((w) => w.toLowerCase()).join('_')
}

export function toKebabCase(text) {
  return splitWords(text).map((w) => w.toLowerCase()).join('-')
}

export function toConstantCase(text) {
  return splitWords(text).map((w) => w.toUpperCase()).join('_')
}

export function toSentenceCase(text) {
  const words = splitWords(text)
  if (!words.length) return ''
  return words[0][0].toUpperCase() + words[0].slice(1).toLowerCase() + words.slice(1).map((w) => w.toLowerCase()).join(' ')
}

// ---------- 进制转换 ----------
export function radixConvert(value, fromBase, toBase) {
  const cleaned = String(value).trim().replace(/^[+-]?(0[xob])/, '')
  const num = parseInt(cleaned, fromBase)
  if (Number.isNaN(num)) throw new Error('invalid number')
  return num.toString(toBase)
}

// ---------- 颜色转换 ----------
function clamp(n, min = 0, max = 255) {
  return Math.max(min, Math.min(max, Math.round(n)))
}

function clampA(n) {
  return Math.max(0, Math.min(1, n))
}

function roundA(a) {
  return Number(clampA(a).toFixed(3))
}

// 解析颜色输入 -> RGB {r,g,b,a}（a 为 0-1 透明度，默认 1）
export function parseColor(input) {
  const s = String(input).trim().toLowerCase()
  // hex（支持 #rgb #rgba #rrggbb #rrggbbaa）
  let m = s.match(/^#?([0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/)
  if (m) {
    let hex = m[1]
    if (hex.length === 3 || hex.length === 4) hex = hex.split('').map((c) => c + c).join('')
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const a = hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
    return { r, g, b, a }
  }
  // rgb() / rgba()（支持逗号或空格分隔，分量可百分比，alpha 可小数或百分比）
  m = s.match(
    /^rgba?\(\s*([\d.]+)(%)?\s*[,\s/]\s*([\d.]+)(%)?\s*[,\s/]\s*([\d.]+)(%)?\s*(?:[,\s/]\s*([\d.]+)(%)?)?\s*\)$/
  )
  if (m) {
    const to255 = (v, pct) => (pct ? clamp((+v / 100) * 255) : clamp(+v))
    const r = to255(m[1], m[2])
    const g = to255(m[3], m[4])
    const b = to255(m[5], m[6])
    let a = 1
    if (m[7] !== undefined) a = m[8] ? +m[7] / 100 : clampA(+m[7])
    return { r, g, b, a }
  }
  // hsl() / hsla()
  m = s.match(/^hsla?\(\s*([\d.]+)(?:deg)?\s*[,\s]\s*([\d.]+)%\s*[,\s]\s*([\d.]+)%\s*(?:[,\s/]\s*([\d.]+)(%))?\s*\)$/)
  if (m) {
    const { r, g, b } = hslToRgb(+m[1], +m[2] / 100, +m[3] / 100)
    let a = 1
    if (m[4] !== undefined) a = m[5] ? +m[4] / 100 : clampA(+m[4])
    return { r, g, b, a }
  }
  throw new Error('无法识别的颜色格式')
}

export function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360
  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return { r: clamp((r + m) * 255), g: clamp((g + m) * 255), b: clamp((b + m) * 255) }
}

export function rgbToHsl({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0, s = 0
  const l = (max + min) / 2
  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) }
}

// HSV（色相/饱和度/明度，值域 h:0-360 s/v:0-100）
export function rgbToHsv({ r, g, b }) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const d = max - min
  let h = 0
  if (d) {
    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) * 60
    else if (max === g) h = ((b - r) / d + 2) * 60
    else h = ((r - g) / d + 4) * 60
  }
  const s = max ? d / max : 0
  return { h: Math.round(h), s: Math.round(s * 100), v: Math.round(max * 100) }
}

export function hsvToRgb({ h, s, v }) {
  h = ((h % 360) + 360) % 360
  s = clamp(s, 0, 100) / 100
  v = clamp(v, 0, 100) / 100
  const c = v * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = v - c
  let r = 0, g = 0, b = 0
  if (h < 60) { r = c; g = x }
  else if (h < 120) { r = x; g = c }
  else if (h < 180) { g = c; b = x }
  else if (h < 240) { g = x; b = c }
  else if (h < 300) { r = x; b = c }
  else { r = c; b = x }
  return { r: clamp((r + m) * 255), g: clamp((g + m) * 255), b: clamp((b + m) * 255) }
}

export function toHex({ r, g, b, a }, withHash = true) {
  const h = (n) => clamp(n).toString(16).padStart(2, '0')
  let out = `${h(r)}${h(g)}${h(b)}`
  if (a !== undefined && a < 1) out += h(a * 255)
  return `${withHash ? '#' : ''}${out}`
}

export function toRgb({ r, g, b, a }) {
  if (a !== undefined && a < 1) return `rgba(${clamp(r)}, ${clamp(g)}, ${clamp(b)}, ${roundA(a)})`
  return `rgb(${clamp(r)}, ${clamp(g)}, ${clamp(b)})`
}

export function toHsl({ r, g, b, a }) {
  const { h, s, l } = rgbToHsl({ r, g, b })
  if (a !== undefined && a < 1) return `hsla(${h}, ${s}%, ${l}%, ${roundA(a)})`
  return `hsl(${h}, ${s}%, ${l}%)`
}
