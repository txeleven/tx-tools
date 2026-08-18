<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.uuid.name') }}</div>
      <div class="tool-desc">{{ t('tools.uuid.desc') }}</div>
    </div>

    <div class="toolbar">
      <div class="num-line">
        <span>{{ t('uuid.count') }}:</span>
        <input type="number" v-model.number="count" min="1" max="50" />
      </div>
      <div class="num-line">
        <span>{{ t('uuid.version') }}:</span>
        <select v-model="version" style="width: 70px">
          <option value="v4">v4</option>
          <option value="v1">v1</option>
        </select>
      </div>
      <label class="check-line">
        <input type="checkbox" v-model="upper" /> {{ t('uuid.uppercase') }}
      </label>
      <label class="check-line">
        <input type="checkbox" v-model="noHyphen" /> {{ t('uuid.noHyphen') }}
      </label>
      <button class="primary" @click="generate">{{ t('common.generate') }}</button>
      <button class="primary" :disabled="!list.length" @click="copyAll">{{ t('uuid.copyAll') }}</button>
    </div>

    <div class="output-box uuid-list">
      <div v-for="(u, i) in list" :key="i" class="uuid-line">
        <span class="mono">{{ u }}</span>
        <button class="copy-btn" @click="copy(u)">{{ t('common.copy') }}</button>
      </div>
      <span v-if="!list.length" class="dim">{{ t('common.empty') }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { uuidV4, uuidV1 } from '../tools/generate.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'

const count = ref(5)
const version = ref('v4')
const upper = ref(false)
const noHyphen = ref(false)
const list = ref([])
const { show } = useToast()

function generate() {
  const n = Math.max(1, Math.min(50, count.value || 1))
  list.value = Array.from({ length: n }, () => {
    let u = version.value === 'v4' ? uuidV4() : uuidV1()
    if (upper.value) u = u.toUpperCase()
    if (noHyphen.value) u = u.replace(/-/g, '')
    return u
  })
}

async function copy(u) {
  if (await copyText(u)) show(t('common.copied'))
}

async function copyAll() {
  if (await copyText(list.value.join('\n'))) show(t('common.copied'))
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.uuid-list {
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.uuid-line {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
  border-bottom: 1px dashed var(--border);
}

.uuid-line:last-child {
  border-bottom: none;
}

.copy-btn {
  padding: 2px 8px;
  font-size: 12px;
}

.primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.dim {
  color: var(--text-secondary);
}
</style>
