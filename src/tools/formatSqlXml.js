// SQL 简单格式化：关键字换行 + 缩进
export function formatSql(sql) {
  const keywords = [
    'SELECT', 'FROM', 'WHERE', 'GROUP BY', 'ORDER BY', 'HAVING', 'LIMIT',
    'INSERT INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'JOIN', 'LEFT JOIN',
    'RIGHT JOIN', 'INNER JOIN', 'OUTER JOIN', 'ON', 'UNION', 'AND', 'OR',
  ]

  let out = sql.replace(/\s+/g, ' ').trim()

  // 在每个关键字前换行
  for (const kw of keywords) {
    const re = new RegExp(`\\b(${kw})\\b`, 'gi')
    out = out.replace(re, (m) => '\n' + m)
  }

  // 移除行首多余空格
  out = out.replace(/[ \t]+/g, ' ').replace(/\n\s*/g, '\n').replace(/\n+/g, '\n')

  const lines = out.split('\n')
  let indent = 0
  const result = []

  for (let raw of lines) {
    const line = raw.trim()
    if (!line) continue
    const upper = line.toUpperCase()

    // 关闭缩进：AND/OR 连接保持当前缩进
    const isCloser =
      /^(FROM|WHERE|GROUP BY|ORDER BY|HAVING|JOIN|LEFT JOIN|RIGHT JOIN|INNER JOIN|OUTER JOIN|ON|SET|VALUES|AND|OR)\b/.test(upper)
        ? true
        : /^\)/.test(line)

    if (isCloser && indent > 0) indent = Math.max(0, indent - 1)
    result.push('  '.repeat(indent) + line)
    if (upper.startsWith('SELECT') || upper.startsWith('INSERT INTO') || upper.startsWith('UPDATE') || upper.startsWith('DELETE')) {
      indent += 1
    }
  }

  return result.join('\n')
}

// XML 简单格式化：标签缩进
export function formatXml(xml) {
  // 用占位符保护注释/CDATA
  const comments = []
  xml = xml.replace(/<!--[\s\S]*?-->/g, (m) => {
    comments.push(m)
    return `\u0000${comments.length - 1}\u0000`
  })

  const tokens = xml
    .replace(/></g, '>\n<')
    .replace(/\/>/g, '/>\n')
    .replace(/\/>\n/g, '/>') // 让自闭合标签保持一行
    .replace(/\n+/g, '\n')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

  let indent = 0
  const result = []
  for (const raw of tokens) {
    let line = raw
    // 还原注释
    line = line.replace(/\u0000(\d+)\u0000/g, (_, i) => comments[Number(i)])

    const isClosing = /^<\//.test(line) || /^<[^>]+\/>$/.test(line) || /^<\?/.test(line)
    if (isClosing) indent = Math.max(0, indent - 1)

    result.push('  '.repeat(indent) + line)

    if (/^<[^/!?]/.test(line) && !/\/>$/.test(line) && !/^<\?/.test(line)) {
      indent += 1
    }
  }
  return result.join('\n')
}
