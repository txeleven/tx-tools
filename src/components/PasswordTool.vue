<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.password.name') }}</div>
      <div class="tool-desc">{{ t('tools.password.desc') }}</div>
    </div>

    <div class="toolbar">
      <div class="num-line">
        <span>{{ t('password.length') }}:</span>
        <input type="number" v-model.number="length" min="4" max="100" />
      </div>
      <label class="check-line">
        <input type="checkbox" v-model="opts.uppercase" /> {{ t('password.uppercase') }}
      </label>
      <label class="check-line">
        <input type="checkbox" v-model="opts.lowercase" /> {{ t('password.lowercase') }}
      </label>
      <label class="check-line">
        <input type="checkbox" v-model="opts.digits" /> {{ t('password.digits') }}
      </label>
      <label class="check-line">
        <input type="checkbox" v-model="opts.symbols" /> {{ t('password.symbols') }}
      </label>
      <button class="primary" @click="generate">{{ t('common.generate') }}</button>
      <button class="primary" @click="copy(current)" :disabled="!current">{{ t('common.copy') }}</button>
      <button class="icon-btn" :disabled="!current" :title="t('common.refresh')" @click="generate">🔄</button>
    </div>

    <input
      class="output-box password-box mono"
      :value="current"
      :placeholder="'—'"
      readonly
    />

    <div class="toolbar" v-if="current">
      <span>{{ t('password.strength') }}:</span>
      <div class="strength-bar">
        <div
          v-for="i in 5"
          :key="i"
          class="bar-seg"
          :class="{ filled: i <= strength, [`lv${strength}`]: i <= strength }"
        ></div>
      </div>
      <span class="strength-label" :class="`lv${strength}`">{{ strengthText }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, reactive, watch, onMounted } from 'vue'
import { randomPassword, passwordStrength } from '../tools/generate.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { getStorage, setStorage } from '../utils/storage.js'
import { t } from '../i18n/index.js'

const STORAGE_KEY = 'password.settings'

const length = ref(16)
const opts = reactive({ uppercase: true, lowercase: true, digits: true, symbols: true })
const current = ref('')
const { show } = useToast()

function applySettings(s) {
  if (!s) return
  if (typeof s.length === 'number' && s.length >= 4 && s.length <= 100) length.value = s.length
  if (typeof s.uppercase === 'boolean') opts.uppercase = s.uppercase
  if (typeof s.lowercase === 'boolean') opts.lowercase = s.lowercase
  if (typeof s.digits === 'boolean') opts.digits = s.digits
  if (typeof s.symbols === 'boolean') opts.symbols = s.symbols
}

onMounted(async () => {
  applySettings(await getStorage(STORAGE_KEY, null))
})

watch(
  [length, () => opts.uppercase, () => opts.lowercase, () => opts.digits, () => opts.symbols],
  () => {
    setStorage(STORAGE_KEY, {
      length: length.value,
      uppercase: opts.uppercase,
      lowercase: opts.lowercase,
      digits: opts.digits,
      symbols: opts.symbols,
    })
  }
)

const strength = computed(() => passwordStrength(current.value))
const strengthText = computed(() => {
  if (!current.value) return ''
  if (strength.value <= 1) return t('password.weak')
  if (strength.value === 2) return t('password.medium')
  if (strength.value === 3) return t('password.strong')
  return t('password.veryStrong')
})

function generate() {
  current.value = randomPassword({
    length: Math.max(4, Math.min(100, length.value || 16)),
    ...opts,
  })
}

async function copy(value) {
  if (value && (await copyText(value))) show(t('common.copied'))
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.icon-btn {
  border: 1px solid var(--border);
  background: transparent;
  border-radius: var(--radius-sm);
  padding: 6px 10px;
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
}

.icon-btn:hover:not(:disabled) {
  background: var(--hover);
}

.icon-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.password-box {
  font-size: 15px;
  text-align: left;
  flex: none;
  min-height: 0;
  white-space: nowrap;
  max-width: 100%;
}

.strength-bar {
  display: flex;
  gap: 4px;
}

.bar-seg {
  width: 28px;
  height: 6px;
  border-radius: 3px;
  background: var(--bg-hover);
}

.bar-seg.filled.lv1 { background: var(--danger); }
.bar-seg.filled.lv2 { background: #f59e0b; }
.bar-seg.filled.lv3 { background: #84cc16; }
.bar-seg.filled.lv4 { background: var(--success); }
.bar-seg.filled.lv5 { background: #16a34a; }

.strength-label {
  font-size: 12px;
  font-weight: 600;
}

.strength-label.lv1 { color: var(--danger); }
.strength-label.lv2 { color: #b45309; }
.strength-label.lv3 { color: #4d7c0f; }
.strength-label.lv4 { color: var(--success); }
.strength-label.lv5 { color: #15803d; }
</style>
