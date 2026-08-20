<template>
  <div class="popup-root">
    <header class="header">
      <img src="/icons/icon48.png" alt="logo" class="logo" />
      <div class="title-area">
        <div class="title">{{ t('app.title') }}</div>
        <div class="subtitle">{{ t('app.subtitle') }}</div>
      </div>
      <button class="icon-btn lang-toggle" @click="toggleLocale" :title="t('settings.language')">
        {{ locale === 'zh-CN' ? '中' : 'EN' }}
      </button>
      <button class="icon-btn" @click="openOptions" title="Settings">⚙</button>
    </header>

    <nav class="tabs" v-if="tabs.length > 1">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        class="tab"
        :class="{ active: activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tabName(tab) }}
      </button>
    </nav>

    <main class="content" ref="content" :data-tool="activeTab">
      <keep-alive>
        <component v-if="currentTool" :is="currentTool.component" v-bind="currentTool.props" :key="activeTab" />
      </keep-alive>
    </main>

    <footer class="footer">
      <button class="link-btn" @click="openOptions">🧰 {{ t('app.openFull') }}</button>
    </footer>

    <transition name="toast">
      <div v-if="toastState.visible" class="toast">{{ toastState.message }}</div>
    </transition>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch, watchEffect, nextTick } from 'vue'
import { popupTools, getToolById } from '../tools/registry.js'
import { t, currentLocale, setLocale } from '../i18n/index.js'
import { toastState } from '../utils/useToast.js'
import { restoreHeights, bindHeightMemory } from '../utils/resizeMemory.js'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'

const POPUP_TAB_KEY = 'dev-toolbox-popup-tab'

const tabs = computed(() => popupTools.map(getToolById).filter(Boolean))
const activeTab = ref(popupTools[0] || '')
const content = ref(null)

// 当前语言（computed，随切换自动响应），切换后写入缓存
const locale = currentLocale

async function toggleLocale() {
  await setLocale(locale.value === 'zh-CN' ? 'en-US' : 'zh-CN')
}

const currentTool = computed(() => getToolById(activeTab.value))

// 切换标签时同步页面标题
watchEffect(() => {
  document.title = currentTool.value ? `${t(currentTool.value.nameKey)} - ${t('app.title')}` : t('app.title')
})

async function getItem(key) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => chrome.storage.local.get(key, (res) => resolve(res[key])))
  }
  return localStorage.getItem(key)
}

function setItem(key, value) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) chrome.storage.local.set({ [key]: value })
  else localStorage.setItem(key, value)
}

// 恢复上次选中的标签
onMounted(async () => {
  bindHeightMemory()
  const saved = await getItem(POPUP_TAB_KEY)
  if (saved && tabs.value.some((tab) => tab.id === saved)) activeTab.value = saved
  await nextTick()
  restoreHeights(content.value, activeTab.value)
})

watch(activeTab, async (id) => {
  if (id) setItem(POPUP_TAB_KEY, id)
  if (!id) return
  await nextTick()
  restoreHeights(content.value, id)
})

function tabName(tab) {
  return t(tab.nameKey)
}

// 打开完整版时先记录当前工具，options 页会读取并直接定位到对应栏目
// 兼容两种模式：插件模式（chrome.runtime.id 存在）与 html 模式（直接作为网页打开）
async function openOptions() {
  const id = activeTab.value
  const query = `?tool=${id}`
  // 先记录当前工具（storage 失败不阻断打开页面）
  try {
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      await chrome.storage.local.set({ 'dev-toolbox-active-tool': id })
    } else {
      localStorage.setItem('dev-toolbox-active-tool', id)
    }
  } catch {
    // ignore
  }

  if (typeof chrome !== 'undefined' && chrome.runtime?.id) {
    // 插件模式：chrome.tabs.create + getURL 绝对地址（比 openOptionsPage 更可靠）
    const url = chrome.runtime.getURL(`options/index.html${query}`)
    if (chrome.tabs?.create) {
      chrome.tabs.create({ url })
    } else if (chrome.runtime.openOptionsPage) {
      chrome.runtime.openOptionsPage()
    } else {
      window.open(url, '_blank')
    }
  } else {
    // html 模式（dev server / 直接打开 popup/index.html）：相对地址新标签打开
    window.open(`../options/index.html${query}`, '_blank')
  }
}
</script>

<style scoped>
.popup-root {
  width: 400px;
  max-height: 600px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  background: var(--primary);
  color: #fff;
}

.logo {
  width: 28px;
  height: 28px;
  border-radius: 6px;
}

.title-area {
  flex: 1;
}

.title {
  font-size: 15px;
  font-weight: 700;
  line-height: 1.2;
}

.subtitle {
  font-size: 11px;
  opacity: 0.85;
}

.icon-btn {
  background: rgba(255, 255, 255, 0.15);
  border: none;
  color: #fff;
  border-radius: 6px;
  width: 30px;
  height: 30px;
  font-size: 15px;
}

.icon-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

.lang-toggle {
  font-size: 12px;
  width: 34px;
  font-weight: 600;
}

.content {
  padding: 12px 14px;
  flex: 1;
  overflow-y: auto;
  scrollbar-width: none;
}

.content::-webkit-scrollbar {
  display: none;
}

.footer {
  padding: 8px 14px;
  border-top: 1px solid var(--border);
  background: var(--bg-panel);
  text-align: center;
}

.link-btn {
  border: none;
  background: none;
  color: var(--primary);
  font-size: 12.5px;
  padding: 4px 8px;
}

.link-btn:hover {
  background: var(--primary-soft);
}

.tab-icon {
  margin-right: 3px;
}

/* 覆盖全局下划线 tab，改为小按钮（pill）形式 */
.tabs {
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 12px 0;
  border-bottom: none;
  margin-bottom: 0;
  overflow-x: visible;
}

.tab {
  flex: none;
  padding: 4px 10px;
  font-size: 12px;
  border: 1px solid var(--border);
  border-radius: 999px;
  background: var(--bg-panel);
  color: var(--text);
}

.tab:hover {
  border-color: var(--primary);
  color: var(--primary);
  background: var(--primary-soft);
}

.tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 600;
}
</style>
