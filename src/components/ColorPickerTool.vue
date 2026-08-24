<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.colorPicker.name') }}</div>
      <div class="tool-desc">{{ t('tools.colorPicker.desc') }}</div>
    </div>

    <div v-if="!support" class="status warn">{{ t('colorPicker.noSupport') }}</div>

    <div class="pick-wrap">
      <button class="primary pick-btn" @click="startPicking" :disabled="picking || !support">
        <span class="dropper">🎨</span>
        {{ picking ? t('colorPicker.picking') : t('colorPicker.pick') }}
      </button>
      <button v-if="picking" class="cancel-btn" @click="stopPicking">
        {{ t('colorPicker.cancel') }}
      </button>
      <span v-if="!picking && samples.length" class="samples-count">
        {{ t('colorPicker.samples') }}: {{ samples.length }}
      </span>
      <span v-if="!picking && samples.length" class="clear-btn" @click="samples = []">{{ t('colorPicker.clear') }}</span>
    </div>

    <div v-if="!picking && error" class="status err">{{ error }}</div>

    <div v-if="!picking && hint" class="hint">{{ t('colorPicker.hint') }}</div>

    <!-- 已采集色值列表 -->
    <div v-if="!picking && samples.length" class="samples">
      <div
        v-for="(s, i) in samples"
        :key="i"
        class="sample-row"
        :style="{ '--c': s.hex }"
      >
        <span class="sample-swatch"></span>
        <input class="sample-hex mono" readonly :value="s.hex" @click="copy(s.hex)" />
        <input class="sample-rgb mono" readonly :value="s.rgb" @click="copy(s.rgb)" />
        <span class="sample-remove" :title="t('common.delete')" @click="samples.splice(i, 1)">×</span>
      </div>
    </div>

    <!-- 取色覆盖层 -->
    <teleport to="body">
      <div
        v-if="picking && shot"
        class="picker-overlay"
        :style="{ cursor: 'crosshair' }"
        @mousemove="onMove"
        @click="onClick"
        @mouseleave="onLeave"
      >
        <img class="picker-shot" :src="shot" alt="" draggable="false" />
        <div
          class="picker-magnifier"
          :style="magStyle"
          :class="{ hidden: !hover }"
        >
          <canvas ref="magCanvas" class="mag-canvas" width="120" height="120"></canvas>
          <div class="mag-info">
            <span class="mag-hex" :style="{ color: hover ? hover.hex : '#fff' }">{{ hover ? hover.hex : '' }}</span>
            <span class="mag-rgb">{{ hover ? hover.rgb : '' }}</span>
            <span class="mag-pos">{{ hover ? `${hover.x}, ${hover.y}` : '' }}</span>
          </div>
        </div>
        <div class="picker-tip">{{ t('colorPicker.hint') }}</div>
      </div>
    </teleport>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import { t } from '../i18n/index.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'

const support = ref(false)
const picking = ref(false)
const shot = ref('')
const error = ref('')
const hint = ref(true)
const magCanvas = ref(null)
const samples = ref([])
const { show } = useToast()

// 当前悬停处的颜色信息
const hover = ref(null)
// 截图的实际像素尺寸（用于把屏幕坐标映射到像素）
const shotSize = reactive({ w: 0, h: 0 })
// 缓存截图的 ImageData，避免每次 mousemove 重新绘制
let shotImage = null
let shotCanvas = null

const MAG_ZOOM = 8 // 放大镜放大倍数
const MAG_PX = 15 // 放大镜取 MAG_PX×MAG_PX 区域

const magStyle = computed(() => {
  if (!hover.value) return {}
  const x = hover.value.x
  const y = hover.value.y
  // 放大镜跟随鼠标，避免超出右/下边界时翻转
  const flipX = x > window.innerWidth - 150
  const flipY = y > window.innerHeight - 150
  return {
    left: flipX ? x - 132 + 'px' : x + 18 + 'px',
    top: flipY ? y - 132 + 'px' : y + 18 + 'px',
  }
})

onMounted(() => {
  support.value = typeof chrome !== 'undefined' && !!chrome.tabs && !!chrome.tabs.captureVisibleTab
  window.addEventListener('keydown', onKeydown)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onKeydown)
  stopPicking()
})

async function getActiveTab() {
  if (typeof chrome === 'undefined' || !chrome.tabs) return null
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs && tabs[0] ? tabs[0] : null
}

async function startPicking() {
  if (!support.value || picking.value) return
  error.value = ''
  picking.value = true
  shot.value = ''
  hover.value = null
  try {
    const tab = await getActiveTab()
    if (!tab || tab.id == null) {
      error.value = t('colorPicker.noTab')
      picking.value = false
      return
    }
    const dataUrl = await chrome.tabs.captureVisibleTab(null, { format: 'png' })
    if (!dataUrl) throw new Error('empty')
    shot.value = dataUrl
    await loadShot(dataUrl)
  } catch (e) {
    error.value = `${t('colorPicker.captureFail')}: ${e.message || e}`
    picking.value = false
  }
}

// 把截图绘制到离屏 canvas，缓存 ImageData 供采样
async function loadShot(dataUrl) {
  const img = new Image()
  await new Promise((resolve, reject) => {
    img.onload = resolve
    img.onerror = reject
    img.src = dataUrl
  })
  shotSize.w = img.naturalWidth
  shotSize.h = img.naturalHeight
  shotCanvas = document.createElement('canvas')
  shotCanvas.width = img.naturalWidth
  shotCanvas.height = img.naturalHeight
  const ctx = shotCanvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0)
  try {
    shotImage = ctx.getImageData(0, 0, img.naturalWidth, img.naturalHeight)
  } catch (e) {
    shotImage = null
  }
}

// 把屏幕坐标映射到截图像素坐标
function toPixel(x, y) {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const px = Math.round((x / vw) * shotSize.w)
  const py = Math.round((y / vh) * shotSize.h)
  return {
    px: Math.max(0, Math.min(shotSize.w - 1, px)),
    py: Math.max(0, Math.min(shotSize.h - 1, py)),
  }
}

function sampleAt(x, y) {
  const { px, py } = toPixel(x, y)
  let r = 0, g = 0, b = 0
  if (shotImage) {
    const idx = (py * shotSize.w + px) * 4
    r = shotImage.data[idx]
    g = shotImage.data[idx + 1]
    b = shotImage.data[idx + 2]
  }
  const hex = rgbToHex(r, g, b)
  return { x, y, px, py, r, g, b, hex, rgb: `rgb(${r}, ${g}, ${b})` }
}

function onMove(e) {
  const info = sampleAt(e.clientX, e.clientY)
  hover.value = info
  drawMagnifier(info)
}

function onLeave() {
  hover.value = null
}

function onClick(e) {
  const info = sampleAt(e.clientX, e.clientY)
  samples.value.push(info)
  show(t('colorPicker.picked') + ' ' + info.hex)
}

function drawMagnifier(info) {
  const canvas = magCanvas.value
  if (!canvas || !shotImage) return
  const ctx = canvas.getContext('2d')
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  // 取以当前像素为中心的 MAG_PX×MAG_PX 区域
  const half = Math.floor(MAG_PX / 2)
  const { px, py } = info
  const sx = Math.max(0, Math.min(shotSize.w - MAG_PX, px - half))
  const sy = Math.max(0, Math.min(shotSize.h - MAG_PX, py - half))
  try {
    const region = ctx.createImageData(MAG_PX, MAG_PX)
    for (let j = 0; j < MAG_PX; j++) {
      for (let i = 0; i < MAG_PX; i++) {
        const spx = Math.min(shotSize.w - 1, sx + i)
        const spy = Math.min(shotSize.h - 1, sy + j)
        const sIdx = (spy * shotSize.w + spx) * 4
        const dIdx = (j * MAG_PX + i) * 4
        region.data[dIdx] = shotImage.data[sIdx]
        region.data[dIdx + 1] = shotImage.data[sIdx + 1]
        region.data[dIdx + 2] = shotImage.data[sIdx + 2]
        region.data[dIdx + 3] = 255
      }
    }
    // 放大绘制到 magCanvas（120×120）
    const off = document.createElement('canvas')
    off.width = MAG_PX
    off.height = MAG_PX
    off.getContext('2d').putImageData(region, 0, 0)
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(off, 0, 0, MAG_PX, MAG_PX, 0, 0, canvas.width, canvas.height)
    // 中心十字
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(canvas.width / 2, 0)
    ctx.lineTo(canvas.width / 2, canvas.height)
    ctx.moveTo(0, canvas.height / 2)
    ctx.lineTo(canvas.width, canvas.height / 2)
    ctx.stroke()
  } catch (e) {
    /* ignore */
  }
}

function stopPicking() {
  picking.value = false
  shot.value = ''
  hover.value = null
  shotImage = null
  shotCanvas = null
}

function onKeydown(e) {
  // Cmd/Ctrl + I 启动取色
  if ((e.metaKey || e.ctrlKey) && (e.key === 'i' || e.key === 'I')) {
    if (!picking.value) {
      e.preventDefault()
      startPicking()
    }
    return
  }
  if (e.key === 'Escape' && picking.value) {
    e.preventDefault()
    stopPicking()
  }
}

async function copy(value) {
  if (value && (await copyText(value))) show(t('common.copied'))
}

function rgbToHex(r, g, b) {
  const h = (n) => n.toString(16).padStart(2, '0')
  return ('#' + h(r) + h(g) + h(b)).toUpperCase()
}
</script>

<style scoped>
.pick-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pick-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dropper {
  font-size: 16px;
}

.cancel-btn {
  display: inline-flex;
  align-items: center;
}

.samples-count {
  font-size: 12px;
  color: var(--text-secondary);
}

.clear-btn {
  font-size: 12px;
  color: var(--primary);
  cursor: pointer;
}

.clear-btn:hover {
  text-decoration: underline;
}

.hint {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  margin-bottom: 10px;
}

.samples {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.sample-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.sample-swatch {
  width: 24px;
  height: 24px;
  border-radius: var(--radius-sm);
  border: 1px solid rgba(0, 0, 0, 0.15);
  background: var(--c, transparent);
  flex-shrink: 0;
}

.sample-hex {
  width: 100px;
  cursor: pointer;
  font-family: var(--mono);
}

.sample-rgb {
  flex: 1;
  cursor: pointer;
  font-family: var(--mono);
}

.sample-remove {
  cursor: pointer;
  font-size: 18px;
  color: var(--text-secondary);
  line-height: 1;
  flex-shrink: 0;
  padding: 0 4px;
}

.sample-remove:hover {
  color: #e5484d;
}
</style>

<style>
/* 覆盖层与放大镜使用非 scoped 样式，确保 teleport 到 body 后生效 */
.picker-overlay {
  position: fixed;
  inset: 0;
  z-index: 99999;
  overflow: hidden;
  background: #000;
}

.picker-shot {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: fill;
  user-select: none;
  pointer-events: none;
  opacity: 0.96;
}

.picker-magnifier {
  position: fixed;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  border: 2px solid #fff;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.4);
  overflow: hidden;
  pointer-events: none;
  background: #222;
}

.picker-magnifier.hidden {
  display: none;
}

.mag-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}

.mag-info {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1px;
  padding: 3px 4px;
  background: rgba(0, 0, 0, 0.62);
  font-family: var(--mono, monospace);
  font-size: 11px;
  line-height: 1.3;
  pointer-events: none;
}

.mag-hex {
  font-weight: 600;
}

.mag-rgb,
.mag-pos {
  color: #ddd;
}

.picker-tip {
  position: fixed;
  top: 12px;
  left: 50%;
  transform: translateX(-50%);
  padding: 6px 14px;
  font-size: 12px;
  color: #fff;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 999px;
  pointer-events: none;
}
</style>
