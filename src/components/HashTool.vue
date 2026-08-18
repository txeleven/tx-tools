<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.hash.name') }}</div>
      <div class="tool-desc">{{ t('tools.hash.desc') }}</div>
    </div>

    <div class="toolbar">
      <button
        v-for="algo in algorithms"
        :key="algo"
        class="algo-btn"
        :class="{ active: current === algo }"
        @click="switchAlgo(algo)"
      >
        {{ algo === 'MD5' ? 'MD5' : algo }}
      </button>
      <span class="spacer"></span>
      <label class="check-line">
        <input type="checkbox" v-model="upperCase" /> {{ t('hash.uppercase') }}
      </label>
    </div>

    <LinedTextarea
      v-model="input"
      :placeholder="t('hash.placeholder')"
      min-height="120px"
    />

    <div class="toolbar">
      <button class="primary" @click="compute">{{ t('common.generate') }}</button>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div v-if="results.length" class="result-grid">
      <div class="result-row" v-for="r in results" :key="r.algo">
        <span class="label">{{ r.algo }}</span>
        <span class="value mono">{{ r.value }}</span>
        <button class="copy-btn" @click="copy(r.value)">{{ t('common.copy') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue'
import { hashText } from '../tools/hash.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const algorithms = ['MD5', 'SHA-1', 'SHA-256', 'SHA-512']
const current = ref('MD5')
const input = ref('')
const upperCase = ref(false)
const results = ref([])
const { show } = useToast()

function switchAlgo(algo) {
  current.value = algo
  if (input.value) compute()
}

async function compute() {
  if (!input.value) return
  results.value = await Promise.all(
    algorithms.map(async (algo) => {
      let value = await hashText(input.value, algo)
      if (upperCase.value) value = value.toUpperCase()
      return { algo, value }
    })
  )
}

watch([upperCase], async () => {
  if (results.value.length && input.value) compute()
})

function clear() {
  input.value = ''
  results.value = []
}

async function copy(value) {
  if (await copyText(value)) show(t('common.copied'))
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.algo-btn {
  padding: 4px 10px;
  font-size: 12px;
  font-family: var(--mono);
}

.algo-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.result-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.copy-btn {
  padding: 3px 8px;
  font-size: 12px;
  flex-shrink: 0;
}
</style>
