/**
 * A simple Python formatter: normalizes indentation based on colons and
 * block continuation keywords (else/elif/except/finally). It does not parse
 * the full grammar, but is safe enough for typical snippets.
 */
export function formatPython(code) {
  const lines = code.split(/\r?\n/)
  const out = []
  const indentStr = '    '
  const stack = [0]
  const continuation = /^\s*(else|elif|except|finally)\b/
  let pending = false

  for (const raw of lines) {
    const trimmed = raw.replace(/\s+$/, '').trim()
    if (!trimmed) continue

    if (pending) {
      stack.push(stack[stack.length - 1] + 1)
      pending = false
    }

    if (continuation.test(raw) && stack.length > 1) {
      stack.pop()
    }

    const currentIndent = stack[stack.length - 1]
    out.push(indentStr.repeat(Math.max(0, currentIndent)) + trimmed)

    if (trimmed.endsWith(':')) {
      pending = true
    }
  }

  return out.join('\n')
}
