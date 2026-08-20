<template>
  <div class="tool-panel">
    <div class="tool-header">
      <div class="tool-title">{{ t('tools.stringCodec.name') }}</div>
      <div class="tool-desc">{{ t('tools.stringCodec.desc') }}</div>
    </div>

    <!-- 编码转换 -->
    <div class="toolbar">
      <button class="info" @click="encodeBase64">{{ t('stringCodec.base64Encode') }}</button>
      <button @click="decodeBase64">{{ t('stringCodec.base64Decode') }}</button>
      <button @click="encodeUrl">{{ t('stringCodec.urlEncode') }}</button>
      <button @click="decodeUrl">{{ t('stringCodec.urlDecode') }}</button>
      <span class="spacer"></span>
      <button @click="clear">🗑 {{ t('common.clear') }}</button>
    </div>

    <div class="toolbar">
      <button @click="encodeHtml">{{ t('stringCodec.htmlEncode') }}</button>
      <button @click="decodeHtml">{{ t('stringCodec.htmlDecode') }}</button>
      <label class="check-line">
        <input type="checkbox" v-model="allEntities" /> {{ t('html.allEntities') }}
      </label>
      <button @click="unicodeEscape">{{ t('stringCodec.unicodeEscape') }}</button>
      <button @click="unicodeUnescape">{{ t('stringCodec.unicodeUnescape') }}</button>
      <button @click="rot13">{{ t('stringCodec.rot13') }}</button>
      <button @click="rot47">{{ t('stringCodec.rot47') }}</button>
      <button @click="toHex">{{ t('stringCodec.toHex') }}</button>
      <button @click="fromHex">{{ t('stringCodec.fromHex') }}</button>
      <button @click="toBinary">{{ t('stringCodec.toBinary') }}</button>
      <button @click="fromBinary">{{ t('stringCodec.fromBinary') }}</button>
      <span class="spacer"></span>
    </div>

    <!-- 字符处理 -->
    <div class="toolbar">
      <button @click="reverseText">{{ t('stringCodec.reverse') }}</button>
      <button @click="toAscii">{{ t('stringCodec.toAscii') }}</button>
      <button @click="fromAscii">{{ t('stringCodec.fromAscii') }}</button>
      <button @click="morseEncode">{{ t('stringCodec.morseEncode') }}</button>
      <button @click="morseDecode">{{ t('stringCodec.morseDecode') }}</button>
      <span class="spacer"></span>
    </div>

    <!-- 代码美化 / 压缩 -->
    <div class="toolbar">
      <span class="toolbar-label">{{ t('beautify.language') }}</span>
      <select v-model="lang" class="lang-select">
        <option v-for="opt in langOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
      </select>
      <button class="primary" @click="beautify">{{ t('beautify.run') }}</button>
      <button class="primary"  @click="minify">{{ t('minify.run') }}</button>
      <button class="primary" :disabled="!input" @click="copyInput">{{ t('common.copy') }}</button>
    </div>

    <div class="codec-area" :class="{ expanded }">
      <button class="expand-btn" @click="expanded = !expanded" :title="t(expanded ? 'common.restore' : 'common.expand')">
        {{ expanded ? '⤡' : '⤢' }}
      </button>
      <HlTextarea v-model="input" :language="lang" :placeholder="t('stringCodec.placeholder')" fill />
    </div>

    <div class="status" :class="statusClass" v-if="status">{{ status }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import beautifyPkg from 'js-beautify'
import { formatSql, formatXml } from '../tools/formatSqlXml.js'
import { formatPython } from '../tools/formatPython.js'
import { minifyJs, minifyCss, minifyHtml } from '../tools/minifyCode.js'
import { minifyPhp } from '../tools/minifyPhp.js'
import { minifyPython } from '../tools/minifyPython.js'
import { formatPhp } from '../tools/syntaxHighlight.js'
import { encodeHtml as encodeHtmlEntity, decodeHtml as decodeHtmlEntity } from '../tools/html.js'
import { copyText } from '../utils/clipboard.js'
import { useToast } from '../utils/useToast.js'
import { t } from '../i18n/index.js'
import HlTextarea from './common/HlTextarea.vue'

const jsBeautify = beautifyPkg.js
const cssBeautify = beautifyPkg.css
const htmlBeautify = beautifyPkg.html

const MINIFY_LANGS = ['js', 'css', 'html', 'php', 'python']

const input = ref('')
const lang = ref('js')
const allEntities = ref(false)
const status = ref('')
const statusClass = ref('')
// 放大覆盖（把左边侧边栏和顶部都盖住，非浏览器全屏）
const expanded = ref(false)

// Esc 退出放大模式
function onKeydown(e) {
  if (e.key === 'Escape' && expanded.value) expanded.value = false
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onBeforeUnmount(() => window.removeEventListener('keydown', onKeydown))

const { show } = useToast()

const langOptions = [
  { value: 'js', label: t('beautify.js') },
  { value: 'css', label: t('beautify.css') },
  { value: 'html', label: t('beautify.html') },
  { value: 'sql', label: t('beautify.sql') },
  { value: 'xml', label: t('beautify.xml') },
  { value: 'php', label: t('beautify.php') },
  { value: 'python', label: t('beautify.python') },
]

function setStatus(msg, cls = 'ok') {
  status.value = msg
  statusClass.value = cls
}

function clear() {
  input.value = ''
  status.value = ''
}

function encodeBase64() {
  try {
    input.value = btoa(unescape(encodeURIComponent(input.value)))
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function decodeBase64() {
  try {
    input.value = decodeURIComponent(escape(atob(input.value.trim())))
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidBase64')}`, 'err')
  }
}

function encodeUrl() {
  input.value = encodeURIComponent(input.value)
  setStatus(t('stringCodec.done'))
}

function decodeUrl() {
  try {
    input.value = decodeURIComponent(input.value.replace(/\+/g, ' '))
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidUrl')}`, 'err')
  }
}

function encodeHtml() {
  try {
    input.value = encodeHtmlEntity(input.value, { all: allEntities.value })
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function decodeHtml() {
  try {
    input.value = decodeHtmlEntity(input.value)
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function unicodeEscape() {
  input.value = Array.from(input.value)
    .map((ch) => {
      const code = ch.codePointAt(0)
      return code > 0xffff ? '\\u{' + code.toString(16) + '}' : '\\u' + code.toString(16).padStart(4, '0')
    })
    .join('')
  setStatus(t('stringCodec.done'))
}

function unicodeUnescape() {
  try {
    input.value = input.value.replace(/\\u\{([0-9a-fA-F]+)\}/g, (_, h) => String.fromCodePoint(parseInt(h, 16)))
      .replace(/\\u([0-9a-fA-F]{4})/g, (_, h) => String.fromCharCode(parseInt(h, 16)))
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidEscape')}`, 'err')
  }
}

function rot13() {
  input.value = input.value.replace(/[a-zA-Z]/g, (ch) => {
    const base = ch <= 'Z' ? 65 : 97
    return String.fromCharCode(((ch.charCodeAt(0) - base + 13) % 26) + base)
  })
  setStatus(t('stringCodec.done'))
}

// ROT47：对可见 ASCII 字符（33-126）整体位移 47 位
function rot47() {
  input.value = input.value.replace(/[\x21-\x7e]/g, (ch) => {
    const c = ch.charCodeAt(0)
    return String.fromCharCode(33 + ((c + 14) % 94))
  })
  setStatus(t('stringCodec.done'))
}

// 反转字符顺序
function reverseText() {
  input.value = Array.from(input.value).reverse().join('')
  setStatus(t('stringCodec.done'))
}

// 字符 → 十进制码点（空格分隔）
function toAscii() {
  input.value = Array.from(input.value)
    .map((ch) => ch.codePointAt(0))
    .join(' ')
  setStatus(t('stringCodec.done'))
}

// 十进制码点（空格分隔）→ 字符
function fromAscii() {
  try {
    const parts = input.value.trim().split(/\s+/)
    if (parts.length === 1 && parts[0] === '') throw new Error('empty')
    if (!parts.every((p) => /^\d+$/.test(p))) throw new Error('bad ascii')
    input.value = parts.map((p) => String.fromCodePoint(parseInt(p, 10))).join('')
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(t('stringCodec.invalidAscii'), 'err')
  }
}

// 摩斯码表
const MORSE = {
  a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
  i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
  q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
  y: '-.--', z: '--..',
  0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-', 5: '.....',
  6: '-....', 7: '--...', 8: '---..', 9: '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', "'": '.----.', '!': '-.-.--',
  '/': '-..-.', '(': '-.--.', ')': '-.--.-', '&': '.-...', ':': '---...',
  ';': '-.-.-.', '=': '-...-', '+': '.-.-.', '-': '-....-', '_': '..--.-',
  '"': '.-..-.', '$': '...-..-', '@': '.--.-.',
}

// 摩斯加密：字母间空格，单词间用 / 分隔
function morseEncode() {
  input.value = Array.from(input.value.toLowerCase())
    .map((ch) => {
      if (ch === ' ') return '/'
      return MORSE[ch] || ch
    })
    .join(' ')
  setStatus(t('stringCodec.done'))
}

// 摩斯解密
function morseDecode() {
  const reverse = Object.fromEntries(Object.entries(MORSE).map(([k, v]) => [v, k]))
  try {
    input.value = input.value
      .split(/\s*\/\s*/)
      .map((word) =>
        word
          .trim()
          .split(/\s+/)
          .map((code) => {
            if (code === '') return ''
            if (!(code in reverse)) throw new Error('bad morse')
            return reverse[code]
          })
          .join('')
      )
      .join(' ')
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(t('stringCodec.invalidMorse'), 'err')
  }
}

function toHex() {
  input.value = Array.from(input.value)
    .map((ch) => ch.codePointAt(0).toString(16).padStart(2, '0'))
    .join(' ')
  setStatus(t('stringCodec.done'))
}

function fromHex() {
  try {
    const hex = input.value.replace(/\s+/g, '')
    if (!/^[0-9a-fA-F]*$/.test(hex) || hex.length % 2 !== 0) throw new Error('bad hex')
    const bytes = hex.match(/.{2}/g).map((b) => parseInt(b, 16))
    input.value = bytes.map((b) => String.fromCharCode(b)).join('')
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidHex')}`, 'err')
  }
}

function toBinary() {
  input.value = Array.from(input.value)
    .map((ch) => ch.codePointAt(0).toString(2).padStart(8, '0'))
    .join(' ')
  setStatus(t('stringCodec.done'))
}

function fromBinary() {
  try {
    const bin = input.value.replace(/\s+/g, '')
    if (!/^[01]*$/.test(bin) || bin.length % 8 !== 0) throw new Error('bad bin')
    const bytes = bin.match(/.{8}/g).map((b) => parseInt(b, 2))
    input.value = bytes.map((b) => String.fromCharCode(b)).join('')
    setStatus(t('stringCodec.done'))
  } catch (e) {
    setStatus(`${t('stringCodec.invalidBinary')}`, 'err')
  }
}

function beautify() {
  let result
  try {
    switch (lang.value) {
      case 'js':
        result = jsBeautify(input.value, { indent_size: 2, space_in_empty_paren: true })
        break
      case 'css':
        result = cssBeautify(input.value, { indent_size: 2 })
        break
      case 'html':
        result = htmlBeautify(input.value, { indent_size: 2, preserve_newlines: true })
        break
      case 'sql':
        result = formatSql(input.value)
        break
      case 'xml':
        result = formatXml(input.value)
        break
      case 'php':
        result = formatPhp(input.value)
        break
      case 'python':
        result = formatPython(input.value)
        break
    }
    input.value = result
    setStatus(t('beautify.done'))
  } catch (e) {
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

function minify() {
  if (!MINIFY_LANGS.includes(lang.value)) {
    setStatus(t('minify.unsupported'), 'err')
    return
  }
  const before = input.value.length
  let result
  try {
    switch (lang.value) {
      case 'js':
        result = minifyJs(input.value)
        break
      case 'css':
        result = minifyCss(input.value)
        break
      case 'html':
        result = minifyHtml(input.value)
        break
      case 'php':
        result = minifyPhp(input.value)
        break
      case 'python':
        result = minifyPython(input.value)
        break
    }
    input.value = result
    if (before > 0) {
      const after = result.length
      const pct = Math.round((1 - after / before) * 100)
      setStatus(t('minify.saved', { size: `${pct}% (${before} → ${after})` }), 'info')
    } else {
      setStatus(t('minify.done'), 'info')
    }
  } catch (e) {
    setStatus(`${t('common.error')}: ${e.message}`, 'err')
  }
}

async function copyInput() {
  if (!input.value) return
  if (await copyText(input.value)) show(t('common.copied'))
}
</script>

<style scoped>
.tool-panel {
  height: 100%;
  min-height: 0;
}

.lang-select {
  width: 130px;
}

.toolbar-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-right: -6px;
}

/* 放大覆盖区域：默认占满剩余空间；放大时覆盖左边和顶部（非浏览器全屏） */
.codec-area {
  flex: 1 1 auto;
  min-height: 0;
  display: flex;
  flex-direction: column;
  position: relative;
}

.codec-area.expanded {
  position: fixed;
  inset: 0;
  z-index: 1000;
  background: var(--bg);
  padding: 16px;
}

.expand-btn {
  position: absolute;
  top: 10px;
  right: 12px;
  z-index: 5;
  width: 30px;
  height: 30px;
  padding: 0;
  font-size: 15px;
  line-height: 1;
  border-radius: var(--radius-sm);
  background: var(--bg-panel);
  opacity: 0.85;
}

.expand-btn:hover {
  opacity: 1;
  border-color: var(--primary);
  color: var(--primary);
}
</style>
