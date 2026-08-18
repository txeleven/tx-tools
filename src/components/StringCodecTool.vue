<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.stringCodec.name') }}</div>
      <div class="tool-desc">{{ t('tools.stringCodec.desc') }}</div>
    </div>

    <div class="toolbar">
      <button class="info" @click="encodeBase64">{{ t('stringCodec.base64Encode') }}</button>
      <button @click="decodeBase64">{{ t('stringCodec.base64Decode') }}</button>
      <button @click="encodeUrl">{{ t('stringCodec.urlEncode') }}</button>
      <button @click="decodeUrl">{{ t('stringCodec.urlDecode') }}</button>
      <span class="spacer"></span>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div class="toolbar">
      <button @click="encodeHtml">{{ t('stringCodec.htmlEncode') }}</button>
      <button @click="decodeHtml">{{ t('stringCodec.htmlDecode') }}</button>
      <button @click="unicodeEscape">{{ t('stringCodec.unicodeEscape') }}</button>
      <button @click="unicodeUnescape">{{ t('stringCodec.unicodeUnescape') }}</button>
      <span class="spacer"></span>
      <button @click="rot13">{{ t('stringCodec.rot13') }}</button>
    </div>

    <div class="toolbar">
      <button @click="toHex">{{ t('stringCodec.toHex') }}</button>
      <button @click="fromHex">{{ t('stringCodec.fromHex') }}</button>
      <button @click="toBinary">{{ t('stringCodec.toBinary') }}</button>
      <button @click="fromBinary">{{ t('stringCodec.fromBinary') }}</button>
    </div>

    <div class="split-pane">
      <div class="pane">
        <div class="pane-label">
          <span>{{ t('common.input') }}</span>
          <button class="pane-copy" :disabled="!input" @click="copyInput">{{ t('common.copy') }}</button>
        </div>
        <LinedTextarea v-model="input" :placeholder="t('stringCodec.placeholder')" min-height="260px" />
      </div>
      <div class="pane">
        <div class="pane-label">
          <span>{{ t('common.output') }}</span>
          <button class="pane-copy" :disabled="!output" @click="copyOutput">{{ t('common.copy') }}</button>
        </div>
        <LinedTextarea v-model="output" :placeholder="t('common.result')" readonly min-height="260px" />
      </div>
    </div>

    <div class="status" :class="statusClass" v-if="status">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const input = ref('')
const output = ref('')
const status = ref('')
const statusClass = ref('')

const { show } = useToast()

function setStatus(msg, cls = 'ok') {
  status.value = msg
  statusClass.value = cls
}

function clear() {
  input.value = ''
  output.value = ''
  status.value = ''
}

function encodeBase64() {
  try {
    output.value = btoa(unescape(encodeURIComponent(input.value)))
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function decodeBase64() {
  try {
    output.value = decodeURIComponent(escape(atob(input.value.trim())))
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidBase64')}`, 'err')
  }
}

function encodeUrl() {
  output.value = encodeURIComponent(input.value)
  setStatus(t('stringCodec.done'))
}

function decodeUrl() {
  try {
    output.value = decodeURIComponent(input.value.replace(/\+/g, ' '))
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidUrl')}`, 'err')
  }
}

function encodeHtml() {
  output.value = input.value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
  setStatus(t('stringCodec.done'))
}

function decodeHtml() {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = input.value
  output.value = textarea.value
  setStatus(t('stringCodec.done'))
}

function unicodeEscape() {
  output.value = Array.from(input.value)
    .map((ch) => {
      const code = ch.codePointAt(0)
      return code > 0xffff ? '\\u{' + code.toString(16) + '}' : '\\u' + code.toString(16).padStart(4, '0')
    })
    .join('')
  setStatus(t('stringCodec.done'))
}

function unicodeUnescape() {
  try {
    output.value = input.value.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidEscape')}`, 'err')
  }
}

function rot13() {
  output.value = input.value.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch <= 'Z' ? 65 : 97
    return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base)
  })
  setStatus(t('stringCodec.done'))
}

function toHex() {
  output.value = Array.from(input.value)
    .map((ch) => ch.codePointAt(0).toString(16).padStart(2, '0'))
    .join(' ')
  setStatus(t('stringCodec.done'))
}

function fromHex() {
  try {
    const hex = input.value.replace(/\s+/g, '')
    if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) throw new Error('bad hex')
    const bytes = hex.match(/.{2}/g).map((b) => parseInt(b, 16))
    output.value = bytes.map((b) => String.fromCharCode(b)).join('')
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidHex')}`, 'err')
  }
}

function toBinary() {
  output.value = Array.from(input.value)
    .map((ch) => ch.codePointAt(0).toString(2).padStart(8, '0'))
    .join(' ')
  setStatus(t('stringCodec.done'))
}

function fromBinary() {
  try {
    const bin = input.value.replace(/\s+/g, '')
    if (!/^[01]*$/.test(bin) || bin.length % 8 !== 0) throw new Error('bad bin')
    const bytes = bin.match(/.{8}/g).map((b) => parseInt(b, 2))
    output.value = bytes.map((b) => String.fromCharCode(b)).join('')
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidBinary')}`, 'err')
  }
}

async function copyInput() {
  if (!input.value) return
  if (await copyText(input.value)) show(t('common.copied'))
}

async function copyOutput() {
  if (!output.value) return
  if (await copyText(output.value)) show(t('common.copied'))
}
</script>

<style scoped>
.split-pane {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  flex: 1;
  min-height: 220px;
}

.pane {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.pane-label {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--text-secondary);
}

.pane-copy {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-size: 12px;
  padding: 2px 10px;
  border-radius: var(--radius-sm);
  cursor: pointer;
}

.pane-copy:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.split-pane {
  overflow: auto;
}

.pane :deep(.lined-textarea) {
  background: #ffffff;
}

.pane :deep(.lt-area) {
  color: #1f2933;
}

.pane :deep(.lt-gutter) {
  background: #f5f6f8;
  color: #6b7280;
  border-right-color: #e2e5ea;
}
</style>
