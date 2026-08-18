<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.caseConvert.name') }}</div>
      <div class="tool-desc">{{ t('tools.caseConvert.desc') }}</div>
    </div>

    <LinedTextarea
      v-model="input"
      :placeholder="t('caseConvert.placeholder')"
      min-height="100px"
    />

    <div class="result-list">
      <div class="result-row" v-for="conv in conversions" :key="conv.key">
        <span class="label">{{ conv.label }}</span>
        <span class="value mono">{{ conv.value }}</span>
        <button class="copy-btn" @click="copy(conv.value)">{{ t('common.copy') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import {
  toCamelCase, toPascalCase, toSnakeCase, toKebabCase, toConstantCase, toSentenceCase,
} from '../tools/convert.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const input = ref('')
const { show } = useToast()

const conversions = computed(() => {
  if (!input.value.trim()) return []
  return [
    { key: 'camel', label: t('caseConvert.camel'), value: toCamelCase(input.value) },
    { key: 'pascal', label: t('caseConvert.pascal'), value: toPascalCase(input.value) },
    { key: 'snake', label: t('caseConvert.snake'), value: toSnakeCase(input.value) },
    { key: 'kebab', label: t('caseConvert.kebab'), value: toKebabCase(input.value) },
    { key: 'constant', label: t('caseConvert.constant'), value: toConstantCase(input.value) },
    { key: 'sentence', label: t('caseConvert.sentence'), value: toSentenceCase(input.value) },
  ]
})

async function copy(value) {
  if (await copyText(value)) show(t('common.copied'))
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.result-list {
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
