<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.imageBase64.name') }}</div>
      <div class="tool-desc">{{ t('tools.imageBase64.desc') }}</div>
    </div>

    <div
      class="drop-zone"
      :class="{ dragging }"
      @click="openPicker"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="onDrop"
      tabindex="0"
      @keydown.enter.prevent="openPicker"
    >
      <input ref="fileInput" type="file" accept="image/*" class="hidden-input" @change="onFile" />
      <template v-if="!dataUrl">
        <div class="drop-icon">🖼</div>
        <div>{{ t('image.dropHint') }}</div>
        <div class="drop-sub">{{ t('image.clickHint') }}</div>
      </template>
      <template v-else>
        <img :src="dataUrl" alt="preview" class="drop-img" />
        <div class="drop-meta mono">{{ t('image.original') }}: {{ origW }}×{{ origH }}px · {{ fileSize }}</div>
      </template>
    </div>

    <div class="toolbar">
      <label class="check-line">
        <input type="checkbox" v-model="resizeEnabled" @change="onResizeChange" /> {{ t('image.resize') }}
      </label>
      <label class="num-line" v-if="resizeEnabled">
        {{ t('image.maxWidth') }}
        <input type="number" v-model.number="maxWidth" min="1" @change="onResizeChange" />
      </label>
      <label class="num-line" v-if="resizeEnabled">
        {{ t('image.maxHeight') }}
        <input type="number" v-model.number="maxHeight" min="1" @change="onResizeChange" />
      </label>
      <span class="spacer"></span>
      <button :disabled="!dataUrl" @click="copyOutput">{{ t('common.copy') }}</button>
      <button :disabled="!dataUrl" @click="download">{{ t('image.download') }}</button>
      <button v-if="dataUrl" @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div v-if="status" class="status" :class="statusClass">{{ status }}</div>

    <div class="output-box" v-if="dataUrl">{{ dataUrl }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'

const fileInput = ref(null)
const dataUrl = ref('')
const fileName = ref('')
const origW = ref(0)
const origH = ref(0)
const origBytes = ref(0)
const dragging = ref(false)
const resizeEnabled = ref(false)
const maxWidth = ref(1024)
const maxHeight = ref(1024)
const status = ref('')
const statusClass = ref('')
const { show } = useToast()

const fileSize = computed(() => formatBytes(origBytes.value))

function openPicker() {
  fileInput.value && fileInput.value.click()
}

function onDrop(e) {
  dragging.value = false
  const file = e.dataTransfer?.files?.[0]
  if (file) processFile(file)
}

function onFile(e) {
  const file = e.target.files?.[0]
  if (file) processFile(file)
  e.target.value = ''
}

function processFile(file) {
  if (!file.type || !file.type.startsWith('image/')) {
    setStatus(t('image.invalidType'), 'err')
    return
  }
  fileName.value = file.name
  origBytes.value = file.size
  const reader = new FileReader()
  reader.onload = (e) => {
    const img = new Image()
    img.onload = () => {
      origW.value = img.naturalWidth
      origH.value = img.naturalHeight
      dataUrl.value = e.target.result
      if (resizeEnabled.value) {
        applyResize(img)
      } else {
        setStatus('', '')
      }
    }
    img.onerror = () => setStatus(t('image.readError'), 'err')
    img.src = e.target.result
  }
  reader.onerror = () => setStatus(t('image.readError'), 'err')
  reader.readAsDataURL(file)
}

function onResizeChange() {
  if (!dataUrl.value) return
  const img = new Image()
  img.onload = () => {
    if (resizeEnabled.value) applyResize(img)
    else {
      // 恢复原始尺寸
      const canvas = document.createElement('canvas')
      canvas.width = origW.value
      canvas.height = origH.value
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, origW.value, origH.value)
      dataUrl.value = canvas.toDataURL('image/png')
      setStatus('', '')
    }
  }
  img.src = dataUrl.value
}

function applyResize(img) {
  const ratio = Math.min(
    maxWidth.value > 0 ? maxWidth.value / img.naturalWidth : Infinity,
    maxHeight.value > 0 ? maxHeight.value / img.naturalHeight : Infinity,
    1
  )
  const w = Math.max(1, Math.round(img.naturalWidth * ratio))
  const h = Math.max(1, Math.round(img.naturalHeight * ratio))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  ctx.drawImage(img, 0, 0, w, h)
  dataUrl.value = canvas.toDataURL('image/png')
  setStatus(`${t('image.resized')}: ${w}×${h}px`, 'ok')
}

function setStatus(msg, cls) {
  status.value = msg
  statusClass.value = cls || ''
}

async function copyOutput() {
  if (dataUrl.value && (await copyText(dataUrl.value))) show(t('common.copied'))
}

function download() {
  if (!dataUrl.value) return
  const a = document.createElement('a')
  a.href = dataUrl.value
  a.download = fileName.value || 'image.png'
  a.click()
}

function clear() {
  dataUrl.value = ''
  fileName.value = ''
  origW.value = 0
  origH.value = 0
  origBytes.value = 0
  status.value = ''
  if (fileInput.value) fileInput.value.value = ''
}

function formatBytes(bytes) {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let v = bytes
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024
    i++
  }
  return `${v.toFixed(v >= 100 ? 0 : 1)} ${units[i]}`
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.hidden-input {
  display: none;
}

.drop-zone {
  border: 2px dashed var(--border);
  border-radius: var(--radius);
  padding: 24px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 13px;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}

.drop-zone:hover,
.drop-zone.dragging {
  border-color: var(--primary);
  background: var(--primary-soft);
  color: var(--primary);
}

.drop-icon {
  font-size: 32px;
}

.drop-sub {
  font-size: 12px;
  opacity: 0.75;
}

.drop-img {
  max-width: 100%;
  max-height: 180px;
  border-radius: var(--radius-sm);
  object-fit: contain;
}

.drop-meta {
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
}

.output-box {
  max-height: 160px;
}
</style>
