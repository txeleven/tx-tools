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
      <div class="about-head">
        <img class="about-logo" src="/icons/icon128.png" alt="logo" />
        <div class="about-meta">
          <div class="about-name">
            {{ t('app.title') }}
            <span class="badge">v{{ version }}</span>
          </div>
          <div class="about-desc">{{ t('settings.aboutDesc') }}</div>
        </div>
      </div>

      <div class="about-stats">
        <div class="stat">
          <span class="stat-num">{{ toolCount }}</span>
          <span class="stat-label">{{ t('settings.toolsCount') }}</span>
        </div>
        <div class="stat">
          <span class="stat-num">{{ categoryCount }}</span>
          <span class="stat-label">{{ t('settings.categories') }}</span>
        </div>
      </div>

      <div class="about-info">
        <div class="info-row">
          <span class="info-label">{{ t('settings.author') }}</span>
          <span>eleven</span>
        </div>
        <div class="info-row">
          <span class="info-label">Email</span>
          <span>t281882168@gmail.com</span>
        </div>
        <div class="info-row">
          <span class="info-label">{{ t('settings.github') }}</span>
          <a :href="repoUrl" target="_blank" rel="noopener">{{ repoUrl }}</a>
        </div>
      </div>

      <div class="about-footer">
        <a class="feedback-link" :href="issuesUrl" target="_blank" rel="noopener">
          🐞 {{ t('settings.feedback') }}
        </a>
      </div>
    </section>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { t, currentLocale, setLocale } from '../i18n/index.js'
import { useToast } from '../utils/useToast.js'
import { tools, categories } from '../tools/registry.js'

const locale = ref(currentLocale.value)
const { show } = useToast()

const version =
  (typeof chrome !== 'undefined' && chrome.runtime?.getManifest?.()?.version) || '1.0.0'
const toolCount = tools.length
const categoryCount = categories.length
const repoUrl = 'https://github.com/txeleven/tx-tools'
const issuesUrl = `${repoUrl}/issues`

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

.about-head {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 14px;
}

.about-logo {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  flex-shrink: 0;
}

.about-meta {
  min-width: 0;
}

.about-name {
  font-size: 15px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.badge {
  font-size: 11px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--primary);
  color: #fff;
}

.about-desc {
  font-size: 12px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.about-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 14px;
}

.stat {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 10px 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.stat-num {
  font-size: 20px;
  font-weight: 700;
  color: var(--primary);
}

.stat-label {
  font-size: 11px;
  color: var(--text-secondary);
}

.about-info {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 14px;
}

.info-row {
  display: flex;
  align-items: center;
  font-size: 12.5px;
}

.info-row a {
  color: var(--primary);
  word-break: break-all;
}

.info-label {
  width: 80px;
  flex-shrink: 0;
  color: var(--text-secondary);
}

.about-footer {
  border-top: 1px solid var(--border);
  padding-top: 12px;
}

.feedback-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  color: var(--primary);
}

.menu-actions {
  display: flex;
  gap: 8px;
}
</style>
