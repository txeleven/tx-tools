// URL 编解码工具
// 注意：encodeURIComponent 与 PHP/Go 等语言的 urlencode 有差异（空格编码不同）

// URL 编码，all=true 时空格编码为 %20（对标 PHP rawurlencode）
export function encodeUrl(text, { all = false } = {}) {
  if (all) {
    return encodeURIComponent(text).replace(/[!'()*]/g, (c) => '%' + c.charCodeAt(0).toString(16).toUpperCase())
  }
  return encodeURIComponent(text).replace(/%20/g, '+')
}

// URL 解码
export function decodeUrl(text) {
  return decodeURIComponent(text.replace(/\+/g, '%20'))
}

// 解析 URL 各组成部分
export function parseUrl(url) {
  try {
    return new URL(url)
  } catch (e) {
    throw new Error(`invalid url: ${e.message}`)
  }
}

// 获取 query string 键值对
export function parseQuery(qs) {
  const clean = qs.startsWith('?') ? qs.slice(1) : qs
  const params = {}
  if (!clean) return params
  clean.split('&').forEach((pair) => {
    if (!pair) return
    const eq = pair.indexOf('=')
    const key = eq >= 0 ? decodeURIComponent(pair.slice(0, eq)) : decodeURIComponent(pair)
    const val = eq >= 0 ? decodeURIComponent(pair.slice(eq + 1)) : ''
    if (key in params) {
      params[key] = Array.isArray(params[key]) ? [...params[key], val] : [params[key], val]
    } else {
      params[key] = val
    }
  })
  return params
}
