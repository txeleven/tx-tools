<template>
  <div class="lines-box">
    <div class="lines-gutter" aria-hidden="true">{{ gutter }}</div>
    <div class="lines-body"><slot /></div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  text: { type: String, default: '' },
})

const gutter = computed(() => {
  const n = props.text ? props.text.split('\n').length : 0
  let s = ''
  for (let i = 1; i <= n; i++) s += (i > 1 ? '\n' : '') + i
  return s
})
</script>
