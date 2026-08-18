// 整页滚动截图 Content Script
// 在页面上下文运行，通过 chrome.runtime.sendMessage 请求后台逐段截图
// 流程：测量页面尺寸 -> 逐段滚动 -> 后台 captureVisibleTab -> 拼接 canvas

;(() => {
  if (window.__fullPageScreenshotActive) {
    chrome.runtime.sendMessage({ type: 'fullPageScreenshot', payload: { error: 'ALREADY_RUNNING' } })
    return
  }
  window.__fullPageScreenshotActive = true

  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  // 捕获页面的完整尺寸（包含滚动高度）
  function getPageMetrics() {
    const doc = document.documentElement
    const body = document.body
    const scrollWidth = Math.max(
      doc.scrollWidth,
      body.scrollWidth,
      doc.offsetWidth,
      body.offsetWidth
    )
    const scrollHeight = Math.max(
      doc.scrollHeight,
      body.scrollHeight,
      doc.offsetHeight,
      body.offsetHeight
    )
    return { width: Math.max(scrollWidth, viewport.width), height: Math.max(scrollHeight, viewport.height) }
  }

  function capture() {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'fullPageScreenshotCapture' }, (resp) => {
        const err = chrome.runtime.lastError
        if (err) {
          reject(new Error(err.message))
          return
        }
        if (!resp || !resp.ok) {
          reject(new Error((resp && resp.error) || 'capture failed'))
          return
        }
        resolve(resp.dataUrl)
      })
    })
  }

  function notify(progress, extra) {
    chrome.runtime.sendMessage({
      type: 'fullPageScreenshot',
      payload: Object.assign({ progress }, extra || {}),
    })
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => resolve(img)
      img.onerror = (e) => reject(new Error('image load failed'))
      img.src = src
    })
  }

  // 让图片可跨源绘制（避免 canvas 被污染）
  function loadCorsImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => {
        // 跨源失败时，重试不带 crossOrigin 的方式
        const img2 = new Image()
        img2.onload = () => resolve(img2)
        img2.onerror = () => reject(new Error('image load failed'))
        img2.src = src
      }
      img.src = src
    })
  }

  async function run() {
    try {
      const metrics = getPageMetrics()
      const pageWidth = metrics.width
      const pageHeight = metrics.height

      // 若页面较小，无需滚动，直接截一次
      if (pageHeight <= viewport.height) {
        window.scrollTo(0, 0)
        await new Promise((r) => setTimeout(r, 80))
        const dataUrl = await capture()
        notify(1, { done: true, dataUrl, pageWidth, pageHeight })
        return
      }

      // 计算分段数（重叠 0 防止接缝，但为了简单这里不重叠，按视口高度切分）
      const totalSegments = Math.ceil(pageHeight / viewport.height)
      const canvas = document.createElement('canvas')
      canvas.width = pageWidth
      canvas.height = pageHeight
      const ctx = canvas.getContext('2d')

      // 各段裁剪尺寸
      const segCropH = viewport.height
      const lastCropH = pageHeight - (totalSegments - 1) * viewport.height

      // 恢复初始滚动位置
      window.scrollTo(0, 0)
      await new Promise((r) => setTimeout(r, 80))

      for (let i = 0; i < totalSegments; i++) {
        const scrollY = i * viewport.height
        window.scrollTo(0, scrollY)
        // 等待页面稳定（图片懒加载 / 固定布局）
        await new Promise((r) => setTimeout(r, 120))

        const dataUrl = await capture()
        const img = await loadCorsImage(dataUrl)

        const drawH = i === totalSegments - 1 ? lastCropH : segCropH
        // 绘制当前段到对应位置（从底部对齐，处理最后一段可能不足视口高的情况）
        ctx.drawImage(img, 0, 0, img.width, img.height, 0, scrollY, pageWidth, drawH)

        notify(Math.round(((i + 1) / totalSegments) * 100), { segment: i + 1, total: totalSegments })
      }

      // 恢复滚动到顶部
      window.scrollTo(0, 0)

      const finalDataUrl = canvas.toDataURL('image/png')
      notify(1, { done: true, dataUrl: finalDataUrl, pageWidth, pageHeight })
    } catch (e) {
      notify(0, { done: true, error: e.message })
    } finally {
      window.__fullPageScreenshotActive = false
    }
  }

  run()
})()
