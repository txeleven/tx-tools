<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.qr.name') }}</div>
      <div class="tool-desc">{{ t('tools.qr.desc') }}</div>
    </div>

    <LinedTextarea
      v-model="text"
      :placeholder="t('qr.placeholder')"
      :min-height="textareaMinHeight"
      @input="scheduleGenerate"
    />

    <div class="toolbar">
      <label class="num-line">
        {{ t('qr.size') }}
        <input type="number" v-model.number="size" min="128" max="512" step="8" @change="generate" />
      </label>

      <label class="num-line">
        {{ t('qr.level') }}
        <select v-model="level" @change="generate">
          <option value="L">L</option>
          <option value="M">M</option>
          <option value="Q">Q</option>
          <option value="H">H</option>
        </select>
      </label>

      <label class="check-line">
        {{ t('qr.foreground') }}
        <input type="color" :value="fgColor" @input="onFg" class="picker" />
      </label>

      <label class="check-line">
        {{ t('qr.background') }}
        <input type="color" :value="bgColor" @input="onBg" class="picker" />
      </label>

      <span class="spacer"></span>
      <button @click="loadCurrentUrl">{{ t('qr.currentUrl') }}</button>
      <button :disabled="!dataUrl" @click="download">{{ t('qr.download') }}</button>
      <button :disabled="!dataUrl" @click="copyOutput">{{ t('common.copy') }}</button>
    </div>

    <div v-if="status" class="status" :class="statusClass">{{ status }}</div>

    <div class="qr-preview" v-if="dataUrl">
      <img :src="dataUrl" alt="QR Code" class="qr-img" />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import QRCode from 'qrcode'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const text = ref('')
// options 页面空间更大，textarea 默认 200px；popup 保持紧凑 100px
const textareaMinHeight = window.location.pathname.includes('/options/') ? '200px' : '100px'
const size = ref(256)
const level = ref('M')
const fgColor = ref('#000000')
const bgColor = ref('#ffffff')
const dataUrl = ref('')
const status = ref('')
const statusClass = ref('')
const { show } = useToast()

let debounceTimer = null

function scheduleGenerate() {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(generate, 300)
}

function onFg(e) {
  fgColor.value = e.target.value
  generate()
}

function onBg(e) {
  bgColor.value = e.target.value
  generate()
}

async function generate() {
  const value = text.value.trim()
  if (!value) {
    dataUrl.value = ''
    setStatus('', '')
    return
  }
  const s = Math.max(128, Math.min(512, Math.round(size.value) || 256))
  size.value = s
  try {
    dataUrl.value = await QRCode.toDataURL(value, {
      width: s,
      margin: 2,
      errorCorrectionLevel: level.value,
      color: {
        dark: fgColor.value,
        light: bgColor.value,
      },
    })
    setStatus('', '')
  } catch (e) {
    dataUrl.value = ''
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function setStatus(msg, cls) {
  status.value = msg
  statusClass.value = cls || ''
}

function download() {
  if (!dataUrl.value) return
  const a = document.createElement('a')
  a.href = dataUrl.value
  a.download = 'qrcode.png'
  a.click()
}

async function copyOutput() {
  if (dataUrl.value && (await copyText(dataUrl.value))) show(t('common.copied'))
}

// 获取当前活动标签页 URL（popup 打开时 activeTab 权限已授予）
function getCurrentTabUrl() {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.tabs?.query) {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve((tabs && tabs[0] && tabs[0].url) || '')
      })
    } else {
      // 网页模式（dev server）下直接用当前页面地址
      resolve(window.location.href || '')
    }
  })
}

async function loadCurrentUrl() {
  const url = await getCurrentTabUrl()
  if (url) {
    text.value = url
    await generate()
    show(t('qr.loadedUrl'))
  } else {
    setStatus(t('qr.noUrl'), 'err')
  }
}

onMounted(async () => {
  await loadCurrentUrl()
})
onUnmounted(() => clearTimeout(debounceTimer))
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.picker {
  width: 40px;
  height: 30px;
  padding: 2px;
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
}

.qr-preview {
  display: flex;
  justify-content: center;
  padding: 16px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.qr-img {
  max-width: 100%;
  height: auto;
  image-rendering: pixelated;
  border-radius: 4px;
}
</style>
