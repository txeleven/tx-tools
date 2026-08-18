// 通用工具函数组合式 API：toast 提示
import { reactive } from 'vue'

const toastState = reactive({
  visible: false,
  message: '',
  timer: null,
})

export function useToast() {
  function show(message) {
    toastState.message = message
    toastState.visible = true
    clearTimeout(toastState.timer)
    toastState.timer = setTimeout(() => {
      toastState.visible = false
    }, 1500)
  }
  return { toastState, show }
}

// 全局 Toast 组件需要的状态
export { toastState }
