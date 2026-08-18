// 简单的 JS 编码规范检测，返回问题列表
// 每项：{ line, column, message, severity: 'warn'|'error' }
export function lintJs(code) {
  const problems = []
  const lines = code.split('\n')

  const add = (lineNo, message, severity = 'warn') => {
    problems.push({ line: lineNo + 1, column: 0, message, severity })
  }

  lines.forEach((line, i) => {
    const trimmed = line.trim()

    // 跳过空行与纯注释行（仍检查行尾空格）
    const isCommentLine = /^\/\//.test(trimmed) || /^\/\*/.test(trimmed) || /^\*/.test(trimmed)

    // 1. 行尾空格
    if (/[ \t]+$/.test(line)) {
      add(i, 'Trailing whitespace detected (行尾有多余空格)')
    }

    // 2. 使用 == 而不是 ===（排除字符串内的简单情形）
    if (!isCommentLine && /(^|[^=!<>])\s*==\s*[^=]/.test(trimmed) && !/==\s*==/.test(trimmed)) {
      add(i, 'Use === instead of == (建议使用 === 严格相等)', 'error')
    }

    // 3. 使用 var 而不是 let/const
    if (!isCommentLine && /\bvar\s+[A-Za-z_$]/.test(trimmed)) {
      add(i, 'Use let/const instead of var (建议使用 let/const)', 'error')
    }

    // 4. 缺少分号（粗略判断：非注释、非块级、非 if/else/for/while/function 结尾、有实际语句）
    if (!isCommentLine && !/^\s*(if|else|for|while|do|function|switch|case|try|catch|return)\b/.test(trimmed)) {
      const isBlockEnd = /[{}]$/.test(trimmed)
      const isControl = /^(if|else|for|while|switch|catch|function)\s*\(?/.test(trimmed)
      const isEmptyOrComment = trimmed === '' || trimmed.startsWith('//') || trimmed.startsWith('/*')
      const hasSemi = /;+\s*(\/\/.*)?$/.test(trimmed)
      if (!isBlockEnd && !isControl && !isEmptyOrComment && !hasSemi) {
        // 排除"行首是闭合括号 + 空行"等边界
        add(i, 'Missing semicolon (缺少分号)')
      }
    }

    // 5. 未定义变量粗略检测（简单标识符 + 赋值/调用，非声明、非关键字、非全局）
    const globalVars = new Set(['window', 'document', 'console', 'Math', 'JSON', 'Object', 'Array', 'String', 'Number', 'Boolean', 'Date', 'RegExp', 'Promise', 'undefined', 'globalThis', 'setTimeout', 'setInterval', 'clearTimeout', 'clearInterval'])
    const declared = new Set()
    for (let j = 0; j <= i; j++) {
      const decl = lines[j].match(/\b(?:let|const|var|function)\s+([A-Za-z_$][\w$]*)/g)
      if (decl) decl.forEach((d) => declared.add(d.split(/\s+/)[1]))
    }
    if (!isCommentLine) {
      const usage = trimmed.match(/\b[A-Za-z_$][\w$]*\b/g) || []
      for (const word of usage) {
        const isReserved = /^(if|else|for|while|do|return|function|var|let|const|new|this|null|true|false|typeof|instanceof|in|of|switch|case|break|continue|class|extends|import|export|from|default|async|await|try|catch|finally|throw|delete|void|yield|super)\b/.test(word)
        if (isReserved || globalVars.has(word) || declared.has(word)) continue
        // 避免把属性名、字符串当变量：只检测紧跟 ( 的调用或 = 前的赋值
        if (new RegExp(`\\b${escapeRegExp(word)}\\s*(?:=\\s*|\\()`).test(trimmed)) {
          add(i, `Possibly undefined variable "${word}" (可能未定义的变量)`, 'warn')
          break
        }
      }
    }
  })

  return problems
}

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
