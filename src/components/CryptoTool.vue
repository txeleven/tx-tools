<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.crypto.name') }}</div>
      <div class="tool-desc">{{ t('tools.crypto.desc') }}</div>
    </div>

    <div class="toolbar">
      <select v-model="algorithm" class="algo-select">
        <option value="xor">XOR + Base64</option>
        <option value="rc4">RC4</option>
        <option value="aes">AES-128-CBC</option>
      </select>
      <input
        v-model="key"
        :placeholder="t('crypto.keyPlaceholder')"
        class="key-input"
        type="text"
        spellcheck="false"
      />
      <button class="primary" @click="encrypt">{{ t('crypto.encrypt') }}</button>
      <button @click="decrypt">{{ t('crypto.decrypt') }}</button>
      <span class="spacer"></span>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div v-if="algorithm === 'aes'" class="key-hint">⚠️ {{ t('crypto.aesKeyHint') }}</div>

    <LinedTextarea
      v-model="input"
      :placeholder="t('crypto.inputPlaceholder')"
      min-height="180px"
    />

    <div class="status" :class="statusClass" v-if="status">{{ status }}</div>

    <div class="output-box">
      <div v-if="output" class="output-inner">
        <LinesBox :text="output" class="crypto-lines">
          <pre class="crypto-output">{{ output }}</pre>
        </LinesBox>
        <button class="copy-btn" @click="copyOutput">{{ t('common.copy') }}</button>
      </div>
      <div v-else class="empty-hint">{{ t('common.result') }}</div>
    </div>

    <div class="code-section">
      <div class="code-header">
        <span class="code-title">🧰 {{ t('crypto.codeTitle') }}</span>
        <div class="code-tabs">
          <button
            v-for="l in codeLangs"
            :key="l"
            class="code-tab"
            :class="{ active: codeLang === l }"
            @click="codeLang = l"
          >
            {{ t('crypto.lang.' + l) }}
          </button>
        </div>
        <span class="spacer"></span>
        <button @click="copyCode">{{ t('common.copy') }}</button>
      </div>
      <div class="code-body">
        <LinesBox :text="codeText" class="code-lines">
          <pre v-html="highlightedCode"></pre>
        </LinesBox>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { encrypt as cryptoEncrypt, decrypt as cryptoDecrypt } from '../tools/crypto.js'
import { getCryptoCode, codeLangs } from '../tools/cryptoCode.js'
import { highlight } from '../tools/syntaxHighlight.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinesBox from './common/LinesBox.vue'
import LinedTextarea from './common/LinedTextarea.vue'

const algorithm = ref('xor')
const key = ref('')
const input = ref('')
const output = ref('')
const status = ref('')
const statusClass = ref('')
const codeLang = ref('js')
const { show } = useToast()

const codeHlLang = computed(() => {
  if (codeLang.value === 'js') return 'js'
  if (codeLang.value === 'php') return 'php'
  return 'python'
})
const codeText = computed(() => getCryptoCode(algorithm.value, codeLang.value))
const highlightedCode = computed(() => highlight(codeText.value, codeHlLang.value))

watch(algorithm, () => {
  codeLang.value = 'js'
  setStatus('', '')
})

function setStatus(msg, cls) {
  status.value = msg
  statusClass.value = cls || ''
}

function requireKey() {
  if (!key.value.trim()) {
    setStatus(t('crypto.emptyKey'), 'err')
    return false
  }
  return true
}

function encrypt() {
  if (!input.value) return
  if (!requireKey()) return
  try {
    output.value = cryptoEncrypt(algorithm.value, input.value, key.value)
    setStatus(t('crypto.encryptDone'), 'ok')
  } catch (e) {
    output.value = ''
    setStatus(e.message || String(e), 'err')
  }
}

function decrypt() {
  if (!input.value) return
  if (!requireKey()) return
  try {
    output.value = cryptoDecrypt(algorithm.value, input.value.trim(), key.value)
    setStatus(t('crypto.decryptDone'), 'ok')
  } catch (e) {
    output.value = ''
    setStatus(e.message || String(e), 'err')
  }
}

function clear() {
  input.value = ''
  output.value = ''
  key.value = ''
  setStatus('', '')
}

async function copyOutput() {
  if (await copyText(output.value)) show(t('common.copied'))
}

async function copyCode() {
  if (await copyText(getCryptoCode(algorithm.value, codeLang.value))) show(t('common.copied'))
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.algo-select {
  width: 160px;
  flex-shrink: 0;
}

.key-input {
  flex: 1;
  min-width: 160px;
}

.key-hint {
  font-size: 12px;
  color: #b45309;
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: var(--radius-sm);
  padding: 6px 10px;
}

.output-inner {
  display: flex;
  gap: 10px;
  align-items: flex-start;
}

.crypto-output {
  flex: 1;
  margin: 0;
  white-space: pre;
  word-break: normal;
  font-family: var(--mono);
  font-size: 12.5px;
}

.crypto-lines {
  flex: 1;
  min-width: 0;
  overflow-x: auto;
}

.copy-btn {
  padding: 3px 8px;
  font-size: 12px;
  flex-shrink: 0;
}

.code-section {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  flex: 1;
  min-height: 140px;
  display: flex;
  flex-direction: column;
}

.code-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  background: var(--bg-panel);
  flex-wrap: wrap;
}

.code-title {
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
}

.code-tabs {
  display: flex;
  gap: 4px;
}

.code-tab {
  padding: 3px 12px;
  font-size: 12px;
  border-radius: var(--radius-sm);
}

.code-tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.code-body {
  margin: 0;
  padding: 12px;
  overflow: hidden;
  flex: 1;
  min-height: 0;
  display: flex;
  color: var(--text);
}

.code-lines {
  flex: 1;
  min-width: 0;
  overflow: auto;
}
</style>
