// 抓包桥接脚本（ISOLATED world，默认）：监听 MAIN world 嗅探脚本通过
// window.postMessage 上报的请求，写入 chrome.storage.local 实现常驻后台持久化。
// 该脚本运行在隔离世界，可访问 chrome.storage。
;(function () {
  if (window.__txSnifferBridgeInstalled) return
  window.__txSnifferBridgeInstalled = true

  const STORAGE_KEY = 'tx-captured-requests'
  const ENABLED_KEY = 'tx-sniffer-enabled'
  const STORE_MAX = 100 // storage 仅保留最近 100 条，避免数据过多
  const FLUSH_MS = 1200 // 缓冲写入间隔
  const FLUSH_BATCH = 20 // 累积条数达此值立即写入

  const pending = []
  let flushTimer = null
  let enabled = true

  // 读取开关并实时同步
  try {
    chrome.storage.local.get(ENABLED_KEY, (res) => {
      if (typeof res[ENABLED_KEY] === 'boolean') enabled = res[ENABLED_KEY]
    })
    chrome.storage.onChanged.addListener((changes, area) => {
      if (area === 'local' && changes[ENABLED_KEY]) {
        enabled = !!changes[ENABLED_KEY].newValue
        if (!enabled) pending.length = 0
      }
    })
  } catch (e) {}

  function scheduleFlush() {
    if (!flushTimer) flushTimer = setTimeout(flushNow, FLUSH_MS)
  }

  async function flushNow() {
    flushTimer = null
    if (!pending.length) return
    const batch = pending.splice(0, pending.length)
    try {
      const cur = await new Promise((resolve) =>
        chrome.storage.local.get(STORAGE_KEY, (res) => resolve(res[STORAGE_KEY] || []))
      )
      const next = cur.concat(batch)
      if (next.length > STORE_MAX) next.splice(0, next.length - STORE_MAX)
      await new Promise((resolve) => chrome.storage.local.set({ [STORAGE_KEY]: next }, resolve))
    } catch (e) {
      // 写失败退回缓冲，下次再试
      for (let i = batch.length - 1; i >= 0; i--) pending.unshift(batch[i])
    }
  }

  // 按 id 更新 storage 中已写入记录的状态码
  async function applyStatus(id, status) {
    if (!id) return
    try {
      const cur = await new Promise((resolve) =>
        chrome.storage.local.get(STORAGE_KEY, (res) => resolve(res[STORAGE_KEY] || []))
      )
      let dirty = false
      for (let i = cur.length - 1; i >= 0; i--) {
        if (cur[i] && cur[i].id === id) {
          cur[i].status = status
          dirty = true
          break
        }
      }
      if (dirty) await new Promise((resolve) => chrome.storage.local.set({ [STORAGE_KEY]: cur }, resolve))
    } catch (e) {}
  }

  window.addEventListener('message', (e) => {
    // 注意：ISOLATED world 的 window 与 MAIN world 是不同 wrapper，
    // 不能用 e.source !== window 判断（会误判丢弃）。改用 origin + 数据标记校验。
    if (e.origin !== location.origin) return
    const d = e.data
    if (!d) return
    // 立即落盘请求
    if (d.__txCaptureFlush === true) {
      flushNow()
      return
    }
    // 状态码更新
    if (d.__txCaptureUpdate === true) {
      if (!enabled) return
      // 先看缓冲里有没有（尚未落盘），有则直接改缓冲
      const inPending = pending.find((r) => r && r.id === d.id)
      if (inPending) {
        inPending.status = d.status
        return
      }
      applyStatus(d.id, d.status)
      return
    }
    if (d.__txCapture !== true || !d.req) return
    if (!enabled) return
    pending.push(d.req)
    if (pending.length >= FLUSH_BATCH) flushNow()
    else scheduleFlush()
  })

  // 页面卸载前尽量落盘
  window.addEventListener('pagehide', () => flushNow(), { once: true })
})()
