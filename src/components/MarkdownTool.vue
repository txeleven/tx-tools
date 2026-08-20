<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.markdown.name') }}</div>
      <div class="tool-desc">{{ t('tools.markdown.desc') }}</div>
    </div>

    <div class="toolbar">
      <button
        v-for="m in modes"
        :key="m.value"
        :class="{ primary: mode === m.value }"
        @click="mode = m.value"
      >{{ m.label }}</button>
      <span class="spacer"></span>
      <button :disabled="!html" @click="copyOutput">{{ t('markdown.copyHtml') }}</button>
      <button :disabled="!html" @click="openPreview">{{ t('markdown.openWindow') }}</button>
      <button :disabled="!input" @click="saveToCache">💾 {{ t('markdown.save') }}</button>
      <button @click="historyVisible = true">🕘 {{ t('markdown.history') }}</button>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <LinedTextarea
      v-if="mode === 'write' || mode === 'split'"
      v-model="input"
      :placeholder="t('markdown.placeholder')"
      class="md-input"
    />

    <div v-if="mode === 'preview' || mode === 'split'" class="md-preview">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="markdown-body" v-html="html"></div>
      <div class="empty-hint" v-if="!input">{{ t('markdown.empty') }}</div>
    </div>

    <!-- 历史记录弹窗 -->
    <div v-if="historyVisible" class="md-overlay" @click.self="historyVisible = false">
      <div class="md-modal">
        <div class="md-modal-head">
          <span>{{ t('markdown.historyTitle') }}</span>
          <div class="md-modal-actions">
            <button v-if="history.length" class="danger" @click="clearHistory">{{ t('common.clear') }}</button>
            <button class="icon-btn" @click="historyVisible = false">×</button>
          </div>
        </div>
        <div class="md-history-list">
          <div v-if="!history.length" class="empty">{{ t('markdown.noHistory') }}</div>
          <div v-for="r in history" :key="r.id" class="md-history-item" @click="loadRecord(r)">
            <div class="md-history-title" :title="r.title">{{ r.title || t('markdown.untitled') }}</div>
            <div class="md-history-time">{{ formatTime(r.timestamp) }}</div>
            <button class="del-btn" @click.stop="removeRecord(r.id)">×</button>
          </div>
        </div>
        <div class="md-modal-foot">
          <button @click="historyVisible = false">{{ t('markdown.close') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { marked } from 'marked'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { confirmDialog } from '../utils/useConfirm.js'
import { dbGetAll, dbPut, dbDelete, dbClear, STORE_MARKDOWN } from '../utils/db.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const input = ref(`# Hello Markdown

- 支持 **粗体**、*斜体*
- 列表、链接 [CodeBuddy](https://codebuddy.ai)
- \`行内代码\`

\`\`\`js
console.log('hello')
\`\`\`
`)
const mode = ref('split')
const { show } = useToast()

// 历史记录（IndexedDB）
const historyVisible = ref(false)
const history = ref([])

onMounted(async () => {
  try {
    const list = await dbGetAll(STORE_MARKDOWN)
    history.value = list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
  } catch {
    history.value = []
  }
})

marked.setOptions({
  gfm: true,
  breaks: true,
})

const modes = computed(() => [
  { value: 'write', label: t('markdown.write') },
  { value: 'preview', label: t('markdown.preview') },
  { value: 'split', label: t('markdown.split') },
])

const html = computed(() => {
  if (!input.value) return ''
  try {
    return marked.parse(input.value)
  } catch (e) {
    return `<p>${t('markdown.error')}</p>`
  }
})

function clear() {
  input.value = ''
}

function makeTitle(text) {
  const first = (text || '')
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !l.startsWith('```'))
  const title = (first || '')
    .replace(/^#{1,6}\s*/, '')
    .replace(/[*_`>[\]-]/g, '')
    .trim()
  return title.slice(0, 40)
}

async function saveToCache() {
  if (!input.value) return
  const record = {
    id: genId(),
    timestamp: Date.now(),
    title: makeTitle(input.value),
    content: input.value,
  }
  await dbPut(STORE_MARKDOWN, record)
  history.value.unshift(record)
  show(t('common.success'))
}

function loadRecord(r) {
  input.value = r.content
  historyVisible.value = false
  show(t('markdown.loaded'))
}

async function removeRecord(id) {
  if (!(await confirmDialog(t('markdown.confirmDelete')))) return
  history.value = history.value.filter((r) => r.id !== id)
  await dbDelete(STORE_MARKDOWN, id)
}

async function clearHistory() {
  if (!(await confirmDialog(t('markdown.confirmClear')))) return
  history.value = []
  await dbClear(STORE_MARKDOWN)
}

function formatTime(ts) {
  const d = new Date(ts)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function genId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

async function copyOutput() {
  if (await copyText(html.value)) show(t('common.copied'))
}

function openPreview() {
  const w = window.open('', 'md-preview', 'width=960,height=720,menubar=no,toolbar=no,location=no')
  if (!w) return
  const doc = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Markdown Preview</title>
<style>
body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height: 1.6; padding: 24px 32px; max-width: 900px; margin: 0 auto; color: #222; background: #fff; }
h1,h2 { border-bottom: 1px solid #e1e4e8; padding-bottom: 6px; }
pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; }
code { background: #f6f8fa; padding: 2px 5px; border-radius: 4px; font-family: Consolas,monospace; }
blockquote { border-left: 4px solid #dfe2e5; padding-left: 12px; color: #6a737d; margin: 0; }
table { border-collapse: collapse; } th,td { border: 1px solid #dfe2e5; padding: 6px 10px; }
a { color: #0366d6; }
</style>
</head>
<body>
${html.value}
</body>
</html>`
  w.document.open()
  w.document.write(doc)
  w.document.close()
}
</script>

<style scoped>
.tool-panel .md-input {
  min-height: 220px;
  flex: 1;
}

.md-preview {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-panel);
  padding: 16px 18px;
  flex: 1;
  min-height: 200px;
  overflow: auto;
}

.markdown-body :deep(h1), .markdown-body :deep(h2) {
  border-bottom: 1px solid var(--border);
  padding-bottom: 4px;
  margin: 12px 0 8px;
}

.markdown-body :deep(h1) { font-size: 22px; }
.markdown-body :deep(h2) { font-size: 18px; }
.markdown-body :deep(h3) { font-size: 15px; }
.markdown-body :deep(p) { margin: 8px 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 22px; margin: 8px 0; }
.markdown-body :deep(code) {
  background: var(--bg-hover);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 12px;
}
.markdown-body :deep(pre) {
  background: var(--bg-hover);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  overflow: auto;
  margin: 8px 0;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}
.markdown-body :deep(a) { color: var(--primary); }
.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--border);
  padding-left: 10px;
  color: var(--text-secondary);
  margin: 8px 0;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
}
.markdown-body :deep(th), .markdown-body :deep(td) {
  border: 1px solid var(--border);
  padding: 5px 9px;
}

.empty-hint {
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
}

.md-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.md-modal {
  width: min(560px, 90vw);
  max-height: 70vh;
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 14px;
}

.md-modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
}

.md-modal-actions {
  display: flex;
  gap: 6px;
  align-items: center;
}

.md-history-list {
  flex: 1;
  overflow: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 200px;
}

.md-history-item {
  display: flex;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 10px;
  cursor: pointer;
  background: var(--bg);
}

.md-history-item:hover {
  border-color: var(--primary);
}

.md-history-title {
  flex: 1;
  font-size: 13px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}

.md-history-time {
  font-size: 11px;
  color: var(--text-secondary);
  flex: none;
}

.del-btn {
  border: none;
  background: transparent;
  color: var(--text-secondary);
  font-size: 15px;
  cursor: pointer;
  padding: 0 4px;
  flex: none;
}

.del-btn:hover {
  color: var(--danger);
}

.md-modal-foot {
  display: flex;
  justify-content: flex-end;
}
</style>
