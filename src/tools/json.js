// JSON 工具：格式化 / 压缩 / 校验 / 排序

// 格式化 JSON，indent 可选 2/4 空格或 Tab
export function formatJson(text, indent = 2) {
  const parsed = parseJson(text)
  const space = indent === 'tab' ? '\t' : ' '.repeat(indent)
  return JSON.stringify(parsed, null, space)
}

// 压缩 JSON
export function minifyJson(text) {
  const parsed = parseJson(text)
  return JSON.stringify(parsed)
}

// 剥离 JSON 中不允许出现的不可见字符（BOM、零宽字符、字面控制字符等）
// 这些字符经常随复制粘贴混入，直接 JSON.parse 会失败
export function cleanJsonText(text) {
  return String(text)
    .replace(/^\uFEFF+/, '') // BOM
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '') // 字面控制字符
    .replace(/[\u200B\u200C\u200D\u2060\uFEFF]/g, '') // 零宽字符 / BOM 中段
    .trim()
}

// 修复复制粘贴常见污染：弯引号 -> 直引号，不间断/全角空格 -> 普通空格
function fixCommonIssues(text) {
  return text
    .replace(/[\u201C\u201D\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u2032\u2035]/g, "'")
    .replace(/[\u00A0\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
}

// 解析 JSON，抛出带错误位置的异常
export function parseJson(text) {
  const trimmed = cleanJsonText(text)
  if (!trimmed) throw new Error('empty')
  try {
    return JSON.parse(trimmed)
  } catch (e) {
    // 直接解析失败时，尝试修复常见复制污染后重试
    const fixed = fixCommonIssues(trimmed)
    if (fixed !== trimmed) {
      try {
        return JSON.parse(fixed)
      } catch {
        // 修复后仍失败，抛出原始错误
      }
    }
    throw new Error(e.message)
  }
}

// 校验 JSON 是否合法
export function isValidJson(text) {
  try {
    parseJson(text)
    return true
  } catch {
    return false
  }
}

// 对 JSON 对象的 key 排序（递归）
export function sortJson(text) {
  const parsed = parseJson(text)
  const sort = (val) => {
    if (Array.isArray(val)) return val.map(sort)
    if (val && typeof val === 'object') {
      const out = {}
      Object.keys(val)
        .sort()
        .forEach((k) => { out[k] = sort(val[k]) })
      return out
    }
    return val
  }
  return JSON.stringify(sort(parsed), null, 2)
}

// JSON -> TypeScript 接口定义
export function jsonToTs(text, name = 'RootObject') {
  const parsed = parseJson(text)

  const toTsType = (val) => {
    if (val === null) return 'any'
    if (Array.isArray(val)) {
      if (val.length === 0) return 'any[]'
      const inner = val.map(toTsType)
      // 取第一个非 any 类型作为元素类型
      const t = inner.find((x) => x !== 'any') || 'any'
      return `${t}[]`
    }
    switch (typeof val) {
      case 'string': return 'string'
      case 'number': return Number.isInteger(val) ? 'number' : 'number'
      case 'boolean': return 'boolean'
      case 'object': {
        const lines = Object.keys(val).map((k) => `  ${k}: ${toTsType(val[k])}`)
        return `{\n${lines.join(';\n')};\n}`
      }
      default: return 'any'
    }
  }

  const type = toTsType(parsed)
  const indent = (s) => s.split('\n').map((l) => '  ' + l).join('\n')
  return `interface ${name} ${indent(type)}`
}

// 统计 JSON 节点数量
export function countNodes(text) {
  let count = 0
  const walk = (val) => {
    count++
    if (Array.isArray(val)) val.forEach(walk)
    else if (val && typeof val === 'object') Object.values(val).forEach(walk)
  }
  walk(parseJson(text))
  return count
}
