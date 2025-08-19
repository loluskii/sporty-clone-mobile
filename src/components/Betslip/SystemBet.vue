<template>
 <div class="m-betslips-stake-wrapper">
    <div class="m-betslips-stake" style="padding-bottom: 5px;">
      <StakeInput 
        title="Play All"
        :stake="betlistStake"
        :bet-slip-type="betSlipType"
        :can-edit="true"
        :tabindex="-1"
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

const { coupon } = useCouponStore();

const betlistStake = computed(() => {
  return coupon.totalStake;
});


</script>
<style>
</style>