// 抓包桥接脚本（ISOLATED world，默认）：监听 MAIN world 嗅探脚本通过
// window.postMessage 上报的请求，写入 chrome.storage.local 实现常驻后台持久化。
// 该脚本运行在隔离世界，可访问 chrome.storage。
;(function () {
  if (window.__txSnifferBridgeInstalled) return
  window.__txSnifferBridgeInstalled = true

  const STORAGE_KEY = 'tx-captured-requests'
  const ENABLED_KEY = 'tx-sniffer-enabled'
  const STORE_MAX = 100 // storage 仅保留最近 100 条，避免数据过多
  const FLUSH_MS = 800 // 缓冲写入间隔（≤1s，保证抓包数据最多延迟约 1 秒可见）
  const FLUSH_BATCH = 20 // 累积条数达此值立即写入

  const pending = []
  let flushTimer = null
  let enabled = true
  // 代际号：每次收到"清空"消息自增。flushNow 在写入前校验代际，
  // 若清空发生在 flush 期间，则丢弃旧缓冲数据，避免"清除后旧数据被写回 storage 导致还原"。
  let epoch = 0

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

  // 读取 storage 抓包数组。必须检查 chrome.runtime.lastError：
  // 之前直接 resolve 导致写失败被静默吞掉，降级重试逻辑永远不触发，
  // applyPatch 补状态码也静默失败 —— 这是"状态码一直不显示"的重要根因。
  function getStore() {
    return new Promise((resolve, reject) => {
      chrome.storage.local.get(STORAGE_KEY, (res) => {
        const err = chrome.runtime.lastError
        if (err) reject(new Error(err.message || 'storage get failed'))
        else resolve(res[STORAGE_KEY] || [])
      })
    })
  }

  function setStore(next) {
    return new Promise((resolve, reject) => {
      chrome.storage.local.set({ [STORAGE_KEY]: next }, () => {
        const err = chrome.runtime.lastError
        if (err) reject(new Error(err.message || 'storage set failed'))
        else resolve()
      })
    })
  }

  // 剥离 resBody 以压缩存储体积（超配额降级用），保留其余字段
  function stripBody(list) {
    return (list || []).map((r) => (r && r.resBody ? { ...r, resBody: '' } : r))
  }

  function scheduleFlush() {
    if (!flushTimer) flushTimer = setTimeout(flushNow, FLUSH_MS)
  }

  async function flushNow() {
    flushTimer = null
    if (!pending.length) return
    const batch = pending.splice(0, pending.length)
    const myEpoch = epoch
    try {
      const cur = await getStore()
      // 清空动作发生在本次 flush 期间：丢弃这批旧缓冲，防止旧数据重新写回 storage
      if (epoch !== myEpoch) return
      const next = cur.concat(batch)
      if (next.length > STORE_MAX) next.splice(0, next.length - STORE_MAX)
      await setStore(next)
    } catch (e) {
      // 写失败（多为超配额）：依次降级——剥离所有记录 resBody（含历史）再写一次；
      // 仍失败才退回缓冲，下次再试。
      try {
        const cur = await getStore()
        if (epoch !== myEpoch) return
        const next = stripBody(cur).concat(stripBody(batch))
        if (next.length > STORE_MAX) next.splice(0, next.length - STORE_MAX)
        await setStore(next)
        return
      } catch (e2) {}
      for (let i = batch.length - 1; i >= 0; i--) pending.unshift(batch[i])
    }
  }

  // 按 id 更新 storage 中已写入记录的状态码/响应头/响应体（未传字段保持不变）
  async function applyPatch(id, patch, retried) {
    if (!id || !patch) return
    try {
      let cur = await getStore()
      let dirty = false
      for (let i = cur.length - 1; i >= 0; i--) {
        if (cur[i] && cur[i].id === id) {
          if (patch.status !== undefined) cur[i].status = patch.status
          if (patch.resHeaders !== undefined) cur[i].resHeaders = patch.resHeaders
          if (patch.resBody !== undefined) cur[i].resBody = patch.resBody
          dirty = true
          break
        }
      }
      if (!dirty) {
        // 记录尚未落盘（flush 竞态）：延迟重试一次，避免 status 丢失
        if (!retried) {
          setTimeout(() => applyPatch(id, patch, true), 600)
        }
        return
      }
      try {
        await setStore(cur)
      } catch (e) {
        // 超配额：剥离全部 resBody 后重试，至少保证 status 更新成功
        cur = stripBody(cur)
        await setStore(cur)
      }
    } catch (e) {}
  }

  window.addEventListener('message', (e) => {
    // 只校验自定义数据标记（页面脚本不会伪造 __txCapture），不再用 origin/source
    // 判断（ISOLATED 与 MAIN world 的 window wrapper 不同，易误判丢弃）。
    const d = e.data
    if (!d) return
    // 清空缓冲（与页面内存清空配套，防止旧缓冲在下次 flush 时重新写回 storage）
    if (d.__txCaptureClear === true) {
      epoch++
      pending.length = 0
      if (flushTimer) {
        clearTimeout(flushTimer)
        flushTimer = null
      }
      return
    }
    // 立即落盘请求
    if (d.__txCaptureFlush === true) {
      flushNow()
      return
    }
    // 状态码/响应信息更新
    if (d.__txCaptureUpdate === true) {
      if (!enabled) return
      // 先看缓冲里有没有（尚未落盘），有则直接改缓冲
      const inPending = pending.find((r) => r && r.id === d.id)
      if (inPending) {
        if (d.status !== undefined) inPending.status = d.status
        if (d.resHeaders !== undefined) inPending.resHeaders = d.resHeaders
        if (d.resBody !== undefined) inPending.resBody = d.resBody
        return
      }
      applyPatch(d.id, d)
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
