<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.htmlCodec.name') }}</div>
      <div class="tool-desc">{{ t('tools.htmlCodec.desc') }}</div>
    </div>

    <LinedTextarea
      v-model="input"
      :placeholder="t('html.placeholder')"
      min-height="120px"
    />

    <div class="toolbar">
      <button class="primary" @click="encode">{{ t('html.encode') }}</button>
      <button @click="decode">{{ t('html.decode') }}</button>
      <label class="check-line">
        <input type="checkbox" v-model="allEntities" /> {{ t('html.allEntities') }}
      </label>
      <span class="spacer"></span>
      <button :disabled="!output" @click="copyOutput">{{ t('common.copy') }}</button>
      <button :disabled="!output" @click="swap">{{ '⇅ ' + t('common.paste') }}</button>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div class="toolbar" v-if="status">
      <span class="status" :class="statusClass">{{ status }}</span>
    </div>

    <div class="output-box">
      <LinesBox v-if="output" :text="output">
        <pre>{{ output }}</pre>
      </LinesBox>
      <template v-else>{{ placeholder }}</template>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { encodeHtml, decodeHtml } from '../tools/html.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinesBox from './common/LinesBox.vue'
import LinedTextarea from './common/LinedTextarea.vue'

const input = ref('')
const output = ref('')
const allEntities = ref(false)
const status = ref('')
const statusClass = ref('')
const { show } = useToast()

const placeholder = computed(() => t('common.result'))

function encode() {
  try {
    output.value = encodeHtml(input.value, { all: allEntities.value })
    setStatus('', '')
  } catch (e) {
    setStatus(e.message, 'err')
  }
}

function decode() {
  try {
    output.value = decodeHtml(input.value)
    setStatus('', '')
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
