// 页面性能检测 Content Script
// 注入当前页面收集导航/渲染性能指标
// 通过 chrome.runtime.sendMessage 返回结果

;(() => {
  function getNavigationTiming() {
    const nav = performance.getEntriesByType('navigation')[0] || performance.timing
    if (!nav) return {}
    const now = (t) => (t > 0 ? Math.max(0, t) : null)
    return {
      // 导航开始到各阶段（相对 navigationStart / startTime）
      dns: now(nav.domainLookupEnd - nav.domainLookupStart),
      tcp: now(nav.connectEnd - nav.connectStart),
      ttfb: now(
        (nav.responseStart || nav.requestStart) - (nav.startTime || nav.fetchStart || 0)
      ),
      domInteractive: now(nav.domInteractive - (nav.startTime || 0)),
      domContentLoaded: now(nav.domContentLoadedEventEnd - (nav.startTime || 0)),
      load: now(nav.loadEventEnd - (nav.startTime || 0)),
      // 总加载时间（从导航开始）
      total: nav.loadEventEnd > 0 ? Math.max(0, nav.loadEventEnd) : null,
      // 资源传输大小
      transferSize: nav.transferSize || 0,
    }
  }

  function getLCP() {
    const entries = performance.getEntriesByType('largest-contentful-paint')
    if (!entries.length) return null
    const last = entries[entries.length - 1]
    return last ? Math.round(last.startTime) : null
  }

  // FID：若页面还未完全加载完真实用户交互数据，则返回 null，否则用 FCP 到 first input 的延迟
  function getFID() {
    const fid = performance.getEntriesByType('first-input')
    if (fid.length) return Math.round(fid[0].processingStart - fid[0].startTime)
    return null
  }

  function getCLS() {
    // 累加所有 layout-shift 条目
    let value = 0
    const entries = performance.getEntriesByType('layout-shift')
    for (const e of entries) {
      if (!e.hadRecentInput) value += e.value
    }
    return value
  }

  function getResourceStats() {
    const res = performance.getEntriesByType('resource')
    let jsSize = 0
    let cssSize = 0
    let imgCount = 0
    let imgSize = 0
    const byType = {}

    for (const r of res) {
      const t = r.initiatorType || 'other'
      byType[t] = (byType[t] || 0) + 1
      const size = r.transferSize || r.encodedBodySize || 0
      if (t === 'script') jsSize += size
      else if (t === 'css' || t === 'link') cssSize += size
      else if (t === 'img') {
        imgCount += 1
        imgSize += size
      }
    }

    const domImgs = document.images ? document.images.length : 0

    return {
      total: res.length,
      byType,
      jsSize,
      cssSize,
      imgCount: Math.max(imgCount, domImgs),
      imgSize,
    }
  }

  function getDomInfo() {
    const all = document.querySelectorAll('*').length
    return {
      nodeCount: all,
      depth: (() => {
        let max = 0
        let node = document.body
        const walk = (el, d) => {
          if (d > max) max = d
          for (const child of el.children) walk(child, d + 1)
        }
        if (document.body) walk(document.body, 1)
        return max
      })(),
    }
  }

  function getFCP() {
    const entries = performance.getEntriesByType('paint')
    const fcp = entries.find((e) => e.name === 'first-contentful-paint')
    return fcp ? Math.round(fcp.startTime) : null
  }

  const timing = getNavigationTiming()
  const result = {
    url: location.href,
    title: document.title,
    ua: navigator.userAgent,
    navigation: timing,
    fcp: getFCP(),
    lcp: getLCP(),
    fid: getFID(),
    cls: getCLS(),
    resources: getResourceStats(),
    dom: getDomInfo(),
  }

  chrome.runtime.sendMessage({ type: 'perfResult', payload: result })
})()
