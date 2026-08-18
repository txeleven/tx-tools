<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.urlCodec.name') }}</div>
      <div class="tool-desc">{{ t('tools.urlCodec.desc') }}</div>
    </div>

    <LinedTextarea
      v-model="input"
      :placeholder="t('url.placeholder')"
      min-height="120px"
    />

    <div class="toolbar">
      <button class="primary" @click="encode">{{ t('url.encode') }}</button>
      <button @click="decode">{{ t('url.decode') }}</button>
      <label class="check-line">
        <input type="checkbox" v-model="usePlus" /> {{ t('url.plus') }}
      </label>
      <button @click="parseQueryString">🔍 {{ t('url.query') }}</button>
      <span class="spacer"></span>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div v-if="status" class="status" :class="statusClass">{{ status }}</div>

    <div class="output-box">{{ output || placeholder }}</div>

    <div v-if="queryRows.length" class="query-table">
      <div class="q-row q-head">
        <span>Key</span>
        <span>Value</span>
      </div>
      <div class="q-row" v-for="(v, k) in queryRows" :key="k">
        <span class="mono">{{ k }}</span>
        <span class="mono">{{ v }}</span>
      </div>
    </div>

    <div class="toolbar" v-if="output">
      <button class="primary" @click="copyOutput">{{ t('common.copy') }}</button>
      <button @click="swap">{{ '⇅ ' + t('common.paste') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { encodeUrl, decodeUrl, parseQuery } from '../tools/url.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const input = ref('')
const output = ref('')
const usePlus = ref(true)
const status = ref('')
const statusClass = ref('')
const queryRows = ref({})
const { show } = useToast()

const placeholder = computed(() => t('common.result'))

function encode() {
  try {
    output.value = encodeUrl(input.value, { all: !usePlus.value })
    queryRows.value = {}
    setStatus('', '')
  } catch (e) {
    setStatus(e.message, 'err')
  }
}

function decode() {
  try {
    output.value = decodeUrl(input.value)
    queryRows.value = {}
    setStatus('', '')
  } catch (e) {
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function parseQueryString() {
  try {
    const qs = input.value.includes('?') ? input.value.slice(input.value.indexOf('?') + 1) : input.value
    queryRows.value = parseQuery(qs)
    output.value = JSON.stringify(queryRows.value, null, 2)
    setStatus(Object.keys(queryRows.value).length + ' params', 'ok')
  } catch (e) {
    setStatus(e.message, 'err')
  }
}

function setStatus(msg, cls) {
  status.value = msg
  statusClass.value = cls
}

function clear() {
  input.value = ''
  output.value = ''
  status.value = ''
  queryRows.value = {}
}

async function copyOutput() {
  if (await copyText(output.value)) show(t('common.copied'))
}

function swap() {
  input.value = output.value
  output.value = ''
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.query-table {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.q-row {
  display: grid;
  grid-template-columns: 1fr 2fr;
  padding: 6px 10px;
  border-bottom: 1px solid var(--border);
  word-break: break-all;
}

.q-row:last-child {
  border-bottom: none;
}

.q-head {
  background: var(--bg-hover);
  font-weight: 600;
  font-size: 12px;
}
</style>
