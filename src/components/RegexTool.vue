<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.regex.name') }}</div>
      <div class="tool-desc">{{ t('tools.regex.desc') }}</div>
    </div>

    <div class="toolbar">
      <input
        v-model="pattern"
        :placeholder="t('regex.pattern')"
        class="mono"
        spellcheck="false"
        @input="run"
      />
      <input
        v-model="flags"
        :placeholder="'gim'"
        class="flags-input"
        spellcheck="false"
        @input="run"
      />
      <button @click="run">▶</button>
    </div>

    <div class="flags-hint">{{ t('regex.flagsHint') }}</div>

    <div class="toolbar wrap">
      <span class="label-sm">{{ t('regex.presets') }}:</span>
      <button v-for="p in presets" :key="p.key" class="preset" @click="applyPreset(p)">
        {{ p.label }}
      </button>
    </div>

    <LinedTextarea
      v-model="testText"
      :placeholder="t('regex.testText')"
      min-height="140px"
      @input="run"
    />

    <div class="status info" v-if="matchInfo">{{ matchInfo }}</div>
    <div class="status err" v-else-if="error">{{ error }}</div>

    <div class="regex-result">
      <template v-for="(seg, i) in segments" :key="i">
        <span v-if="seg.match" class="match">{{ seg.text }}</span>
        <span v-else>{{ seg.text }}</span>
      </template>
      <span v-if="!testText && !segments.length" class="dim">{{ t('regex.empty') }}</span>
    </div>

    <div class="usage-section">
      <div class="usage-head">
        <span class="label-sm">{{ t('regex.usage') }}</span>
        <div class="usage-tabs">
          <button
            v-for="l in usageLangs"
            :key="l.key"
            class="usage-tab"
            :class="{ active: usageLang === l.key }"
            @click="usageLang = l.key"
          >{{ l.label }}</button>
        </div>
        <span class="usage-hint">{{ t('regex.usageHint') }}</span>
      </div>
      <div class="usage-block" v-for="(u, i) in usageExamples" :key="i">
        <div class="usage-label">{{ u.title }}</div>
        <div class="usage-code">
          <pre v-html="u.html"></pre>
          <button class="copy-usage" @click="copyUsage(u.text)">{{ t('regex.copyUsage') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LinedTextarea from './common/LinedTextarea.vue'
import { highlightJs, highlight } from '../tools/syntaxHighlight.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'

const { show } = useToast()

const pattern = ref('')
const flags = ref('g')
const testText = ref('')
const error = ref('')
const matchCount = ref(0)
const usageLang = ref('js')

const presets = [
  { label: t('regex.email'), key: 'email', re: '[\\w.+-]+@[\\w-]+(?:\\.[\\w-]+)+' },
  { label: t('regex.phone'), key: 'phone', re: '1[3-9]\\d{9}' },
  { label: t('regex.urlPattern'), key: 'url', re: '(?:https?:)?//[\\w.-]+(?:/\\S*)?' },
  { label: t('regex.ip'), key: 'ip', re: '\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b' },
  { label: t('regex.chinese'), key: 'zh', re: '[\\u4e00-\\u9fa5]+' },
  { label: t('regex.datePattern'), key: 'date', re: '\\d{4}[-/]\\d{1,2}[-/]\\d{1,2}' },
  { label: t('regex.hexColor'), key: 'hex', re: '#[0-9a-fA-F]{3,8}\\b' },
  { label: t('regex.idCard'), key: 'idCard', re: '\\b(?:\\d{15}|\\d{17}[\\dXx])\\b' },
  { label: t('regex.postcode'), key: 'postcode', re: '\\b[1-9]\\d{5}\\b' },
  { label: t('regex.domain'), key: 'domain', re: '\\b(?:[a-zA-Z0-9-]+\\.)+[a-zA-Z]{2,}\\b' },
  { label: t('regex.qq'), key: 'qq', re: '\\b[1-9]\\d{4,10}\\b' },
  { label: t('regex.strongPassword'), key: 'strongPassword', re: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{8,}$' },
  { label: t('regex.time'), key: 'time', re: '\\b(?:[01]?\\d|2[0-3]):[0-5]\\d\\b' },
  { label: t('regex.uuid'), key: 'uuid', re: '[0-9a-fA-F]{8}(?:-[0-9a-fA-F]{4}){3}-[0-9a-fA-F]{12}' },
  { label: t('regex.htmlTag'), key: 'htmlTag', re: '</?[a-zA-Z][^>]*>' },
]

const usageLangs = [
  { key: 'js', label: 'JavaScript' },
  { key: 'php', label: 'PHP' },
  { key: 'py', label: 'Python' },
]

function applyPreset(p) {
  pattern.value = p.re
  run()
}

function run() {
  error.value = ''
  if (!pattern.value) {
    matchCount.value = 0
    return
  }
  try {
    const re = new RegExp(pattern.value, flags.value)
    if (!testText.value) {
      matchCount.value = 0
      return
    }
    const matches = [...testText.value.matchAll(re)]
    matchCount.value = matches.length
  } catch (e) {
    error.value = `${t('common.error')}: ${e.message}`
    matchCount.value = 0
  }
}

const matchInfo = computed(() => (matchCount.value ? t('regex.matchCount', { n: matchCount.value }) : ''))

// 高亮分段
const segments = computed(() => {
  if (!pattern.value || !testText.value || error.value) return []
  try {
    const re = new RegExp(pattern.value, flags.value.includes('g') ? flags.value : flags.value + 'g')
    const segs = []
    let last = 0
    for (const m of testText.value.matchAll(re)) {
      if (m.index > last) segs.push({ text: testText.value.slice(last, m.index), match: false })
      segs.push({ text: m[0], match: true })
      last = m.index + m[0].length
    }
    if (last < testText.value.length) segs.push({ text: testText.value.slice(last), match: false })
    return segs
  } catch {
    return []
  }
})

// flags 转换：PHP 无 g（preg_match_all 即全局），Python 用 re.I/re.M/re.S
function phpFlags() {
  return (flags.value || '').replace(/[gy]/g, '')
}

function pyFlags() {
  const map = { i: 're.I', m: 're.M', s: 're.S', x: 're.X' }
  return [...(flags.value || '')].filter((f) => map[f]).map((f) => map[f]).join('|')
}

function phpPattern() {
  return `/${pattern.value.replace(/\//g, '\\/')}/${phpFlags()}`
}

function pyPattern() {
  // 优先用单引号原始字符串；含单引号时改用双引号
  const hasSingle = pattern.value.includes("'")
  const hasDouble = pattern.value.includes('"')
  const q = hasSingle && !hasDouble ? '"' : "'"
  return `r${q}${pattern.value}${q}`
}

// 生成各语言使用方法示例（随正则/flags 实时更新）
const usageExamples = computed(() => {
  if (!pattern.value) return []
  const s = sample()
  if (usageLang.value === 'php') {
    const p = phpPattern()
    const examples = [
      {
        title: t('regex.usageTest'),
        text: `$text = '${s}';\nif (preg_match(${p}, $text)) {\n    echo 'matched';\n}`,
      },
      {
        title: t('regex.usageMatch'),
        text: `preg_match_all(${p}, $text, $matches);\nprint_r($matches[0]);`,
      },
      {
        title: t('regex.usageReplace'),
        text: `$result = preg_replace(${p}, '<替换为>', $text);`,
      },
    ]
    return examples.map((e) => ({ ...e, html: highlight(e.text, 'php') }))
  }
  if (usageLang.value === 'py') {
    const p = pyPattern()
    const fl = pyFlags()
    const flArg = fl ? `, ${fl}` : ''
    const examples = [
      {
        title: t('regex.usageTest'),
        text: `import re\ntext = '${s}'\nmatched = bool(re.search(${p}, text${flArg}))`,
      },
      {
        title: t('regex.usageMatch'),
        text: `matches = re.findall(${p}, text${flArg})`,
      },
      {
        title: t('regex.usageReplace'),
        text: `result = re.sub(${p}, '<替换为>', text${flArg})`,
      },
    ]
    return examples.map((e) => ({ ...e, html: highlight(e.text, 'python') }))
  }
  const lit = `/${pattern.value}/${flags.value || ''}`
  const examples = [
    {
      title: t('regex.usageTest'),
      text: `${lit}.test('${s}')`,
    },
    {
      title: t('regex.usageMatch'),
      text: `'${s}'.match(${lit})`,
    },
    {
      title: t('regex.usageReplace'),
      text: `'${s}'.replace(${lit}, '<替换为>')`,
    },
  ]
  return examples.map((e) => ({ ...e, html: highlightJs(e.text) }))
})

// 取测试文本首行作为示例，若无则用占位
function sample() {
  const line = (testText.value || '').split('\n')[0].trim()
  return line || '待匹配的字符串'
}

async function copyUsage(code) {
  if (await copyText(code)) show(t('common.copied'))
}
</script>

<style scoped>
.tool-header {
  margin-bottom: 2px;
}

.flags-input {
  width: 60px;
}

.flags-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

.toolbar.wrap {
  flex-wrap: wrap;
}

.label-sm {
  font-size: 12px;
  color: var(--text-secondary);
}

.preset {
  padding: 3px 8px;
  font-size: 12px;
}

.regex-result {
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 10px 12px;
  font-family: var(--mono);
  font-size: 12.5px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 180px;
  overflow: auto;
}

.match {
  background: #fde68a;
  color: #78350f;
  border-radius: 2px;
  padding: 0 1px;
}

.dim {
  color: var(--text-secondary);
}

.usage-section {
  margin-top: 14px;
}

.usage-head {
  display: flex;
  align-items: baseline;
  gap: 8px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.usage-tabs {
  display: flex;
  gap: 4px;
}

.usage-tab {
  padding: 2px 10px;
  font-size: 11.5px;
  border-radius: var(--radius-sm);
}

.usage-tab.active {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
}

.usage-hint {
  font-size: 11px;
  color: var(--text-secondary);
}

.usage-block {
  margin-bottom: 8px;
}

.usage-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 4px;
}

.usage-code {
  position: relative;
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.usage-code pre {
  margin: 0;
  padding: 8px 10px;
  font-family: var(--mono);
  font-size: 12.5px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-break: break-all;
  padding-right: 56px;
}

.usage-code :deep(.hl-kw) { color: #cf222e; font-weight: 600; }
.usage-code :deep(.hl-str) { color: #0a7a37; }
.usage-code :deep(.hl-func) { color: #8250df; }
.usage-code :deep(.hl-num) { color: #0550ae; }
.usage-code :deep(.hl-comment) { color: #6a737d; font-style: italic; }

.copy-usage {
  position: absolute;
  top: 6px;
  right: 6px;
  padding: 2px 8px;
  font-size: 11px;
}
</style>
