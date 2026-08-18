<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.perf.name') }}</div>
      <div class="tool-desc">{{ t('tools.perf.desc') }}</div>
    </div>

    <div class="toolbar">
      <button class="primary" :disabled="running" @click="run">{{ t('perf.run') }}</button>
      <span class="spacer"></span>
      <span v-if="running" class="status info">{{ t('perf.running') }}</span>
      <span v-else-if="report" class="status ok">{{ t('perf.updated') }}</span>
    </div>

    <div v-if="error" class="status err">{{ error }}</div>

    <div v-if="!report && !running" class="empty-hint">
      {{ t('perf.empty') }}
    </div>

    <div v-if="report" class="report">
      <div class="report-head">
        <div class="report-title">{{ report.title || report.url }}</div>
        <div class="report-url">{{ report.url }}</div>
      </div>

      <div class="metrics-grid">
        <div class="metric">
          <div class="metric-value">{{ fmtMs(report.navigation.dns) }}</div>
          <div class="metric-label">DNS</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ fmtMs(report.navigation.tcp) }}</div>
          <div class="metric-label">TCP</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ fmtMs(report.navigation.domContentLoaded) }}</div>
          <div class="metric-label">DOM Content</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ fmtMs(report.navigation.load) }}</div>
          <div class="metric-label">Load</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ fmtMs(report.fcp) }}</div>
          <div class="metric-label">FCP</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ fmtMs(report.lcp) }}</div>
          <div class="metric-label">LCP</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ fmtMs(report.fid) }}</div>
          <div class="metric-label">FID</div>
        </div>
        <div class="metric">
          <div class="metric-value">{{ fmtCls(report.cls) }}</div>
          <div class="metric-label">CLS</div>
        </div>
      </div>

      <div class="section-title">{{ t('perf.resources') }}</div>
      <div class="kv-list">
        <div class="kv">
          <span class="k">{{ t('perf.resourceTotal') }}</span>
          <span class="v">{{ report.resources.total }}</span>
        </div>
        <div class="kv">
          <span class="k">{{ t('perf.imgCount') }}</span>
          <span class="v">{{ report.resources.imgCount }}</span>
        </div>
        <div class="kv">
          <span class="k">{{ t('perf.jsSize') }}</span>
          <span class="v">{{ fmtBytes(report.resources.jsSize) }}</span>
        </div>
        <div class="kv">
          <span class="k">{{ t('perf.cssSize') }}</span>
          <span class="v">{{ fmtBytes(report.resources.cssSize) }}</span>
        </div>
        <div class="kv">
          <span class="k">{{ t('perf.imgSize') }}</span>
          <span class="v">{{ fmtBytes(report.resources.imgSize) }}</span>
        </div>
      </div>

      <div class="section-title">{{ t('perf.dom') }}</div>
      <div class="kv-list">
        <div class="kv">
          <span class="k">{{ t('perf.nodeCount') }}</span>
          <span class="v">{{ report.dom.nodeCount }}</span>
        </div>
        <div class="kv">
          <span class="k">{{ t('perf.domDepth') }}</span>
          <span class="v">{{ report.dom.depth }}</span>
        </div>
      </div>

      <div class="toolbar">
        <button class="mini" @click="copyReport">{{ t('common.copy') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'

const running = ref(false)
const report = ref(null)
const error = ref('')
const { show } = useToast()

let handler = null

function fmtMs(v) {
  if (v == null) return '--'
  return `${Math.round(v)} ms`
}

function fmtCls(v) {
  if (v == null) return '--'
  return v.toFixed(3)
}

function fmtBytes(b) {
  if (!b) return '0 B'
  if (b < 1024) return `${b} B`
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`
  return `${(b / 1024 / 1024).toFixed(2)} MB`
}

async function getActiveTab() {
  if (typeof chrome === 'undefined' || !chrome.tabs) return null
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  return tabs && tabs[0] ? tabs[0] : null
}

async function run() {
  error.value = ''
  report.value = null
  const tab = await getActiveTab()
  if (!tab || tab.id == null) {
    error.value = t('perf.noTab')
    return
  }
  running.value = true
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content-scripts/perf.js'],
    })
  } catch (e) {
    running.value = false
    error.value = `${t('perf.fail')}: ${e.message}`
  }
}

function handleMessage(msg) {
  if (msg && msg.type === 'perfResult' && msg.payload) {
    report.value = msg.payload
    running.value = false
  }
}

async function copyReport() {
  if (!report.value) return
  const text = JSON.stringify(report.value, null, 2)
  if (await copyText(text)) show(t('common.copied'))
  else show(t('common.error'))
}

onMounted(() => {
  if (typeof chrome !== 'undefined' && chrome.runtime?.onMessage) {
    handler = handleMessage
    chrome.runtime.onMessage.addListener(handler)
  }
})

onUnmounted(() => {
  if (handler) chrome.runtime.onMessage.removeListener(handler)
})
</script>

<style scoped>
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 8px;
}

.metric {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 8px;
  text-align: center;
}

.metric-value {
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.metric-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin: 10px 0 6px;
}

.kv-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.kv {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 10px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  font-size: 13px;
}

.kv .k {
  color: var(--text-secondary);
}

.kv .v {
  font-family: monospace;
  color: var(--text);
}

.report-head {
  margin-bottom: 10px;
}

.report-title {
  font-weight: 600;
  font-size: 14px;
  word-break: break-all;
}

.report-url {
  font-size: 12px;
  color: var(--text-secondary);
  word-break: break-all;
  margin-top: 2px;
}

.empty-hint {
  color: var(--text-secondary);
  font-size: 13px;
  padding: 20px 0;
  text-align: center;
}
</style>
