<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.beautify.name') }}</div>
      <div class="tool-desc">{{ t('tools.beautify.desc') }}</div>
    </div>

    <div class="toolbar">
      <button class="primary" @click="beautify">{{ t('beautify.run') }}</button>
      <button @click="minify">{{ t('minify.run') }}</button>
      <select v-model="lang" class="lang-select">
        <option v-for="opt in langOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <span class="spacer"></span>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <LinedTextarea v-model="input" :placeholder="mode === 'beautify' ? t('beautify.placeholder') : t('minify.placeholder')" min-height="180px" />

    <div class="status" :class="statusClass" v-if="status">{{ status }}</div>

    <div class="output-box code-output" ref="outputRef">
      <LinesBox v-if="output" :text="output">
        <pre v-if="mode === 'beautify'" v-html="highlightedOutput"></pre>
        <pre v-else>{{ output }}</pre>
      </LinesBox>
      <div v-else class="empty-hint">{{ placeholder }}</div>
    </div>

    <div class="output-footer">
      <button :disabled="!output" @click="copyOutput">{{ t('common.copy') }}</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import beautifyPkg from 'js-beautify'
import { formatSql, formatXml } from '../tools/formatSqlXml.js'
import { formatPython } from '../tools/formatPython.js'
import { minifyJs, minifyCss, minifyHtml } from '../tools/minifyCode.js'
import { minifyPhp } from '../tools/minifyPhp.js'
import { minifyPython } from '../tools/minifyPython.js'
import { highlight, formatPhp } from '../tools/syntaxHighlight.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinesBox from './common/LinesBox.vue'
import LinedTextarea from './common/LinedTextarea.vue'

const jsBeautify = beautifyPkg.js
const cssBeautify = beautifyPkg.css
const htmlBeautify = beautifyPkg.html

const MINIFY_LANGS = ['js', 'css', 'html', 'php', 'python']

const mode = ref('beautify')
const lang = ref('js')
const input = ref('')
const output = ref('')
const status = ref('')
const statusClass = ref('')

const { show } = useToast()

const placeholder = computed(() => t('common.result'))

// 全部语言可选；压缩仅支持 js / css / html / php / python（在 minify() 内校验）
const langOptions = [
  { value: 'js', label: t('beautify.js') },
  { value: 'css', label: t('beautify.css') },
  { value: 'html', label: t('beautify.html') },
  { value: 'sql', label: t('beautify.sql') },
  { value: 'xml', label: t('beautify.xml') },
  { value: 'php', label: t('beautify.php') },
  { value: 'python', label: t('beautify.python') },
]

// 美化输出做语法高亮
const highlightedOutput = computed(() => {
  if (!output.value) return ''
  return highlight(output.value, lang.value)
})

const savedPct = computed(() => {
  if (!input.value || !output.value) return ''
  const before = input.value.length
  const after = output.value.length
  if (before === 0) return ''
  const pct = Math.round((1 - after / before) * 100)
  return t('minify.saved', { size: `${pct}% (${before} → ${after})` })
})

function setStatus(msg, cls = 'ok') {
  status.value = msg
  statusClass.value = cls
}

function beautify() {
  mode.value = 'beautify'
  try {
    switch (lang.value) {
      case 'js':
        output.value = jsBeautify(input.value, { indent_size: 2, space_in_empty_paren: true })
        break
      case 'css':
        output.value = cssBeautify(input.value, { indent_size: 2 })
        break
      case 'html':
        output.value = htmlBeautify(input.value, { indent_size: 2, preserve_newlines: true })
        break
      case 'sql':
        output.value = formatSql(input.value)
        break
      case 'xml':
        output.value = formatXml(input.value)
        break
      case 'php':
        output.value = formatPhp(input.value)
        break
      case 'python':
        output.value = formatPython(input.value)
        break
    }
    setStatus(t('beautify.done'))
  } catch (e) {
    output.value = ''
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function minify() {
  if (!MINIFY_LANGS.includes(lang.value)) {
    setStatus(t('minify.unsupported'), 'err')
    return
  }
  mode.value = 'minify'
  try {
    switch (lang.value) {
      case 'js':
        output.value = minifyJs(input.value)
        break
      case 'css':
        output.value = minifyCss(input.value)
        break
      case 'html':
        output.value = minifyHtml(input.value)
        break
      case 'php':
        output.value = minifyPhp(input.value)
        break
      case 'python':
        output.value = minifyPython(input.value)
        break
    }
    setStatus(savedPct.value || t('minify.done'), 'info')
  } catch (e) {
    output.value = ''
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function clear() {
  input.value = ''
  output.value = ''
  status.value = ''
}

async function copyOutput() {
  if (await copyText(output.value)) show(t('common.copied'))
}
</script>

<style scoped>
.lang-select {
  width: 130px;
}

.code-output pre {
  margin: 0;
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre;
  word-break: normal;
}

.code-output :deep(.hl-kw) { color: #cf222e; font-weight: 600; }
.code-output :deep(.hl-str) { color: #0a7a37; }
.code-output :deep(.hl-num) { color: #0550ae; }
.code-output :deep(.hl-func) { color: #8250df; }
.code-output :deep(.hl-comment) { color: #6a737d; font-style: italic; }
.code-output :deep(.hl-tag) { color: #22863a; }
.code-output :deep(.hl-attr) { color: #e36209; }
.code-output :deep(.hl-property) { color: #e36209; }

.empty-hint {
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
}

.output-footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 8px;
}
</style>
