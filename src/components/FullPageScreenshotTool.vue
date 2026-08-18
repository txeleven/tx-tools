<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.screenshot.name') }}</div>
      <div class="tool-desc">{{ t('tools.screenshot.desc') }}</div>
    </div>

    <div class="toolbar">
      <button class="primary" :disabled="running" @click="start">{{ t('screenshot.capture') }}</button>
      <button :disabled="!image || running" @click="download">{{ t('screenshot.download') }}</button>
      <span class="spacer"></span>
      <span v-if="running" class="status info">{{ progressLabel }}</span>
      <span v-else-if="resultInfo" class="status ok">{{ resultInfo }}</span>
    </div>

    <div v-if="running" class="progress-track">
      <div class="progress-bar" :style="{ width: progress + '%' }"></div>
    </div>

    <div v-if="error" class="status err">{{ error }}</div>

    <div class="preview-wrap" v-if="image">
      <div class="preview-label">{{ t('screenshot.preview') }}</div>
      <div class="image-scroll">
        <img :src="image" alt="screenshot" />
      </div>
      <div class="toolbar">
        <button @click="copyImage">{{ t('screenshot.copyImage') }}</button>
      </div>
    </div>

    <div v-if="!image && !running" class="empty-hint">
      {{ t('screenshot.empty') }}
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, onActivated, onDeactivated } from 'vue'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'

const running = ref(false)
const progress = ref(0)
const segment = ref(0)
const total = ref(0)
const image = ref('')
const error = ref('')
const resultInfo = ref('')
const { show } = useToast()

const progressLabel = computed(() => {
  if (!total.value) return `${t('screenshot.processing')} ${progress.value}%`
  return `${t('screenshot.processing')} ${progress.value}% (${segment.value}/${total.value})`
})

let tabId = null
let messageHandler = null

async function getActiveTab() {
  if (typeof chrome === 'undefined' || !chrome.tabs) return null
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs && tabs[0] ? tabs[0] : null
}

async function start() {
  error.value = ''
  resultInfo.value = ''
  image.value = ''
  const tab = await getActiveTab()
  if (!tab || tab.id == null) {
    error.value = t('screenshot.noTab')
    return
  }
  tabId = tab.id
  running.value = true
  progress.value = 0
  try {
    // 注入截图 content script 到当前标签页
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-scripts/screenshot.js'],
    })
  } catch (e) {
    running.value = false
    error.value = `${t('screenshot.injectFail')}: ${e.message}`
  }
}

// 处理 content script 发来的消息
function handleMessage(msg, sender, sendResponse) {
  if (!msg || typeof msg.type !== 'string') return false

  if (msg.type === 'fullPageScreenshotCapture') {
    // 请求后台截图当前可见区域
    chrome.tabs.captureVisibleTab(null, { format: 'png' }, (dataUrl) => {
      const err = chrome.runtime.lastError
      if (err) {
        sendResponse({ ok: false, error: err.message })
        return
      }
      sendResponse({ ok: true, dataUrl })
    })
    return true // 异步响应
  }

  if (msg.type === 'fullPageScreenshot' && msg.payload) {
    const p = msg.payload
    if (p.error) {
      running.value = false
      error.value = p.error === 'ALREADY_RUNNING' ? t('screenshot.already') : `${t('common.error')}: ${p.error}`
    } else if (p.done) {
      running.value = false
      if (p.dataUrl) {
        image.value = p.dataUrl
        resultInfo.value = `${t('screenshot.result')}: ${p.pageWidth}×${p.pageHeight}px`
      } else if (p.error) {
        error.value = `${t('common.error')}: ${p.error}`
      }
    } else {
      progress.value = p.progress != null ? p.progress : progress.value
      segment.value = p.segment != null ? p.segment : segment.value
      total.value = p.total != null ? p.total : total.value
    }
  }
  return false
}

async function download() {
  if (!image.value) return
  const a = document.createElement('a')
  a.href = image.value
  a.download = `screenshot-${Date.now()}.png`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  show(t('screenshot.downloaded'))
}

async function copyImage() {
  if (!image.value) return
  try {
    const blob = await (await fetch(image.value)).blob()
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
    show(t('common.copied'))
  } catch (e) {
    // 降级：复制图片的 data URL
    if (await copyText(image.value)) show(t('common.copied'))
    else show(t('common.error'))
  }
}

// keep-alive 场景下用 activated/deactivated 注册/注销监听器；
// onMounted/onUnmounted 兜底非 keep-alive 场景（register/unregister 幂等）
function registerHandler() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage && !messageHandler) {
    messageHandler = handleMessage
    chrome.runtime.onMessage.addListener(messageHandler)
  }
}

function unregisterHandler() {
  if (messageHandler) {
    chrome.runtime.onMessage.removeListener(messageHandler)
    messageHandler = null
  }
}

onMounted(registerHandler)
onUnmounted(unregisterHandler)
onActivated(registerHandler)
onDeactivated(unregisterHandler)
</script>

<style scoped>
.progress-track {
  height: 6px;
  background: var(--bg-hover);
  border-radius: 3px;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background: var(--primary);
  border-radius: 3px;
  transition: width 0.2s ease;
}

.preview-wrap {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.image-scroll {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  max-height: 360px;
  overflow: auto;
  background: var(--bg-panel);
}

.image-scroll img {
  width: 100%;
  display: block;
}

.empty-hint {
  color: var(--text-secondary);
  font-size: 13px;
  padding: 20px 0;
  text-align: center;
}
</style>
