<template>
  <div ref="rootEl" class="lined-textarea" :style="minHeight ? { minHeight } : {}">
    <div class="lt-gutter" ref="gutter" aria-hidden="true">{{ gutterText }}</div>
    <textarea
      ref="area"
      class="lt-area"
      :value="modelValue"
      :placeholder="placeholder"
      :readonly="readonly"
      wrap="soft"
      spellcheck="false"
      @input="onInput"
      @scroll="syncScroll"
    ></textarea>
    <div class="lt-mirror" ref="mirror" aria-hidden="true">
      <div v-for="(line, i) in mirrorLines" :key="i">{{ line }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  minHeight: { type: String, default: '' },
  // 传入则记忆用户上下拖动的高度，下次恢复
  resizeKey: { type: String, default: '' },
})
const emit = defineEmits(['update:modelValue', 'input'])

function onInput(e) {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}

const rootEl = ref(null)
const gutter = ref(null)
const area = ref(null)
const mirror = ref(null)
const gutterText = ref('1')

const NBSP = ' '
const mirrorLines = computed(() => {
  const text = props.modelValue || ''
  let lines = text.split('\n')
  if (text.endsWith('\n')) lines.pop()
  if (!lines.length) lines = ['']
  return lines.map((l) => (l.length ? l : NBSP))
})

let recalcScheduled = false
let recalcing = false
let lastAreaWidth = -1

function scheduleRecalc() {
  if (recalcScheduled || recalcing) return
  recalcScheduled = true
  requestAnimationFrame(() => {
    recalcScheduled = false
    void recalcGutter()
  })
}

async function recalcGutter() {
  if (recalcing) return
  recalcing = true
  try {
    await nextTick()
    const ta = area.value
    const mir = mirror.value
    if (!ta || !mir) return
    const w = ta.clientWidth
    if (mir.style.width !== w + 'px') mir.style.width = w + 'px'
    const lh = parseFloat(getComputedStyle(ta).lineHeight)
    const kids = mir.children
    let out = ''
    for (let i = 0; i < kids.length; i++) {
      const wraps = Math.max(1, Math.round(kids[i].offsetHeight / lh))
      out += (i ? '\n' : '') + (i + 1)
      for (let k = 1; k < wraps; k++) out += '\n'
    }
    if (out !== gutterText.value) gutterText.value = out || '1'
  } finally {
    recalcing = false
  }
}

let ro = null
let resizeRO = null
let resizeTimer = null
let lastResizeH = -1
const RESIZE_PREFIX = 'dev-toolbox-resize-'

onMounted(() => {
  lastAreaWidth = area.value ? area.value.clientWidth : -1
  scheduleRecalc()
  if (typeof ResizeObserver !== 'undefined' && area.value) {
    // 仅宽度变化才重算行号（折行只与宽度/内容有关；高度变化不重算，避免拖动分隔条时卡死）
    ro = new ResizeObserver(() => {
      const ta = area.value
      if (!ta) return
      const w = ta.clientWidth
      if (w === lastAreaWidth) return
      lastAreaWidth = w
      scheduleRecalc()
    })
    ro.observe(area.value)
  }
  // 记忆上下拖动的高度：恢复上次 + 监听变化后保存（防抖）
  if (props.resizeKey && rootEl.value && typeof ResizeObserver !== 'undefined') {
    try {
      const saved = Number(localStorage.getItem(RESIZE_PREFIX + props.resizeKey))
      if (saved >= 50 && saved <= 4000) rootEl.value.style.height = saved + 'px'
    } catch {}
    resizeRO = new ResizeObserver(() => {
      if (!rootEl.value) return
      const h = rootEl.value.offsetHeight
      if (h === lastResizeH) return // 高度没变（如仅宽度变化）不处理
      lastResizeH = h
      clearTimeout(resizeTimer)
      resizeTimer = setTimeout(() => {
        try { localStorage.setItem(RESIZE_PREFIX + props.resizeKey, String(h)) } catch {}
      }, 300)
    })
    resizeRO.observe(rootEl.value)
  }
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  if (resizeRO) resizeRO.disconnect()
  clearTimeout(resizeTimer)
})

watch(() => props.modelValue, scheduleRecalc, { flush: 'post' })

function syncScroll() {
  if (gutter.value && area.value) gutter.value.scrollTop = area.value.scrollTop
}
</script>

<style scoped>
.lined-textarea {
  display: flex;
  align-items: stretch;
  width: 100%;
  height: 260px;
  min-height: 260px;
  flex: none;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  overflow: hidden;
  resize: vertical;
  transition: border-color 0.15s;
  position: relative;
}

.lined-textarea:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.lt-gutter {
  flex: none;
  padding: 8px 8px 8px 10px;
  border-right: 1px solid var(--border);
  background: var(--bg-hover);
  text-align: right;
  color: var(--text-secondary);
  user-select: none;
  white-space: pre;
  overflow: hidden;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.6;
}

.lt-area {
  flex: 1;
  min-width: 0;
  min-height: 0;
  border: none;
  border-radius: 0;
  background: transparent;
  resize: none;
  white-space: pre-wrap;
  overflow: auto;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.6;
  padding: 8px 10px;
}

.lt-area:focus {
  border: none;
  box-shadow: none;
}

/* 镜像容器：与 textarea 同字体/行距/内边距/折行规则，用于测量每个逻辑行折行数 */
.lt-mirror {
  position: absolute;
  visibility: hidden;
  top: 0;
  left: 0;
  height: auto;
  pointer-events: none;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.6;
  padding: 8px 10px;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  box-sizing: border-box;
}
</style>
