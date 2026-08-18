// 轻量 i18n 实现：响应式语言切换 + 全局 t() 函数
import { reactive, computed } from 'vue'
import zhCN from './locales/zh-CN.js'
import enUS from './locales/en-US.js'

const messages = {
  'zh-CN': zhCN,
  'en-US': enUS,
}

const STORAGE_KEY = 'dev-toolbox-locale'

function detectDefaultLocale() {
  const ui = typeof chrome !== 'undefined' && chrome.i18n ? chrome.i18n.getUILanguage() : navigator.language || 'zh-CN'
  return ui.startsWith('zh') ? 'zh-CN' : 'en-US'
}

const state = reactive({
  locale: 'zh-CN',
  loaded: false,
})

// 从 storage 读取语言设置
export async function initI18n() {
  const stored = await new Promise((resolve) => {
    if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
      chrome.storage.sync.get(STORAGE_KEY, (res) => resolve(res[STORAGE_KEY]))
    } else {
      resolve(localStorage.getItem(STORAGE_KEY))
    }
  })
  state.locale = stored && messages[stored] ? stored : detectDefaultLocale()
  state.loaded = true
  return state.locale
}

// 切换语言并持久化
export async function setLocale(locale) {
  if (!messages[locale]) return
  state.locale = locale
  if (typeof chrome !== 'undefined' && chrome.storage?.sync) {
    chrome.storage.sync.set({ [STORAGE_KEY]: locale })
  } else {
    localStorage.setItem(STORAGE_KEY, locale)
  }
}

// 模板插值: t('key', { n: 5 }) -> "5 字符"
export function translate(key, params) {
  const keys = key.split('.')
  let val = messages[state.locale]
  for (const k of keys) {
    if (val == null) return key
    val = val[k]
  }
  if (typeof val !== 'string') return key
  if (params) {
    return val.replace(/\{(\w+)\}/g, (_, name) => (params[name] != null ? params[name] : `{${name}}`))
  }
  return val
}

// 供模板使用的 t 函数
export function useT() {
  return computed(() => translate)
}

export const currentLocale = computed(() => state.locale)

export function t(key, params) {
  return translate(key, params)
}
