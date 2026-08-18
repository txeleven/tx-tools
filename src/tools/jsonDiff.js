// 递归比较两个 JSON 值，返回结构化差异。
// 返回一个数组，每一项：{ type: 'added'|'removed'|'changed'|'arrayAdded'|'arrayRemoved', path, oldValue, newValue }
export function diffJson(a, b, path = []) {
  const results = []

  // 类型不同或基本类型不等 => changed
  if (typeof a !== typeof b || (a === null) !== (b === null) || isPrimitive(a) || isPrimitive(b)) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      results.push({ type: 'changed', path, oldValue: a, newValue: b })
    }
    return results
  }

  if (Array.isArray(a) && Array.isArray(b)) {
    const len = Math.max(a.length, b.length)
    for (let i = 0; i < len; i++) {
      if (i >= a.length) {
        results.push({ type: 'arrayAdded', path: [...path, i], newValue: b[i] })
      } else if (i >= b.length) {
        results.push({ type: 'arrayRemoved', path: [...path, i], oldValue: a[i] })
      } else {
        results.push(...diffJson(a[i], b[i], [...path, i]))
      }
    }
    return results
  }

  if (isObject(a) && isObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)])
    for (const k of keys) {
      const keyPath = [...path, k]
      if (!(k in b)) {
        results.push({ type: 'removed', path: keyPath, oldValue: a[k] })
      } else if (!(k in a)) {
        results.push({ type: 'added', path: keyPath, newValue: b[k] })
      } else {
        results.push(...diffJson(a[k], b[k], keyPath))
      }
    }
    return results
  }

  return results
}

function isPrimitive(v) {
  return v === null || typeof v !== 'object'
}

function isObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v)
}
