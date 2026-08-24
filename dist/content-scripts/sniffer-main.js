// 网络请求嗅探（主世界 MAIN world）：拦截 fetch 与 XMLHttpRequest。
// MAIN world 脚本运行在页面上下文，无法直接访问 chrome.storage，
// 因此抓到的请求通过 window.postMessage 上报给 ISOLATED world 的桥接脚本
// （sniffer-bridge.js），由后者写入 chrome.storage.local 实现常驻后台持久化。
// 同时保留 window.__txCapturedRequests 内存数组，供 popup 通过 executeScript 快速读取。
;(function () {
  // 版本号：popup/options 注入时检测旧版拦截残留（扩展更新后未刷新页面），并提示用户刷新
  if (window.__txSnifferInstalled) return
  window.__txSnifferInstalled = true
  window.__txSnifferVersion = 2

  const MEM_MAX = 200 // 内存保留条数（popup 快速读取用）
  const RES_MAX = 32 * 1024 // 响应体保留上限（32KB），超长截断，避免 storage 超配额
  const store = (window.__txCapturedRequests = window.__txCapturedRequests || [])
  let seq = Date.now() // 自增 id，用于请求与响应状态码关联

  function push(req) {
    req.id = ++seq
    try {
      store.push(req)
      if (store.length > MEM_MAX) store.splice(0, store.length - MEM_MAX)
    } catch (e) {}
    // 上报给 ISOLATED bridge 写 storage
    try {
      window.postMessage({ __txCapture: true, req }, '*')
    } catch (e) {}
    return req.id
  }

  // 响应返回后补充信息（状态码 / 响应头 / 响应体，同步内存 + 上报 bridge 更新 storage）
  // 未传的字段保持原样，便于先补状态、再异步补响应体
  function reportResult(id, status, resHeaders, resBody) {
    if (!id) return
    try {
      const rec = store.find((r) => r.id === id)
      if (rec) {
        if (status !== undefined) rec.status = status
        if (resHeaders !== undefined) rec.resHeaders = resHeaders
        if (resBody !== undefined) rec.resBody = resBody
      }
    } catch (e) {}
    try {
      window.postMessage({ __txCaptureUpdate: true, id, status, resHeaders, resBody }, '*')
    } catch (e) {}
  }

  // 截断超长响应体
  function truncateBody(s) {
    if (!s || s.length <= RES_MAX) return s
    return s.slice(0, RES_MAX) + '\n…[truncated]'
  }

  // 通知 bridge 立即把缓冲落盘到 storage（popup/options 打开时调用，保证数据立即可读）
  window.__txSnifferFlush = function () {
    try {
      window.postMessage({ __txCaptureFlush: true }, '*')
    } catch (e) {}
  }

  // 清空抓包：清空页面内存 + 通知 bridge 清空缓冲
  // （仅清 storage 不够——自动刷新会从页面内存/缓冲重新读回旧数据）
  window.__txSnifferClear = function () {
    try { store.length = 0 } catch (e) {}
    try {
      window.postMessage({ __txCaptureClear: true }, '*')
    } catch (e) {}
  }

  function headersToObj(h) {
    const o = {}
    if (!h) return o
    try {
      if (typeof Headers !== 'undefined' && h instanceof Headers) {
        h.forEach((v, k) => {
          o[k] = v
        })
      } else if (Array.isArray(h)) {
        h.forEach((pair) => {
          if (pair && pair.length >= 2) o[pair[0]] = pair[1]
        })
      } else if (typeof h === 'object') {
        Object.assign(o, h)
      }
    } catch (e) {}
    return o
  }

  function bodyToStr(b) {
    if (b == null) return ''
    if (typeof b === 'string') return b
    try {
      if (typeof URLSearchParams !== 'undefined' && b instanceof URLSearchParams) return b.toString()
      if (typeof FormData !== 'undefined' && b instanceof FormData) return '[FormData]'
      if (typeof Blob !== 'undefined' && b instanceof Blob) return '[Blob ' + (b.type || '') + ']'
      if (b instanceof ArrayBuffer) return '[ArrayBuffer ' + b.byteLength + ' bytes]'
      if (typeof ArrayBuffer !== 'undefined' && ArrayBuffer.isView && ArrayBuffer.isView(b)) {
        return '[TypedArray ' + b.byteLength + ' bytes]'
      }
      return JSON.stringify(b)
    } catch (e) {
      try {
        return String(b)
      } catch (e2) {
        return ''
      }
    }
  }

  // 解析请求 URL 的域名（相对路径按当前页解析）
  function resolveDomain(url) {
    try {
      return new URL(url, location.href).host
    } catch (e) {
      return ''
    }
  }

  // 把相对 URL 补全为绝对 URL（保证抓到的信息含完整可访问地址）
  function absoluteUrl(url) {
    try {
      return new URL(url, location.href).href
    } catch (e) {
      return String(url || '')
    }
  }

  // ---- 拦截 fetch ----
  if (typeof window.fetch === 'function') {
    const origFetch = window.fetch
    window.fetch = function (input, init) {
      let reqId = null
      try {
        init = init || {}
        const url = typeof input === 'string' ? input : (input && input.url) || ''
        const method = (init.method || (input && input.method) || 'GET').toUpperCase()
        const headers = headersToObj(init.headers !== undefined ? init.headers : input && input.headers)
        const body = bodyToStr(init.body !== undefined ? init.body : input && input.body)
        if (url) {
          reqId = push({
            type: 'fetch',
            url: absoluteUrl(url),
            method,
            headers,
            body,
            time: Date.now(),
            host: location.host,
            origin: location.href,
            domain: resolveDomain(url),
          })
        }
      } catch (e) {}
      let p
      try {
        p = origFetch.apply(this, arguments)
      } catch (err) {
        // 原 fetch 抛异常：保持页面原有语义（继续抛），但已记录的请求标记为失败
        if (reqId) reportResult(reqId, 0)
        throw err
      }
      try {
        if (reqId && p && typeof p.then === 'function') {
          p.then(
            (res) => {
              const status = res && res.status
              // 响应头可同步拿到；响应体需 clone 后异步读取（不阻塞原响应流）
              let resHeaders
              try {
                if (res && typeof Headers !== 'undefined' && res.headers && typeof res.headers.forEach === 'function') {
                  resHeaders = headersToObj(res.headers)
                }
              } catch (e) {}
              reportResult(reqId, status, resHeaders)
              try {
                if (res && typeof res.clone === 'function') {
                  res
                    .clone()
                    .text()
                    .then((txt) => reportResult(reqId, undefined, undefined, truncateBody(txt == null ? '' : String(txt))))
                    .catch(() => {})
                }
              } catch (e) {}
            },
            () => reportResult(reqId, 0) // 网络层失败
          )
        }
      } catch (e) {}
      return p
    }
  }

  // ---- 拦截 XMLHttpRequest ----
  const X = window.XMLHttpRequest
  if (X && X.prototype) {
    const origOpen = X.prototype.open
    const origSend = X.prototype.send
    const origSetHeader = X.prototype.setRequestHeader

    X.prototype.open = function (method, url) {
      this.__tx = { method: (method || 'GET').toUpperCase(), url: String(url || ''), headers: {} }
      return origOpen.apply(this, arguments)
    }
    X.prototype.setRequestHeader = function (k, v) {
      if (this.__tx) this.__tx.headers[k] = v
      return origSetHeader.apply(this, arguments)
    }
    X.prototype.send = function (body) {
      let reqId = null
      try {
        if (this.__tx && this.__tx.url) {
          reqId = push({
            type: 'xhr',
            url: absoluteUrl(this.__tx.url),
            method: this.__tx.method,
            headers: this.__tx.headers,
            body: bodyToStr(body),
            time: Date.now(),
            host: location.host,
            origin: location.href,
            domain: resolveDomain(this.__tx.url),
          })
          this.__txReqId = reqId
        }
      } catch (e) {}
      if (reqId) {
        const id = reqId
        this.addEventListener('loadend', function () {
          try {
            const status = this.status
            // 响应头
            let resHeaders
            try {
              const raw = this.getAllResponseHeaders ? this.getAllResponseHeaders() : ''
              if (raw) {
                resHeaders = {}
                raw.trim().split(/\r?\n/).forEach((line) => {
                  const idx = line.indexOf(':')
                  if (idx > 0) resHeaders[line.slice(0, idx).trim()] = line.slice(idx + 1).trim()
                })
              }
            } catch (e) {}
            // 响应体（仅文本响应可读）
            let resBody
            try {
              if (!this.responseType || this.responseType === 'text') {
                resBody = typeof this.responseText === 'string' ? this.responseText : ''
              }
            } catch (e) {}
            reportResult(id, status, resHeaders, resBody === undefined ? '' : truncateBody(resBody))
          } catch (e) {}
        })
      }
      return origSend.apply(this, arguments)
    }
  }

})()
