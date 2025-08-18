<template>
 <div class="m-betslips-stake-wrapper">
    <div class="m-betslips-stake" style="padding-bottom: 5px;">
      <StakeInput 
        title="Play All"
        :stake="betlistStake"
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
import { computed, ref } from "vue";

import { useCouponStore, useUsersStore, useUtilsStore } from "@/stores";
import { displayComboName } from "@/helpers/utils";

const userStore = useUsersStore();
import { useRouter } from "vue-router";
import StakeInput from "./StakeInput.vue";

const { coupon } = useCouponStore();
const { SportsbookGlobalVariable } = useUtilsStore();
const router = useRouter();
const keyboardVisible = ref(false);

const emit = defineEmits(["toggle-betslip"]);

const betlistStake = computed(() => {
  return coupon.totalStake;
});

const balanceLowerThanStake = computed(() => {
  return userStore.currentUser && betlistStake.value > userStore.currentUser?.sportBonusBalance && betlistStake.value > userStore.currentUser?.availableBalance
})

const amountNeededToStake = computed(() => {
  let bal = betlistStake.value - userStore.currentUser?.availableBalance
  return `${SportsbookGlobalVariable.CurrencyCode} ${formatNumber(bal)}`;
})

const goToDeposit = () => {
  emit("toggle-betslip");
  return router.push({ name: 'account-deposit' })
}

const toggleKeyboard = () => {
  keyboardVisible.value = !keyboardVisible.value;
};

</script>
<style>
</style>