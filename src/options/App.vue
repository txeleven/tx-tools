<template>
  <div class="options-root">
    <!-- 侧边栏 -->
    <aside class="sidebar" :style="{ width: sidebarWidth + 'px' }">
      <div class="brand">
        <img src="/icons/icon48.png" alt="logo" />
        <div>
          <div class="brand-title">{{ t('app.title') }}</div>
          <div class="brand-sub">{{ t('app.subtitle') }}</div>
        </div>
      </div>

      <nav class="category-nav">
        <div v-for="cat in categories" :key="cat.id" class="cat-group">
          <div class="cat-title">{{ t(cat.key) }}</div>
          <button
            v-for="tool in toolsByCategory(cat.id)"
            :key="tool.id"
            class="tool-item"
            :class="{ active: activeTool === tool.id }"
            @click="selectTool(tool.id)"
          >
            <span class="tool-icon">{{ tool.icon }}</span>
            <span class="tool-name">{{ t(tool.nameKey) }}</span>
          </button>
        </div>
      </nav>
    </aside>

    <!-- 拖拽分隔条 -->
    <div class="sidebar-resizer" @mousedown="startResize"></div>

    <!-- 主内容区 -->
    <main class="main">
      <template v-if="ready">
        <div v-if="activeTool" class="tool-container" ref="toolContainer" :data-tool="activeTool">
          <keep-alive>
            <component :is="currentTool.component" v-bind="currentTool.props" :key="activeTool" />
          </keep-alive>
        </div>

        <div v-else class="settings-container">
          <SettingsPanel />
        </div>
      </template>
    </main>

    <transition name="toast">
      <div v-if="toastState.visible" class="toast">{{ toastState.message }}</div>
    </transition>

    <ConfirmDialog />
  </div>
</template>

<script setup>
import { ref, computed, watchEffect, watch, nextTick } from 'vue'
import { categories, optionTools, getToolById } from '../tools/registry.js'
import { t } from '../i18n/index.js'
import { toastState } from '../utils/useToast.js'
import { restoreHeights, bindHeightMemory } from '../utils/resizeMemory.js'
import ConfirmDialog from '../components/common/ConfirmDialog.vue'
import SettingsPanel from './SettingsPanel.vue'

const ACTIVE_TOOL_KEY = 'dev-toolbox-active-tool'
const ACTIVE_CATEGORY_KEY = 'dev-toolbox-active-category'
const SIDEBAR_WIDTH_KEY = 'dev-toolbox-sidebar-width'

const activeTool = ref(null)
const ready = ref(false)
const sidebarWidth = ref(220)
const resizing = ref(false)
const toolContainer = ref(null)

async function loadSidebarWidth() {
  const w = await getItem(SIDEBAR_WIDTH_KEY)
  const n = Number(w)
  if (n >= 160 && n <= 420) sidebarWidth.value = n
}

function startResize(e) {
  if (resizing.value) return
  resizing.value = true
  const startX = e.clientX
  const startWidth = sidebarWidth.value
  const onMove = (ev) => {
    sidebarWidth.value = Math.min(420, Math.max(160, startWidth + (ev.clientX - startX)))
  }
  const onUp = () => {
    resizing.value = false
    window.removeEventListener('mousemove', onMove)
    window.removeEventListener('mouseup', onUp)
    document.body.classList.remove('resizing-col')
    setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.value)
  }
  document.body.classList.add('resizing-col')
  window.addEventListener('mousemove', onMove)
  window.addEventListener('mouseup', onUp)
}

const currentTool = computed(() => getToolById(activeTool.value))

// 切换工具时同步页面标题（语言切换时自动跟随更新）
watchEffect(() => {
  document.title = currentTool.value ? `${t(currentTool.value.nameKey)} - ${t('app.title')}` : t('app.title')
})

async function getItem(key) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (res) => resolve(res[key]))
    })
  }
  return localStorage.getItem(key)
}

function setItem(key, value) {
  if (typeof chrome !== 'undefined' && chrome.storage?.local) {
    chrome.storage.local.set({ [key]: value })
  } else {
    localStorage.setItem(key, value)
  }
}

// 支持 URL 参数直达工具：?tool=xxx 或 #xxx（popupOnly 工具不在 options 展示，忽略）
function getToolParam() {
  const id = new URLSearchParams(location.search).get('tool')
  const tool = getToolById(id)
  if (tool && !tool.popupOnly) return id
  const hash = location.hash.replace(/^#/, '')
  const hashTool = getToolById(hash)
  return hashTool && !hashTool.popupOnly ? hash : null
}

function updateToolUrl(id) {
  const url = new URL(location.href)
  url.searchParams.set('tool', id)
  url.hash = ''
  history.replaceState(null, '', url)
}

async function loadLastTool() {
  const paramTool = getToolParam()
  if (paramTool) {
    activeTool.value = paramTool
    ready.value = true
    return
  }
  let lastId = await getItem(ACTIVE_TOOL_KEY)
  const lastTool = getToolById(lastId)
  if (!lastTool || lastTool.popupOnly) {
    const lastCat = await getItem(ACTIVE_CATEGORY_KEY)
    const fallback = optionTools.find((tool) => tool.category === lastCat)
    lastId = fallback ? fallback.id : optionTools[0]?.id
  }
  activeTool.value = lastId
  ready.value = true
}

function selectTool(id) {
  const tool = getToolById(id)
  if (!tool) return
  activeTool.value = id
  setItem(ACTIVE_TOOL_KEY, id)
  setItem(ACTIVE_CATEGORY_KEY, tool.category)
  updateToolUrl(id)
}

loadLastTool()
loadSidebarWidth()
bindHeightMemory()

// 切换工具后恢复该工具输入/输出区域保存过的高度
watch(activeTool, async (id) => {
  if (!id) return
  await nextTick()
  restoreHeights(toolContainer.value, id)
})

function toolsByCategory(catId) {
  return optionTools.filter((tool) => tool.category === catId)
}
</script>

<style scoped>
.options-root {
  display: flex;
  height: 100vh;
  overflow: hidden;
}

.sidebar {
  background: var(--bg-panel);
  border-right: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  flex-shrink: 0;
}

.sidebar-resizer {
  width: 4px;
  flex-shrink: 0;
  cursor: col-resize;
  background: transparent;
  transition: background 0.15s;
}

.sidebar-resizer:hover {
  background: var(--primary);
}

.brand {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 14px;
  border-bottom: 1px solid var(--border);
}

.brand img {
  width: 32px;
  height: 32px;
  border-radius: 8px;
}

.brand-title {
  font-size: 15px;
  font-weight: 700;
}

.brand-sub {
  font-size: 11px;
  color: var(--text-secondary);
}

.category-nav {
  padding: 10px 0;
  flex: 1;
}

.cat-group {
  margin-bottom: 8px;
}

.cat-title {
  padding: 6px 16px 4px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-secondary);
  opacity: 0.45;
  text-transform: uppercase;
  letter-spacing: 0.6px;
}

.tool-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  border: none;
  background: transparent;
  border-radius: 0;
  padding: 7px 16px;
  text-align: left;
  font-size: 13px;
  color: var(--text);
}

.tool-item:hover {
  background: var(--bg-hover);
}

.tool-item.active {
  background: var(--primary-soft);
  color: var(--primary);
  font-weight: 600;
  border-right: 3px solid var(--primary);
}

.tool-icon {
  width: 18px;
  text-align: center;
}

.main {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  width: 100%;
  min-width: 0;
}

.tool-container {
  width: 100%;
  max-width: none;
  height: 100%;
}

.settings-container {
  width: 100%;
}
</style>
