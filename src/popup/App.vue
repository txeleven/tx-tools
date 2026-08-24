<template>
  <div class="popup-root">
    <header class="header">
      <img src="/icons/icon48.png" alt="logo" class="logo" />
      <div class="title-area">
        <div class="title">{{ t('app.title') }}</div>
        <div class="subtitle">{{ t('app.subtitle') }}</div>
      </div>
      <button class="icon-btn lang-toggle" @click="toggleLocale" :title="t('settings.language')">
        {{ locale === 'zh-CN' ? '中' : 'EN' }}
      </button>
      <button class="icon-btn" @click="openOptions" title="Settings">⚙</button>
    </header>

    <!-- 页面请求抓包 -->
    <div class="sniffer">
      <div class="sniffer-head" @click="toggleSniffer">
        <span class="sniffer-title">🌐 {{ t('popup.snifferTitle') }}</span>
        <label
          class="sniffer-toggle"
          :title="snifferEnabled ? t('popup.snifferEnabled') : t('popup.snifferDisabled')"
          @click.stop
        >
          <input type="checkbox" v-model="snifferEnabled" @change="onToggleSniffer" />
          <span class="track"><span class="thumb"></span></span>
        </label>
        <span
          v-if="requests.length"
          class="sniffer-count"
          :title="t('popup.snifferOpenDetail')"
          @click.stop="openSnifferDetail"
        >{{ requests.length }}</span>
        <button
          class="sniffer-refresh"
          @click.stop="loadRequests"
          :disabled="snifferLoading"
          :title="t('popup.snifferFetch')"
        >
          {{ snifferLoading ? '…' : '↻' }}
        </button>
        <button
          class="sniffer-clear"
          @click.stop="clearRequests"
          :title="t('popup.snifferClear')"
        >
          ✕
        </button>
      </div>
      <div v-if="snifferOpen" class="sniffer-body">
        <div v-if="snifferError" class="sniffer-error">{{ snifferError }}</div>
        <div v-else-if="!requests.length" class="sniffer-empty">{{ t('popup.snifferEmpty') }}</div>
        <template v-else>
          <input
            v-model="snifferQuery"
            class="sniffer-search"
            type="text"
            :placeholder="t('popup.snifferSearch')"
          />
          <div class="sniffer-stat">
            <span v-if="snifferQuery.trim()">{{ t('popup.snifferMatched', { m: filteredRequests.length, n: requests.length }) }}</span>
            <span v-else>{{ t('popup.snifferTotal', { n: requests.length }) }}</span>
          </div>
          <div v-if="!filteredRequests.length" class="sniffer-empty">{{ t('popup.snifferNoMatch') }}</div>
          <div v-else class="sniffer-list">
            <div
              v-for="(r, i) in filteredRequests"
              :key="i"
              class="sniffer-item"
              @mouseenter="showTip(i, $event)"
              @mouseleave="hoverTip = -1"
            >
              <span class="sniffer-method" :data-m="r.method">{{ r.method }}</span>
              <span class="sniffer-status" :data-s="statusClass(r.status)">{{ r.status != null ? r.status : '…' }}</span>
              <span class="sniffer-url">{{ pathUrl(r) }}</span>
              <button class="sniffer-detail" @click.stop="openDetail(r)" :title="t('popup.snifferDetail')">⋯</button>
              <button class="sniffer-copy" @click.stop="copyUrl(r)" :title="t('common.copy')">⧉</button>
              <button class="sniffer-send" @click.stop="sendToHttp(r)" :title="t('popup.sendToHttp')">➤</button>
              <div v-if="hoverTip === i" class="sniffer-tip" :style="tipStyle">
                <div class="sniffer-tip-row"><span class="sniffer-tip-label">{{ t('http.status') }}</span><pre class="sniffer-tip-pre">{{ r.status != null ? r.status : '-' }}</pre></div>
                <div class="sniffer-tip-row"><span class="sniffer-tip-label">URL</span><pre class="sniffer-tip-pre">{{ fullUrl(r) }}</pre></div>
                <div class="sniffer-tip-row" v-if="r.body"><span class="sniffer-tip-label">{{ t('http.body') }}</span><pre class="sniffer-tip-pre">{{ r.body }}</pre></div>
              </div>
            </div>
          </div>
        </template>
      </div>
    </div>

    <nav class="tabs" v-if="tabs.length > 1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tabName(tab) }}
      </button>
    </nav>

    <main class="content" ref="content" :data-tool="activeTab">
      <keep-alive>
        <component v-if="currentTool" :is="currentTool.component" v-bind="currentTool.props" :key="activeTab" />
      </keep-alive>
    </main>

    <footer class="footer">
      <button class="link-btn" @click="openOptions">🧰 {{ t('app.openFull') }}</button>
    </footer>

    <transition name="toast">
      <div v-if="toastState.visible" class="toast">{{ toastState.message }}</div>
    </transition>

    <!-- 抓包详情弹窗：点击列表 ⋯ 显示完整请求与返回信息 -->
    <transition name="fade">
      <div v-if="detailReq" class="sniffer-modal" @click.self="closeDetail">
        <div class="sniffer-modal-panel">
          <div class="sniffer-modal-head">
            <span class="sniffer-method" :data-m="detailReq.method">{{ detailReq.method }}</span>
            <span class="sniffer-status" :data-s="statusClass(detailReq.status)">{{ detailReq.status != null ? detailReq.status : '…' }}</span>
            <span class="sniffer-modal-url" :title="fullUrl(detailReq)">{{ fullUrl(detailReq) }}</span>
            <button class="sniffer-modal-close" @click="closeDetail">✕</button>
          </div>
          <div class="sniffer-modal-body">
            <div class="sniffer-modal-sec">
              <div class="sniffer-modal-sec-title">{{ t('http.headers') }}</div>
              <pre class="sniffer-modal-pre">{{ formatHeaders(detailReq.headers) || '-' }}</pre>
            </div>
            <div class="sniffer-modal-sec" v-if="detailReq.body">
              <div class="sniffer-modal-sec-title">{{ t('http.body') }}</div>
              <pre class="sniffer-modal-pre">{{ detailReq.body }}</pre>
            </div>
            <div class="sniffer-modal-sec">
              <div class="sniffer-modal-sec-title">{{ t('http.responseHeaders') }}</div>
              <pre class="sniffer-modal-pre">{{ formatHeaders(detailReq.resHeaders) || '-' }}</pre>
            </div>
            <div class="sniffer-modal-sec" v-if="detailReq.resBody">
              <div class="sniffer-modal-sec-title">{{ t('http.responseBody') }}</div>
              <pre class="sniffer-modal-pre">{{ detailReq.resBody }}</pre>
            </div>
            <div class="sniffer-modal-sec" v-else>
              <div class="sniffer-modal-sec-title">{{ t('http.responseBody') }}</div>
              <div class="sniffer-modal-empty">{{ t('popup.snifferNoResBody') }}</div>
            </div>
          </div>
        </div>
      </div>
    </transition>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch, watchEffect, nextTick } from 'vue'
import { popupTools, getToolById } from '../tools/registry.js'
import { t, currentLocale, setLocale } from '../i18n/index.js'
import { toastState, useToast } from '../utils/useToast.js'
import { copyText } from '../utils/clipboard.js'
import { restoreHeights, bindHeightMemory } from '../utils/resizeMemory.js'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'

const POPUP_TAB_KEY = 'dev-toolbox-popup-tab'

const tabs = computed(() => popupTools.map(getToolById).filter(Boolean))
const activeTab = ref(popupTools[0] || '')
const content = ref(null)

// 当前语言（computed，随切换自动响应），切换后写入缓存
const locale = currentLocale

async function toggleLocale() {
  await setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}

const currentTool = computed(() => getToolById(activeTab.value))

// 切换标签时同步页面标题
watchEffect(() => {
  document.title = currentTool.value ? `${t(currentTool.value.nameKey)} - ${t('app.title')}` : t('app.title')
})

async function getItem(key) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => chrome.storage.local.get(key, (res) => resolve(res[key])))
  }
  return localStorage.getItem(key)
}

function setItem(key, value) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) chrome.storage.local.set({ [key]: value })
  else localStorage.setItem(key, value)
}

// 恢复上次选中的标签
onMounted(async () => {
  bindHeightMemory()
  const saved = await getItem(POPUP_TAB_KEY)
  if (saved && tabs.value.some((tab) => tab.id === saved)) activeTab.value = saved
  await nextTick()
  restoreHeights(content.value, activeTab.value)
  // 打开 popup 即自动加载抓包数量（不依赖手动点刷新/展开）
  loadRequests()
})

onBeforeUnmount(() => {
  stopAutoRefresh()
})

watch(activeTab, async (id) => {
  if (id) setItem(POPUP_TAB_KEY, id)
  if (!id) return
  await nextTick()
  restoreHeights(content.value, id)
})

function tabName(tab) {
  return t(tab.nameKey)
}

// ---------- 页面请求抓包 ----------
const PENDING_KEY = 'dev-toolbox-pending-http-request'
const snifferOpen = ref(false)
const requests = ref([])
const snifferLoading = ref(false)
const snifferError = ref('')
const snifferQuery = ref('')
const SNIFFER_ENABLED_KEY = 'tx-sniffer-enabled'
const snifferEnabled = ref(true)

// 初始化开关状态
;(async () => {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    const res = await new Promise((resolve) => chrome.storage.local.get(SNIFFER_ENABLED_KEY, resolve))
    if (typeof res[SNIFFER_ENABLED_KEY] === 'boolean') snifferEnabled.value = res[SNIFFER_ENABLED_KEY]
  }
})()

async function onToggleSniffer() {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    await new Promise((resolve) => chrome.storage.local.set({ [SNIFFER_ENABLED_KEY]: !!snifferEnabled.value }, resolve))
  }
}

// 抓包列表悬停 tooltip（fixed 定位，避免被列表滚动裁剪）
const hoverTip = ref(-1)
const tipPos = ref({ top: 0, left: 0 })

function showTip(i, e) {
  hoverTip.value = i
  const el = e.currentTarget
  if (!el) return
  const rect = el.getBoundingClientRect()
  const tipH = 160
  let top = rect.bottom + 4
  if (top + tipH > window.innerHeight - 8) top = Math.max(8, rect.top - tipH - 4)
  tipPos.value = { top, left: rect.left }
}

const tipStyle = computed(() => ({ top: tipPos.value.top + 'px', left: tipPos.value.left + 'px' }))

// 抓包详情弹窗：点击 ⋯ 展示完整请求与返回信息
const detailReq = ref(null)
function openDetail(r) {
  hoverTip.value = -1
  detailReq.value = r
}
function closeDetail() {
  detailReq.value = null
}
function formatHeaders(h) {
  if (!h || typeof h !== 'object') return ''
  const keys = Object.keys(h)
  if (!keys.length) return ''
  return keys.map((k) => `${k}: ${h[k]}`).join('\n')
}

// 按关键词筛选接口（匹配 URL 或方法）
const filteredRequests = computed(() => {
  const q = snifferQuery.value.trim().toLowerCase()
  if (!q) return requests.value
  return requests.value.filter((r) => {
    const full = fullUrl(r).toLowerCase() // 完整 url（含 domain）
    const domain = (r.domain || '').toLowerCase()
    const method = (r.method || '').toLowerCase()
    return full.includes(q) || domain.includes(q) || method.includes(q)
  })
})

function toggleSniffer() {
  snifferOpen.value = !snifferOpen.value
  if (snifferOpen.value) {
    loadRequests()
    startAutoRefresh()
  } else {
    stopAutoRefresh()
  }
}

// 抓包列表实时刷新：最多 1 秒延迟（接口未响应先展示，状态码由 bridge 异步补全后下次刷新显示）
let refreshTimer = null
function startAutoRefresh() {
  stopAutoRefresh()
  refreshTimer = setInterval(() => {
    if (snifferOpen.value) loadRequests()
  }, 1000)
}
function stopAutoRefresh() {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

async function loadRequests() {
  if (typeof chrome === 'undefined' || !chrome.scripting?.executeScript) {
    snifferError.value = t('popup.snifferFail')
    return
  }
  // 开关关闭时不抓包、不展示
  if (!snifferEnabled.value) {
    requests.value = []
    snifferError.value = t('popup.snifferOffTip')
    snifferLoading.value = false
    return
  }
  snifferLoading.value = true
  snifferError.value = ''
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab || !tab.id) {
      snifferError.value = t('popup.snifferNoTab')
      return
    }
    const host = tab.url ? safeHost(tab.url) : ''

    // 1. 主动注入 sniffer（幂等，__txSnifferInstalled 防重复）
    //    解决 content script 只对注册后新加载页面生效、当前已开页面未注入的问题
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        files: ['content-scripts/sniffer-main.js'],
      })
    } catch (e) {
      // 无法注入的页面（chrome://、扩展页等）
      snifferError.value = t('popup.snifferFail')
      requests.value = []
      return
    }

    // 1.5 检测旧版抓包拦截残留：扩展更新后未刷新页面时，页面里仍是旧版
    //     fetch/XHR 拦截（__txSnifferInstalled 挡住新版注入），旧版无状态码上报，
    //     此时提示用户刷新页面才能恢复状态码展示
    try {
      const [vr] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => ({ installed: !!window.__txSnifferInstalled, version: window.__txSnifferVersion || 0 }),
      })
      if (vr && vr.result && vr.result.installed && vr.result.version < 2) {
        snifferError.value = t('popup.snifferStale')
      }
    } catch (e) {}

    // 2. 强制把内存缓冲落盘到 storage，并顺带读页面内存做兜底
    let memList = []
    try {
      const [res] = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        world: 'MAIN',
        func: () => {
          if (typeof window.__txSnifferFlush === 'function') {
            try { window.__txSnifferFlush() } catch (e) {}
          }
          return (window.__txCapturedRequests || []).slice(-100)
        },
      })
      memList = res && Array.isArray(res.result) ? res.result : []
    } catch (e) {}

    // 3. 从 storage 读全部（当前 host），与页面内存合并去重
    let storeList = []
    try {
      const res = await chrome.runtime.sendMessage({
        type: 'tx-get-captured',
        key: 'tx-captured-requests',
        host,
      })
      storeList = res && Array.isArray(res.list) ? res.list : []
    } catch (e) {}

    // 合并：以 storage 为主，内存记录更实时（status/resBody 由响应异步补全），
    // 与 storage 记录重合时双向字段补全（storage 缺的用内存补，内存缺的用 storage 补），
    // 保证 status 在任意一侧有值时都能展示出来
    const merged = new Map(storeList.map((r) => [`${r.time}|${r.url}`, r]))
    for (const r of memList) {
      const k = `${r.time}|${r.url}`
      const ex = merged.get(k)
      if (ex) {
        if (r.status != null && ex.status == null) ex.status = r.status
        else if (ex.status != null && r.status == null) r.status = ex.status
        if (r.resHeaders && !ex.resHeaders) ex.resHeaders = r.resHeaders
        if (r.resBody && !ex.resBody) ex.resBody = r.resBody
        if (r.headers && !ex.headers) ex.headers = r.headers
        if (r.body && !ex.body) ex.body = r.body
      } else {
        merged.set(k, r)
      }
    }

    requests.value = [...merged.values()].slice(-100).reverse()
    if (!requests.value.length && !snifferError.value) {
      snifferError.value = t('popup.snifferEmpty')
    }
  } catch (e) {
    requests.value = []
    snifferError.value = t('popup.snifferFail')
  } finally {
    snifferLoading.value = false
  }
}

function safeHost(url) {
  try {
    return new URL(url).host
  } catch {
    return ''
  }
}

const { show } = useToast()

function statusClass(s) {
  if (s == null) return 'none'
  if (s >= 200 && s < 300) return 'ok'
  if (s >= 300 && s < 400) return 'redirect'
  if (s >= 400 && s < 500) return 'clienterr'
  if (s >= 500) return 'servererr'
  return 'none'
}

async function copyUrl(r) {
  const url = fullUrl(r)
  if (url && (await copyText(url))) show(t('common.copied'))
}

// 清除当前页面的抓包记录（按 host 从 storage 删除）
async function clearRequests() {
  if (typeof chrome === 'undefined' || !chrome.runtime?.sendMessage) return
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    const host = tab && tab.url ? safeHost(tab.url) : ''

    // 先清空所有 http/https 标签页的内存与 bridge 缓冲（__txSnifferClear 会通知
    // bridge 清 pending 并使代际号 +1，阻断进行中的 flush 把旧数据写回 storage）。
    // 只清当前 tab 不够：其它同 host 标签页的 bridge 随时会把旧缓冲写回 storage。
    let tabs = []
    try {
      tabs = await chrome.tabs.query({ url: ['http://*/*', 'https://*/*'] })
    } catch (e) {}
    await Promise.all(
      (tabs || []).map(async (t) => {
        if (!t.id) return
        try {
          await chrome.scripting.executeScript({
            target: { tabId: t.id },
            world: 'MAIN',
            files: ['content-scripts/sniffer-main.js'],
          })
        } catch (e) {}
        try {
          await chrome.scripting.executeScript({
            target: { tabId: t.id },
            world: 'MAIN',
            func: () => {
              if (typeof window.__txSnifferClear === 'function') {
                try { window.__txSnifferClear() } catch (e) {}
              }
            },
          })
        } catch (e) {}
      })
    )

    // 最后清 storage（当前 host），此时各 tab 旧缓冲已丢弃，不会再被写回
    await chrome.runtime.sendMessage({
      type: 'tx-clear-host',
      key: 'tx-captured-requests',
      host,
    })
    requests.value = []
    snifferQuery.value = ''
  } catch (e) {}
}

// 数字徽章点击：打开 options 的抓包模块展示全部抓取信息
async function openSnifferDetail() {
  // 打开前先刷新（内部会对当前 tab 触发 flush，保证内存数据落盘到 storage）
  try { await loadRequests() } catch (e) {}
  await openToolInOptions('sniffer')
}

// 把 url 拆成 base（不含 query）与 query 参数，避免 HttpTool 重复拼接
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

// 根据请求 method/body/content-type 推断 bodyMode 与 body 内容
function guessBody(r) {
  const none = { bodyMode: 'none', body: '', formBody: [] }
  if (!['POST', 'PUT', 'PATCH'].includes((r.method || '').toUpperCase())) return none
  const raw = r.body || ''
  if (!raw || raw.startsWith('[')) return none // [FormData]/[Blob] 等无法还原
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

// 列表默认显示去掉 domain 的路径（pathname + search + hash），相对路径原样返回
function pathUrl(r) {
  const u = r && r.url ? String(r.url) : ''
  if (!/^https?:\/\//i.test(u)) return u || '/'
  try {
    const o = new URL(u)
    return o.pathname + o.search + o.hash || '/'
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
    if (chrome.storage?.local) await chrome.storage.local.set({ [PENDING_KEY]: JSON.stringify(pending) })
    else localStorage.setItem(PENDING_KEY, JSON.stringify(pending))
  } catch {}
  await openToolInOptions('http')
}

// 打开 options 指定工具页（复用 openOptions 的模式，但固定到某个工具）
async function openToolInOptions(toolId) {
  const query = `?tool=${toolId}`
  try {
    if (chrome.storage?.local) await chrome.storage.local.set({ 'dev-toolbox-active-tool': toolId })
    else localStorage.setItem('dev-toolbox-active-tool', toolId)
  } catch {}
  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    const url = chrome.runtime.getURL(`options/index.html${query}`)
    if (chrome.tabs?.create) chrome.tabs.create({ url })
    else if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage()
    else window.open(url, '_blank')
  } else {
    window.open(`../options/index.html${query}`, '_blank')
  }
}

// 打开完整版时先记录当前工具，options 页会读取并直接定位到对应栏目
// 兼容两种模式：插件模式（chrome.runtime.id 存在）与 html 模式（直接作为网页打开）
async function openOptions() {
  const id = activeTab.value
  const query = `?tool=${id}`
  // 先记录当前工具（storage 失败不阻断打开页面）
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ 'dev-toolbox-active-tool': id })
    } else {
      localStorage.setItem('dev-toolbox-active-tool', id)
    }
  } catch {
    // ignore
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    // 插件模式：chrome.tabs.create + getURL 绝对地址（比 openOptionsPage 更可靠）
    const url = chrome.runtime.getURL(`options/index.html${query}`)
    if (chrome.tabs?.create) {
      chrome.tabs.create({ url })
    } else if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(url, '_blank')
    }
  } else {
    // html 模式（dev server / 直接打开 popup/index.html）：相对地址新标签打开
    window.open(`../options/index.html${query}`, '_blank')
  }
}
</script>

<style scoped>
.popup-root {
  width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--primary);
  color: #fff;
}

.logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.title-area {
  flex: 1;
}

.title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.subtitle {
  font-size: 11px;
  opacity: 0.85;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  border-radius: 6px;
  width: 30px;
  height: 30px;
  font-size: 15px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.lang-toggle {
  font-size: 12px;
  width: 34px;
  font-weight: 600;
}

.content {
  padding: 12px 14px;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}

.content::-webkit-scrollbar {
  display: none;
}

.footer {
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
  text-align: center;
}

.link-btn {
  border: none;
  background: none;
  color: var(--primary);
  font-size: 12.5px;
  padding: 4px 8px;
}

.link-btn:hover {
  background: var(--primary-soft);
}

.tab-icon {
  margin-right: 3px;
}

/* 覆盖全局下划线 tab，改为小按钮（pill）形式 */
.tabs {
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px 0;
  border-bottom: none;
  margin-bottom: 0;
  overflow-x: visible;
}

.tab {
  flex: none;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-panel);
  color: var(--text);
}

.tab:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 600;
}

/* 页面请求抓包 */
.sniffer {
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
}

.sniffer-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  cursor: pointer;
  user-select: none;
  font-size: 12.5px;
  line-height: 1.5;
}

.sniffer-head > * {
  display: inline-flex;
  align-items: center;
}

.sniffer-head:hover {
  background: var(--primary-soft);
}

.sniffer-title {
  font-weight: 600;
}

.sniffer-count {
  background: var(--primary);
  color: #fff;
  border-radius: 999px;
  font-size: 11px;
  padding: 1px 7px;
  cursor: pointer;
  transition: opacity 0.15s;
}

.sniffer-count:hover {
  opacity: 0.85;
}

.sniffer-toggle {
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.sniffer-toggle input {
  display: none;
}

.sniffer-toggle .track {
  width: 32px;
  height: 18px;
  border-radius: 999px;
  background: var(--border);
  position: relative;
  transition: background 0.18s;
  flex-shrink: 0;
}

.sniffer-toggle .thumb {
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

.sniffer-toggle input:checked + .track {
  background: var(--primary);
}

.sniffer-toggle input:checked + .track .thumb {
  transform: translateX(14px);
}

.sniffer-refresh {
  margin-left: auto;
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 6px;
  width: 26px;
  height: 24px;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
  padding: 0 7px;
  color: var(--text);
}

.sniffer-refresh:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.sniffer-clear {
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 6px;
  width: 26px;
  height: 24px;
  font-size: 12px;
  line-height: 1;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 0 7px;
}

.sniffer-clear:hover {
  border-color: #cf222e;
  color: #cf222e;
}

.sniffer-body {
  max-height: 240px;
  overflow-y: auto;
  border-top: 1px solid var(--border);
}

.sniffer-search {
  display: block;
  width: calc(100% - 28px);
  margin: 8px 14px 4px;
  padding: 6px 10px;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--bg);
  color: var(--text);
  outline: none;
}

.sniffer-search:focus {
  border-color: var(--primary);
}

.sniffer-stat {
  padding: 0 14px 6px;
  font-size: 11px;
  color: var(--text-secondary);
}

.sniffer-error,
.sniffer-empty {
  padding: 12px 14px;
  font-size: 12px;
  color: var(--text-secondary);
}

.sniffer-error {
  color: var(--danger, #d32f2f);
}

.sniffer-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px;
  font-size: 12px;
  border-bottom: 1px solid var(--border);
  position: relative;
}

.sniffer-tip {
  position: fixed;
  z-index: 9999;
  width: 360px;
  max-height: 220px;
  overflow-y: auto;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.18);
  padding: 8px 10px;
  pointer-events: none;
}

.sniffer-tip-row {
  margin-bottom: 6px;
}

.sniffer-tip-row:last-child {
  margin-bottom: 0;
}

.sniffer-tip-label {
  font-size: 10px;
  color: var(--text-secondary);
  display: block;
  margin-bottom: 2px;
}

.sniffer-tip-pre {
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.4;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
}

.sniffer-item:last-child {
  border-bottom: none;
}

.sniffer-item:hover {
  background: var(--primary-soft);
}

.sniffer-method {
  flex-shrink: 0;
  font-weight: 700;
  font-size: 11px;
  min-width: 42px;
  color: var(--primary);
}

.sniffer-method[data-m='POST'] { color: #0a7a37; }
.sniffer-method[data-m='PUT'] { color: #9a6700; }
.sniffer-method[data-m='PATCH'] { color: #8250df; }
.sniffer-method[data-m='DELETE'] { color: #cf222e; }

.sniffer-status {
  flex-shrink: 0;
  min-width: 30px;
  text-align: center;
  font-family: var(--mono);
  font-size: 11px;
  font-weight: 600;
  border-radius: 4px;
  padding: 1px 3px;
  background: var(--bg-hover);
  color: var(--text-secondary);
}

.sniffer-status[data-s='ok'] { color: #0a7a37; background: rgba(10, 122, 55, 0.12); }
.sniffer-status[data-s='redirect'] { color: #9a6700; background: rgba(154, 103, 0, 0.12); }
.sniffer-status[data-s='clienterr'] { color: #cf222e; background: rgba(207, 34, 46, 0.12); }
.sniffer-status[data-s='servererr'] { color: #cf222e; background: rgba(207, 34, 46, 0.2); }

.sniffer-detail {
  flex-shrink: 0;
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 6px;
  width: 26px;
  height: 24px;
  padding: 0 7px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1;
}

.sniffer-detail:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.sniffer-copy {
  flex-shrink: 0;
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 6px;
  width: 26px;
  height: 24px;
  cursor: pointer;
  padding: 0 7px;
  color: var(--text-secondary);
  font-size: 13px;
  line-height: 1;
}

.sniffer-copy:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.sniffer-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--text);
  font-family: var(--mono);
  font-size: 11px;
}

.sniffer-send {
  flex-shrink: 0;
  border: 1px solid var(--border);
  background: var(--bg);
  border-radius: 6px;
  width: 26px;
  height: 24px;
  cursor: pointer;
  padding: 0 7px;
  color: var(--primary);
  font-size: 13px;
  line-height: 1;
}

.sniffer-send:hover {
  border-color: var(--primary);
  background: var(--primary-soft);
}

/* ---- 抓包详情弹窗 ---- */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.15s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.sniffer-modal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
}

.sniffer-modal-panel {
  width: 100%;
  max-width: 480px;
  max-height: 92vh;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 10px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.25);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.sniffer-modal-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.sniffer-modal-url {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--mono);
  font-size: 11.5px;
  color: var(--text);
}

.sniffer-modal-close {
  flex-shrink: 0;
  border: none;
  background: none;
  font-size: 14px;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 2px 6px;
  border-radius: 6px;
}
.sniffer-modal-close:hover {
  background: var(--bg-hover);
  color: var(--text);
}

.sniffer-modal-body {
  overflow-y: auto;
  padding: 10px 12px;
}

.sniffer-modal-sec {
  margin-bottom: 12px;
}
.sniffer-modal-sec:last-child {
  margin-bottom: 0;
}

.sniffer-modal-sec-title {
  font-size: 11px;
  color: var(--text-secondary);
  font-weight: 600;
  margin-bottom: 4px;
}

.sniffer-modal-pre {
  margin: 0;
  font-family: var(--mono);
  font-size: 11px;
  line-height: 1.45;
  color: var(--text);
  white-space: pre-wrap;
  word-break: break-all;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 6px;
  padding: 8px 10px;
  max-height: 200px;
  overflow-y: auto;
}

.sniffer-modal-empty {
  font-size: 12px;
  color: var(--text-secondary);
  padding: 6px 0;
}
</style>
