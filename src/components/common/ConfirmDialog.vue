<template>
  <teleport to="body">
    <transition name="confirm-fade">
      <div v-if="confirmState.visible" class="confirm-mask" @click.self="cancel">
        <div class="confirm-dialog" role="dialog" aria-modal="true">
          <div class="confirm-title">{{ confirmState.title || t('common.confirmTitle') }}</div>
          <div class="confirm-message">{{ confirmState.message }}</div>
          <div class="confirm-actions">
            <button class="confirm-btn cancel" @click="cancel">{{ t('common.cancel') }}</button>
            <button class="confirm-btn ok" @click="ok">{{ t('common.confirm') }}</button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup>
import { confirmState, resolveConfirm } from '../../utils/useConfirm.js'
import { t } from '../../i18n/index.js'

function ok() {
  resolveConfirm(true)
}

function cancel() {
  resolveConfirm(false)
}
</script>

<style scoped>
.confirm-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.confirm-dialog {
  width: 340px;
  max-width: calc(100vw - 40px);
  background: var(--bg-panel);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  padding: 18px 20px 16px;
}

.confirm-title {
  font-size: 15px;
  font-weight: 700;
  margin-bottom: 10px;
  color: var(--text);
}

.confirm-message {
  font-size: 13px;
  line-height: 1.6;
  color: var(--text-secondary);
  margin-bottom: 18px;
  white-space: pre-wrap;
  word-break: break-all;
}

.confirm-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.confirm-btn {
  padding: 7px 18px;
  font-size: 13px;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
  background: var(--bg-panel);
  color: var(--text);
  cursor: pointer;
}

.confirm-btn:hover {
  border-color: var(--primary);
  color: var(--primary);
}

.confirm-btn.ok {
  background: var(--primary);
  border-color: var(--primary);
  color: #fff;
  font-weight: 600;
}

.confirm-btn.ok:hover {
  background: var(--primary-hover);
  border-color: var(--primary-hover);
  color: #fff;
}

.confirm-fade-enter-active,
.confirm-fade-leave-active {
  transition: opacity 0.15s ease;
}

.confirm-fade-enter-active .confirm-dialog,
.confirm-fade-leave-active .confirm-dialog {
  transition: transform 0.15s ease;
}

.confirm-fade-enter-from,
.confirm-fade-leave-to {
  opacity: 0;
}

.confirm-fade-enter-from .confirm-dialog,
.confirm-fade-leave-to .confirm-dialog {
  transform: scale(0.94);
}
</style>
