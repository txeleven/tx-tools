<template>
  <div class="tool-panel http-tool">
    <div class="http-layout">
      <!-- 左侧边栏 -->
      <aside class="http-sidebar" :style="{ width: sidebarWidth + 'px' }">
        <div class="sidebar-tabs">
          <button :class="{ active: sidebar === 'history' }" @click="sidebar = 'history'">{{ t('http.history') }}</button>
          <button :class="{ active: sidebar === 'saved' }" @click="sidebar = 'saved'">{{ t('http.saved') }}</button>
        </div>

        <input v-model="searchQuery" type="text" class="search-input" :placeholder="t('http.searchPlaceholder')" />

        <div class="records">
          <div v-if="sidebar === 'history'">
            <div v-if="!historyFiltered.length" class="empty">{{ t('common.empty') }}</div>
            <div
              v-for="r in historyFiltered"
              :key="r.id"
              class="record-item"
              :class="{ active: selectedId === r.id }"
              @click="loadRecord(r)"
              @mouseenter="showRecordTooltip($event, r)"
              @mousemove="moveRecordTooltip"
              @mouseleave="hideRecordTooltip"
            >
              <div class="record-line">
                <span class="method" :class="methodClass(r.method)">{{ r.method }}</span>
                <span class="time">{{ formatTime(r.timestamp) }}</span>
                <button class="record-del" :title="t('common.delete')" @click.stop="deleteHistory(r.id)">×</button>
              </div>
              <div class="record-url">{{ r.url }}</div>
              <div v-if="r.response" class="record-status">{{ r.response.status }} · {{ r.duration }}ms</div>
            </div>
          </div>

          <div v-else>
            <div class="group-bar">
              <select v-model="selectedGroup">
                <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
              </select>
              <button class="icon-btn" @click="groupManageVisible = true" title="Manage groups">⚙</button>
            </div>
            <div v-if="!savedFiltered.length" class="empty">{{ t('common.empty') }}</div>
            <div
              v-for="r in savedFiltered"
              :key="r.id"
              class="record-item"
              @click="loadRecord(r)"
              @mouseenter="showRecordTooltip($event, r)"
              @mousemove="moveRecordTooltip"
              @mouseleave="hideRecordTooltip"
            >
              <div v-if="r.name && r.name !== r.url" class="record-name">{{ r.name }}</div>
              <div class="record-url" >{{ r.url }}</div>
              <button class="del-btn" @click.stop="deleteSaved(r.id)">×</button>
            </div>
          </div>
        </div>

        <div class="side-actions">
          <button @click="exportSidebar">{{ t('http.export') }}</button>
          <label class="file-label">
            <input type="file" accept="application/json" @change="importRecords" />
            {{ t('http.import') }}
          </label>
          <button class="danger" @click="clearSidebar">{{ t('common.clear') }}</button>
        </div>
      </aside>

      <!-- 侧边栏宽度分隔条（可左右拖动） -->
      <div class="side-divider" @mousedown="startDragSidebar" :title="t('http.dragResize')"></div>

      <!-- 右侧主区域 -->
      <main class="http-main" :class="{ expanded }" ref="mainRef">
        <!-- 顶部 URL 栏 -->
        <div class="url-bar">
          <select v-model="method" class="method-select">
            <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
          </select>
          <input v-model="url" class="url-input" type="text" :placeholder="t('http.urlPlaceholder')" @keyup.enter="send" />
          <button class="primary send-btn" :disabled="loading" @click="send">
            {{ loading ? '...' : t('http.send') }}
          </button>
          <button class="save-btn" @click="openCurl" :title="t('http.curlTitle')">{{ t('http.buildCurl') }}</button>
          <button class="save-btn" @click="openSaveModal" :title="t('http.saveRequest')">{{ t('common.save') }}</button>
          <button class="expand-btn" @click="expanded = !expanded" :title="t(expanded ? 'common.restore' : 'common.expand')">
            {{ expanded ? '⤡' : '⤢' }}
          </button>
        </div>

        <!-- 请求区域 Tabs -->
        <div class="request-tabs">
          <button :class="{ active: requestTab === 'headers' }" @click="requestTab = 'headers'">
            <span class="tab-icon">H</span> {{ t('http.headers') }}
          </button>
          <button :class="{ active: requestTab === 'params' }" @click="requestTab = 'params'">
            <span class="tab-icon">P</span> {{ t('http.params') }}
          </button>
          <button :class="{ active: requestTab === 'body' }" @click="requestTab = 'body'">
            <span class="tab-icon">B</span> {{ t('http.body') }}
          </button>
        </div>

        <!-- 请求头面板 -->
        <div v-if="requestTab === 'headers'" class="request-panel" :style="{ height: reqHeightPct + '%' }">
          <div class="panel-toolbar">
            <span class="panel-title">Key</span>
            <span class="panel-title">Value</span>
            <span class="panel-title" style="width: 60px; text-align: center;">{{ t('common.action') }}</span>
          </div>
          <div v-for="(h, i) in headers" :key="i" class="data-row">
            <input type="checkbox" v-model="h.enabled" title="Enable" />
            <input v-model="h.key" type="text" :placeholder="t('http.headerKey')" />
            <input v-model="h.value" type="text" :placeholder="t('http.headerValue')" />
            <button class="icon-btn" @click="removeHeader(i)">×</button>
          </div>
          <button class="add-btn" @click="addHeader">+ {{ t('http.addHeader') }}</button>
        </div>

        <!-- 参数面板 -->
        <div v-if="requestTab === 'params'" class="request-panel" :style="{ height: reqHeightPct + '%' }">
          <div class="panel-toolbar">
            <span class="panel-title">Key</span>
            <span class="panel-title">Value</span>
            <span class="panel-title" style="width: 60px; text-align: center;">{{ t('common.action') }}</span>
          </div>
          <div v-for="(p, i) in queryParams" :key="i" class="data-row">
            <input v-model="p.key" type="text" placeholder="key" />
            <input v-model="p.value" type="text" placeholder="value" />
            <button class="icon-btn" @click="removeQueryParam(i)">×</button>
          </div>
          <button class="add-btn" @click="addQueryParam">+ {{ t('http.addParam') }}</button>
        </div>

        <!-- 请求体面板 -->
        <div v-if="requestTab === 'body'" class="request-panel" :style="{ height: reqHeightPct + '%' }">
          <div v-if="!canHaveBody" class="body-disabled-hint">{{ t('http.bodyNotSupported', { method }) }}</div>
          <template v-else>
            <div class="body-tabs">
              <button :class="{ active: bodyMode === 'none' }" @click="bodyMode = 'none'">{{ t('http.bodyNone') }}</button>
              <button :class="{ active: bodyMode === 'json' }" @click="bodyMode = 'json'">{{ t('http.bodyJson') }}</button>
              <button :class="{ active: bodyMode === 'form' }" @click="bodyMode = 'form'">{{ t('http.bodyForm') }}</button>
              <button :class="{ active: bodyMode === 'text' }" @click="bodyMode = 'text'">{{ t('http.bodyText') }}</button>
              <button :class="{ active: bodyMode === 'file' }" @click="bodyMode = 'file'">{{ t('http.bodyFile') }}</button>
            </div>
            <LinedTextarea
              v-if="bodyMode === 'json' || bodyMode === 'text'"
              v-model="body"
              min-height="50px"
              resize-key="http-body"
              :placeholder="bodyPlaceholder"
            />
            <div v-if="bodyMode === 'form'" class="form-rows">
              <div v-for="(p, i) in formBody" :key="i" class="form-row">
                <input v-model="p.key" type="text" placeholder="key" />
                <input v-model="p.value" type="text" placeholder="value" />
                <button class="icon-btn" @click="removeFormRow(i)">×</button>
              </div>
              <button class="add-btn" @click="addFormRow">+ {{ t('http.addParam') }}</button>
            </div>
            <div v-if="bodyMode === 'file'" class="form-rows">
              <div class="file-mode-row">
                <div class="file-mode-switch">
                  <button :class="{ active: fileMode === 'single' }" @click="switchFileMode('single')">{{ t('http.fileSingle') }}</button>
                  <button :class="{ active: fileMode === 'multiple' }" @click="switchFileMode('multiple')">{{ t('http.fileMultiple') }}</button>
                </div>
                <span class="file-mode-hint">{{ fileMode === 'single' ? t('http.fileSingleHint') : t('http.fileMultipleHint') }}</span>
              </div>
              <div class="file-row">
                <input v-model="fileFieldName" type="text" :placeholder="t('http.fileFieldPlaceholder')" />
                <label class="file-pick">
                  <input type="file" :multiple="fileMode === 'multiple'" @change="onFileChange" />
                  {{ filesMeta.length ? t('http.filesChosen', { n: filesMeta.length }) : t('http.filePlaceholder') }}
                </label>
              </div>
              <div v-if="filesMeta.length" class="file-list">
                <div v-for="(f, i) in filesMeta" :key="i" class="file-item">
                  <span class="file-name" :title="f.name">{{ f.name }}</span>
                  <span class="file-size">{{ formatSize(f.size) }}</span>
                  <button class="icon-btn" @click="removeFile(i)">×</button>
                </div>
              </div>
              <div class="form-hint">{{ t('http.formExtraFields') }}</div>
              <div v-for="(p, i) in formBody" :key="i" class="form-row">
                <input v-model="p.key" type="text" placeholder="key" />
                <input v-model="p.value" type="text" placeholder="value" />
                <button class="icon-btn" @click="removeFormRow(i)">×</button>
              </div>
              <button class="add-btn" @click="addFormRow">+ {{ t('http.addParam') }}</button>
            </div>
          </template>
        </div>

        <!-- 可拖动分隔条 -->
        <div class="drag-divider" @mousedown="startDragDivider"></div>

        <!-- 响应区域 -->
        <section v-if="response" class="response-section">
          <div class="response-bar" :class="statusClass(response.status)">
            <span class="status-code">{{ response.status }} {{ response.statusText }}</span>
            <span class="duration">{{ response.duration }}ms</span>
            <span class="spacer"></span>
            <button @click="formatJson">{{ t('http.formatJson') }}</button>
            <button @click="exportMarkdown">{{ t('http.exportMarkdown') }}</button>
            <button @click="copyResponseBody">{{ t('common.copy') }}</button>
            <button @click="downloadResponse">{{ t('common.download') }}</button>
          </div>
          <div class="response-tabs">
            <button :class="{ active: responseTab === 'body' }" @click="responseTab = 'body'">{{ t('http.responseBody') }}</button>
            <button :class="{ active: responseTab === 'headers' }" @click="responseTab = 'headers'">{{ t('http.responseHeaders') }}</button>
            <button :class="{ active: responseTab === 'cookie' }" @click="responseTab = 'cookie'">Cookie</button>
          </div>
          <LinesBox v-if="responseTab === 'body'" :text="formattedResponseBody" class="response-body-lines">
            <pre class="response-body" v-html="highlightedResponseBody"></pre>
          </LinesBox>
          <LinesBox v-else-if="responseTab === 'headers'" :text="responseHeadersText" class="response-headers-lines">
            <div class="response-headers">
              <div v-for="(value, key) in response.headers" :key="key" class="header-line">
                <span class="h-key">{{ key }}:</span> {{ value }}
              </div>
            </div>
          </LinesBox>
          <LinesBox v-else :text="responseCookiesText" class="response-headers-lines">
            <div class="response-headers">
              <div v-for="(c, i) in responseCookies" :key="i" class="header-line">
                <span class="h-key">{{ c.name }}:</span> {{ c.value }}
              </div>
              <div v-if="!responseCookies.length" class="empty">{{ t('common.empty') }}</div>
            </div>
          </LinesBox>
        </section>

        <!-- 无响应时的占位 -->
        <div v-else class="response-empty">
          <div class="response-empty-text">{{ t('http.sendHint') }}</div>
        </div>
      </main>
    </div>

    <!-- 记录悬浮提示（完整请求信息） -->
    <div
      v-if="tooltipVisible && hoverRecord"
      class="record-tooltip"
      :style="{ left: tooltipX + 'px', top: tooltipY + 'px' }"
    >
      <div class="rt-method">
        <span class="method" :class="methodClass(hoverRecord.method)">{{ hoverRecord.method }}</span>
        <span class="rt-time">{{ formatTime(hoverRecord.timestamp) }}</span>
      </div>
      <div class="rt-url">{{ recordFullUrl(hoverRecord) }}</div>
      <template v-if="recordHeaders(hoverRecord).length">
        <div class="rt-section">{{ t('http.headers') }}</div>
        <div v-for="(h, i) in recordHeaders(hoverRecord)" :key="'h' + i" class="rt-line">
          <span class="rt-key">{{ h.key }}:</span> {{ h.value }}
        </div>
      </template>
      <template v-if="recordParams(hoverRecord).length">
        <div class="rt-section">{{ t('http.queryParams') }}</div>
        <div v-for="(p, i) in recordParams(hoverRecord)" :key="'p' + i" class="rt-line">
          <span class="rt-key">{{ p.key }}:</span> {{ p.value }}
        </div>
      </template>
      <template v-if="recordBodyLines(hoverRecord).length">
        <div class="rt-section">{{ t('http.body') }}</div>
        <div v-for="(l, i) in recordBodyLines(hoverRecord)" :key="'b' + i" class="rt-line rt-body">{{ l }}</div>
      </template>
    </div>

    <!-- cURL 弹窗 -->
    <div v-if="curlVisible" class="curl-overlay" @click.self="curlVisible = false">
      <div class="curl-modal">
        <div class="curl-head">
          <span>{{ t('http.curlTitle') }}</span>
          <button class="icon-btn" @click="curlVisible = false">×</button>
        </div>
        <pre class="curl-body">{{ curlCommand }}</pre>
        <div class="curl-actions">
          <button @click="copyCurl">{{ t('common.copy') }}</button>
          <button @click="curlVisible = false">{{ t('http.close') }}</button>
        </div>
      </div>
    </div>

    <!-- 保存请求弹窗 -->
    <div v-if="saveModalVisible" class="curl-overlay" @click.self="saveModalVisible = false">
      <div class="curl-modal" style="width: min(480px, 90vw)">
        <div class="curl-head">
          <span>{{ t('http.saveRequest') }}</span>
          <button class="icon-btn" @click="saveModalVisible = false">×</button>
        </div>
        <div class="save-form">
          <input v-model="saveName" type="text" :placeholder="t('http.saveNamePlaceholder')" />
          <select v-model="selectedGroup">
            <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
          </select>
          <input v-model="newGroupName" type="text" :placeholder="t('http.newGroup')" />
        </div>
        <div class="curl-actions">
          <button class="primary" @click="saveCurrent">{{ t('common.save') }}</button>
          <button @click="saveModalVisible = false">{{ t('http.close') }}</button>
        </div>
      </div>
    </div>

    <!-- 分组管理弹窗 -->
    <div v-if="groupManageVisible" class="curl-overlay" @click.self="groupManageVisible = false">
      <div class="curl-modal">
        <div class="curl-head">
          <span>{{ t('http.manageGroups') }}</span>
          <button class="icon-btn" @click="groupManageVisible = false">×</button>
        </div>
        <div class="group-add">
          <input v-model="newGroupName" type="text" :placeholder="t('http.newGroup')" @keyup.enter="addGroup" />
          <button @click="addGroup">{{ t('http.add') }}</button>
        </div>
        <div class="group-list">
          <div v-if="!manageGroups.length" class="empty">{{ t('common.empty') }}</div>
          <div v-for="g in manageGroups" :key="g" class="group-manage-row">
            <template v-if="editingGroup === g">
              <input v-model="editingGroupName" type="text" @keyup.enter="renameGroup(g)" />
              <button @click="renameGroup(g)">{{ t('http.ok') }}</button>
              <button @click="cancelEditGroup">{{ t('http.close') }}</button>
            </template>
            <template v-else>
              <span class="group-name">{{ g }}</span>
              <button class="icon-btn" title="rename" @click="startEditGroup(g)">{{ t('http.rename') }}</button>
              <button class="icon-btn" title="delete" @click="removeGroup(g)">×</button>
            </template>
          </div>
        </div>
        <div class="curl-actions">
          <button @click="groupManageVisible = false">{{ t('http.close') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, watch } from 'vue'
import { t } from '../i18n/index.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { confirmDialog } from '../utils/useConfirm.js'
import { getStorage, removeStorage } from '../utils/storage.js'
import { dbGetAll, dbPut, dbDelete, dbClear, STORE_HISTORY, STORE_SAVED } from '../utils/db.js'
import LinesBox from './common/LinesBox.vue'
import LinedTextarea from './common/LinedTextarea.vue'
import { highlight } from '../tools/syntaxHighlight.js'

const HISTORY_KEY = 'dev-toolbox-http-history'
const SAVED_KEY = 'dev-toolbox-http-saved'

const methods = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']
const BODY_METHODS = ['POST', 'PUT', 'PATCH']
const method = ref('GET')
const canHaveBody = computed(() => BODY_METHODS.includes(method.value))
const url = ref('')
const DEFAULT_HEADERS = [
  { key: 'Accept', value: '*/*', enabled: true },
  { key: 'Content-Type', value: 'application/json', enabled: true },
  { key: 'Cache-Control', value: 'no-cache', enabled: true },
]
const headers = ref(DEFAULT_HEADERS.map((h) => ({ ...h })))
const bodyMode = ref('none')
const body = ref('')
const formBody = ref([{ key: '', value: '' }])
const fileFieldName = ref('file')
const fileMode = ref('single')
const selectedFiles = ref([])
const filesMeta = ref([])

const response = ref(null)
const responseTab = ref('body')
const loading = ref(false)
const curlVisible = ref(false)
const groupManageVisible = ref(false)
const saveModalVisible = ref(false)
const editingGroup = ref('')
const editingGroupName = ref('')
const { show } = useToast()

const history = ref([])
const saved = ref([])
const SIDEBAR_TAB_KEY = 'dev-toolbox-http-sidebar-tab'
const sidebar = ref('history')
const selectedId = ref(null)
const saveName = ref('')

// 记忆侧边栏当前 tab（历史记录/已保存）
watch(sidebar, (v) => {
  setItem(SIDEBAR_TAB_KEY, v)
})
const selectedGroup = ref(t('http.defaultGroup'))
const newGroupName = ref('')
const searchQuery = ref('')

// 请求区域 Tab
const requestTab = ref('headers')

// 请求/响应高度分隔（可上下拖动）
const REQ_HEIGHT_KEY = 'dev-toolbox-http-req-height'
const mainRef = ref(null)
const reqHeightPct = ref(50)
const draggingDivider = ref(false)

function startDragDivider(e) {
  e.preventDefault()
  const el = mainRef.value
  if (!el) return
  const rect = el.getBoundingClientRect()
  const total = rect.height
  // 请求面板顶部相对 main 的偏移 = URL 栏 + 请求 Tabs 的固定高度
  const panel = el.querySelector('.request-panel')
  const panelTopOffset = panel ? panel.getBoundingClientRect().top - rect.top : 90
  const margin = 20
  // 请求面板高度范围（像素）：上最小 20px 且不超出视口顶部；下不超视口底部 margin，且响应区保留 50px
  const minPanelH = Math.max(20, margin - (rect.top + panelTopOffset))
  const maxPanelH = Math.min(
    window.innerHeight - margin - (rect.top + panelTopOffset),
    total - panelTopOffset - 8 - 50
  )
  draggingDivider.value = true
  document.body.classList.add('resizing-row')
  const onMove = (ev) => {
    // 直接按像素计算请求面板高度，限制分隔条不拖出浏览器窗口
    let panelH = ev.clientY - (rect.top + panelTopOffset)
    panelH = Math.max(minPanelH, Math.min(maxPanelH, panelH))
    reqHeightPct.value = (panelH / total) * 100
  }
  const cleanup = () => {
    draggingDivider.value = false
    document.body.classList.remove('resizing-row')
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', cleanup)
    document.removeEventListener('mouseleave', cleanup)
    window.removeEventListener('blur', cleanup)
    setItem(REQ_HEIGHT_KEY, String(reqHeightPct.value))
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', cleanup)
  document.addEventListener('mouseleave', cleanup)
  window.addEventListener('blur', cleanup)
}

// 侧边栏（历史/保存）宽度可左右拖动
const SIDEBAR_WIDTH_KEY = 'dev-toolbox-http-sidebar-width'
const sidebarWidth = ref(260)

function startDragSidebar(e) {
  e.preventDefault()
  const startX = e.clientX
  const startW = sidebarWidth.value
  const onMove = (ev) => {
    let w = startW + (ev.clientX - startX)
    w = Math.min(480, Math.max(180, w))
    // 视口约束：窄窗口下不超出窗口右缘
    const maxW = Math.max(180, window.innerWidth - 100)
    if (w > maxW) w = maxW
    sidebarWidth.value = w
  }
  const onUp = () => {
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    setItem(SIDEBAR_WIDTH_KEY, String(sidebarWidth.value))
  }
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

// 记录悬浮提示（完整请求信息）
const hoverRecord = ref(null)
const tooltipVisible = ref(false)
const tooltipX = ref(0)
const tooltipY = ref(0)

function showRecordTooltip(e, r) {
  hoverRecord.value = r
  tooltipVisible.value = true
  moveRecordTooltip(e)
}

function moveRecordTooltip(e) {
  const w = 440
  const left = e.clientX + 16
  tooltipX.value = left + w > window.innerWidth ? e.clientX - w - 16 : left
  tooltipY.value = e.clientY + 14
}

function hideRecordTooltip() {
  tooltipVisible.value = false
  hoverRecord.value = null
}

// 记录完整 URL（合并 Query 参数）
function recordFullUrl(r) {
  if (!r.url) return ''
  const qp = recordParams(r)
  if (!qp.length) return r.url
  try {
    const u = new URL(r.url, 'http://localhost')
    for (const p of qp) u.searchParams.append(p.key, p.value)
    return u.toString()
  } catch {
    return r.url
  }
}

function recordHeaders(r) {
  return (r.headers || []).filter((h) => h.enabled && h.key && h.key.trim())
}

function recordParams(r) {
  return (r.queryParams || []).filter((p) => p.key && p.key.trim())
}

function recordBodyLines(r) {
  if (r.bodyMode === 'json' || r.bodyMode === 'text') {
    return r.body ? r.body.split('\n').slice(0, 40) : []
  }
  if (r.bodyMode === 'form') {
    return (r.formBody || []).filter((p) => p.key && p.key.trim()).map((p) => `${p.key}: ${p.value}`)
  }
  if (r.bodyMode === 'file') {
    return (r.files || []).map((f) => `[file] ${f.name} (${formatSize(f.size || 0)})`)
  }
  return []
}

// 整个右侧主区域放大（覆盖左侧边栏和顶部，铺满屏幕，非浏览器全屏）
const expanded = ref(false)

function onExpandKeydown(e) {
  if (e.key === 'Escape' && expanded.value) expanded.value = false
}

// Query 参数
const queryParams = ref([{ key: '', value: '' }])

function addQueryParam() {
  queryParams.value.push({ key: '', value: '' })
}
function removeQueryParam(i) {
  queryParams.value.splice(i, 1)
}

// 从 queryParams 构建 URL（带参数）
const finalUrl = computed(() => {
  if (!url.value) return ''
  const enabled = queryParams.value.filter((p) => p.key)
  if (!enabled.length) return url.value
  const u = new URL(url.value, 'http://localhost')
  for (const p of enabled) {
    u.searchParams.set(p.key, p.value)
  }
  // 保留原始协议和 host
  const base = url.value.split('?')[0]
  const qs = u.search
  return qs ? base + qs : base
})

function matchRecord(r) {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return true
  const url = (r.url || '').toLowerCase()
  const method = (r.method || '').toLowerCase()
  const status = r.response && r.response.status ? String(r.response.status) : ''
  const bodyMode = r.bodyMode || ''
  return url.includes(q) || method.includes(q) || status.includes(q) || bodyMode.includes(q)
}

const groups = computed(() => {
  const list = new Set(saved.value.map((r) => r.group || t('http.defaultGroup')))
  return [t('http.defaultGroup'), ...Array.from(list).filter((g) => g !== t('http.defaultGroup'))]
})
const manageGroups = computed(() => groups.value.filter((g) => g !== t('http.defaultGroup')))
const historyFiltered = computed(() => history.value.filter(matchRecord))
const savedFiltered = computed(() => {
  return saved.value.filter((r) => (r.group || t('http.defaultGroup')) === selectedGroup.value && matchRecord(r))
})

const bodyPlaceholder = computed(() => {
  if (bodyMode.value === 'json') return '{\n  "key": "value"\n}'
  return ''
})

const formattedResponseBody = computed(() => {
  if (!response.value) return ''
  return formatBody(response.value.body, response.value.contentType)
})

const highlightedResponseBody = computed(() => {
  if (!response.value) return ''
  const body = formattedResponseBody.value
  if (!body) return ''
  const trimmed = body.trim()
  const ct = (response.value.contentType || '').toLowerCase()
  const looksJson =
    ct.includes('json') ||
    ((trimmed.startsWith('{') || trimmed.startsWith('[')) && isJsonText(trimmed))
  if (looksJson) return highlight(body, 'json')
  return escapeHtml(body)
})

const responseHeadersText = computed(() => {
  if (!response.value || !response.value.headers) return ''
  return Object.entries(response.value.headers)
    .map(([k, v]) => `${k}: ${v}`)
    .join('\n')
})

const responseCookies = computed(() => {
  if (!response.value || !response.value.headers) return []
  const setCookie = response.value.headers['set-cookie']
  if (!setCookie) return []
  const raw = Array.isArray(setCookie) ? setCookie : [setCookie]
  return raw.map((c) => {
    const parts = String(c).split(';')
    const first = parts[0].trim()
    const eq = first.indexOf('=')
    return eq > 0
      ? { name: first.slice(0, eq).trim(), value: first.slice(eq + 1).trim() }
      : { name: first, value: '' }
  })
})

const responseCookiesText = computed(() => {
  if (!responseCookies.value.length) return ''
  return responseCookies.value.map((c) => `${c.name}: ${c.value}`).join('\n')
})

function isJsonText(text) {
  try {
    JSON.parse(text)
    return true
  } catch {
    return false
  }
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const curlCommand = computed(() => {
  if (!url.value) return ''
  const parts = ['curl']
  parts.push(`-X ${method.value}`)
  parts.push(`'${finalUrl.value || url.value}'`)
  for (const h of headers.value) {
    if (h.enabled && h.key) parts.push(`-H '${shq(h.key)}: ${shq(h.value)}'`)
  }
  const withBody = BODY_METHODS.includes(method.value) && bodyMode.value !== 'none'
  if (withBody) {
    if (bodyMode.value === 'form') {
      const params = new URLSearchParams()
      for (const p of formBody.value) {
        if (p.key) params.append(p.key, p.value)
      }
      if (params.toString()) parts.push(`--data '${params.toString()}'`)
    } else if (bodyMode.value === 'file') {
      const field = fileFieldName.value.trim() || 'file'
      if (selectedFiles.value.length) {
        for (const f of selectedFiles.value) parts.push(`-F '${shq(field)}=@${shq(f.name)}'`)
      } else {
        parts.push(`-F '${shq(field)}=@<file-path>'`)
      }
    } else if (body.value) {
      parts.push(`--data-raw '${shq(body.value)}'`)
    }
  }
  return parts.join(' ')
})

function shq(s) {
  return String(s).replace(/'/g, `'\\''`)
}

watch(method, (m) => {
  if (!BODY_METHODS.includes(m)) {
    bodyMode.value = 'none'
    selectedFiles.value = []
    filesMeta.value = []
  }
})

onMounted(async () => {
  window.addEventListener('keydown', onExpandKeydown)
  await migrateLegacyData()
  const h = await loadRecords(STORE_HISTORY)
  history.value = h.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  const s = await loadRecords(STORE_SAVED)
  saved.value = s.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  const savedH = await getItem(REQ_HEIGHT_KEY)
  const n = Number(savedH)
  // 放宽校验：覆盖拖动可达范围（向上可到 20px≈2%，向下响应区留 50px≈95%）
  if (!Number.isNaN(n) && n > 0 && n < 100) reqHeightPct.value = Math.min(98, Math.max(2, n))
  const savedW = await getItem(SIDEBAR_WIDTH_KEY)
  const w = Number(savedW)
  if (w >= 180 && w <= 480) sidebarWidth.value = w
  const savedTab = await getItem(SIDEBAR_TAB_KEY)
  if (savedTab === 'history' || savedTab === 'saved') sidebar.value = savedTab
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', onExpandKeydown)
})

function getItem(key) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get(key, (obj) => resolve(obj ? obj[key] : null))
    } else {
      try {
        resolve(localStorage.getItem(key))
      } catch {
        resolve(null)
      }
    }
  })
}

function setItem(key, value) {
  return new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: value }, resolve)
    } else {
      try {
        localStorage.setItem(key, value)
        resolve()
      } catch {
        resolve()
      }
    }
  })
}

async function loadRecords(store) {
  try {
    return await dbGetAll(store)
  } catch {
    return []
  }
}

async function migrateLegacyData() {
  const legacy = [
    [HISTORY_KEY, STORE_HISTORY],
    [SAVED_KEY, STORE_SAVED],
  ]
  for (const [key, store] of legacy) {
    try {
      const old = await getStorage(key, null)
      if (!Array.isArray(old) || !old.length) continue
      const existing = await dbGetAll(store)
      const existingIds = new Set(existing.map((r) => r.id))
      for (const rec of old) {
        if (!rec.timestamp) rec.timestamp = Date.now()
        if (!existingIds.has(rec.id)) await dbPut(store, rec)
      }
      await removeStorage(key)
    } catch {
      // ignore
    }
  }
}

function addHeader() {
  headers.value.push({ key: '', value: '', enabled: true })
}
function removeHeader(i) {
  headers.value.splice(i, 1)
}

function addFormRow() {
  formBody.value.push({ key: '', value: '' })
}
function removeFormRow(i) {
  formBody.value.splice(i, 1)
}

function onFileChange(e) {
  const files = Array.from(e.target.files || [])
  if (!files.length) return
  if (fileMode.value === 'single') {
    selectedFiles.value = [files[0]]
    filesMeta.value = [{ name: files[0].name, size: files[0].size }]
  } else {
    selectedFiles.value = [...selectedFiles.value, ...files]
    filesMeta.value = [...filesMeta.value, ...files.map((f) => ({ name: f.name, size: f.size }))]
  }
  e.target.value = ''
}

function switchFileMode(mode) {
  if (fileMode.value === mode) return
  fileMode.value = mode
  selectedFiles.value = []
  filesMeta.value = []
}

function removeFile(i) {
  selectedFiles.value.splice(i, 1)
  filesMeta.value.splice(i, 1)
}

function buildBody() {
  if (bodyMode.value === 'none' || !BODY_METHODS.includes(method.value)) return undefined
  if (bodyMode.value === 'json') return body.value
  if (bodyMode.value === 'text') return body.value
  if (bodyMode.value === 'form') {
    const params = new URLSearchParams()
    for (const p of formBody.value) {
      if (p.key) params.append(p.key, p.value)
    }
    return params.toString()
  }
  if (bodyMode.value === 'file') {
    if (!selectedFiles.value.length) return undefined
    const fd = new FormData()
    for (const p of formBody.value) {
      if (p.key) fd.append(p.key, p.value)
    }
    const field = fileFieldName.value.trim() || 'file'
    for (const f of selectedFiles.value) fd.append(field, f)
    return fd
  }
  return undefined
}

function buildHeaders() {
  const h = new Headers()
  for (const item of headers.value) {
    if (item.enabled && item.key) {
      h.append(item.key, item.value)
    }
  }
  if (bodyMode.value === 'form' && !hasHeader('Content-Type')) {
    h.append('Content-Type', 'application/x-www-form-urlencoded')
  }
  if (bodyMode.value === 'file') {
    for (const k of [...h.keys()]) {
      if (k.toLowerCase() === 'content-type') h.delete(k)
    }
  }
  return h
}

function hasHeader(key) {
  const lower = key.toLowerCase()
  return headers.value.some((h) => h.enabled && h.key.toLowerCase() === lower)
}

const REQUEST_TIMEOUT = 60000

async function send() {
  if (!url.value) return
  loading.value = true
  response.value = null
  responseTab.value = 'body'
  const start = performance.now()
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
  try {
    const reqBody = buildBody()
    const reqHeaders = buildHeaders()
    const res = await fetch(finalUrl.value || url.value, { method: method.value, headers: reqHeaders, body: reqBody, signal: controller.signal })
    const duration = Math.round(performance.now() - start)
    const text = await res.text()
    const contentType = res.headers.get('content-type') || ''

    const resHeaders = {}
    res.headers.forEach((v, k) => {
      resHeaders[k] = v
    })

    response.value = {
      status: res.status,
      statusText: res.statusText,
      headers: resHeaders,
      body: text,
      contentType,
    }

    void addHistory({
      id: genId(),
      timestamp: Date.now(),
      method: method.value,
      url: url.value,
      headers: headers.value.map((h) => ({ ...h })),
      queryParams: queryParams.value.map((p) => ({ ...p })),
      bodyMode: bodyMode.value,
      body: body.value,
      formBody: formBody.value.map((p) => ({ ...p })),
      fileMode: fileMode.value,
      files: filesMeta.value.length
        ? filesMeta.value.map((f) => ({ fieldName: fileFieldName.value, ...f }))
        : null,
      response: { status: res.status, statusText: res.statusText, headers: resHeaders, body: text, contentType },
      duration,
    })
  } catch (err) {
    const aborted = err && err.name === 'AbortError'
    response.value = { status: 0, statusText: 'Error', headers: {}, body: aborted ? t('http.timeout') : String(err.message || err), contentType: 'text/plain' }
  } finally {
    clearTimeout(timer)
    loading.value = false
  }
}

const HISTORY_LIMIT = 200

async function addHistory(record) {
  history.value.unshift(record)
  if (history.value.length > HISTORY_LIMIT) {
    const removed = history.value.splice(HISTORY_LIMIT)
    await Promise.all(removed.map((r) => dbDelete(STORE_HISTORY, r.id)))
  }
  await dbPut(STORE_HISTORY, record)
}

function loadRecord(record) {
  method.value = record.method || 'GET'
  url.value = record.url || ''
  headers.value = record.headers && record.headers.length ? record.headers.map((h) => ({ ...h })) : [...DEFAULT_HEADERS]
  queryParams.value = record.queryParams && record.queryParams.length ? record.queryParams.map((p) => ({ ...p })) : [{ key: '', value: '' }]
  bodyMode.value = record.bodyMode || 'none'
  body.value = record.body || ''
  formBody.value = record.formBody && record.formBody.length ? record.formBody.map((p) => ({ ...p })) : [{ key: '', value: '' }]
  if (record.bodyMode === 'file') {
    const oldFiles = record.files && record.files.length ? record.files : record.file ? [record.file] : []
    fileFieldName.value = (oldFiles[0] && oldFiles[0].fieldName) || 'file'
    fileMode.value = record.fileMode || (oldFiles.length > 1 ? 'multiple' : 'single')
    selectedFiles.value = []
    filesMeta.value = oldFiles.map((f) => ({ name: f.name, size: f.size }))
  } else {
    selectedFiles.value = []
    filesMeta.value = []
  }
  selectedId.value = record.id
  if (!BODY_METHODS.includes(method.value)) {
    bodyMode.value = 'none'
    selectedFiles.value = []
    filesMeta.value = []
  }
  if (record.response) {
    response.value = record.response
  }
}

function openSaveModal() {
  if (!url.value) return
  saveModalVisible.value = true
}

async function saveCurrent() {
  if (!url.value) return
  const group = newGroupName.value.trim() || selectedGroup.value || t('http.defaultGroup')
  selectedGroup.value = group
  newGroupName.value = ''
  const record = {
    id: genId(),
    name: saveName.value.trim() || `${method.value} ${url.value}`,
    group,
    timestamp: Date.now(),
    method: method.value,
    url: url.value,
    headers: headers.value.map((h) => ({ ...h })),
    queryParams: queryParams.value.map((p) => ({ ...p })),
    bodyMode: bodyMode.value,
    body: body.value,
    formBody: formBody.value.map((p) => ({ ...p })),
    fileMode: fileMode.value,
    files: filesMeta.value.length
      ? filesMeta.value.map((f) => ({ fieldName: fileFieldName.value, ...f }))
      : null,
  }
  saved.value.unshift(record)
  await dbPut(STORE_SAVED, record)
  saveModalVisible.value = false
  show(t('common.success'))
}

async function deleteSaved(id) {
  if (!(await confirmDialog(t('http.confirmDeleteSaved')))) return
  saved.value = saved.value.filter((r) => r.id !== id)
  await dbDelete(STORE_SAVED, id)
}

async function deleteHistory(id) {
  if (!(await confirmDialog(t('http.confirmDeleteHistory')))) return
  history.value = history.value.filter((r) => r.id !== id)
  await dbDelete(STORE_HISTORY, id)
}

function addGroup() {
  const name = newGroupName.value.trim()
  if (!name) return
  if (groups.value.includes(name)) {
    show(t('http.groupExists'))
    return
  }
  selectedGroup.value = name
  newGroupName.value = ''
  groupManageVisible.value = false
  show(t('common.success'))
}

function startEditGroup(name) {
  editingGroup.value = name
  editingGroupName.value = name
}

function cancelEditGroup() {
  editingGroup.value = ''
  editingGroupName.value = ''
}

async function renameGroup(oldName) {
  const newName = editingGroupName.value.trim()
  if (!newName || newName === oldName) {
    cancelEditGroup()
    return
  }
  if (groups.value.includes(newName)) {
    show(t('http.groupExists'))
    return
  }
  for (const rec of saved.value) {
    if ((rec.group || t('http.defaultGroup')) === oldName) {
      rec.group = newName
      await dbPut(STORE_SAVED, rec)
    }
  }
  if (selectedGroup.value === oldName) selectedGroup.value = newName
  cancelEditGroup()
  show(t('common.success'))
}

async function removeGroup(name) {
  const recs = saved.value.filter((r) => (r.group || t('http.defaultGroup')) === name)
  if (!(await confirmDialog(t('http.confirmDeleteGroup', { n: recs.length })))) return
  for (const rec of recs) {
    rec.group = t('http.defaultGroup')
    await dbPut(STORE_SAVED, rec)
  }
  if (selectedGroup.value === name) selectedGroup.value = t('http.defaultGroup')
  show(t('common.success'))
}

function exportRecords(records) {
  if (!records.length) return
  const blob = new Blob([JSON.stringify(records, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `dev-toolbox-http-${sidebar.value}-${Date.now()}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

function exportSidebar() {
  exportRecords(sidebar.value === 'history' ? history.value : saved.value)
}

async function importRecords(e) {
  const file = e.target.files[0]
  if (!file) return
  try {
    const text = await file.text()
    const data = JSON.parse(text)
    if (!Array.isArray(data)) throw new Error('invalid')
    const store = sidebar.value === 'history' ? STORE_HISTORY : STORE_SAVED
    const existing = sidebar.value === 'history' ? history.value : saved.value
    const existingIds = new Set(existing.map((r) => r.id))
    const fresh = data.filter((rec) => !existingIds.has(rec.id))
    for (const rec of fresh) {
      if (!rec.timestamp) rec.timestamp = Date.now()
      await dbPut(store, rec)
    }
    if (sidebar.value === 'history') {
      history.value = [...fresh, ...existing]
    } else {
      saved.value = [...fresh, ...existing]
    }
    show(t('common.success'))
  } catch {
    show(t('common.error'))
  }
  e.target.value = ''
}

async function clearSidebar() {
  if (!(await confirmDialog(t('http.confirmClear')))) return
  if (sidebar.value === 'history') {
    history.value = []
    await dbClear(STORE_HISTORY)
  } else {
    saved.value = []
    await dbClear(STORE_SAVED)
  }
}

function openCurl() {
  if (!url.value) return
  curlVisible.value = true
}

async function copyCurl() {
  if (await copyText(curlCommand.value)) show(t('common.copied'))
}

function formatJson() {
  if (!response.value) return
  try {
    const obj = JSON.parse(response.value.body)
    response.value.body = JSON.stringify(obj, null, 2)
    response.value.contentType = 'application/json'
    show(t('common.success'))
  } catch {
    show(t('common.error'))
  }
}

function exportMarkdown() {
  if (!response.value) return
  const res = response.value
  const line = []
  line.push('# HTTP Request Record')
  line.push('')
  line.push('## Request')
  line.push(`- **Method**: \`${method.value}\``)
  line.push(`- **URL**: \`${finalUrl.value || url.value}\``)
  line.push(`- **Time**: ${new Date().toLocaleString()}`)
  const enabledHeaders = headers.value.filter((h) => h.enabled && h.key)
  if (enabledHeaders.length) {
    line.push('')
    line.push('### Headers')
    for (const h of enabledHeaders) line.push(`- \`${h.key}\`: ${h.value}`)
  }
  if (bodyMode.value !== 'none' && bodyMode.value !== 'file' && body.value) {
    line.push('')
    line.push('### Body')
    line.push('```')
    line.push(body.value)
    line.push('```')
  }
  if (bodyMode.value === 'file' && filesMeta.value.length) {
    line.push('')
    line.push('### Upload Files')
    line.push(`- **Field**: \`${fileFieldName.value || 'file'}\``)
    for (const f of filesMeta.value) {
      line.push(`- **File**: ${f.name} (${formatSize(f.size)})`)
    }
  }
  line.push('')
  line.push('## Response')
  line.push(`- **Status**: \`${res.status} ${res.statusText}\``)
  line.push(`- **Duration**: ${res.duration}ms`)
  const respHeaderEntries = res.headers ? Object.entries(res.headers) : []
  if (respHeaderEntries.length) {
    line.push('')
    line.push('### Response Headers')
    for (const [k, v] of respHeaderEntries) line.push(`- \`${k}\`: ${v}`)
  }
  line.push('')
  line.push('### Response Body')
  line.push('```')
  line.push(res.body || '')
  line.push('```')
  const blob = new Blob([line.join('\n')], { type: 'text/markdown;charset=utf-8' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `http-request-${Date.now()}.md`
  a.click()
  URL.revokeObjectURL(a.href)
}

async function copyResponseBody() {
  if (await copyText(response.value.body)) show(t('common.copied'))
}

function downloadResponse() {
  const blob = new Blob([response.value.body], { type: response.value.contentType || 'text/plain' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  const ext = guessExt(response.value.contentType)
  a.download = `response-${Date.now()}${ext}`
  a.click()
  URL.revokeObjectURL(a.href)
}

function formatSize(bytes) {
  if (!bytes && bytes !== 0) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function methodClass(m) {
  if (m === 'GET') return 'get'
  if (m === 'POST' || m === 'PUT' || m === 'PATCH') return 'post'
  if (m === 'DELETE') return 'delete'
  return ''
}

function statusClass(status) {
  if (status >= 200 && status < 300) return 'ok'
  if (status >= 400) return 'err'
  return ''
}

function formatTime(ts) {
  const d = new Date(ts)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}:${d.getSeconds().toString().padStart(2, '0')}`
}

function formatBody(body, contentType) {
  if (!body) return ''
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('application/json')) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2)
    } catch {
      return body
    }
  }
  return body
}

function guessExt(contentType) {
  const ct = (contentType || '').toLowerCase()
  if (ct.includes('json')) return '.json'
  if (ct.includes('html')) return '.html'
  if (ct.includes('xml')) return '.xml'
  if (ct.includes('javascript') || ct.includes('js')) return '.js'
  if (ct.includes('css')) return '.css'
  if (ct.includes('text/plain')) return '.txt'
  return '.bin'
}

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}
</script>

<style scoped>
.http-tool {
  gap: 0;
  height: 100%;
  min-height: 0;
}

.http-layout {
  display: flex;
  gap: 0;
  height: 100%;
  min-height: 0;
}

/* 左侧边栏 */
.http-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  background: var(--bg-panel);
  overflow: hidden;
}

/* 侧边栏宽度分隔条（可左右拖动） */
.side-divider {
  flex-shrink: 0;
  width: 7px;
  cursor: col-resize;
  position: relative;
  z-index: 2;
}

.side-divider::after {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 2px;
  width: 3px;
  background: var(--border);
  transition: background 0.15s;
}

.side-divider:hover::after,
.side-divider:active::after {
  background: var(--primary);
}

/* 记录悬浮提示（完整请求信息） */
.record-tooltip {
  position: fixed;
  z-index: 1000;
  max-width: 440px;
  max-height: 60vh;
  overflow: auto;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.2);
  padding: 10px 12px;
  font-size: 12px;
  line-height: 1.6;
  pointer-events: none;
  text-align: left;
  word-break: break-all;
}

.record-tooltip .rt-method {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.record-tooltip .rt-time {
  color: var(--text-secondary);
}

.record-tooltip .rt-url {
  color: var(--text-secondary);
  margin-bottom: 4px;
  font-family: monospace;
}

.record-tooltip .rt-section {
  font-weight: 600;
  margin: 8px 0 2px;
  color: var(--primary);
}

.record-tooltip .rt-line {
  padding-left: 8px;
  white-space: pre-wrap;
}

.record-tooltip .rt-key {
  color: var(--text-secondary);
}

.record-tooltip .rt-body {
  font-family: monospace;
}

.sidebar-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
}

.sidebar-tabs button {
  flex: 1;
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 10px 0;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all 0.15s;
}

.sidebar-tabs button.active {
  color: var(--primary);
  font-weight: 600;
  border-bottom: 2px solid var(--primary);
  margin-bottom: -1px;
}

.search-input {
  margin: 8px;
  flex: none;
}

.records {
  flex: 1;
  overflow-y: auto;
  padding: 0 8px 8px;
}

.empty {
  color: var(--text-secondary);
  text-align: center;
  padding: 20px 0;
  font-size: 12px;
}

.record-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px;
  margin-bottom: 6px;
  cursor: pointer;
  background: var(--bg);
  position: relative;
  overflow: hidden;
}

.record-item:hover,
.record-item.active {
  border-color: var(--primary);
  background: var(--primary-soft);
}

.record-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.method {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  background: var(--bg-panel);
}

.method.get { color: var(--success); }
.method.post { color: var(--primary); }
.method.delete { color: var(--danger); }

.time {
  font-size: 11px;
  color: var(--text-secondary);
}

.record-url,
.record-name {
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.record-status {
  font-size: 11px;
  color: var(--text-secondary);
  margin-top: 2px;
}

.group-bar {
  display: flex;
  gap: 6px;
  margin-bottom: 8px;
  align-items: center;
}

.group-bar select {
  flex: 1;
}

.del-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  padding: 0 5px;
  font-size: 16px;
  line-height: 1;
  border: none;
  background: transparent;
  color: var(--text-secondary);
}

.del-btn:hover {
  color: var(--danger);
}

.record-del {
  flex: none;
  border: none;
  background: transparent;
  padding: 0 3px;
  font-size: 14px;
  line-height: 1;
  color: var(--text-secondary);
}

.record-del:hover {
  color: var(--danger);
}

.side-actions {
  display: flex;
  gap: 6px;
  padding: 8px;
  border-top: 1px solid var(--border);
  background: var(--bg);
}

.side-actions button,
.file-label {
  flex: 1;
  font-size: 12px;
  text-align: center;
}

.file-label input {
  display: none;
}

/* 右侧主区域 */
.http-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0;
  overflow: hidden;
  min-width: 0;
  background: var(--bg);
}

/* 整个最右侧主区域放大：覆盖左侧边栏和顶部，铺满屏幕（非浏览器全屏） */
.http-main.expanded {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--bg);
}

/* 放大按钮（与字符串编解码/加密工具一致） */
.expand-btn {
  width: 34px;
  min-width: 34px;
  padding: 0;
  font-size: 15px;
  line-height: 1;
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  opacity: 0.85;
}

.expand-btn:hover {
  opacity: 1;
  border-color: var(--primary);
  color: var(--primary);
}

/* URL 栏 */
.url-bar {
  display: flex;
  gap: 10px;
  align-items: stretch;
  padding: 12px 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
}

.method-select {
  width: auto;
  min-width: 90px;
  border-radius: var(--radius-sm);
}

.url-input {
  flex: 1;
  border-radius: var(--radius-sm);
}

.send-btn {
  min-width: 80px;
  border-radius: var(--radius-sm);
}

.save-btn {
  border-radius: var(--radius-sm);
}

/* 请求 Tabs */
.request-tabs {
  display: flex;
  gap: 0;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
}

.request-tabs button {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 10px 16px;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s;
}

.request-tabs button.active {
  color: var(--primary);
  font-weight: 600;
  border-bottom: 2px solid var(--primary);
  margin-bottom: -1px;
}

.tab-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  font-size: 10px;
  font-weight: 700;
  border: 1px solid currentColor;
  border-radius: 3px;
  opacity: 0.7;
}

/* 请求面板 */
.request-panel {
  flex: 0 0 auto;
  height: 50%;
  overflow-y: auto;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 0;
  position: relative;
}

/* 可拖动分隔条 */
.drag-divider {
  flex-shrink: 0;
  height: 8px;
  cursor: row-resize;
  position: relative;
  z-index: 2;
}

.drag-divider::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 3px;
  height: 2px;
  background: var(--border);
  transition: background 0.15s;
}

.drag-divider:hover::after {
  background: var(--primary);
}

.drag-divider:active::after {
  background: var(--primary);
  height: 3px;
  top: 2.5px;
}

/* 拖动分隔条时禁用请求面板内交互，避免误触 textarea 的 resize 手柄/文本选择 */
.resizing-row .request-panel,
.resizing-row .request-panel * {
  pointer-events: none !important;
  user-select: none !important;
}

.panel-toolbar {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 60px;
  gap: 8px;
  padding: 0 4px;
  font-size: 12px;
  color: var(--text-secondary);
  font-weight: 500;
}

.panel-title {
  padding: 4px 0;
}

.data-row {
  display: grid;
  grid-template-columns: 40px 1fr 1fr 60px;
  gap: 8px;
  align-items: center;
}

.data-row input[type='text'] {
  min-width: 0;
}

.data-row input[type='checkbox'] {
  width: auto;
  justify-self: center;
}

.add-btn {
  align-self: flex-start;
  font-size: 12px;
}

/* Body 区域 */
.body-tabs {
  display: flex;
  gap: 4px;
}

.body-tabs button {
  font-size: 12px;
  padding: 5px 14px;
  border-radius: var(--radius-sm);
}

.body-tabs button.active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.body-disabled-hint {
  font-size: 12px;
  color: var(--text-secondary);
  background: var(--bg);
  border: 1px dashed var(--border);
  border-radius: var(--radius-sm);
  padding: 10px;
  text-align: center;
}

.form-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.form-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.form-row input[type='text'] {
  flex: 1;
}

.file-mode-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.file-mode-switch {
  display: flex;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
  flex: none;
}

.file-mode-switch button {
  border: none;
  border-radius: 0;
  font-size: 12px;
  padding: 3px 12px;
  background: var(--bg);
}

.file-mode-switch button + button {
  border-left: 1px solid var(--border);
}

.file-mode-switch button.active {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
}

.file-mode-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

.file-row {
  display: flex;
  gap: 6px;
  align-items: center;
}

.file-row input[type='text'] {
  width: 100px;
  flex: none;
}

.file-pick {
  flex: 1;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  font-size: 12px;
  text-align: center;
  cursor: pointer;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file-pick:hover {
  border-color: var(--primary);
}

.file-pick input {
  display: none;
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  max-height: 120px;
  overflow-y: auto;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px;
  background: var(--bg);
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12px;
}

.file-name {
  flex: 1;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.file-size {
  color: var(--text-secondary);
  font-size: 11px;
  flex: none;
}

.form-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

/* 响应区域 */
.response-section {
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.response-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  font-size: 13px;
}

.response-empty-text {
  text-align: center;
}

.response-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
}

.response-bar.ok .status-code {
  color: var(--success);
}

.response-bar.err .status-code {
  color: var(--danger);
}

.status-code {
  font-weight: 600;
}

.duration {
  color: var(--text-secondary);
  font-size: 12px;
}

.spacer {
  flex: 1;
}

.response-tabs {
  display: flex;
  gap: 0;
  padding: 0 14px;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.response-tabs button {
  border: none;
  border-radius: 0;
  background: transparent;
  padding: 8px 14px;
  font-size: 12px;
  color: var(--text-secondary);
  cursor: pointer;
}

.response-tabs button.active {
  color: var(--primary);
  font-weight: 600;
  border-bottom: 2px solid var(--primary);
  margin-bottom: -1px;
}

.response-body-lines {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 14px;
}

.response-body {
  margin: 0;
  padding: 0;
  white-space: pre;
  word-break: normal;
  font-family: var(--mono);
  font-size: 12.5px;
}

.response-headers-lines {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px 14px;
}

.response-headers {
  margin: 0;
  padding: 0;
}

.header-line {
  font-family: var(--mono);
  font-size: 12.5px;
  margin-bottom: 4px;
}

.h-key {
  color: var(--primary);
}

/* 弹窗 */
.curl-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.curl-modal {
  width: min(640px, 90vw);
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}

.curl-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.curl-body {
  flex: 1;
  overflow: auto;
  margin: 0;
  padding: 12px;
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-family: var(--mono);
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.curl-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}

.save-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.save-form input,
.save-form select {
  width: 100%;
}

.group-add {
  display: flex;
  gap: 8px;
}

.group-add input {
  flex: 1;
}

.group-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 120px;
}

.group-manage-row {
  display: flex;
  gap: 6px;
  align-items: center;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 6px 8px;
}

.group-manage-row .group-name {
  flex: 1;
  font-size: 13px;
}

.group-manage-row input[type='text'] {
  flex: 1;
}

.icon-btn {
  padding: 4px 8px;
  line-height: 1;
}

:global(body.resizing-row) {
  user-select: none;
  cursor: row-resize;
}
</style>
