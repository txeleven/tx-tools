<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.markdown.name') }}</div>
      <div class="tool-desc">{{ t('tools.markdown.desc') }}</div>
    </div>

    <div class="toolbar">
      <button
        v-for="m in modes"
        :key="m.value"
        :class="{ primary: mode === m.value }"
        @click="mode = m.value"
      >{{ m.label }}</button>
      <span class="spacer"></span>
      <button :disabled="!html" @click="copyOutput">{{ t('markdown.copyHtml') }}</button>
      <button :disabled="!html" @click="openPreview">{{ t('markdown.openWindow') }}</button>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <LinedTextarea
      v-if="mode === 'write' || mode === 'split'"
      v-model="input"
      :placeholder="t('markdown.placeholder')"
      class="md-input"
    />

    <div v-if="mode === 'preview' || mode === 'split'" class="md-preview">
      <!-- eslint-disable-next-line vue/no-v-html -->
      <div class="markdown-body" v-html="html"></div>
      <div class="empty-hint" v-if="!input">{{ t('markdown.empty') }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { marked } from 'marked'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const input = ref(`# Hello Markdown

- 支持 **粗体**、*斜体*
- 列表、链接 [CodeBuddy](https://codebuddy.ai)
- \`行内代码\`

\`\`\`js
console.log('hello')
\`\`\`
`)
const mode = ref('split')
const { show } = useToast()

marked.setOptions({
  gfm: true,
  breaks: true,
})

const modes = computed(() => [
  { value: 'write', label: t('markdown.write') },
  { value: 'preview', label: t('markdown.preview') },
  { value: 'split', label: t('markdown.split') },
])

const html = computed(() => {
  if (!input.value) return ''
  try {
    return marked.parse(input.value)
  } catch (e) {
    return `<p>${t('markdown.error')}</p>`
  }
})

function clear() {
  input.value = ''
}

async function copyOutput() {
  if (await copyText(html.value)) show(t('common.copied'))
}

function openPreview() {
  const w = window.open('', 'md-preview', 'width=960,height=720,menubar=no,toolbar=no,location=no')
  if (!w) return
  const doc = `
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>Markdown Preview</title>
<style>
body { font-family: -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif; line-height: 1.6; padding: 24px 32px; max-width: 900px; margin: 0 auto; color: #222; background: #fff; }
h1,h2 { border-bottom: 1px solid #e1e4e8; padding-bottom: 6px; }
pre { background: #f6f8fa; padding: 12px; border-radius: 6px; overflow: auto; }
code { background: #f6f8fa; padding: 2px 5px; border-radius: 4px; font-family: Consolas,monospace; }
blockquote { border-left: 4px solid #dfe2e5; padding-left: 12px; color: #6a737d; margin: 0; }
table { border-collapse: collapse; } th,td { border: 1px solid #dfe2e5; padding: 6px 10px; }
a { color: #0366d6; }
</style>
</head>
<body>
${html.value}
</body>
</html>`
  w.document.open()
  w.document.write(doc)
  w.document.close()
}
</script>

<style scoped>
.tool-panel .md-input {
  min-height: 220px;
  flex: 1;
}

.md-preview {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--bg-panel);
  padding: 16px 18px;
  flex: 1;
  min-height: 200px;
  overflow: auto;
}

.markdown-body :deep(h1), .markdown-body :deep(h2) {
  border-bottom: 1px solid var(--border);
  padding-bottom: 4px;
  margin: 12px 0 8px;
}

.markdown-body :deep(h1) { font-size: 22px; }
.markdown-body :deep(h2) { font-size: 18px; }
.markdown-body :deep(h3) { font-size: 15px; }
.markdown-body :deep(p) { margin: 8px 0; }
.markdown-body :deep(ul), .markdown-body :deep(ol) { padding-left: 22px; margin: 8px 0; }
.markdown-body :deep(code) {
  background: var(--bg-hover);
  padding: 2px 5px;
  border-radius: 4px;
  font-family: var(--mono);
  font-size: 12px;
}
.markdown-body :deep(pre) {
  background: var(--bg-hover);
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  overflow: auto;
  margin: 8px 0;
}
.markdown-body :deep(pre code) {
  background: transparent;
  padding: 0;
}
.markdown-body :deep(a) { color: var(--primary); }
.markdown-body :deep(blockquote) {
  border-left: 3px solid var(--border);
  padding-left: 10px;
  color: var(--text-secondary);
  margin: 8px 0;
}
.markdown-body :deep(table) {
  border-collapse: collapse;
  margin: 8px 0;
}
.markdown-body :deep(th), .markdown-body :deep(td) {
  border: 1px solid var(--border);
  padding: 5px 9px;
}

.empty-hint {
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
}
</style>
