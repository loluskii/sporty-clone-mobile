<template>
  <button
    type="button"
    class="mode-toggle"
    :class="{ 'is-sim': couponStore.betslipMode }"
    role="switch"
    :aria-checked="couponStore.betslipMode"
    @click="toggleMode"
  >
    <span class="mode-label mode-label--real">REAL</span>
    <span class="mode-label mode-label--sim">SIM</span>
    <span class="mode-thumb">
      {{ couponStore.betslipMode ? 'SIM' : 'REAL' }}
    </span>
  </button>
</template>
<script setup>
import { useCouponStore } from '@/stores'

const couponStore = useCouponStore()
const toggleMode = () => {
  // Use store action to keep minimum stake in sync when toggling mode.
  couponStore.setBetslipMode(couponStore.betslipMode ? 'real' : 'sim')
}
</script>
<style scoped>
.mode-toggle {
  align-items: center;
  background: linear-gradient(135deg, #1b1e25, #353a45);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 999px;
  color: #ffffff;
  cursor: pointer;
  display: grid;
  font-family: 'Anton', serif;
  font-size: 12px;
  grid-template-columns: 1fr 1fr;
  height: 30px;
  letter-spacing: 0.6px;
  overflow: hidden;
  padding: 0 6px;
  position: relative;
  width: 160px;
}

.mode-toggle::before {
  background: repeating-linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.08),
    rgba(255, 255, 255, 0.08) 6px,
    transparent 6px,
    transparent 12px
  );
  content: '';
  inset: 0;
  position: absolute;
}

.mode-label {
  position: relative;
  text-align: center;
  z-index: 1;
}

.mode-label--real {
  color: #e6f7ec;
}

.mode-label--sim {
  color: #fff2a6;
}

.mode-thumb {
  align-items: center;
  background: var(--brand-active-tab-bg);
  border-radius: 999px;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.35);
  color: #ffffff;
  display: flex;
  height: 24px;
  justify-content: center;
  left: 4px;
  position: absolute;
  top: 2px;
  transition: transform 0.2s ease;
  width: 76px;
  z-index: 2;
}

.mode-toggle.is-sim .mode-thumb {
  background: var(--sim-primary);
  color: #1b1e25;
  transform: translateX(74px);
}
</style>
