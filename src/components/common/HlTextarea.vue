<template>
  <div class="hl-textarea" :class="{ fill }" :style="minHeight ? { minHeight } : {}">
    <div class="lt-gutter" ref="gutter" aria-hidden="true">{{ gutterText }}</div>
    <div class="hl-body">
      <pre ref="hl" class="hl-layer" aria-hidden="true">{{ modelValue }}</pre>
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
    </div>
    <div class="lt-mirror" ref="mirror" aria-hidden="true">
      <div v-for="(line, i) in mirrorLines" :key="i">{{ line }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { getHighlightTokens } from '../../tools/syntaxHighlight.js'

const props = defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  readonly: { type: Boolean, default: false },
  minHeight: { type: String, default: '' },
  language: { type: String, default: '' },
  fill: { type: Boolean, default: false },
})
const emit = defineEmits(['update:modelValue', 'input'])

function onInput(e) {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}

const gutter = ref(null)
const area = ref(null)
const hl = ref(null)
const mirror = ref(null)
const gutterText = ref('1')

// CSS Custom Highlight API：不改 DOM（纯文本节点，断行与输入层一致），用 Range 给 token 上色
const highlightSupported = typeof CSS !== 'undefined' && !!CSS.highlights && typeof Highlight !== 'undefined'
const registeredTypes = new Set()

async function applyHighlights() {
  const el = hl.value
  if (!el) return
  if (highlightSupported) {
    for (const t of registeredTypes) CSS.highlights.delete(t)
    registeredTypes.clear()
  }
  await nextTick()
  if (!highlightSupported || !props.language) return
  const textNode = el.firstChild
  if (!textNode || textNode.nodeType !== 3 || !textNode.length) return
  const tokens = getHighlightTokens(props.modelValue || '', props.language)
  const byType = new Map()
  for (const t of tokens) {
    if (t.start >= textNode.length) continue
    const range = new Range()
    range.setStart(textNode, t.start)
    range.setEnd(textNode, Math.min(t.end, textNode.length))
    if (!byType.has(t.type)) byType.set(t.type, [])
    byType.get(t.type).push(range)
  }
  for (const [type, ranges] of byType) {
    CSS.highlights.set(type, new Highlight(...ranges))
    registeredTypes.add(type)
  }
}

const NBSP = ' '
const mirrorLines = computed(() => {
  const text = props.modelValue || ''
  let lines = text.split('\n')
  if (text.endsWith('\n')) lines.pop()
  if (!lines.length) lines = ['']
  return lines.map((l) => (l.length ? l : NBSP))
})

async function recalc() {
  await nextTick()
  const ta = area.value
  const mir = mirror.value
  if (!ta || !mir) return
  const w = ta.clientWidth + 'px'
  mir.style.width = w
  if (hl.value) hl.value.style.width = w
  const lh = parseFloat(getComputedStyle(ta).lineHeight)
  const kids = mir.children
  let out = ''
  for (let i = 0; i < kids.length; i++) {
    const wraps = Math.max(1, Math.round(kids[i].offsetHeight / lh))
    out += (i ? '\n' : '') + (i + 1)
    for (let k = 1; k < wraps; k++) out += '\n'
  }
  gutterText.value = out || '1'
}

let ro = null
onMounted(() => {
  recalc()
  applyHighlights()
  if (typeof ResizeObserver !== 'undefined' && area.value) {
    ro = new ResizeObserver(recalc)
    ro.observe(area.value)
  }
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
  if (highlightSupported) {
    for (const t of registeredTypes) CSS.highlights.delete(t)
    registeredTypes.clear()
  }
})

function refresh() {
  recalc()
  applyHighlights()
}
watch(() => props.modelValue, refresh, { flush: 'post' })
watch(() => props.language, refresh, { flush: 'post' })

function syncScroll() {
  if (gutter.value && area.value) gutter.value.scrollTop = area.value.scrollTop
  if (hl.value && area.value) {
    hl.value.scrollTop = area.value.scrollTop
    hl.value.scrollLeft = area.value.scrollLeft
  }
}
</script>

<style scoped>
.hl-textarea {
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

.hl-textarea:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

/* fill 模式：撑满父容器剩余空间 */
.hl-textarea.fill {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
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

.hl-body {
  flex: 1;
  min-width: 0;
  min-height: 0;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.hl-layer {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  margin: 0;
  box-sizing: border-box;
  padding: 8px 10px;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.6;
  letter-spacing: normal;
  tab-size: 4;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow: hidden;
  pointer-events: none;
  color: var(--text);
}


.lt-area {
  flex: 1;
  width: 100%;
  min-height: 0;
  box-sizing: border-box;
  border: none;
  border-radius: 0;
  background: transparent;
  color: transparent;
  caret-color: var(--text);
  resize: none;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  overflow: auto;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.6;
  letter-spacing: normal;
  tab-size: 4;
  padding: 8px 10px;
  z-index: 1;
}

.lt-area:focus {
  border: none;
  box-shadow: none;
  outline: none;
}

.lt-area::placeholder {
  color: var(--text-secondary);
  opacity: 0.6;
}

.lt-area::selection {
  background: rgba(37, 99, 235, 0.2);
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
  letter-spacing: normal;
  tab-size: 4;
  padding: 8px 10px;
  white-space: pre-wrap;
  overflow-wrap: break-word;
  box-sizing: border-box;
}
</style>
