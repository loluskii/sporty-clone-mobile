<template>
  <div id="bonus-progress-bar" class="real-theme">
    <div class="progress" :style="`width: ${progressWidth}%`"></div>
    <p>{{ bonusMessage }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { countAccaBonusQualifyingLegs, normalizeAccaBonusConfig } from '@/helpers'
import { useCouponStore, useUtilsStore } from '@/stores'

const couponStore = useCouponStore()
const utilsStore = useUtilsStore()

const accaBonusConfig = computed(() => {
  return normalizeAccaBonusConfig(utilsStore.SportsbookFeatureConfig?.accaBonus)
})

const qualifyingLegs = computed(() => {
  return countAccaBonusQualifyingLegs(
    couponStore.coupon.selections,
    accaBonusConfig.value.minOddsPerLeg
  )
})

const maxTierLegs = computed(() => {
  const tiers = accaBonusConfig.value.tiers
  if (!tiers.length) return 1
  return tiers[tiers.length - 1].legs
})

const nextTier = computed(() => {
  return accaBonusConfig.value.tiers.find((tier) => tier.legs > qualifyingLegs.value) || null
})

const progressWidth = computed(() => {
  return Math.min(100, Math.max(0, (qualifyingLegs.value / maxTierLegs.value) * 100))
})

const bonusMessage = computed(() => {
  if (!accaBonusConfig.value.enabled) {
    return 'ACCA bonus is currently unavailable'
  }

  if (!nextTier.value) {
    return 'Highest ACCA bonus unlocked'
  }

  const legsNeeded = Math.max(0, nextTier.value.legs - qualifyingLegs.value)
  const label = legsNeeded === 1 ? 'selection' : 'selections'
  return `Add ${legsNeeded} more qualifying ${label} to unlock ${nextTier.value.percentage}% bonus`
})
</script>
<style>
#bonus-progress-bar {
  border-radius: 8.5px;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  font-family: Roboto;
  font-size: 12px;
  position: relative;
  text-align: center;
  white-space: nowrap;
  width: calc(100% - 30px);
  margin: auto;
  margin-bottom: 20px;
}
#bonus-progress-bar p {
  position: relative;
}
@media only screen and (min-width: 320px) and (max-width: 359px),
  only screen and (max-width: 320px) {
  #bonus-progress-bar p {
    -webkit-transform: scale(0.8);
    -ms-transform: scale(0.8);
    transform: scale(0.8);
    -webkit-transform-origin: center;
    -ms-transform-origin: center;
    transform-origin: center;
  }
}
@media only screen and (min-width: 360px) and (max-width: 375px) {
  #bonus-progress-bar p {
    -webkit-transform: scale(0.9);
    -ms-transform: scale(0.9);
    transform: scale(0.9);
    -webkit-transform-origin: center;
    -ms-transform-origin: center;
    transform-origin: center;
  }
}
#bonus-progress-bar .progress {
  border-radius: 8.5px;
  height: 100%;
  left: 0;
  position: absolute;
  top: 0;
  -webkit-transition: width 0.2s ease;
  transition: width 0.2s ease;
}
#bonus-progress-bar .progress.with-opacity {
  opacity: 70%;
}
#bonus-progress-bar.real-theme {
  background-color: #ECF2FE;
  /* color: v; */
  color: var(--brand-secondary);
}
#bonus-progress-bar.real-theme .progress {
  background-color: rgba(13, 151, 55, 0.5);
  background-color: var(--brand-primary);
  opacity: 0.3;
}
#bonus-progress-bar.sim-theme {
  background-color: rgba(250, 253, 0, 0.2);
  color: #9ca0ab;
}
#bonus-progress-bar.sim-theme .progress {
  background-color: #fafd00;
}
</style>
