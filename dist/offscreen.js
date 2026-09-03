// Offscreen 文档：负责后台复制到剪贴板
// 注意：Chrome 不支持 async 形式的 onMessage 监听器（返回 Promise 而非 true
// 会导致消息端口提前关闭、sendResponse 失效），必须同步返回 true。
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type !== 'copy') return
  ;(async () => {
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
  })()
  return true // 异步响应
})
