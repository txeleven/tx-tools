<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.lint.name') }}</div>
      <div class="tool-desc">{{ t('tools.lint.desc') }}</div>
    </div>

    <div class="toolbar">
      <select v-model="lang" class="lang-select">
        <option value="js">JavaScript</option>
        <option value="css">CSS</option>
        <option value="html">HTML</option>
        <option value="php">PHP</option>
        <option value="py">Python</option>
      </select>
      <button @click="runLint">{{ t('lint.run') }}</button>
      <button class="secondary" @click="clearAll">{{ t('common.clear') }}</button>
    </div>

    <LinedTextarea v-model="code" :placeholder="placeholder" min-height="200px" />

    <div v-if="issues.length" class="issues">
      <div class="issue-head">
        <span :class="['badge', severityClass]">{{ summary }}</span>
      </div>
      <div v-for="(issue, i) in issues" :key="i" class="issue" :class="issue.severity">
        <div class="issue-line">{{ t('lint.line') }} {{ issue.line }}</div>
        <div class="issue-msg">{{ issue.message }}</div>
        <code v-if="issue.snippet" class="issue-snippet">{{ issue.snippet }}</code>
      </div>
    </div>
    <div v-else-if="linted && !issues.length" class="status ok">{{ t('lint.clean') }}</div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { t } from '../i18n/index.js'
import LinedTextarea from './common/LinedTextarea.vue'

const lang = ref('js')
const code = ref('')
const issues = ref([])
const linted = ref(false)

const placeholder = computed(() => t(`lint.${lang.value}Placeholder`))

const severityClass = computed(() => {
  if (issues.value.some((i) => i.severity === 'error')) return 'err'
  if (issues.value.some((i) => i.severity === 'warn')) return 'warn'
  return 'ok'
})

const summary = computed(() => {
  const e = issues.value.filter((i) => i.severity === 'error').length
  const w = issues.value.filter((i) => i.severity === 'warn').length
  return t('lint.summary', { error: e, warn: w })
})

function clearAll() {
  code.value = ''
  issues.value = []
  linted.value = false
}

function addIssue(line, message, severity = 'warn', snippet = '') {
  issues.value.push({ line, message, severity, snippet })
}

function runLint() {
  issues.value = []
  linted.value = true
  const src = code.value
  if (!src.trim()) return
  const lines = src.split('\n')
  if (lang.value === 'js') lintJs(src, lines)
  else if (lang.value === 'css') lintCss(src, lines)
  else if (lang.value === 'html') lintHtml(src, lines)
  else if (lang.value === 'php') lintPhp(src, lines)
  else if (lang.value === 'py') lintPy(src, lines)
}

function lintJs(src, lines) {
  const declared = new Set()
  const used = new Map() // name -> line

  lines.forEach((line, idx) => {
    const ln = idx + 1
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('//')) return

    // == / !=
    if (/[^=!]==[^=]|[^=!]!=[^=]/.test(line)) {
      addIssue(ln, t('lint.eq'), 'warn', trimmed.slice(0, 80))
    }
    // var
    const varMatch = line.match(/\bvar\s+(\w+)/)
    if (varMatch) {
      addIssue(ln, t('lint.var'), 'warn', trimmed.slice(0, 80))
      declared.add(varMatch[1])
    }
    // let/const
    const declMatch = line.match(/\b(let|const)\s+(\w+)/)
    if (declMatch) declared.add(declMatch[2])

    // collect identifiers (rough)
    const ids = line.match(/\b[a-zA-Z_$][\w$]*\b/g) || []
    ids.forEach((id) => {
      if (['if', 'else', 'for', 'while', 'return', 'function', 'const', 'let', 'var', 'true', 'false', 'null', 'undefined', 'new', 'this', 'typeof', 'in', 'of'].includes(id)) return
      used.set(id, ln)
    })

    // trailing spaces
    if (/\s+$/.test(line)) addIssue(ln, t('lint.trailing'), 'warn')
    // console.log
    if (/console\.\w+\s*\(/.test(line)) addIssue(ln, t('lint.console'), 'warn', trimmed.slice(0, 80))
    // eval
    if (/\beval\s*\(/.test(line)) addIssue(ln, t('lint.eval'), 'error', trimmed.slice(0, 80))
  })

  // unused variables (declared but never used elsewhere)
  declared.forEach((name) => {
    if (!used.has(name) || (used.get(name) === findLine(lines, new RegExp(`\\b(var|let|const)\\s+${name}`)))) {
      const ln = findLine(lines, new RegExp(`\\b(var|let|const)\\s+${name}`))
      addIssue(ln, t('lint.unused', { name }), 'warn')
    }
  })

  // unclosed braces (rough)
  let brace = 0
  src.split('').forEach((ch) => {
    if (ch === '{') brace++
    if (ch === '}') brace--
  })
  if (brace !== 0) addIssue(lines.length, t('lint.brace'), 'error')
}

function lintCss(src, lines) {
  lines.forEach((line, idx) => {
    const ln = idx + 1
    const trimmed = line.trim()
    if (/\s+$/.test(line)) addIssue(ln, t('lint.trailing'), 'warn')
    if (/!important/i.test(line)) addIssue(ln, t('lint.important'), 'warn', trimmed.slice(0, 80))
    if (/{\s*$/.test(trimmed) && !/[.#\[]/.test(trimmed) && !/[a-z]\w*\s*\{/.test(trimmed)) {
      // ignore simple element selectors
    }
  })
}

function lintHtml(src, lines) {
  lines.forEach((line, idx) => {
    const ln = idx + 1
    const trimmed = line.trim()
    if (/\s+$/.test(line)) addIssue(ln, t('lint.trailing'), 'warn')
    // inline style
    if (/\sstyle\s*=/.test(line)) addIssue(ln, t('lint.inlineStyle'), 'warn', trimmed.slice(0, 80))
    // inline event
    if (/\son\w+\s*=/.test(line)) addIssue(ln, t('lint.inlineEvent'), 'warn', trimmed.slice(0, 80))
  })
  // tag balance rough check
  const openTags = (src.match(/<([a-z][a-z0-9]*)[^>]*?>/gi) || []).length
  const closeTags = (src.match(/<\/([a-z][a-z0-9]*)>/gi) || []).length
  if (openTags !== closeTags) addIssue(lines.length, t('lint.tagBalance'), 'warn')
}

const PHP_KEYWORDS = new Set([
  'if', 'else', 'elseif', 'endif', 'for', 'foreach', 'while', 'do', 'switch', 'case', 'default',
  'break', 'continue', 'return', 'function', 'class', 'interface', 'trait', 'new', 'extends',
  'implements', 'public', 'private', 'protected', 'static', 'const', 'namespace', 'use', 'require',
  'require_once', 'include', 'include_once', 'define', 'array', 'list', 'as', 'global', 'isset',
  'empty', 'unset', 'true', 'false', 'null', 'instanceof', 'try', 'catch', 'finally', 'throw',
  'echo', 'print', 'match', 'fn', 'readonly', 'enum', 'abstract', 'final', 'self', 'parent',
  'and', 'or', 'xor', 'clone', 'declare', 'yield', 'goto',
])

function lintPhp(src, lines) {
  let hasOpenTag = false
  const declared = new Set()
  const used = new Set()

  lines.forEach((line, idx) => {
    const ln = idx + 1
    const trimmed = line.trim()
    if (!trimmed) return

    if (/<\?php/.test(line)) hasOpenTag = true

    // short echo tag
    if (/<\?=/.test(line)) addIssue(ln, t('lint.noShortEcho'), 'warn', trimmed.slice(0, 80))

    // echo in production-ish
    if (/\becho\b/.test(line)) addIssue(ln, t('lint.echo'), 'warn', trimmed.slice(0, 80))

    // old-style array()
    if (/\barray\s*\(/.test(line)) addIssue(ln, t('lint.oldStyleArray'), 'warn', trimmed.slice(0, 80))

    // trailing spaces
    if (/\s+$/.test(line)) addIssue(ln, t('lint.trailing'), 'warn')

    // magic numbers (rough)
    ;(line.match(/\b\d+\b/g) || []).forEach((num) => {
      if (!['0', '1'].includes(num)) {
        addIssue(ln, t('lint.magicNumber', { num }), 'warn', trimmed.slice(0, 80))
      }
    })

    // variable variables $${name}
    if (/\$\$\w+/.test(line)) addIssue(ln, t('lint.varVars', { name: line.match(/\$\$(\w+)/)?.[1] || '' }), 'warn', trimmed.slice(0, 80))

    // declared variables ($name)
    ;(line.match(/\$([A-Za-z_]\w*)/g) || []).forEach((v) => {
      declared.add(v)
      const name = v.slice(1)
      // variable usage (if on right side of =)
      if (/\$[A-Za-z_]\w*\s*[,\);\s]/.test(line) || line.includes(v) && !new RegExp(`\\$\\s*${name}\\s*=`).test(line)) {
        used.add(v)
      }
    })
  })

  if (!hasOpenTag) addIssue(1, t('lint.phpTag'), 'warn')

  // unused variables (declared with $x = but never used elsewhere)
  declared.forEach((v) => {
    if (!used.has(v)) {
      const ln = findLine(lines, new RegExp('\\$' + v.slice(1).replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\s*='))
      addIssue(ln, t('lint.unusedVar', { name: v.slice(1) }), 'warn')
    }
  })

  // unclosed braces
  let brace = 0
  src.split('').forEach((ch) => {
    if (ch === '{') brace++
    if (ch === '}') brace--
  })
  if (brace !== 0) addIssue(lines.length, t('lint.brace'), 'error')
}

const PY_KEYWORDS = new Set([
  'if', 'elif', 'else', 'for', 'while', 'def', 'return', 'class', 'import', 'from', 'as',
  'try', 'except', 'finally', 'with', 'lambda', 'pass', 'break', 'continue', 'global', 'nonlocal',
  'yield', 'raise', 'assert', 'del', 'in', 'is', 'not', 'and', 'or', 'True', 'False', 'None',
])

function lintPy(src, lines) {
  const declared = new Set()
  const used = new Set()
  const indents = new Set()

  lines.forEach((line, idx) => {
    const ln = idx + 1
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) return

    // tab indentation
    if (/^\t/.test(line)) addIssue(ln, t('lint.tabIndent'), 'warn')

    // indentation level (spaces)
    if (/^ /.test(line)) indents.add(line.match(/^ */)[0].length)

    // trailing spaces
    if (/\s+$/.test(line)) addIssue(ln, t('lint.trailing'), 'warn')

    // print
    if (/\bprint\s*\(/.test(line)) addIssue(ln, t('lint.pyPrint'), 'warn', trimmed.slice(0, 80))

    // == None
    if (/==\s*None\b|\!=\s*None\b/.test(line)) addIssue(ln, t('lint.pyEq'), 'warn', trimmed.slice(0, 80))

    // bare except
    if (/except\s*:/.test(line)) addIssue(ln, t('lint.pyBareExcept'), 'warn', trimmed.slice(0, 80))

    // wildcard import
    if (/from\s+\S+\s+import\s+\*/.test(line)) addIssue(ln, t('lint.pyImportWildcard'), 'warn', trimmed.slice(0, 80))

    // declared vars: name = value (exclude keywords / imports)
    const declMatch = line.match(/(?:^|\s)([a-zA-Z_]\w*)\s*=(?!=)/)
    if (declMatch && !PY_KEYWORDS.has(declMatch[1])) declared.add(declMatch[1])

    // def with missing self (instance method)
    const defMatch = line.match(/\bdef\s+(\w+)\s*\(([^)]*)\)/)
    if (defMatch && !PY_KEYWORDS.has(defMatch[1])) {
      const params = defMatch[2].split(',').map((p) => p.trim())
      if (defMatch[1] !== '__init__' && params.length && params[0] !== 'self' && params[0] !== 'cls') {
        addIssue(ln, t('lint.pySelf'), 'warn', trimmed.slice(0, 80))
      }
    }

    // used identifiers
    ;(line.match(/\b[a-zA-Z_]\w*\b/g) || []).forEach((id) => {
      if (!PY_KEYWORDS.has(id) && id !== 'self' && id !== 'cls') used.add(id)
    })
  })

  // unused variables
  declared.forEach((name) => {
    if (!used.has(name)) {
      const ln = findLine(lines, new RegExp(`(^|\\s)${name}\\s*=(?!=)`))
      addIssue(ln, t('lint.pyUnused', { name }), 'warn')
    }
  })
}

function findLine(lines, re) {
  for (let i = 0; i < lines.length; i++) {
    if (re.test(lines[i])) return i + 1
  }
  return 1
}
</script>

<style scoped>
.lang-select {
  width: 130px;
}

.issues {
  margin-top: 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
}

.issue-head {
  padding: 8px 10px;
  background: var(--bg-hover);
  border-bottom: 1px solid var(--border);
}

.issue {
  padding: 8px 10px;
  border-bottom: 1px solid var(--border);
  font-size: 12.5px;
}

.issue:last-child {
  border-bottom: none;
}

.issue.error {
  border-left: 3px solid var(--danger);
  padding-left: 14px;
}

.issue.warn {
  border-left: 3px solid var(--warning);
  padding-left: 14px;
}

.issue-line {
  font-family: var(--mono);
  color: var(--text-secondary);
  margin-bottom: 2px;
}

.issue-msg {
  color: var(--text);
}

.issue-snippet {
  display: block;
  margin-top: 4px;
  padding: 4px 8px;
  background: var(--bg-panel);
  border-radius: 4px;
  font-family: var(--mono);
  white-space: pre-wrap;
  word-break: break-all;
}

.badge.err {
  color: var(--danger);
}
.badge.warn {
  color: var(--warning);
}
.badge.ok {
  color: var(--success);
}
</style>
