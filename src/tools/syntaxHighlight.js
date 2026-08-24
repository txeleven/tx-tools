// 通用轻量语法高亮：原生 JS，无第三方依赖

function escapeHtml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

// 各语言 token 正则（顺序即优先级）
const jsGrammar = [
  ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
  ['string', /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|`(?:\\.|[^`\\])*`?/],
  ['number', /\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/],
  ['keyword', /\b(?:const|let|var|function|return|if|else|for|while|do|break|continue|new|typeof|instanceof|class|extends|import|export|default|from|async|await|try|catch|finally|throw|switch|case|null|undefined|true|false|this|super|static|get|set|of|in|delete|void|yield)\b/],
  ['function', /[A-Za-z_$][\w$]*(?=\s*\()/],
]

const cssGrammar = [
  ['comment', /\/\*[\s\S]*?\*\//],
  ['string', /"[^"\n]*"|'[^'\n]*'/],
  ['number', /#[0-9a-fA-F]{3,8}\b|\b\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|fr|deg)?\b/],
  ['keyword', /@(?:media|keyframes|import|font-face|supports)[\w-]*/],
  ['property', /[a-zA-Z-]+(?=\s*:)/],
  ['function', /[a-zA-Z-]+(?=\()/],
]

const htmlGrammar = [
  ['comment', /<!--[\s\S]*?-->/],
  ['string', /"[^"\n]*"|'[^'\n]*'/],
  ['tag', /<\/?[a-zA-Z][\w-]*|\/?>/],
  ['attr', /[a-zA-Z-]+(?==)/],
]

const sqlGrammar = [
  ['comment', /--[^\n]*/],
  ['string', /'(?:[^'\n]|'')*'?/],
  ['number', /\b\d+(?:\.\d+)?\b/],
  ['keyword', /\b(?:SELECT|FROM|WHERE|INSERT|INTO|VALUES|UPDATE|SET|DELETE|CREATE|TABLE|DROP|ALTER|ADD|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|BY|ORDER|LIMIT|OFFSET|AS|AND|OR|NOT|NULL|PRIMARY|KEY|DEFAULT|UNIQUE|INDEX|INT|VARCHAR|TEXT|DATE)\b/i],
  ['function', /[A-Za-z_][\w]*(?=\s*\()/],
]

const xmlGrammar = [
  ['comment', /<!--[\s\S]*?-->/],
  ['string', /"[^"\n]*"|'[^'\n]*'/],
  ['tag', /<\/?[a-zA-Z][\w.-]*|\/?>|\?>/],
  ['attr', /[a-zA-Z_:][\w.-]*(?==)/],
]

const phpGrammar = [
  ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*/],
  ['string', /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?/],
  ['number', /\b\d+(?:\.\d+)?\b/],
  ['variable', /\$[A-Za-z_][\w]*/],
  ['keyword', /\b(?:function|return|if|else|elseif|foreach|while|do|for|break|continue|new|class|extends|implements|use|namespace|public|private|protected|static|const|echo|print|require|include|try|catch|finally|throw|switch|case|null|true|false|this|self|parent|as|global|isset|unset|array|fn)\b/],
  ['function', /[A-Za-z_][\w]*(?=\s*\()/],
]

const pythonGrammar = [
  ['comment', /#[^\n]*/],
  ['string', /"(?:\\.|[^"\\\n])*"?|'(?:\\.|[^'\\\n])*'?|"""[\s\S]*?"""|'''[\s\S]*?'''/],
  ['number', /\b(?:0x[\da-fA-F]+|\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)\b/],
  ['keyword', /\b(?:def|class|return|if|elif|else|for|while|break|continue|import|from|as|with|try|except|finally|raise|pass|lambda|None|True|False|self|global|nonlocal|assert|del|in|is|not|and|or|yield|async|await|print)\b/],
  ['function', /[A-Za-z_][\w]*(?=\s*\()/],
]

const jsonGrammar = [
  ['comment', /\/\/[^\n]*|\/\*[\s\S]*?\*\//],
  ['string', /"(?:\\.|[^"\\\n])*"?/],
  ['number', /-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/],
  ['keyword', /\b(?:true|false|null)\b/],
]

const GRAMMARS = {
  js: jsGrammar,
  javascript: jsGrammar,
  json: jsonGrammar,
  css: cssGrammar,
  html: htmlGrammar,
  sql: sqlGrammar,
  xml: xmlGrammar,
  php: phpGrammar,
  python: pythonGrammar,
  py: pythonGrammar,
}

// 根据语言与内容选择实际使用的 grammar（js 内容若是 JSON 则切到 json）
function resolveGrammar(code, language) {
  if (language === 'js' || language === 'javascript') {
    const t = code.trim().replace(/^\uFEFF/, '')
    if (t.startsWith('{') || t.startsWith('[')) return jsonGrammar
  }
  return GRAMMARS[language] || null
}

function tokenize(code, grammar) {
  const compiled = grammar.map(([type, src]) => ({ type, re: new RegExp(src, 'gy') }))
  const tokens = []
  let i = 0
  while (i < code.length) {
    let matched = false
    for (const { type, re } of compiled) {
      re.lastIndex = i
      const m = re.exec(code)
      if (m) {
        tokens.push({ type, value: m[0], start: i, end: i + m[0].length })
        i += m[0].length
        matched = true
        break
      }
    }
    if (!matched) {
      const last = tokens[tokens.length - 1]
      const ch = code[i]
      if (last && last.type === 'text') {
        last.value += ch
        last.end = i + 1
      } else {
        tokens.push({ type: 'text', value: ch, start: i, end: i + 1 })
      }
      i++
    }
  }
  return tokens
}

const TYPE_CLASS = {
  keyword: 'hl-kw',
  string: 'hl-str',
  number: 'hl-num',
  function: 'hl-func',
  comment: 'hl-comment',
  tag: 'hl-tag',
  attr: 'hl-attr',
  property: 'hl-property',
  variable: 'hl-var',
}

export function highlight(code, language) {
  if (!code || !language) return escapeHtml(code || '')
  const trimmed = code.trim()
  if (!trimmed) return escapeHtml(code)
  const grammar = resolveGrammar(code, language)
  if (!grammar) return escapeHtml(code)
  return tokenize(code, grammar)
    .map(({ type, value }) => {
      const cls = TYPE_CLASS[type]
      const esc = escapeHtml(value)
      return cls ? `<span class="${cls}">${esc}</span>` : esc
    })
    .join('')
}

// 返回各高亮 token 的文本范围（不改 DOM，供 CSS Custom Highlight API 使用）
export function getHighlightTokens(code, language) {
  if (!code || !language) return []
  const trimmed = code.trim()
  if (!trimmed) return []
  const grammar = resolveGrammar(code, language)
  if (!grammar) return []
  return tokenize(code, grammar)
    .filter((t) => t.type !== 'text' && TYPE_CLASS[t.type])
    .map((t) => ({ start: t.start, end: t.end, type: TYPE_CLASS[t.type] }))
}

// 简单 PHP 格式化：基于大括号配平的缩进
export function formatPhp(code) {
  const lines = code.split(/\r?\n/)
  const out = []
  let indent = 0
  const indentStr = '    '
  for (const raw of lines) {
    const trimmed = raw.trim()
    if (!trimmed) continue
    if (/^[\]\}\)]/.test(trimmed) && indent > 0) indent--
    out.push(indentStr.repeat(Math.max(0, indent)) + trimmed)
    const open = (trimmed.match(/\{/g) || []).length
    const close = (trimmed.match(/\}/g) || []).length
    indent += open - close
  }
  return out.join('\n')
}

// 自定义的 JavaScript 语法高亮，返回 HTML
export function highlightJs(code) {
  if (!code) return escapeHtml(code)

  const classMap = {
    keyword: 'hl-kw',
    string: 'hl-str',
    function: 'hl-func',
    number: 'hl-num',
    comment: 'hl-comment',
  }

  const tokens = tokenize(code, jsGrammar)
  return tokens
    .map((t) => {
      if (t.type === 'text') return escapeHtml(t.value)
      const cls = classMap[t.type]
      return cls ? `<span class="${cls}">${escapeHtml(t.value)}</span>` : escapeHtml(t.value)
    })
    .join('')
}
