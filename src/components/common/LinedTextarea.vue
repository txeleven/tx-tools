<template>
  <div class="lined-textarea" :style="minHeight ? { minHeight } : {}">
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
})
const emit = defineEmits(['update:modelValue', 'input'])

function onInput(e) {
  emit('update:modelValue', e.target.value)
  emit('input', e)
}

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

async function recalcGutter() {
  await nextTick()
  const ta = area.value
  const mir = mirror.value
  if (!ta || !mir) return
  mir.style.width = ta.clientWidth + 'px'
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
  recalcGutter()
  if (typeof ResizeObserver !== 'undefined' && area.value) {
    ro = new ResizeObserver(recalcGutter)
    ro.observe(area.value)
  }
})
onBeforeUnmount(() => {
  if (ro) ro.disconnect()
})

watch(() => props.modelValue, recalcGutter, { flush: 'post' })

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
