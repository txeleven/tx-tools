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
})

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
  }
})
