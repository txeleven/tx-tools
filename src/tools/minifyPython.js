/**
 * Strip comments and blank lines in Python code.
 * Preserves indentation and string literals.
 */
export function minifyPython(code) {
  const lines = code.split(/\r?\n/)
  const out = []

  for (let line of lines) {
    const processed = removeComment(line)
    const trimmed = processed.replace(/\s+$/, '')
    if (!trimmed) continue
    out.push(trimmed)
  }

  return out.join('\n')
}

function removeComment(line) {
  let inString = false
  let quote = ''
  let escape = false

  for (let i = 0; i < line.length; i++) {
    const c = line[i]

    if (escape) {
      escape = false
      continue
    }

    if (c === '\\') {
      escape = true
      continue
    }

    if (inString) {
      if (c === quote) {
        inString = false
        quote = ''
      }
      continue
    }

    if (c === '"' || c === "'") {
      inString = true
      quote = c
      continue
    }

    if (c === '#') {
      return line.slice(0, i)
    }
  }

  return line
}
