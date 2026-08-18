<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.colorPicker.name') }}</div>
      <div class="tool-desc">{{ t('tools.colorPicker.desc') }}</div>
    </div>

    <div v-if="!support" class="status warn">{{ t('colorPicker.noSupport') }}</div>

    <div class="pick-wrap">
      <button class="primary pick-btn" @click="pick" :disabled="picking || !support">
        <span class="dropper">🎨</span> {{ picking ? t('colorPicker.picking') : t('colorPicker.pick') }}
      </button>
      <div v-if="color" class="preview" :style="{ backgroundColor: color }" @click="copy"></div>
    </div>

    <div v-if="color" class="result">
      <div class="field">
        <label>HEX</label>
        <input readonly :value="color.toUpperCase()" @click="copy" />
      </div>
      <div class="field">
        <label>RGB</label>
        <input readonly :value="rgb" @click="copy" />
      </div>
      <div class="toolbar mini">
        <button class="mini-btn" @click="copy">{{ t('common.copy') }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { t } from '../i18n/index.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'

const color = ref('')
const picking = ref(false)
const support = ref(false)
const { show } = useToast()

const rgb = computed(() => {
  if (!color.value) return ''
  const c = hexToRgb(color.value)
  return `rgb(${c.r}, ${c.g}, ${c.b})`
})

onMounted(() => {
  support.value = typeof window !== 'undefined' && 'EyeDropper' in window
})

async function pick() {
  if (!support.value) return
  const eyeDropper = new window.EyeDropper()
  picking.value = true
  try {
    const result = await eyeDropper.open()
    color.value = result.sRGBHex
    show(t('colorPicker.picked') + ' ' + result.sRGBHex)
  } catch (e) {
    // user cancelled
  } finally {
    picking.value = false
  }
}

async function copy() {
  if (color.value && (await copyText(color.value))) {
    show(t('common.copied'))
  }
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16)
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 }
}
</script>

<style scoped>
.pick-wrap {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.pick-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.dropper {
  font-size: 16px;
}

.preview {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--border);
  cursor: pointer;
  box-shadow: 0 0 0 2px rgba(0, 0, 0, 0.05);
}

.result {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.field {
  display: flex;
  align-items: center;
  gap: 8px;
}

.field label {
  width: 40px;
  font-family: var(--mono);
  font-size: 12px;
  color: var(--text-secondary);
}

.field input {
  flex: 1;
  cursor: pointer;
  font-family: var(--mono);
}

.toolbar.mini {
  justify-content: flex-start;
}
</style>
