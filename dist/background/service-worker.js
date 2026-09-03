// 后台 Service Worker：右键菜单快捷转换
// 选中网页文本 -> 右键 -> Base64 解码 / JSON 格式化 / 时间戳转日期 / URL 解码

// ---------- 内联转换工具（与前端逻辑一致） ----------
function bytesToBase64(bytes) {
  let binary = ''
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000))
  }
  return btoa(binary)
}

function decodeBase64(b64) {
  const clean = b64.replace(/\s+/g, '')
  const binary = atob(clean)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  } catch {
    return new TextDecoder('latin1').decode(bytes)
  }
}

function formatJson(text) {
  return JSON.stringify(JSON.parse(text), null, 2)
}

function tsToDate(ts) {
  const num = Number(String(ts).trim())
  let ms = num
  if (String(Math.abs(Math.trunc(num))).length <= 10) ms = num * 1000
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) throw new Error('invalid timestamp')
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function decodeUrl(text) {
  return decodeURIComponent(text.replace(/\+/g, '%20'))
}

// ---------- 右键菜单 ----------
const MENU_ITEMS = [
  { id: 'base64-decode', title: 'Base64 解码', handler: (s) => decodeBase64(s) },
  { id: 'json-format', title: 'JSON 格式化', handler: (s) => formatJson(s) },
  { id: 'ts-to-date', title: '时间戳转日期', handler: (s) => tsToDate(s) },
  { id: 'url-decode', title: 'URL 解码', handler: (s) => decodeUrl(s) },
]

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    MENU_ITEMS.forEach((item) => {
      chrome.contextMenus.create({
        id: item.id,
        title: `🧰 ${item.title}: "%s"`,
        contexts: ['selection'],
      })
    })
  })
  registerSniffer()
})

// ---------- 网络请求嗅探：注册主世界内容脚本 ----------
// 在页面主世界拦截 fetch/XHR，供 popup 读取当前页面已发出的请求
async function registerSniffer() {
  if (!chrome.scripting || !chrome.scripting.registerContentScripts) return
  try {
    await chrome.scripting.registerContentScripts([
      {
        id: 'tx-sniffer-main',
        matches: ['http://*/*', 'https://*/*'],
        js: ['content-scripts/sniffer-main.js'],
        runAt: 'document_start',
        world: 'MAIN',
        allFrames: false,
      },
    ])
  } catch (e) {
    // 已注册过同 id 时忽略
  }
}

chrome.runtime.onStartup.addListener(() => {
  registerSniffer()
  scheduleAutoRefresh()
})

// ---------- 定时刷新当前标签页 ----------
// 调度以 chrome.alarms 为主：alarms 由浏览器托管，不受 SW 休眠/重启影响。
// 之前用 setTimeout 作主调度，SW 空闲约 30 秒即被终止，定时器丢失导致间隔不准甚至不刷新。
const AUTO_REFRESH_KEY = 'tx-autorefresh'
const AUTO_REFRESH_ALARM = 'tx-autorefresh-tick'
const MIN_ALARM_SECONDS = 30 // alarms 最小周期 0.5 分钟
let arTimer = null

function normalizeInterval(s) {
  return Math.max(3, Math.min(3600, Math.floor(Number(s) || 30)))
}

function getArCfg() {
  return new Promise((resolve) => {
    chrome.storage.local.get(AUTO_REFRESH_KEY, (res) => resolve(res[AUTO_REFRESH_KEY] || null))
  })
}

function setArCfg(cfg) {
  return new Promise((resolve) => {
    chrome.storage.local.set({ [AUTO_REFRESH_KEY]: cfg }, resolve)
  })
}

function clearArTimer() {
  if (arTimer) {
    clearTimeout(arTimer)
    arTimer = null
  }
}

// 创建 alarm，返回是否成功。
// 0.5 分钟的周期只有 Chrome 120+ 支持，旧版本会报错，这里自动回退到 1 分钟。
function createAlarm(mins, done) {
  try {
    chrome.alarms.create(AUTO_REFRESH_ALARM, { periodInMinutes: mins }, () => {
      const err = chrome.runtime && chrome.runtime.lastError
      if (err && mins < 1) {
        createAlarm(1, done) // 旧版 Chrome 不支持亚分钟周期
        return
      }
      done(!err)
    })
  } catch (e) {
    if (mins < 1) {
      createAlarm(1, done)
      return
    }
    done(false)
  }
}

// 确保 alarm 存在且周期正确；已存在且周期一致时不重建，避免重置计时导致间隔被推迟。
// 任何异常都不向外抛，避免阻断消息响应导致 popup 开关回弹。
function ensureAlarm(periodMinutes) {
  return new Promise((resolve) => {
    let settled = false
    const finish = (v) => {
      if (settled) return
      settled = true
      clearTimeout(guard)
      resolve(v)
    }
    // 兜底：alarms API 未回调时也不能让 Promise 永久挂起，
    // 否则 await 卡住导致 sendResponse 永不执行，popup 侧表现为"启用失败"
    const guard = setTimeout(() => finish(false), 3000)
    try {
      if (!chrome.alarms) {
        finish(false)
        return
      }
      if (!chrome.alarms.get) {
        createAlarm(periodMinutes, finish)
        return
      }
      chrome.alarms.get(AUTO_REFRESH_ALARM, (existing) => {
        if (existing && Math.abs((existing.periodInMinutes || 0) - periodMinutes) < 0.001) {
          finish(true)
          return
        }
        createAlarm(periodMinutes, finish)
      })
    } catch (e) {
      finish(false)
    }
  })
}

// 恢复/启动调度。小于 30 秒的间隔无法用 alarms 表达，
// 在 alarm 唤醒后的活跃窗口内用 setTimeout 链式补刷。
async function scheduleAutoRefresh() {
  clearArTimer()
  try {
    const cfg = await getArCfg()
    if (!cfg || !cfg.active || !cfg.tabId || !cfg.interval) {
      // 无有效配置：清理残留 alarm 与错误标记（storage 由 popup 负责写，避免循环触发）
      try {
        if (chrome.alarms && chrome.alarms.clear) chrome.alarms.clear(AUTO_REFRESH_ALARM, () => {})
      } catch (e) {}
      return
    }
    const interval = normalizeInterval(cfg.interval)
    const alarmOk = await ensureAlarm(Math.max(MIN_ALARM_SECONDS, interval) / 60)
    // 把调度结果写回（popup 会显示）；仅 error 字段变化不会循环触发 onChanged
    if (!!cfg.error !== !alarmOk) {
      await setArCfg({ ...cfg, error: alarmOk ? '' : 'alarm-unavailable' })
    }
    if (alarmOk && interval >= MIN_ALARM_SECONDS) return // 长间隔完全交给 alarm 调度
    runShortChain(interval)
  } catch (e) {}
}

// 配置变化驱动调度：storage.onChanged 会唤醒休眠的 SW，
// 比消息通道可靠（popup 与 SW 之间不再依赖 sendMessage 响应）。
// count/nextAt 的例行更新不触发重调度，避免 alarm 计时被反复重置。
if (chrome.storage && chrome.storage.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[AUTO_REFRESH_KEY]) return
    const old = changes[AUTO_REFRESH_KEY].oldValue || {}
    const neu = changes[AUTO_REFRESH_KEY].newValue || {}
    if (old.active === neu.active && old.interval === neu.interval && old.tabId === neu.tabId) return
    scheduleAutoRefresh()
  })
}

function runShortChain(interval) {
  // 短间隔链式刷新：每次 refreshOnce 中的 tabs API 调用都会重置 SW 的
  // 空闲计时器（约 30 秒），间隔小于 30 秒时 SW 保持存活、链持续运行；
  // 若 SW 意外终止，alarm（兜底唤醒）触发时重启链。不设次数上限，
  // 持续刷新直到用户关闭开关（cfg.active = false）。
  const step = async () => {
    const cfg = await getArCfg()
    if (!cfg || !cfg.active) return
    const ok = await refreshOnce(cfg)
    if (!ok) return
    clearArTimer()
    arTimer = setTimeout(step, interval * 1000)
  }
  clearArTimer()
  arTimer = setTimeout(step, interval * 1000)
}

// 执行一次刷新；返回 false 表示已停止（目标标签页不存在等）
async function refreshOnce(cfg) {
  const interval = normalizeInterval(cfg.interval)
  try {
    // 注意：不能用 tab.url 做校验——扩展没有 tabs 权限时
    // chrome.tabs.get 不返回 url（activeTab 授权在页面刷新后也会失效），
    // 之前据此判停导致"到点未刷新就自动停止"。只确认标签页仍存在即可。
    const tab = await chrome.tabs.get(cfg.tabId)
    if (!tab || !tab.id) {
      stopAutoRefresh()
      return false
    }
    chrome.tabs.reload(tab.id, { bypassCache: false })
  } catch (e) {
    // 标签页已关闭
    stopAutoRefresh()
    return false
  }
  await setArCfg({ ...cfg, count: (cfg.count || 0) + 1, nextAt: Date.now() + interval * 1000 })
  return true
}

// alarm 触发：刷新一次；短间隔时在活跃窗口内继续链式补刷。
// 必须做存在性判断：权限未生效时若直接访问 onAlarm 会抛错，
// 由于代码在 SW 顶层，异常会中断整个脚本，导致后面所有监听器都无法注册。
if (chrome.alarms && chrome.alarms.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name !== AUTO_REFRESH_ALARM) return
    ;(async () => {
      try {
        const cfg = await getArCfg()
        if (!cfg || !cfg.active) {
          stopAutoRefresh()
          return
        }
        const interval = normalizeInterval(cfg.interval)
        const ok = await refreshOnce(cfg)
        if (ok && interval < MIN_ALARM_SECONDS) runShortChain(interval)
      } catch (e) {}
    })()
  })
}

function stopAutoRefresh() {
  clearArTimer()
  setArCfg({ active: false })
  try {
    if (chrome.alarms && chrome.alarms.clear) chrome.alarms.clear(AUTO_REFRESH_ALARM, () => {})
  } catch (e) {}
}

// SW 每次启动/唤醒都恢复调度（扩展重新加载后 alarms 会丢失，需重建）
scheduleAutoRefresh()

// ---------- Offscreen 剪贴板 ----------
let offscreenReady = false

async function ensureOffscreen() {
  if (offscreenReady) return
  const has = await chrome.offscreen.hasDocument()
  if (!has) {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['CLIPBOARD'],
      justification: '将转换结果复制到剪贴板',
    })
  }
  offscreenReady = true
}

async function copyToClipboard(text) {
  await ensureOffscreen()
  const res = await chrome.runtime.sendMessage({ type: 'copy', text })
  return res?.ok
}

// ---------- 菜单点击处理 ----------
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const item = MENU_ITEMS.find((i) => i.id === info.menuItemId)
  if (!item || !tab?.id) return

  try {
    const [{ result: selected }] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => window.getSelection()?.toString() ?? '',
    })
    const text = String(selected || '').trim()
    if (!text) return

    const output = item.handler(text)
    const ok = await copyToClipboard(output)

    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: ok ? 'TX JS工具箱：已复制' : 'TX JS工具箱',
      message: ok
        ? `${item.title} 成功，结果已复制到剪贴板（${output.length} 字符）`
        : `转换成功，但复制失败：\n${output.slice(0, 200)}`,
    })
  } catch (e) {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: '/icons/icon128.png',
      title: 'TX JS工具箱',
      message: `转换失败：${e.message}`,
    })
  }
})

// 处理来自 offscreen 的剪贴板请求完成通知
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'copy-done') {
    sendResponse({ received: true })
    return
  }

  // ---------- 抓包数据读写（常驻后台，跨页面持久） ----------
  if (msg?.type === 'tx-get-captured') {
    const key = msg.key || 'tx-captured-requests'
    chrome.storage.local.get(key, (res) => {
      // 读取失败（配额异常等）时返回空列表，由前端用页面内存兜底
      if (chrome.runtime.lastError) {
        sendResponse({ ok: false, list: [] })
        return
      }
      const list = res[key] || []
      // 可选按 host 过滤
      const filtered = msg.host ? list.filter((r) => r.host === msg.host) : list
      sendResponse({ ok: true, list: filtered })
    })
    return true // 异步响应
  }
  if (msg?.type === 'tx-clear-captured') {
    const key = msg.key || 'tx-captured-requests'
    chrome.storage.local.set({ [key]: [] }, () => sendResponse({ ok: true }))
    return true
  }
  // 按 host 删除（清除当前页面的抓包）
  if (msg?.type === 'tx-clear-host') {
    const key = msg.key || 'tx-captured-requests'
    chrome.storage.local.get(key, (res) => {
      const list = res[key] || []
      // 兼容老数据缺少 r.host 的情况：同时匹配 r.host / r.domain / 从 url 解析的 host
      const next = msg.host
        ? list.filter((r) => {
            const urlHost = (() => {
              try {
                return new URL(r.url || '').host
              } catch {
                return ''
              }
            })()
            return r.host !== msg.host && r.domain !== msg.host && urlHost !== msg.host
          })
        : list
      chrome.storage.local.set({ [key]: next }, () => sendResponse({ ok: true }))
    })
    return true
  }

  // 定时刷新不再走消息通道：popup 直接写 storage，
  // SW 通过 storage.onChanged 自动调度（见上方 onChanged 监听）。
})
