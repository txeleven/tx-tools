<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.base64.name') }}</div>
      <div class="tool-desc">{{ t('tools.base64.desc') }}</div>
    </div>

    <LinedTextarea
      v-model="input"
      :placeholder="t('base64.placeholder')"
      min-height="120px"
    />

    <div class="toolbar">
      <button class="primary" @click="doEncode">{{ t('base64.encode') }}</button>
      <button class="primary" @click="doDecode">{{ t('base64.decode') }}</button>
      <label class="check-line">
        <input type="checkbox" v-model="urlSafe" /> {{ t('base64.urlSafe') }}
      </label>
      <span class="spacer"></span>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div class="toolbar" v-if="status">
      <span class="status" :class="statusClass">{{ status }}</span>
    </div>

    <div class="output-box">{{ output || placeholder }}</div>

    <div class="toolbar" v-if="output">
      <button class="primary" @click="copyOutput">{{ t('common.copy') }}</button>
      <button @click="swap">{{ '⇅ ' + t('common.paste') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { encodeBase64, decodeBase64, isValidBase64 } from '../tools/base64.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const input = ref('')
const output = ref('')
const urlSafe = ref(false)
const status = ref('')
const statusClass = ref('')
const { show } = useToast()

const placeholder = computed(() => t('common.result'))

function doEncode() {
  try {
    output.value = urlSafe.value
      ? encodeBase64(input.value).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      : encodeBase64(input.value)
    setStatus('', '')
  } catch (e) {
    output.value = ''
    setStatus(e.message, 'err')
  }
}

function doDecode() {
  try {
    output.value = decodeBase64(input.value, { urlSafe: urlSafe.value })
    setStatus('', '')
  } catch (e) {
    output.value = ''
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
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
</style>
