import { defineAsyncComponent } from 'vue'

// 按需加载组件，避免 popup/options 首包包含全部工具代码
export const categories = [
  { id: 'encoding', key: 'nav.encoding' },
  { id: 'code', key: 'nav.code' },
  { id: 'network', key: 'nav.network' },
  { id: 'crypto', key: 'nav.crypto' },
  { id: 'text', key: 'nav.text' },
  { id: 'generate', key: 'nav.generate' },
]

export const tools = [
  { id: 'jsonDiff', icon: '🔀', nameKey: 'tools.jsonDiff.name', category: 'code', component: defineAsyncComponent(() => import('../components/JsonDiffTool.vue')), props: {} },

  { id: 'stringCodec', icon: '🔤', nameKey: 'tools.stringCodec.name', category: 'encoding', component: defineAsyncComponent(() => import('../components/StringCodecTool.vue')), props: {} },
  { id: 'imageBase64', icon: '🖼️', nameKey: 'tools.imageBase64.name', category: 'encoding', component: defineAsyncComponent(() => import('../components/ImageToBase64Tool.vue')), props: {} },

  { id: 'hash', icon: '#️⃣', nameKey: 'tools.hash.name', category: 'crypto', component: defineAsyncComponent(() => import('../components/HashTool.vue')), props: {} },
  { id: 'crypto', icon: '🔒', nameKey: 'tools.crypto.name', category: 'crypto', component: defineAsyncComponent(() => import('../components/CryptoTool.vue')), props: {} },
  { id: 'jwt', icon: '🔑', nameKey: 'tools.jwt.name', category: 'crypto', component: defineAsyncComponent(() => import('../components/JwtTool.vue')), props: {} },

  { id: 'timestamp', icon: '⏰', nameKey: 'tools.timestamp.name', category: 'encoding', component: defineAsyncComponent(() => import('../components/TimestampTool.vue')), props: {} },

  { id: 'regex', icon: '🔍', nameKey: 'tools.regex.name', category: 'text', component: defineAsyncComponent(() => import('../components/RegexTool.vue')), props: {} },
  { id: 'markdown', icon: '📝', nameKey: 'tools.markdown.name', category: 'text', component: defineAsyncComponent(() => import('../components/MarkdownTool.vue')), props: {} },

  { id: 'uuid', icon: '🆔', nameKey: 'tools.uuid.name', category: 'generate', component: defineAsyncComponent(() => import('../components/UuidTool.vue')), props: {} },
  { id: 'password', icon: '🔐', nameKey: 'tools.password.name', category: 'generate', component: defineAsyncComponent(() => import('../components/PasswordTool.vue')), props: {} },

  { id: 'caseConvert', icon: 'Aa', nameKey: 'tools.caseConvert.name', category: 'encoding', component: defineAsyncComponent(() => import('../components/CaseTool.vue')), props: {} },

  { id: 'color', icon: '🎨', nameKey: 'tools.color.name', category: 'code', component: defineAsyncComponent(() => import('../components/ColorTool.vue')), props: {} },
  { id: 'lint', icon: '✅', nameKey: 'tools.lint.name', category: 'code', component: defineAsyncComponent(() => import('../components/LintTool.vue')), props: {} },


  { id: 'screenshot', icon: '📸', nameKey: 'tools.screenshot.name', category: 'page', popupOnly: true, component: defineAsyncComponent(() => import('../components/FullPageScreenshotTool.vue')), props: {} },
  { id: 'colorPicker', icon: '👁️', nameKey: 'tools.colorPicker.name', category: 'page', popupOnly: true, component: defineAsyncComponent(() => import('../components/ColorPickerTool.vue')), props: {} },
  { id: 'qr', icon: '▣', nameKey: 'tools.qr.name', category: 'page', popupOnly: true, component: defineAsyncComponent(() => import('../components/QrTool.vue')), props: {} },
  { id: 'perf', icon: '⏱️', nameKey: 'tools.perf.name', category: 'page', popupOnly: true, component: defineAsyncComponent(() => import('../components/PerfTool.vue')), props: {} },

  { id: 'http', icon: '🌐', nameKey: 'tools.http.name', category: 'network', component: defineAsyncComponent(() => import('../components/HttpTool.vue')), props: {} },
  { id: 'sniffer', icon: '🕸️', nameKey: 'tools.sniffer.name', category: 'network', component: defineAsyncComponent(() => import('../components/SnifferTool.vue')), props: {} },
]

export const popupTools = [
  'screenshot',
  'colorPicker',
  'qr',
  'perf',
  'timestamp',
]

// options 完整工具箱不展示 popupOnly 的页面类工具
export const optionTools = tools.filter((t) => !t.popupOnly)

export function getToolById(id) {
  return tools.find((t) => t.id === id)
}
