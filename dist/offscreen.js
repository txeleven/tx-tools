// Offscreen 文档：负责后台复制到剪贴板
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg?.type === 'copy') {
    try {
      await navigator.clipboard.writeText(msg.text)
      sendResponse({ ok: true })
    } catch (e) {
      // 降级方案
      try {
        const ta = document.createElement('textarea')
        ta.value = msg.text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
        sendResponse({ ok: true })
      } catch (e2) {
        sendResponse({ ok: false, error: e2.message })
      }
    }
    return true // 异步响应
  }
})
