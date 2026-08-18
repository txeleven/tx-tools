import { getStorage, setStorage } from './storage.js'

// 可调节高度的元素：输入 textarea 与输出区域（.output-box）
// .lt-area 是 LinedTextarea 的内部 textarea，高度由容器 .lined-textarea 决定，需排除避免重复计数
const RESIZE_SELECTOR = 'textarea:not(.lt-area), .output-box, .lined-textarea'
const PREFIX = 'dev-toolbox-resize:'
const MIN_H = 60

// 自定义拖拽手柄拖拽中
let dragging = null
// textarea 原生 resize 检测：按下时记录起点，松开时高度变化才保存
let pending = null
let bound = false

function keyOf(toolId, index) {
  return `${PREFIX}${toolId}:${index}`
}

function areaIndex(root, el) {
  return Array.prototype.indexOf.call(root.querySelectorAll(RESIZE_SELECTOR), el)
}

function saveHeight(toolId, index, height) {
  setStorage(keyOf(toolId, index), height)
}

// 给容器内所有可调元素补上拖拽手柄（插在元素正下方）。
// 仅当父容器不是 grid 时注入：grid 直系子元素插入会破坏列布局（现有工具的可调元素均在 flex 容器内）。
function ensureHandles(root) {
  root.querySelectorAll(RESIZE_SELECTOR).forEach((el, i) => {
    if (el.dataset.resizeHandleReady) return
    const parent = el.parentElement
    if (!parent) return
    if (getComputedStyle(parent).display.includes('grid')) return
    el.dataset.resizeHandleReady = '1'
    const handle = document.createElement('div')
    handle.className = 'resize-handle'
    handle.dataset.resizeIndex = String(i)
    parent.insertBefore(handle, el.nextSibling)
  })
}

// 目标元素在父容器内可拉伸的最大高度（不超过父容器剩余空间，避免挤出布局）
function computeMaxHeight(parent, el) {
  const style = getComputedStyle(parent)
  const gap = parseFloat(style.rowGap) || parseFloat(style.gap) || 0
  let other = 0
  let count = 0
  for (const child of parent.children) {
    if (child === el) continue
    other += child.offsetHeight
    count++
  }
  const avail = (parent.clientHeight || parent.offsetHeight) - other - gap * count
  return Math.max(MIN_H, Math.round(avail))
}

function onMouseDown(e) {
  const handle = e.target.closest?.('.resize-handle')
  if (handle) {
    const root = handle.closest('[data-tool]')
    if (!root) return
    const toolId = root.dataset.tool
    const el = root.querySelectorAll(RESIZE_SELECTOR)[Number(handle.dataset.resizeIndex)]
    if (!el) return
    dragging = {
      el,
      parent: el.parentElement,
      toolId,
      index: Number(handle.dataset.resizeIndex),
      startY: e.clientY,
      startH: el.offsetHeight,
      curH: el.offsetHeight,
    }
    document.body.classList.add('resizing-row')
    e.preventDefault()
    return
  }
  // textarea 原生 resize：记录起点，仅当高度真的变化才保存
  const el = e.target.closest?.(RESIZE_SELECTOR)
  if (!el) return
  const root = el.closest('[data-tool]')
  if (!root) return
  pending = { el, toolId: root.dataset.tool, index: areaIndex(root, el), startH: el.offsetHeight }
}

function onMouseMove(e) {
  if (dragging) {
    const { el, parent, startY, startH } = dragging
    const h = Math.min(Math.max(MIN_H, startH + (e.clientY - startY)), computeMaxHeight(parent, el))
    el.style.height = `${h}px`
    el.style.flex = 'none'
    dragging.curH = h
  }
}

function onMouseUp() {
  if (dragging) {
    if (dragging.curH !== dragging.startH) saveHeight(dragging.toolId, dragging.index, dragging.curH)
    dragging = null
    document.body.classList.remove('resizing-row')
    return
  }
  if (pending) {
    if (pending.el.offsetHeight !== pending.startH) {
      saveHeight(pending.toolId, pending.index, pending.el.offsetHeight)
    }
    pending = null
  }
}

function onBlur() {
  if (dragging || pending) {
    dragging = null
    pending = null
    document.body.classList.remove('resizing-row')
  }
}

// 页面加载时绑定一次全局拖拽事件（options / popup 各执行一次即可）
export function bindHeightMemory() {
  if (bound) return
  bound = true
  document.addEventListener('mousedown', onMouseDown)
  document.addEventListener('mousemove', onMouseMove)
  document.addEventListener('mouseup', onMouseUp)
  window.addEventListener('blur', onBlur)
}

// 恢复容器内所有可调区域保存过的高度（按 DOM 顺序索引与工具 id 匹配）
export async function restoreHeights(root, toolId) {
  if (!root || !toolId) return
  ensureHandles(root)
  const list = root.querySelectorAll(RESIZE_SELECTOR)
  const keys = []
  for (let i = 0; i < list.length; i++) keys.push(keyOf(toolId, i))
  const values = await Promise.all(keys.map((k) => getStorage(k)))
  list.forEach((el, i) => {
    const n = Number(values[i])
    if (n && n >= MIN_H) {
      el.style.height = `${n}px`
      el.style.flex = 'none'
    }
  })
}
