// 网络请求嗅探（主世界 MAIN world）：拦截 fetch 与 XMLHttpRequest。
// MAIN world 脚本运行在页面上下文，无法直接访问 chrome.storage，
// 因此抓到的请求通过 window.postMessage 上报给 ISOLATED world 的桥接脚本
// （sniffer-bridge.js），由后者写入 chrome.storage.local 实现常驻后台持久化。
// 同时保留 window.__txCapturedRequests 内存数组，供 popup 通过 executeScript 快速读取。
;(function () {
  if (window.__txSnifferInstalled) return
  window.__txSnifferInstalled = true

  const MEM_MAX = 200 // 内存保留条数（popup 快速读取用）
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

  // 响应返回后补状态码（同步内存 + 上报 bridge 更新 storage）
  function reportStatus(id, status) {
    if (!id) return
    try {
      const rec = store.find((r) => r.id === id)
      if (rec) rec.status = status
    } catch (e) {}
    try {
      window.postMessage({ __txCaptureUpdate: true, id, status }, '*')
    } catch (e) {}
  }

  // 通知 bridge 立即把缓冲落盘到 storage（popup/options 打开时调用，保证数据立即可读）
  window.__txSnifferFlush = function () {
    try {
      window.postMessage({ __txCaptureFlush: true }, '*')
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
      const p = origFetch.apply(this, arguments)
      try {
        if (reqId) {
          p.then(
            (res) => reportStatus(reqId, res && res.status),
            () => reportStatus(reqId, 0) // 网络层失败
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
            reportStatus(id, this.status)
          } catch (e) {}
        })
      }
      return origSend.apply(this, arguments)
    }
  }

})()
