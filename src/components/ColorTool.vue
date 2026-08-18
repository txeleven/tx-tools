<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.color.name') }}</div>
      <div class="tool-desc">{{ t('tools.color.desc') }}</div>
    </div>

    <div class="toolbar">
      <input v-model="input" :placeholder="t('color.placeholder')" class="mono" spellcheck="false" @input="syncFromInput" />
      <div class="picker-wrap" @click.stop>
        <button ref="pickerBtn" class="picker-btn" :title="t('color.picker')" @click.stop="togglePanel">
          <span class="picker-fill" :style="{ background: previewColor }"></span>
        </button>
        <div
          class="picker-panel"
          v-if="panelOpen"
          :style="{ top: panelPos.top + 'px', left: panelPos.left + 'px' }"
          @click.stop
        >
          <div
            ref="svArea"
            class="sv-area"
            :style="svStyle"
            @mousedown.prevent="startDrag('sv', $event)"
          >
            <span class="sv-dot" :style="svDotStyle"></span>
          </div>
          <div
            ref="hueBar"
            class="bar hue-bar"
            @mousedown.prevent="startDrag('hue', $event)"
          >
            <span class="bar-thumb" :style="hueThumbStyle"></span>
          </div>
          <div
            ref="alphaBar"
            class="bar alpha-bar"
            :style="alphaBarStyle"
            @mousedown.prevent="startDrag('alpha', $event)"
          >
            <span class="bar-thumb" :style="alphaThumbStyle"></span>
          </div>
          <div class="panel-foot mono">
            <span>{{ panelHex }}</span>
            <span>{{ alphaPct }}%</span>
          </div>
        </div>
      </div>
    </div>

    <div class="alpha-row">
      <span class="alpha-label">{{ t('color.alphaLabel') }}</span>
      <input
        type="range"
        class="alpha-slider"
        min="0"
        max="100"
        v-model.number="alphaPct"
      />
      <div class="alpha-input-wrap">
        <input
          type="number"
          class="alpha-input"
          min="0"
          max="100"
          v-model.number="alphaPct"
        />
        <span class="alpha-unit">%</span>
      </div>
    </div>

    <div class="palette">
      <span class="palette-label">{{ t('color.palette') }}</span>
      <div class="swatches">
        <button
          v-for="c in palette"
          :key="c.hex"
          class="swatch"
          :class="{ active: baseColor === c.hex }"
          :style="{ background: c.hex }"
          :title="`${c.name} ${c.hex}`"
          @click="selectColor(c.hex)"
        ></button>
      </div>
    </div>

    <div class="status err" v-if="error">{{ error }}</div>

    <div class="preview-box" v-if="previewColor">
      <div class="preview-fill" :style="{ background: previewColor }"></div>
      <span class="preview-text">{{ previewColor }}</span>
    </div>

    <div class="result-group" v-if="results.length">
      <div class="result-row" v-for="r in results" :key="r.key">
        <span class="label">{{ r.label }}</span>
        <button
          v-if="r.type === 'hex'"
          class="hex-chip mono"
          :style="{ '--chip-color': r.value }"
          :title="t('common.copy')"
          @click="copy(r.value)"
        >
          <span class="hex-fill"></span>
          <span class="hex-text">{{ r.value }}</span>
        </button>
        <button
          v-else
          class="value-chip mono"
          :title="t('common.copy')"
          @click="copy(r.value)"
        >
          {{ r.value }}
        </button>
      </div>
    </div>

    <div class="result-group" v-if="cssResults.length">
      <div class="result-row" v-for="r in cssResults" :key="r.key">
        <span class="label">{{ r.label }}</span>
        <button class="value-chip mono" :title="t('common.copy')" @click="copy(r.value)">
          {{ r.value }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { parseColor, toHex, toRgb, toHsl, rgbToHsv, hsvToRgb } from '../tools/convert.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'

const input = ref('#3b82f6')
const error = ref('')
const alpha = ref(1)
const hue = ref(217)
const sat = ref(76)
const val = ref(96)
const panelOpen = ref(false)
const panelPos = ref({ top: 0, left: 0 })
const pickerBtn = ref(null)
const svArea = ref(null)
const hueBar = ref(null)
const alphaBar = ref(null)
let dragPart = null
const { show } = useToast()

// Web 常用默认色（CSS 命名色，按色系排列）
const palette = [
  { name: 'black', hex: '#000000' },
  { name: 'white', hex: '#ffffff' },
  { name: 'gray', hex: '#808080' },
  { name: 'silver', hex: '#c0c0c0' },
  { name: 'red', hex: '#ff0000' },
  { name: 'maroon', hex: '#800000' },
  { name: 'tomato', hex: '#ff6347' },
  { name: 'coral', hex: '#ff7f50' },
  { name: 'darkorange', hex: '#ff8c00' },
  { name: 'orange', hex: '#ffa500' },
  { name: 'gold', hex: '#ffd700' },
  { name: 'yellow', hex: '#ffff00' },
  { name: 'olive', hex: '#808000' },
  { name: 'greenyellow', hex: '#adff2f' },
  { name: 'lime', hex: '#00ff00' },
  { name: 'green', hex: '#008000' },
  { name: 'seagreen', hex: '#2e8b57' },
  { name: 'aqua', hex: '#00ffff' },
  { name: 'teal', hex: '#008080' },
  { name: 'darkturquoise', hex: '#00ced1' },
  { name: 'dodgerblue', hex: '#1e90ff' },
  { name: 'blue', hex: '#0000ff' },
  { name: 'navy', hex: '#000080' },
  { name: 'royalblue', hex: '#4169e1' },
  { name: 'blueviolet', hex: '#8a2be2' },
  { name: 'purple', hex: '#800080' },
  { name: 'violet', hex: '#ee82ee' },
  { name: 'fuchsia', hex: '#ff00ff' },
  { name: 'hotpink', hex: '#ff69b4' },
  { name: 'pink', hex: '#ffc0cb' },
  { name: 'brown', hex: '#a52a2a' },
  { name: 'beige', hex: '#f5f5dc' },
]

function selectColor(hex) {
  input.value = hex
}

const alphaPct = computed({
  get: () => Math.round(alpha.value * 100),
  set: (v) => {
    alpha.value = Math.max(0, Math.min(100, v || 0)) / 100
  },
})

// 输入框内容变化时，同步色盘的状态（透明度 + HSV）
function syncFromInput() {
  try {
    const p = parseColor(input.value)
    const a = Math.round(p.a * 100) / 100
    if (Math.abs(a - alpha.value) > 0.001) alpha.value = a
    const hsv = rgbToHsv(p)
    if (hsv.h !== hue.value) hue.value = hsv.h
    if (hsv.s !== sat.value) sat.value = hsv.s
    if (hsv.v !== val.value) val.value = hsv.v
  } catch (e) {
    /* 忽略无效输入，仅颜色解析报错时展示 */
  }
}

const rgb = computed(() => {
  if (!input.value.trim()) return null
  error.value = ''
  try {
    const p = parseColor(input.value)
    return { ...p, a: alpha.value }
  } catch (e) {
    error.value = `${t('common.error')}: ${e.message}`
    return null
  }
})

// 不透明的基础色（供色板高亮与颜色选择器使用）
const baseColor = computed(() => {
  if (!input.value.trim()) return '#000000'
  try {
    return toHex({ ...parseColor(input.value), a: 1 })
  } catch (e) {
    return '#000000'
  }
})

const results = computed(() => {
  if (!rgb.value) return []
  return [
    { key: 'hex', type: 'hex', label: t('color.hexLabel'), value: toHex(rgb.value) },
    { key: 'rgb', label: t('color.rgbLabel'), value: toRgb(rgb.value) },
    { key: 'hsl', label: t('color.hslLabel'), value: toHsl(rgb.value) },
  ]
})

const cssResults = computed(() => {
  if (!rgb.value) return []
  const v = toRgb(rgb.value)
  return [
    { key: 'bg', label: t('color.cssBackground'), value: `background: ${v};` },
    { key: 'color', label: t('color.cssColor'), value: `color: ${v};` },
  ]
})

const previewColor = computed(() => (rgb.value ? toRgb(rgb.value) : ''))

// ---------- 色盘面板 ----------
const PANEL_W = 210
const PANEL_H = 230

function togglePanel() {
  if (panelOpen.value) {
    closePanel()
    return
  }
  const rect = pickerBtn.value.getBoundingClientRect()
  let left = rect.left
  let top = rect.bottom + 6
  left = Math.max(8, Math.min(left, window.innerWidth - PANEL_W - 8))
  if (top + PANEL_H > window.innerHeight - 8) {
    top = Math.max(8, rect.top - PANEL_H - 6)
  }
  panelPos.value = { top, left }
  panelOpen.value = true
}

function closePanel() {
  panelOpen.value = false
}

function startDrag(part, e) {
  dragPart = part
  onDrag(e)
}

function onDrag(e) {
  if (dragPart === 'sv') onSvPointer(e)
  else if (dragPart === 'hue') onHuePointer(e)
  else if (dragPart === 'alpha') onAlphaPointer(e)
}

function endDrag() {
  dragPart = null
}

function onSvPointer(e) {
  const rect = svArea.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height))
  sat.value = Math.round(x * 100)
  val.value = Math.round((1 - y) * 100)
  applyPicker()
}

function onHuePointer(e) {
  const rect = hueBar.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  hue.value = Math.round(x * 360)
  applyPicker()
}

function onAlphaPointer(e) {
  const rect = alphaBar.value.getBoundingClientRect()
  const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
  alpha.value = Math.round(x * 100) / 100
  applyPicker()
}

// 色盘操作结果写回输入框（带 alpha 的 8 位 hex）
function applyPicker() {
  const { r, g, b } = hsvToRgb({ h: hue.value, s: sat.value, v: val.value })
  const hex = toHex({ r, g, b, a: alpha.value })
  if (hex !== input.value) input.value = hex
}

// 面板样式
const svStyle = computed(() => ({ '--picker-hue': hue.value + 'deg' }))
const svDotStyle = computed(() => ({
  left: sat.value + '%',
  top: 100 - val.value + '%',
}))
const hueThumbStyle = computed(() => ({ left: (hue.value / 360) * 100 + '%' }))
const alphaThumbStyle = computed(() => ({ left: alphaPct.value + '%' }))
const alphaBarStyle = computed(() => {
  const { r, g, b } = hsvToRgb({ h: hue.value, s: sat.value, v: val.value })
  return {
    background:
      `linear-gradient(to right, rgba(0,0,0,0), rgb(${r},${g},${b})), ` +
      'conic-gradient(#e2e5ea 25%, #f7f8fa 0 50%, #e2e5ea 0 75%, #f7f8fa 0)',
    backgroundSize: '100% 100%, 10px 10px',
  }
})
const panelHex = computed(() => (rgb.value ? toHex(rgb.value) : ''))

onMounted(() => {
  window.addEventListener('mousemove', onDrag)
  window.addEventListener('mouseup', endDrag)
  syncFromInput()
})

onBeforeUnmount(() => {
  window.removeEventListener('mousemove', onDrag)
  window.removeEventListener('mouseup', endDrag)
})

// 点击面板外部关闭
watch(panelOpen, (open) => {
  if (open) setTimeout(() => window.addEventListener('click', closePanel), 0)
  else window.removeEventListener('click', closePanel)
})

async function copy(value) {
  if (await copyText(value)) show(t('common.copied'))
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.palette {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.palette-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.swatch {
  width: 22px;
  height: 22px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.18);
  padding: 0;
  cursor: pointer;
  transition: transform 0.1s;
}

.swatch:hover {
  transform: scale(1.15);
}

.swatch.active {
  outline: 2px solid var(--primary);
  outline-offset: 1px;
}

.picker-wrap {
  position: relative;
  flex-shrink: 0;
}

.picker-btn {
  position: relative;
  width: 44px;
  height: 32px;
  padding: 2px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  cursor: pointer;
  overflow: hidden;
  background-image: conic-gradient(#e2e5ea 25%, #f7f8fa 0 50%, #e2e5ea 0 75%, #f7f8fa 0);
  background-size: 8px 8px;
}

.picker-fill {
  position: absolute;
  inset: 0;
  border-radius: calc(var(--radius-sm) - 1px);
}

.picker-panel {
  position: fixed;
  width: 210px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
}

.sv-area {
  position: relative;
  height: 120px;
  border-radius: 4px;
  cursor: crosshair;
  background:
    linear-gradient(to top, #000, transparent),
    linear-gradient(to right, #fff, hsl(var(--picker-hue) 100% 50%));
}

.sv-dot {
  position: absolute;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 2px solid #fff;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.4);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.bar {
  position: relative;
  height: 14px;
  border-radius: 4px;
  cursor: pointer;
}

.hue-bar {
  background: linear-gradient(
    to right,
    #f00 0%, #ff0 17%, #0f0 33%, #0ff 50%, #00f 67%, #f0f 83%, #f00 100%
  );
}

.bar-thumb {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 14px;
  border: 2px solid #fff;
  border-radius: 3px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.3);
  transform: translate(-50%, -50%);
  pointer-events: none;
}

.panel-foot {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: var(--text-secondary);
}

.alpha-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.alpha-label {
  font-size: 12px;
  color: var(--text-secondary);
  flex-shrink: 0;
}

.alpha-slider {
  flex: 1;
  accent-color: var(--primary);
  cursor: pointer;
}

.alpha-input-wrap {
  position: relative;
  flex-shrink: 0;
}

.alpha-input {
  width: 80px;
  padding-right: 18px;
  text-align: right;
  font-family: var(--mono);
}

.alpha-unit {
  position: absolute;
  right: 6px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  color: var(--text-secondary);
  pointer-events: none;
}

.preview-box {
  position: relative;
  height: 56px;
  border-radius: var(--radius);
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid rgba(0, 0, 0, 0.1);
  background-image: conic-gradient(#e2e5ea 25%, #f7f8fa 0 50%, #e2e5ea 0 75%, #f7f8fa 0);
  background-size: 16px 16px;
  overflow: hidden;
}

.preview-fill {
  position: absolute;
  inset: 0;
}

.preview-text {
  position: relative;
  background: rgba(255, 255, 255, 0.85);
  padding: 2px 10px;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 12px;
  color: #1f2329;
}

.result-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.result-group + .result-group {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.hex-chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 2px 10px 2px 2px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: var(--bg-panel);
  cursor: pointer;
  transition: border-color 0.12s;
  text-align: left;
}

.hex-chip:hover {
  border-color: var(--primary);
}

.hex-fill {
  position: relative;
  width: 22px;
  height: 22px;
  border-radius: calc(var(--radius-sm) - 1px);
  overflow: hidden;
  flex-shrink: 0;
  background-size: 8px 8px;
}

.hex-fill::after {
  content: '';
  position: absolute;
  inset: 0;
  background: var(--chip-color, transparent);
}

.value-chip {
  font-family: var(--mono);
  font-size: 12.5px;
  word-break: break-all;
  text-align: left;
  padding: 5px 10px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: var(--bg-panel);
  cursor: pointer;
  transition: border-color 0.12s;
}

.value-chip:hover {
  border-color: var(--primary);
}

.copy-btn {
  padding: 3px 8px;
  font-size: 12px;
  flex-shrink: 0;
}
</style>
