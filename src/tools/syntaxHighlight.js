function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

// 预编译为 sticky 正则（y 标志），直接在原串按 lastIndex 匹配，避免 slice 导致的 O(n^2)
function tokenize(code, grammar) {
  const compiled = grammar.map(({ type, regex }) => ({
    type,
    re: new RegExp(regex.source, regex.flags.replace('g', '').replace('y', '') + 'y'),
  }))
  const tokens = []
  let i = 0
  while (i < code.length) {
    let matched = false
    for (const { type, re } of compiled) {
      re.lastIndex = i
      const m = re.exec(code)
      if (m) {
        tokens.push({ type, value: m[0] })
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
      } else {
        tokens.push({ type: 'text', value: ch })
      }
      i++
    }
  }
  return tokens
}

// 统一的 token -> 高亮类名映射（与 highlightJs 输出保持一致）
const TYPE_CLASS = {
  comment: 'hl-comment',
  string: 'hl-str',
  number: 'hl-num',
  keyword: 'hl-kw',
  function: 'hl-func',
  tag: 'hl-tag',
  attr: 'hl-attr',
  property: 'hl-property',
  variable: 'hl-var',
}

function highlightGeneric(code, grammar) {
  const tokens = tokenize(code, grammar)
  return tokens
    .map((t) => {
      const val = escapeHtml(t.value)
      if (t.type === 'text') return val
      return `<span class="${TYPE_CLASS[t.type] || 'hl-text'}">${val}</span>`
    })
    .join('')
}

const jsGrammar = [
  { type: 'comment', regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\// },
  { type: 'string', regex: /`(?:[^`\\]|\\.|\\\n)*`|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
  { type: 'number', regex: /\b0x[\da-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/ },
  { type: 'keyword', regex: /\b(?:const|let|var|function|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|class|extends|import|export|from|async|await|typeof|instanceof|in|of|true|false|null|undefined)\b/ },
  { type: 'function', regex: /\b[A-Za-z_$][\w$]*(?=\()/ },
]

const cssGrammar = [
  { type: 'comment', regex: /\/\*[\s\S]*?\*\// },
  { type: 'string', regex: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
  { type: 'number', regex: /-?\b\d+(?:\.\d+)?(?:px|em|rem|%|s|ms|deg|vh|vw|pt|pc|ex|ch|fr)?\b/ },
  { type: 'keyword', regex: /\b(?:html|body|div|span|a|p|h[1-6]|ul|ol|li|input|button|form|table|tr|td|th|head|body|style|script|class|id)\b/ },
  { type: 'property', regex: /[\w-]+(?=\s*:)/ },
]

const htmlGrammar = [
  { type: 'comment', regex: /<!--[\s\S]*?-->/ },
  { type: 'string', regex: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
  { type: 'tag', regex: /<\/?[\w:-]+/ },
  { type: 'attr', regex: /\b[\w:-]+(?=\s*=)/ },
]

const sqlGrammar = [
  { type: 'comment', regex: /--[^\n]*|\/\*[\s\S]*?\*\// },
  { type: 'string', regex: /'(?:[^']|'')*'|"(?:[^"]|"")*"/ },
  { type: 'number', regex: /\b\d+(?:\.\d+)?\b/ },
  { type: 'keyword', regex: /\b(?:SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|ON|GROUP|ORDER|BY|HAVING|LIMIT|OFFSET|AND|OR|NOT|NULL|IS|IN|EXISTS|BETWEEN|LIKE|AS|CREATE|TABLE|DROP|ALTER|INDEX|VALUES|UNION|ALL|DISTINCT|CASE|WHEN|THEN|ELSE|END|IF|PRIMARY|KEY|FOREIGN|REFERENCES)\b/i },
]

const xmlGrammar = [
  { type: 'comment', regex: /<!--[\s\S]*?-->/ },
  { type: 'string', regex: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
  { type: 'tag', regex: /<\/?[\w:-]+/ },
  { type: 'attr', regex: /\b[\w:-]+(?=\s*=)/ },
]

const phpGrammar = [
  { type: 'comment', regex: /\/\/[^\n]*|\/\*[\s\S]*?\*\/|#[^\n]*/ },
  { type: 'string', regex: /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
  { type: 'number', regex: /\b0[xX][\da-fA-F]+\b|\b\d+(?:\.\d+)?\b/ },
  { type: 'variable', regex: /\$[A-Za-z_]\w*/ },
  { type: 'keyword', regex: /<\?php|\?>|\b(?:function|return|if|else|elseif|endif|for|foreach|as|while|do|switch|case|break|continue|default|try|catch|finally|throw|new|class|interface|trait|extends|implements|public|private|protected|static|final|abstract|const|use|namespace|require|require_once|include|include_once|echo|print|true|false|null|and|or|not|xor|array|list|global|isset|empty|unset|exit|die|match|fn)\b/ },
  { type: 'function', regex: /\b[A-Za-z_]\w*(?=\()/ },
]

const pythonGrammar = [
  { type: 'comment', regex: /#[^\n]*/ },
  { type: 'string', regex: /"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/ },
  { type: 'number', regex: /\b0[xX][\da-fA-F]+\b|\b\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/ },
  { type: 'keyword', regex: /\b(?:and|as|assert|async|await|break|class|continue|def|del|elif|else|except|False|finally|for|from|global|if|import|in|is|lambda|None|nonlocal|not|or|pass|raise|return|True|try|while|with|yield)\b/ },
  { type: 'function', regex: /\b[A-Za-z_]\w*(?=\()/ },
]

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

export function highlightJs(code) {
  if (!code) return escapeHtml(code)
  const classMap = { keyword: 'hl-kw', string: 'hl-str', function: 'hl-func', number: 'hl-num', comment: 'hl-comment' }
  const tokens = tokenize(code, jsGrammar)
  return tokens
    .map((t) => {
      const val = escapeHtml(t.value)
      const cls = classMap[t.type]
      return cls ? `<span class="${cls}">${val}</span>` : val
    })
    .join('')
}

export function highlight(code, language) {
  if (!code) return ''
  switch (language) {
    case 'javascript':
    case 'js':
      return `<code class="lang-js">${highlightGeneric(code, jsGrammar)}</code>`
    case 'json':
      return `<code class="lang-json">${highlightGeneric(code, [
        { type: 'string', regex: /"(?:[^"\\]|\\.)*"/ },
        { type: 'number', regex: /\b-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?\b/ },
        { type: 'keyword', regex: /\b(true|false|null)\b/ },
      ])}</code>`
    case 'css':
      return `<code class="lang-css">${highlightGeneric(code, cssGrammar)}</code>`
    case 'html':
      return `<code class="lang-html">${highlightGeneric(code, htmlGrammar)}</code>`
    case 'sql':
      return `<code class="lang-sql">${highlightGeneric(code, sqlGrammar)}</code>`
    case 'xml':
      return `<code class="lang-xml">${highlightGeneric(code, xmlGrammar)}</code>`
    case 'php':
      return `<code class="lang-php">${highlightGeneric(code, phpGrammar)}</code>`
    case 'python':
    case 'py':
      return `<code class="lang-python">${highlightGeneric(code, pythonGrammar)}</code>`
    default:
      return `<code>${escapeHtml(code)}</code>`
  }
}
