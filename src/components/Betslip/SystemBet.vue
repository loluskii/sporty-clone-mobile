<template>
 <div class="m-betslips-stake-wrapper">
    <div class="m-betslips-stake" style="padding-bottom: 5px;">
      <StakeInput 
        title="Play All"
        :stake="playAllStake"
        :bet-slip-type="betSlipType"
        :can-edit="true"
        :tabindex="-1"
        :sync-all="true"
      />

      <StakeInput 
        :title="displayComboName(combo.Grouping)"
        :stake="combo.Stake"
        :bet-slip-type="betSlipType"
        :can-edit="true"
        :tabindex="c"
        :combo="combo"
        v-for="(combo, c) in visibleCombos"
      />

    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  betSlipType: String,
  betType: String,
});
import { computed } from "vue";

import { useCouponStore } from "@/stores";
import { displayComboName } from "@/helpers/utils";

import StakeInput from "./StakeInput.vue";

const couponStore = useCouponStore();

const coupon = computed(() => {
  return couponStore.coupon
})

const visibleCombos = computed(() => {
  const combos = coupon.value.combos || []
  return combos.filter((combo) => Number(combo?.Combinations ?? combo?.combinations ?? 0) > 0)
})

const playAllStake = computed(() => {
  const combos = visibleCombos.value
  if (!combos.length) return coupon.value.totalStake
  const firstStake = combos[0]?.Stake
  const allSame = combos.every((combo) => combo?.Stake === firstStake)
  return allSame ? firstStake : ''
})


</script>
<style>
</style>
