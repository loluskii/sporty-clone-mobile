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
        v-for="(combo, c) in coupon.combos"
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

const playAllStake = computed(() => {
  const combos = coupon.value.combos || []
  if (!combos.length) return coupon.value.totalStake
  const firstStake = combos[0]?.Stake
  const allSame = combos.every((combo) => combo?.Stake === firstStake)
  return allSame ? firstStake : ''
})


</script>
<style>
</style>
