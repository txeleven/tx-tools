<template>
  <div class="settings">
    <div class="panel-title">{{ t('settings.title') }}</div>

    <section class="card">
      <div class="card-title">{{ t('settings.language') }}</div>
      <div class="lang-options">
        <button
          class="lang-btn"
          :class="{ active: locale === 'zh-CN' }"
          @click="changeLocale('zh-CN')"
        >
          🇨🇳 {{ t('settings.languageZh') }}
        </button>
        <button
          class="lang-btn"
          :class="{ active: locale === 'en-US' }"
          @click="changeLocale('en-US')"
        >
          🇺🇸 {{ t('settings.languageEn') }}
        </button>
      </div>
    </section>

    <section class="card">
      <div class="card-title">{{ t('settings.contextMenu') }}</div>
      <div class="card-desc">{{ t('settings.contextMenuDesc') }}</div>
      <div class="menu-actions">
        <button @click="reloadExtension">🔄 {{ t('common.refresh') }}</button>
      </div>
    </section>

    <section class="card">
      <div class="card-title">{{ t('settings.about') }}</div>
      <div class="card-desc">{{ t('settings.aboutDesc') }}</div>
      <div class="about-line">
        <span>{{ t('app.title') }} v1.0.0</span>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { t, currentLocale, setLocale } from '../i18n/index.js'
import { useToast } from '../utils/useToast.js'

const locale = ref(currentLocale.value)
const { show } = useToast()

async function changeLocale(loc) {
  await setLocale(loc)
  locale.value = loc
  show(t('common.success'))
}

function reloadExtension() {
  if (typeof chrome !== 'undefined' && chrome.runtime?.reload) {
    chrome.runtime.reload()
  }
}
</script>

<style scoped>
.settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.panel-title {
  font-size: 18px;
  font-weight: 700;
}

.card {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 16px;
}

.card-title {
  font-size: 14px;
  font-weight: 600;
  margin-bottom: 10px;
}

.card-desc {
  font-size: 12.5px;
  color: var(--text-secondary);
  margin-bottom: 12px;
  line-height: 1.6;
}

.lang-options {
  display: flex;
  gap: 10px;
}

.lang-btn {
  padding: 8px 18px;
  border-radius: var(--radius);
  border: 1px solid var(--border);
  background: var(--bg-panel);
}

.lang-btn.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.about-line {
  font-size: 12.5px;
  color: var(--text-secondary);
}

.menu-actions {
  display: flex;
  gap: 8px;
}
</style>
