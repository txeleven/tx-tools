<template>
  <div class="tool-panel http-tool">
    <div class="tool-title">{{ t('tools.http.name') }}</div>
    <div class="tool-desc">{{ t('tools.http.desc') }}</div>

    <div class="url-bar">
      <select v-model="method" class="method-select">
        <option v-for="m in methods" :key="m" :value="m">{{ m }}</option>
      </select>
      <input v-model="url" class="url-input" type="text" :placeholder="t('http.urlPlaceholder')" />
      <button class="primary send-btn" :disabled="loading" @click="send">
        {{ loading ? '...' : t('http.send') }}
      </button>
      <button @click="openCurl">{{ t('http.buildCurl') }}</button>
    </div>

    <div class="http-layout">
      <aside class="http-sidebar">
        <div class="tabs">
          <button :class="{ active: sidebar === 'history' }" @click="sidebar = 'history'">{{ t('http.history') }}</button>
          <button :class="{ active: sidebar === 'saved' }" @click="sidebar = 'saved'">{{ t('http.saved') }}</button>
        </div>

        <input v-model="searchQuery" type="text" class="search-input" :placeholder="t('http.searchPlaceholder')" />

        <div v-if="sidebar === 'history'" class="records">
          <div v-if="!historyFiltered.length" class="empty">{{ t('common.empty') }}</div>
          <div
            v-for="r in historyFiltered"
            :key="r.id"
            class="record-item"
            :class="{ active: selectedId === r.id }"
            @click="loadRecord(r)"
          >
            <div class="record-line">
              <span class="method" :class="methodClass(r.method)">{{ r.method }}</span>
              <span class="time">{{ formatTime(r.timestamp) }}</span>
              <button class="record-del" :title="t('common.delete')" @click.stop="deleteHistory(r.id)">×</button>
            </div>
            <div class="record-url" :title="r.url">{{ r.url }}</div>
            <div v-if="r.response" class="record-status">{{ r.response.status }} · {{ r.duration }}ms</div>
          </div>
        </div>

        <div v-else class="records">
          <div class="group-bar">
            <select v-model="selectedGroup">
              <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
            </select>
            <button @click="groupManageVisible = true">{{ t('http.manageGroups') }}</button>
          </div>
          <div v-if="!savedFiltered.length" class="empty">{{ t('common.empty') }}</div>
          <div
            v-for="r in savedFiltered"
            :key="r.id"
            class="record-item"
            @click="loadRecord(r)"
          >
            <div v-if="r.name && r.name !== r.url" class="record-name">{{ r.name }}</div>
            <div class="record-url" :title="r.url">{{ r.url }}</div>
            <button class="del-btn" @click.stop="deleteSaved(r.id)">×</button>
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

      <main class="http-main">
        <div class="save-row">
          <input v-model="saveName" class="save-name" type="text" :placeholder="t('http.saveNamePlaceholder')" />
          <select v-model="selectedGroup">
            <option v-for="g in groups" :key="g" :value="g">{{ g }}</option>
          </select>
          <input v-model="newGroupName" type="text" :placeholder="t('http.newGroup')" />
          <button @click="saveCurrent">{{ t('common.save') }}</button>
        </div>

        <div class="request-grid">
          <section class="headers-section">
            <div class="section-title">{{ t('http.headers') }}</div>
            <div v-for="(h, i) in headers" :key="i" class="header-row">
              <input type="checkbox" v-model="h.enabled" title="Enable" />
              <input v-model="h.key" type="text" :placeholder="t('http.headerKey')" />
              <input v-model="h.value" type="text" :placeholder="t('http.headerValue')" />
              <button class="icon-btn" @click="removeHeader(i)">×</button>
            </div>
            <button class="add-btn" @click="addHeader">+ {{ t('http.addHeader') }}</button>
          </section>

          <section class="body-section">
            <div class="section-title">{{ t('http.body') }}</div>
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
              min-height="220px"
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
          </section>
        </div>

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
          </div>
          <LinesBox v-if="responseTab === 'body'" :text="formattedResponseBody" class="response-body-lines">
            <pre class="response-body" v-html="highlightedResponseBody"></pre>
          </LinesBox>
          <LinesBox v-else :text="responseHeadersText" class="response-headers-lines">
            <div class="response-headers">
              <div v-for="(value, key) in response.headers" :key="key" class="header-line">
                <span class="h-key">{{ key }}:</span> {{ value }}
              </div>
            </div>
          </LinesBox>
        </section>
      </main>
    </div>

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
import { ref, computed, onMounted, watch } from 'vue'
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
// 规范：仅这些方法允许携带请求体（含文件上传）
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
const fileMode = ref('single') // 'single' | 'multiple'
const selectedFiles = ref([])
const filesMeta = ref([])

const response = ref(null)
const responseTab = ref('body')
const loading = ref(false)
const curlVisible = ref(false)
const groupManageVisible = ref(false)
const editingGroup = ref('')
const editingGroupName = ref('')
const { show } = useToast()

const history = ref([])
const saved = ref([])
const sidebar = ref('history')
const selectedId = ref(null)
const saveName = ref('')
const selectedGroup = ref(t('http.defaultGroup'))
const newGroupName = ref('')
const searchQuery = ref('')

// 搜索关键词：命中 method / url / 状态码 / bodyMode
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
  parts.push(`'${url.value}'`)
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

// 方法切换时规范联动：不允许请求体的方法强制 body 为 none，并清空文件
watch(method, (m) => {
  if (!BODY_METHODS.includes(m)) {
    bodyMode.value = 'none'
    selectedFiles.value = []
    filesMeta.value = []
  }
})

onMounted(async () => {
  await migrateLegacyData()
  const h = await loadRecords(STORE_HISTORY)
  history.value = h.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  const s = await loadRecords(STORE_SAVED)
  saved.value = s.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
})

async function loadRecords(store) {
  try {
    return await dbGetAll(store)
  } catch {
    return []
  }
}

// 一次性迁移旧 chrome.storage / localStorage 数据到 IndexedDB
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
    // 单文件模式：选择新文件时替换旧文件
    selectedFiles.value = [files[0]]
    filesMeta.value = [{ name: files[0].name, size: files[0].size }]
  } else {
    // 多文件模式：追加到已选列表
    selectedFiles.value = [...selectedFiles.value, ...files]
    filesMeta.value = [...filesMeta.value, ...files.map((f) => ({ name: f.name, size: f.size }))]
  }
  e.target.value = ''
}

function switchFileMode(mode) {
  if (fileMode.value === mode) return
  fileMode.value = mode
  // 切换模式后清空已选文件，避免状态混淆
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
  // 文件上传：移除手动设置的 Content-Type，避免破坏 multipart boundary
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
    const res = await fetch(url.value, { method: method.value, headers: reqHeaders, body: reqBody, signal: controller.signal })
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
  bodyMode.value = record.bodyMode || 'none'
  body.value = record.body || ''
  formBody.value = record.formBody && record.formBody.length ? record.formBody.map((p) => ({ ...p })) : [{ key: '', value: '' }]
  if (record.bodyMode === 'file') {
    // 兼容旧数据：单文件存于 record.file，多文件存于 record.files
    const oldFiles = record.files && record.files.length ? record.files : record.file ? [record.file] : []
    fileFieldName.value = (oldFiles[0] && oldFiles[0].fieldName) || 'file'
    // 恢复单/多文件模式，旧数据根据文件数推断
    fileMode.value = record.fileMode || (oldFiles.length > 1 ? 'multiple' : 'single')
    selectedFiles.value = []
    filesMeta.value = oldFiles.map((f) => ({ name: f.name, size: f.size }))
  } else {
    selectedFiles.value = []
    filesMeta.value = []
  }
  selectedId.value = record.id
  // 规范关联：加载的历史记录若方法与请求体冲突，强制归 none
  if (!BODY_METHODS.includes(method.value)) {
    bodyMode.value = 'none'
    selectedFiles.value = []
    filesMeta.value = []
  }
  if (record.response) {
    response.value = record.response
  }
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
  line.push('# HTTP 请求记录')
  line.push('')
  line.push('## 请求')
  line.push(`- **方法**: \`${method.value}\``)
  line.push(`- **URL**: \`${url.value}\``)
  line.push(`- **时间**: ${new Date().toLocaleString()}`)
  const enabledHeaders = headers.value.filter((h) => h.enabled && h.key)
  if (enabledHeaders.length) {
    line.push('')
    line.push('### 请求头')
    for (const h of enabledHeaders) line.push(`- \`${h.key}\`: ${h.value}`)
  }
  if (bodyMode.value !== 'none' && bodyMode.value !== 'file' && body.value) {
    line.push('')
    line.push('### 请求体')
    line.push('```')
    line.push(body.value)
    line.push('```')
  }
  if (bodyMode.value === 'file' && filesMeta.value.length) {
    line.push('')
    line.push('### 上传文件')
    line.push(`- **字段名**: \`${fileFieldName.value || 'file'}\``)
    for (const f of filesMeta.value) {
      line.push(`- **文件名**: ${f.name}（${formatSize(f.size)}）`)
    }
  }
  line.push('')
  line.push('## 响应')
  line.push(`- **状态**: \`${res.status} ${res.statusText}\``)
  line.push(`- **耗时**: ${res.duration}ms`)
  const respHeaderEntries = res.headers ? Object.entries(res.headers) : []
  if (respHeaderEntries.length) {
    line.push('')
    line.push('### 响应头')
    for (const [k, v] of respHeaderEntries) line.push(`- \`${k}\`: ${v}`)
  }
  line.push('')
  line.push('### 响应体')
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
  gap: 14px;
}
.url-bar {
  display: flex;
  gap: 10px;
  align-items: stretch;
}
.method-select {
  width: auto;
  min-width: 90px;
}
.url-input {
  flex: 1;
}
.send-btn {
  min-width: 80px;
}
.http-layout {
  display: flex;
  gap: 14px;
  height: calc(100vh - 220px);
  min-height: 420px;
}
.http-sidebar {
  width: 260px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-panel);
  overflow: hidden;
}
.http-sidebar .tabs {
  margin: 0;
  padding: 6px 6px 0;
  background: var(--bg);
}
.http-sidebar .tabs button {
  flex: 1;
  border: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  background: transparent;
}
.http-sidebar .tabs button.active {
  background: var(--bg-panel);
  font-weight: 600;
  color: var(--primary);
}
.search-input {
  margin: 6px 6px 0;
  flex: none;
}
.records {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
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
  background: var(--bg-panel);
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
  background: var(--bg);
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
  flex-direction: column;
  gap: 6px;
  margin-bottom: 8px;
}
.group-bar select,
.group-bar input {
  width: 100%;
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
.http-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  overflow: hidden;
  min-width: 0;
}
.request-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.headers-section,
.body-section {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-panel);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-height: 220px;
}
.section-title {
  font-weight: 600;
  font-size: 13px;
}
.header-row,
.form-row {
  display: flex;
  gap: 6px;
  align-items: center;
}
.header-row input[type='text'],
.form-row input[type='text'] {
  flex: 1;
}
.header-row input[type='checkbox'] {
  width: auto;
}
.icon-btn {
  padding: 4px 8px;
  line-height: 1;
}
.add-btn {
  align-self: flex-start;
  font-size: 12px;
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
.body-tabs {
  display: flex;
  gap: 4px;
}
.body-tabs button {
  flex: 1;
  font-size: 12px;
}
.body-tabs button.active,
.response-tabs button.active {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}
.body-section textarea {
  flex: 1;
  min-height: 140px;
}
.form-rows {
  display: flex;
  flex-direction: column;
  gap: 6px;
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
.file-item .icon-btn {
  flex: none;
}
.form-hint {
  font-size: 11px;
  color: var(--text-secondary);
}
.save-row {
  display: flex;
  gap: 8px;
  align-items: center;
}
.save-row input[type='text'] {
  flex: 1;
}
.save-row .save-name {
  flex: 2;
}
.save-row select {
  width: auto;
  flex: none;
}
.response-section {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-panel);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 180px;
}
.response-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
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
  gap: 4px;
  padding: 6px 12px 0;
  border-bottom: 1px solid var(--border);
}
.response-tabs button {
  border-bottom-left-radius: 0;
  border-bottom-right-radius: 0;
  border-bottom: none;
  font-size: 12px;
}
.response-body-lines {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 12px;
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
  padding: 12px;
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
</style>
