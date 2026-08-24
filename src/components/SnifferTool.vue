<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.sniffer.name') }}</div>
      <div class="tool-desc">{{ t('tools.sniffer.desc') }}</div>
    </div>

    <div class="bar">
      <input
        v-model="query"
        class="search"
        type="text"
        :placeholder="t('popup.snifferSearch')"
      />
      <button class="btn" @click="load" :disabled="loading">{{ loading ? '…' : '↻ ' + t('popup.snifferFetch') }}</button>
      <button class="btn danger" @click="clearAll">{{ t('common.clear') }}</button>
      <label
        class="toggle"
        :title="enabled ? t('popup.snifferEnabled') : t('popup.snifferDisabled')"
      >
        <input type="checkbox" v-model="enabled" @change="onToggle" />
        <span class="track"><span class="thumb"></span></span>
        <span class="toggle-text">{{ enabled ? t('popup.snifferEnabled') : t('popup.snifferDisabled') }}</span>
      </label>
      <span class="stat">
        <span v-if="query.trim()">{{ t('popup.snifferMatched', { m: filtered.length, n: list.length }) }}</span>
        <span v-else>{{ t('popup.snifferTotal', { n: list.length }) }}</span>
      </span>
    </div>

    <div v-if="error" class="status err">{{ error }}</div>
    <div v-else-if="!list.length" class="status">{{ t('popup.snifferEmpty') }}</div>
    <div v-else-if="!filtered.length" class="status">{{ t('popup.snifferNoMatch') }}</div>

    <div v-else class="list">
      <div v-for="(r, i) in filtered" :key="i" class="item" :class="{ open: openIdx === i }">
        <div
          class="row"
          @click="openIdx = openIdx === i ? -1 : i"
          @mouseenter="showTip(i, $event)"
          @mouseleave="hoverTip = -1"
        >
          <span class="method" :data-m="r.method">{{ r.method }}</span>
          <span class="status-code" :data-s="statusClass(r.status)">{{ r.status != null ? r.status : '…' }}</span>
          <span class="url">{{ fullUrl(r) }}</span>
          <span class="time">{{ fmtTime(r.time) }}</span>
        </div>
        <div v-if="hoverTip === i && openIdx !== i" class="tip" :style="tipStyle">
          <div class="tip-row"><span class="tip-label">{{ t('http.status') }}</span><pre class="tip-pre">{{ r.status != null ? r.status : '-' }}</pre></div>
          <div class="tip-row"><span class="tip-label">URL</span><pre class="tip-pre">{{ fullUrl(r) }}</pre></div>
          <div class="tip-row" v-if="r.body"><span class="tip-label">{{ t('http.body') }}</span><pre class="tip-pre">{{ r.body }}</pre></div>
        </div>
        <div v-if="openIdx === i" class="detail">
          <div class="detail-bar">
            <button class="mini" @click.stop="sendToHttp(r)">{{ t('popup.sendToHttp') }}</button>
            <button class="mini" @click.stop="copy(fullUrl(r))">URL</button>
          </div>
          <div class="detail-block">
            <div class="detail-label">{{ t('http.status') }}</div>
            <pre class="detail-pre">{{ r.status != null ? r.status : '-' }}</pre>
            <div class="detail-label">URL</div>
            <pre class="detail-pre">{{ fullUrl(r) }}</pre>
            <div class="detail-label">{{ t('http.headers') }}</div>
            <pre class="detail-pre">{{ prettyHeaders(r.headers) }}</pre>
            <div class="detail-label">{{ t('http.body') }}</div>
            <pre class="detail-pre">{{ r.body || '-' }}</pre>
            <div class="detail-label">{{ t('http.origin') }}</div>
            <pre class="detail-pre">{{ r.origin || '-' }}</pre>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { t } from '../i18n/index.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'

const STORAGE_KEY = 'tx-captured-requests'
const PENDING_KEY = 'dev-toolbox-pending-http-request'
const { show } = useToast()

const list = ref([])
const query = ref('')
const loading = ref(false)
const error = ref('')
const openIdx = ref(-1)
const ENABLED_KEY = 'tx-sniffer-enabled'
const enabled = ref(true)

// 初始化开关
;(async () => {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const res = await new Promise((resolve) => chrome.storage.local.get(ENABLED_KEY, resolve))
    if (typeof res[ENABLED_KEY] === 'boolean') enabled.value = res[ENABLED_KEY]
  }
})()

async function onToggle() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise((resolve) => chrome.storage.local.set({ [ENABLED_KEY]: !!enabled.value }, resolve))
  }
}

// 列表行悬停 tooltip（fixed 定位，避免被裁剪）
const hoverTip = ref(-1)
const tipPos = ref({ top: 0, left: 0 })

function showTip(i, e) {
  hoverTip.value = i
  const el = e.currentTarget
  if (!el) return
  const rect = el.getBoundingClientRect()
  const tipH = 180
  let top = rect.bottom + 4
  if (top + tipH > window.innerHeight - 8) top = Math.max(8, rect.top - tipH - 4)
  tipPos.value = { top, left: rect.left }
}

const tipStyle = computed(() => ({ top: tipPos.value.top + 'px', left: tipPos.value.left + 'px' }))

const filtered = computed(() => {
  const q = query.value.trim().toLowerCase()
  if (!q) return list.value
  return list.value.filter((r) => {
    const url = (r.url || '').toLowerCase()
    const method = (r.method || '').toLowerCase()
    const host = (r.host || '').toLowerCase()
    return url.includes(q) || method.includes(q) || host.includes(q)
  })
})

async function readStorage() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => chrome.storage.local.get(STORAGE_KEY, (res) => resolve(res[STORAGE_KEY] || [])))
  }
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch {
    return []
  }
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    // 主动向当前活跃 tab 注入 sniffer 并强制 flush，确保最新请求已落盘
    // （注入幂等；无法注入的页面静默跳过，不阻断读取）
    if (typeof chrome !== 'undefined' && chrome.scripting?.executeScript && chrome.tabs) {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
        if (tab && tab.id) {
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'MAIN',
            files: ['content-scripts/sniffer-main.js'],
          })
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            world: 'MAIN',
            func: () => {
              if (typeof window.__txSnifferFlush === 'function') {
                try { window.__txSnifferFlush() } catch (e) {}
              }
            },
          })
        }
      } catch (e) {}
    }
    const data = await readStorage()
    list.value = data.slice(-500).reverse()
    openIdx.value = -1
  } catch (e) {
    error.value = t('popup.snifferFail')
  } finally {
    loading.value = false
  }
}

async function clearAll() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise((resolve) => chrome.storage.local.set({ [STORAGE_KEY]: [] }, resolve))
  } else {
    localStorage.setItem(STORAGE_KEY, '[]')
  }
  list.value = []
  openIdx.value = -1
  show(t('common.cleared'))
}

// ---------- 发送 HTTP 预置 ----------
function splitUrl(rawUrl) {
  try {
    const u = new URL(rawUrl)
    const params = []
    u.searchParams.forEach((value, key) => params.push({ key, value }))
    const base = u.origin + u.pathname + (u.hash || '')
    return { base, params }
  } catch {
    return { base: rawUrl, params: [] }
  }
}

function objToHeaders(obj) {
  return Object.entries(obj || {}).map(([key, value]) => ({ key, value: String(value), enabled: true }))
}

function guessBody(r) {
  const none = { bodyMode: 'none', body: '', formBody: [] }
  if (!['POST', 'PUT', 'PATCH'].includes((r.method || '').toUpperCase())) return none
  const raw = r.body || ''
  if (!raw || raw.startsWith('[')) return none
  const ctEntry = Object.entries(r.headers || {}).find(([k]) => k.toLowerCase() === 'content-type')
  const ct = ctEntry ? String(ctEntry[1]).toLowerCase() : ''
  const trimmed = raw.trim()
  if (ct.includes('json') || trimmed.startsWith('{') || trimmed.startsWith('[')) {
    return { bodyMode: 'json', body: raw, formBody: [] }
  }
  if (ct.includes('x-www-form-urlencoded') || /^[^=\s]+=/.test(trimmed)) {
    const formBody = []
    try {
      new URLSearchParams(raw).forEach((value, key) => formBody.push({ key, value }))
    } catch {}
    if (formBody.length) return { bodyMode: 'form', body: '', formBody }
  }
  return { bodyMode: 'text', body: raw, formBody: [] }
}

// 把抓包记录的 url 补全为带域名的完整地址（相对路径用来源页 origin 拼接）
function fullUrl(r) {
  const u = r && r.url ? String(r.url) : ''
  if (/^https?:\/\//i.test(u)) return u
  const base = r.origin || (r.domain ? `https://${r.domain}/` : '')
  if (!base) return u
  try {
    return new URL(u, base).href
  } catch {
    return u
  }
}

async function sendToHttp(r) {
  const { base, params } = splitUrl(fullUrl(r))
  const { bodyMode, body, formBody } = guessBody(r)
  const pending = {
    method: (r.method || 'GET').toUpperCase(),
    url: base,
    headers: objToHeaders(r.headers),
    queryParams: params,
    bodyMode,
    body,
    formBody,
  }
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ [PENDING_KEY]: JSON.stringify(pending) })
    } else {
      localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
    }
  } catch {}
  // 通知 options 切到 http 工具（同页切换）
  window.dispatchEvent(new CustomEvent('tx-switch-tool', { detail: 'http' }))
  show(t('popup.sendToHttp') + ' → HTTP')
}

async function copy(value) {
  if (value && (await copyText(value))) show(t('common.copied'))
}

function statusClass(s) {
  if (s == null) return 'none'
  if (s >= 200 && s < 300) return 'ok'
  if (s >= 300 && s < 400) return 'redirect'
  if (s >= 400 && s < 500) return 'clienterr'
  if (s >= 500) return 'servererr'
  return 'none'
}

function fmtTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function prettyHeaders(h) {
  if (!h || !Object.keys(h).length) return '-'
  return Object.entries(h).map(([k, v]) => `${k}: ${v}`).join('\n')
}

onMounted(load)
onBeforeUnmount(() => {})
</script>

<style scoped>
.bar {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.search {
  flex: 1;
  min-width: 200px;
  padding: 7px 10px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  outline: none;
}

.search:focus {
  border-color: var(--primary);
}

.btn {
  padding: 7px 12px;
  font-size: 13px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  cursor: pointer;
}

.btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.btn.danger:hover {
  border-color: #cf222e;
  color: #cf222e;
}

.toggle {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  user-select: none;
  font-size: 12px;
  color: var(--text-secondary);
}

.toggle input {
  display: none;
}

.toggle .track {
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: var(--border);
  position: relative;
  transition: background 0.18s;
  flex-shrink: 0;
}

.toggle .thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  transition: transform 0.18s;
}

.toggle input:checked + .track {
  background: var(--primary);
}

.toggle input:checked + .track .thumb {
  transform: translateX(14px);
}

.toggle-text {
  white-space: nowrap;
}

.stat {
  width: 100%;
  font-size: 11px;
  color: var(--text-secondary);
}

.status {
  padding: 14px;
  font-size: 13px;
  color: var(--text-secondary);
  background: var(--bg-hover);
  border-radius: var(--radius-sm);
}

.status.err {
  color: #d32f2f;
}

.list {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.item {
  border-bottom: 1px solid var(--border);
}

.item:last-child {
  border-bottom: none;
}

.row {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  cursor: pointer;
  font-size: 12.5px;
}

.tip {
  position: fixed;
  z-index: 9999;
  width: 420px;
  max-height: 240px;
  overflow-y: auto;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  padding: 8px 10px;
  pointer-events: none;
}

.tip-row {
  margin-bottom: 6px;
}

.tip-row:last-child {
  margin-bottom: 0;
}

.tip-label {
  font-size: 10px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 2px;
}

.tip-pre {
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.4;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
}

.row:hover {
  background: var(--primary-soft);
}

.method {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 11px;
  min-width: 44px;
  color: var(--primary);
}

.method[data-m='POST'] { color: #0a7a37; }
.method[data-m='PUT'] { color: #9a6700; }
.method[data-m='PATCH'] { color: #8250df; }
.method[data-m='DELETE'] { color: #cf222e; }

.status-code {
  flex-shrink: 0;
  min-width: 34px;
  text-align: center;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  padding: 1px 4px;
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.status-code[data-s='ok'] { color: #0a7a37; background: rgba(10, 122, 55, 0.12); }
.status-code[data-s='redirect'] { color: #9a6700; background: rgba(154, 103, 0, 0.12); }
.status-code[data-s='clienterr'] { color: #cf222e; background: rgba(207, 34, 46, 0.12); }
.status-code[data-s='servererr'] { color: #cf222e; background: rgba(207, 34, 46, 0.2); }

.url {
  flex: 1;
  min-width: 0;
  white-space: pre-wrap;
  word-break: break-all;
  overflow-wrap: break-word;
  color: var(--text);
  font-family: var(--mono);
  font-size: 11.5px;
  line-height: 1.4;
}

.time {
  flex-shrink: 0;
  color: var(--text-secondary);
  font-size: 11px;
  font-family: var(--mono);
}

.detail {
  border-top: 1px dashed var(--border);
  background: var(--bg-hover);
  padding: 10px;
}

.detail-bar {
  display: flex;
  gap: 8px;
  margin-bottom: 8px;
}

.mini {
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--primary);
  cursor: pointer;
}

.mini:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.detail-label {
  font-size: 11px;
  color: var(--text-secondary);
  margin: 6px 0 2px;
}

.detail-pre {
  margin: 0;
  padding: 8px 10px;
  font-family: var(--mono);
  font-size: 11.5px;
  line-height: 1.5;
  color: var(--text);
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow: auto;
}
</style>
