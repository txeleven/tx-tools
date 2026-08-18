/**
 * Strip comments and collapse whitespace in PHP-like code.
 * Preserves quoted strings and PHP tags.
 */
export function minifyPhp(code) {
  let out = ''
  let i = 0
  const len = code.length

  function skipLineComment() {
    while (i < len && code[i] !== '\n') i++
  }

  function skipBlockComment() {
    i += 2
    while (i < len && !(code[i] === '*' && code[i + 1] === '/')) i++
    i += 2
  }

  function readString(quote) {
    let s = quote
    i++
    while (i < len) {
      const c = code[i]
      s += c
      if (c === '\\') {
        i++
        if (i < len) {
          s += code[i]
        }
      } else if (c === quote) {
        i++
        break
      }
      i++
    }
    return s
  }

  let lastWasSpace = true
  while (i < len) {
    const c = code[i]
    const next = code[i + 1]

    if (c === '/' && next === '/') {
      skipLineComment()
      if (!lastWasSpace) {
        out += ' '
        lastWasSpace = true
      }
      continue
    }

    if (c === '/' && next === '*') {
      skipBlockComment()
      if (!lastWasSpace && out.length > 0) {
        out += ' '
        lastWasSpace = true
      }
      continue
    }

    if (c === "'" || c === '"') {
      if (!lastWasSpace && out.length > 0) {
        out += ' '
      }
      out += readString(c)
      lastWasSpace = false
      continue
    }

    if (/\s/.test(c)) {
      if (!lastWasSpace && out.length > 0) {
        out += ' '
        lastWasSpace = true
      }
      i++
      continue
    }

    out += c
    lastWasSpace = false
    i++
  }

  return out.replace(/\s+$/,'')
}
