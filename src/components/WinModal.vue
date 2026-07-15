<template>
  <div class="win-modal">
    <div class="win-modal__backdrop" @click="emitClose"></div>
    <div class="win-modal__panel" role="dialog" aria-modal="true">
      <button class="win-modal__close" type="button" @click="emitClose">×</button>
      <img class="win-modal__image" :src="winImage" alt="Win banner" />
      <div class="win-modal__amount">
        <span class="win-modal__currency">NGN</span>
        <span class="win-modal__value">{{ formattedAmount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import winImage from '@/assets/images/win.jpeg'

const props = defineProps({
  amount: {
    type: [Number, String],
    default: 0
  },
  currency: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['close'])

const formattedAmount = computed(() => {
  const numeric = Number(props.amount || 0)
  if (!Number.isFinite(numeric)) return '0.00'
  return numeric.toLocaleString('en')
})

const emitClose = () => {
  emit('close')
}
</script>

<style scoped>
.win-modal {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.win-modal__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
}

.win-modal__panel {
  position: relative;
  width: min(90vw, 360px);
  border-radius: 18px;
  overflow: hidden;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
  z-index: 1;
}

.win-modal__image {
  display: block;
  width: 100%;
  height: auto;
}

.win-modal__amount {
  position: absolute;
  left: 50%;
  bottom: 22px;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.65);
  color: #ffffff;
  /* padding: 10px 18px; */
  /* border-radius: 999px; */
  font-family: 'Roboto-Bold';
  font-size: 1.7rem;
  font-weight: bold;
  /* letter-spacing: 0.08rem; */
  /* display: flex; */
  /* gap: 6px; */
  /* align-items: baseline; */
  color: greenyellow
}

.win-modal__currency {
  font-size: 1.1rem;
  opacity: 0.85;
}

.win-modal__close {
  position: absolute;
  right: 10px;
  top: 8px;
  background: rgba(0, 0, 0, 0.55);
  border: none;
  color: #ffffff;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
}
</style>
