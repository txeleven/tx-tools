<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.timestamp.name') }}</div>
      <div class="tool-desc">{{ t('tools.timestamp.desc') }}</div>
    </div>

    <!-- 时间戳 -> 日期 -->
    <div class="section">
      <div class="toolbar">
        <input v-model="tsInput" :placeholder="t('timestamp.tsPlaceholder')" spellcheck="false" />
        <button class="primary" @click="tsToDate">{{ t('timestamp.toDate') }}</button>
        <button @click="fillNow">🕐 {{ t('timestamp.now') }}</button>
      </div>
      <div v-if="dateResult" class="result-grid">
        <div class="result-row">
          <span class="label">{{ t('timestamp.seconds') }}</span>
          <span class="value mono">{{ dateResult.unixSeconds }}</span>
        </div>
        <div class="result-row">
          <span class="label">{{ t('timestamp.milliseconds') }}</span>
          <span class="value mono">{{ dateResult.unixMs }}</span>
        </div>
        <div class="result-row">
          <span class="label">{{ t('timestamp.local') }}</span>
          <span class="value mono">{{ dateResult.local }}</span>
        </div>
        <div class="result-row">
          <span class="label">{{ t('timestamp.localMs') }}</span>
          <span class="value mono">{{ dateResult.localMs }}</span>
        </div>
        <div class="result-row">
          <span class="label">UTC</span>
          <span class="value mono">{{ dateResult.utc }}</span>
        </div>
        <div class="result-row">
          <span class="label">{{ t('timestamp.iso') }}</span>
          <span class="value mono">{{ dateResult.iso }}</span>
        </div>
        <div class="result-row">
          <span class="label">{{ t('timestamp.relative') }}</span>
          <span class="value">{{ dateResult.relative }}</span>
        </div>
      </div>
      <div v-if="dateError" class="status err">{{ dateError }}</div>
    </div>

    <div class="divider"></div>

    <!-- 日期 -> 时间戳 -->
    <div class="section">
      <div class="toolbar">
        <input v-model="dateInput" :placeholder="t('timestamp.datePlaceholder')" spellcheck="false" />
        <button class="primary" @click="dateToTs">{{ t('timestamp.toTs') }}</button>
        <button v-if="nowMs" @click="copySeconds">{{ t('timestamp.copySeconds') }}</button>
        <button v-if="nowMs" @click="copyMs">{{ t('timestamp.copyMs') }}</button>
      </div>
      <div v-if="tsResult" class="result-grid">
        <div class="result-row">
          <span class="label">{{ t('timestamp.seconds') }}</span>
          <span class="value mono">{{ tsResult.seconds }}</span>
        </div>
        <div class="result-row">
          <span class="label">{{ t('timestamp.milliseconds') }}</span>
          <span class="value mono">{{ tsResult.milliseconds }}</span>
        </div>
      </div>
      <div v-if="tsError" class="status err">{{ tsError }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { timestampToDate, dateToTimestamp, relativeTime } from '../tools/timestamp.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'

const tsInput = ref('')
const dateInput = ref('')
const dateResult = ref(null)
const dateError = ref('')
const tsResult = ref(null)
const tsError = ref('')
const nowMs = ref(0)
const { show } = useToast()

function tsToDate() {
  dateError.value = ''
  if (!tsInput.value.trim()) return
  try {
    const ts = Number(tsInput.value.trim())
    const isMs = String(Math.abs(Math.trunc(ts))).length > 10
    const ms = isMs ? ts : ts * 1000
    dateResult.value = {
      unixSeconds: Math.floor(ms / 1000),
      unixMs: ms,
      local: timestampToDate(ms, { ms: true, format: 'yyyy-MM-dd HH:mm:ss' }),
      localMs: timestampToDate(ms, { ms: true, format: 'yyyy-MM-dd HH:mm:ss.SSS' }),
      utc: new Date(ms).toUTCString(),
      iso: new Date(ms).toISOString(),
      relative: relativeTime(ms),
    }
  } catch (e) {
    dateResult.value = null
    dateError.value = `${t('common.error')}: ${e.message}`
  }
}

function fillNow() {
  nowMs.value = Date.now()
  tsInput.value = String(nowMs.value)
  tsToDate()
}

function dateToTs() {
  tsError.value = ''
  if (!dateInput.value.trim()) return
  try {
    // 支持 2024-01-01 12:00:00 格式（iOS Safari 兼容）
    let str = dateInput.value.trim()
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
      str = str.replace(' ', 'T')
    }
    const res = dateToTimestamp(str)
    tsResult.value = res
    nowMs.value = res.milliseconds
  } catch (e) {
    tsResult.value = null
    tsError.value = `${t('common.error')}: ${e.message}`
  }
}

async function copySeconds() {
  if (await copyText(String(Math.floor(nowMs.value / 1000)))) show(t('common.copied'))
}

async function copyMs() {
  if (await copyText(String(nowMs.value))) show(t('common.copied'))
}
</script>

<style scoped>
.section {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.divider {
  height: 1px;
  background: var(--border);
  margin: 6px 0;
}

.mono {
  font-family: var(--mono);
}
</style>
