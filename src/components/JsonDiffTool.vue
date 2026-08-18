<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.jsonDiff.name') }}</div>
      <div class="tool-desc">{{ t('tools.jsonDiff.desc') }}</div>
    </div>

    <div class="split-pane">
      <div class="pane">
        <div class="pane-label">
          <span>{{ t('jsonDiff.left') }}</span>
          <button class="pane-copy" :disabled="!left" @click="copy(left)">{{ t('common.copy') }}</button>
        </div>
        <LinedTextarea v-model="left" :placeholder="t('jsonDiff.placeholder')" />
      </div>
      <div class="pane">
        <div class="pane-label">
          <span>{{ t('jsonDiff.right') }}</span>
          <button class="pane-copy" :disabled="!right" @click="copy(right)">{{ t('common.copy') }}</button>
        </div>
        <LinedTextarea v-model="right" :placeholder="t('jsonDiff.placeholder')" />
      </div>
    </div>

    <div class="toolbar">
      <button class="primary" @click="compare">{{ t('jsonDiff.compare') }}</button>
      <button @click="swap">{{ t('jsonDiff.swap') }}</button>
      <span class="spacer"></span>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div class="status" :class="statusClass" v-if="status">{{ status }}</div>

    <div class="diff-list" v-if="diffs.length">
      <div
        v-for="(d, i) in diffs"
        :key="i"
        class="diff-item"
        :class="'type-' + d.type"
      >
        <div class="diff-head">
          <span class="badge">{{ badgeText(d.type) }}</span>
          <span class="path mono">{{ formatPath(d.path) }}</span>
        </div>
        <div class="diff-body mono">
          <div v-if="d.oldValue !== undefined" class="old">
            <span class="lbl">-</span>{{ formatValue(d.oldValue) }}
          </div>
          <div v-if="d.newValue !== undefined" class="new">
            <span class="lbl">+</span>{{ formatValue(d.newValue) }}
          </div>
        </div>
      </div>
      <div class="no-diff" v-if="diffs.length === 0 && compared">{{ t('jsonDiff.noDiff') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { diffJson } from '../tools/jsonDiff.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const left = ref('')
const right = ref('')
const diffs = ref([])
const status = ref('')
const statusClass = ref('')
const compared = ref(false)
const { show } = useToast()

async function copy(text) {
  if (text && (await copyText(text))) show(t('common.copied'))
}

const TYPE_LABEL = {
  added: '+',
  removed: '-',
  changed: '~',
  arrayAdded: '⇢',
  arrayRemoved: '⇠',
}

function badgeText(type) {
  return TYPE_LABEL[type] || '?'
}

function formatPath(path) {
  if (!path.length) return '$'
  let out = ''
  for (const seg of path) {
    out += /^\d+$/.test(String(seg)) ? `[${seg}]` : `.${seg}`
  }
  return out
}

function formatValue(v) {
  if (v === undefined) return ''
  if (typeof v === 'string') return `"${v}"`
  if (v === null) return 'null'
  if (typeof v === 'object') return JSON.stringify(v)
  return String(v)
}

function parse(json, label) {
  try {
    return JSON.parse(json)
  } catch (e) {
    throw new Error(`${label} ${t('jsonDiff.invalidJson')}: ${e.message}`)
  }
}

function compare() {
  compared.value = true
  try {
    const a = parse(left.value, t('jsonDiff.left'))
    const b = parse(right.value, t('jsonDiff.right'))
    diffs.value = diffJson(a, b)
    status.value = diffs.value.length
      ? `${t('jsonDiff.found')}: ${diffs.value.length}`
      : t('jsonDiff.noDiff')
    statusClass.value = diffs.value.length ? 'info' : 'ok'
  } catch (e) {
    diffs.value = []
    status.value = e.message
    statusClass.value = 'err'
  }
}

function swap() {
  const tmp = left.value
  left.value = right.value
  right.value = tmp
}

function clear() {
  left.value = ''
  right.value = ''
  diffs.value = []
  status.value = ''
  compared.value = false
}
</script>

<style scoped>
.split-pane {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.pane {
  display: flex;
  flex-direction: column;
  gap: 6px;
  overflow: auto;
}

.pane-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.pane-copy {
  border: none;
  background: transparent;
  color: var(--primary);
  font-size: 12px;
  padding: 0;
  cursor: pointer;
}

.pane-copy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.diff-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-height: 320px;
  overflow: auto;
}

.diff-item {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.diff-head {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 5px 10px;
  font-size: 12px;
  background: var(--bg-hover);
}

.badge {
  font-weight: 700;
  min-width: 18px;
  text-align: center;
  border-radius: 3px;
  color: #fff;
  font-size: 11px;
  padding: 1px 5px;
}

.type-added .badge { background: var(--success); }
.type-removed .badge { background: var(--danger); }
.type-changed .badge { background: var(--warning); }
.type-arrayAdded .badge { background: var(--success); }
.type-arrayRemoved .badge { background: var(--danger); }

.path {
  color: var(--text-secondary);
  word-break: break-all;
}

.diff-body {
  padding: 6px 10px;
  font-size: 12px;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.old {
  color: var(--danger);
  background: rgba(220, 38, 38, 0.06);
  padding: 2px 6px;
  border-radius: 3px;
}

.new {
  color: var(--success);
  background: rgba(22, 163, 74, 0.06);
  padding: 2px 6px;
  border-radius: 3px;
}

.lbl {
  font-weight: 700;
  margin-right: 4px;
}

.no-diff {
  color: var(--success);
  font-size: 13px;
  padding: 8px;
  text-align: center;
}
</style>
