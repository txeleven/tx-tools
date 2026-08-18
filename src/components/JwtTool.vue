<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.jwt.name') }}</div>
      <div class="tool-desc">{{ t('tools.jwt.desc') }}</div>
    </div>

    <LinedTextarea
      v-model="input"
      :placeholder="t('jwt.placeholder')"
      min-height="100px"
    />

    <div class="toolbar">
      <button class="primary" @click="parse">{{ t('jwt.parse') }}</button>
      <span class="spacer"></span>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div v-if="error" class="status err">{{ error }}</div>

    <template v-if="result">
      <div class="exp-badge" :class="result.expired === true ? 'exp' : result.expired === false ? 'ok' : ''">
        <template v-if="result.expired === true">⚠ {{ t('jwt.expired') }}</template>
        <template v-else-if="result.expired === false">✓ {{ t('jwt.notExpired') }}</template>
        <template v-else>{{ t('jwt.noExp') }}</template>
      </div>

      <div class="section">
        <div class="section-title">{{ t('jwt.header') }}</div>
        <div class="output-box mono-box">
          <LinesBox v-if="prettyHeader" :text="prettyHeader">
            <pre>{{ prettyHeader }}</pre>
          </LinesBox>
        </div>
      </div>

      <div class="section">
        <div class="section-title">{{ t('jwt.payload') }}</div>
        <div class="output-box mono-box">
          <LinesBox v-if="prettyPayload" :text="prettyPayload">
            <pre>{{ prettyPayload }}</pre>
          </LinesBox>
        </div>
      </div>

      <div class="section">
        <div class="section-title">{{ t('jwt.signature') }}</div>
        <div class="output-box mono-box sig">{{ result.signature }}</div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { parseJwt, formatJwtPayload } from '../tools/jwt.js'
import { t } from '../i18n/index.js'
import LinesBox from './common/LinesBox.vue'
import LinedTextarea from './common/LinedTextarea.vue'

const input = ref('')
const result = ref(null)
const error = ref('')

const prettyHeader = computed(() => (result.value?.header ? JSON.stringify(result.value.header, null, 2) : ''))
const prettyPayload = computed(() =>
  result.value?.payload ? JSON.stringify(formatJwtPayload(result.value.payload), null, 2) : ''
)

function parse() {
  error.value = ''
  if (!input.value.trim()) return
  try {
    result.value = parseJwt(input.value)
    if (result.value.parseError) {
      error.value = result.value.parseError
    }
  } catch (e) {
    result.value = null
    error.value = `${t('common.error')}: ${e.message}`
  }
}

function clear() {
  input.value = ''
  result.value = null
  error.value = ''
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.section {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.mono-box {
  max-height: 200px;
  overflow: auto;
}

.sig {
  word-break: break-all;
  font-size: 12px;
}

.exp-badge {
  display: inline-flex;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}

.exp-badge.exp {
  background: #fef2f2;
  color: var(--danger);
}

.exp-badge.ok {
  background: #f0fdf4;
  color: var(--success);
}

.exp-badge:not(.exp):not(.ok) {
  background: var(--bg-hover);
  color: var(--text-secondary);
}
</style>
