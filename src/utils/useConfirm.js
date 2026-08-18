// 通用确认弹窗：Promise 风格，替代原生 window.confirm
import { reactive } from 'vue'

const confirmState = reactive({
  visible: false,
  title: '',
  message: '',
  resolve: null,
})

function confirmDialog(message, options = {}) {
  confirmState.message = message
  confirmState.title = options.title || ''
  return new Promise((resolve) => {
    confirmState.resolve = resolve
    confirmState.visible = true
  })
}

function resolveConfirm(result) {
  if (confirmState.resolve) {
    confirmState.resolve(result)
    confirmState.resolve = null
  }
  confirmState.visible = false
}

export function useConfirm() {
  return { confirmState, confirmDialog, resolveConfirm }
}

export { confirmState, confirmDialog, resolveConfirm }
