<template>
    <div class="m-input-keyboard-wrapper m-input mg-b-10">
      <div class="m-input-wrapper">
        <span>
          {{ title }}
        </span>
        
        <span class="text-right" v-if="combo">{{ combo.Combinations }}x</span>
        
        <span class="currency"><em>{{
          SportsbookGlobalVariable.Currency
            }}</em></span>
        <span 
          :tabindex="tabindex"
          type="textx" 
          disabled 
          class="m-keybord-input multiple-stake-input" 
          v-html="displayStake"
          v-if="canEdit"
          @click="toggleKeyboard">
        </span>
        <span v-else type="texts" class="text-right">{{ stake }}</span>
      </div>
      <div v-if="balanceLowerThanStake" class="m-error-info">
        <p>You need a balance of {{
          SportsbookGlobalVariable.Currency
        }} {{ betlistStake }} to place this bet. Please deposit an additional
          {{ amountNeededToStake }}</p>
        <p @click.prevent="goToDeposit" class="m-deposit-link-wrapper">
          <a class="m-deposit-link">
            <span>Go to Deposit</span>
          </a> <i class="arrow-right"></i>
        </p>
      </div>
      <BetlistStakeKeyboard :keyboard-visible="keyboardVisible" @button-click="onKeyClick"></BetlistStakeKeyboard>
    </div>

</template>

<script setup>
import BetlistStakeKeyboard from "./BetlistStakeKeyboard.vue";
import { computed } from "vue";

import { useCouponStore, useUsersStore, useUtilsStore } from "@/stores";
import { formatNumber } from "@/helpers";

import { useRouter } from "vue-router";

const props = defineProps({
  title: String,
  combination: Number,
  stake: [Number, String],
  canEdit: Boolean,
  tabindex: Number,
  betSlipType: String,
  combo: Object,
  syncAll: Boolean,
});

const userStore = useUsersStore();
const couponStore = useCouponStore();
const { SportsbookGlobalVariable } = useUtilsStore();
const {coupon} = couponStore;

const router = useRouter();
const keyboardKey = computed(() => {
  if (props.combo && props.combo.Grouping !== undefined) {
    return `combo:${props.combo.Grouping}`
  }
  return `system:${props.title || 'all'}`
})

const keyboardVisible = computed(() => {
  return couponStore.activeKeyboardKey === keyboardKey.value
})

const emit = defineEmits(["toggle-betslip"]);

const betlistStake = computed(() => {
  return coupon.totalStake;
});

const balanceLowerThanStake = computed(() => {
  return userStore.currentUser && betlistStake.value > userStore.currentUser?.sportBonusBalance && betlistStake.value > userStore.currentUser?.availableBalance
})

const amountNeededToStake = computed(() => {
  let bal = betlistStake.value - userStore.currentUser?.availableBalance
  return `${SportsbookGlobalVariable.Currency} ${formatNumber(bal)}`;
})

const minStake = computed(() => {
  const raw = props.betSlipType === 'Combo'
    ? SportsbookGlobalVariable.comboMinStake
    : SportsbookGlobalVariable.singleMinStake
  return Number(raw || 0)
})

const maxStake = computed(() => {
  const raw = props.betSlipType === 'Combo'
    ? SportsbookGlobalVariable.comboMaxStake
    : SportsbookGlobalVariable.singleMaxStake
  return Number(raw || 0)
})

const displayStake = computed(() => {
  const numericStake = Number(props.stake)
  if (!Number.isFinite(numericStake) || numericStake === 0) {
    return ''
  }
  return props.stake
})

const goToDeposit = () => {
  emit("toggle-betslip");
  return router.push({ name: 'account-deposit' })
}

const updateStake = (stake) => {
  if (stake === '') {
    // Clearing should set stake to 0, not snap back to a minimum.
    if (props.betSlipType === 'Combo') {
      const targetCombo = props.syncAll ? null : props.combo
      return couponStore.updateComboWinnings(0, targetCombo)
    }
    return couponStore.updateWinnings({
      stake: 0,
      id: "all",
    })
  }
  const parsed = Number(stake)
  // Only clamp when min/max stakes are actually configured (> 0); otherwise allow free input.
  let normalized = Number.isFinite(parsed) ? parsed : 0
  const minValue =
    Number.isFinite(minStake.value) && Number(minStake.value) > 0 ? Number(minStake.value) : null
  const maxValue =
    Number.isFinite(maxStake.value) && Number(maxStake.value) > 0 ? Number(maxStake.value) : null
  if (!Number.isFinite(normalized)) {
    normalized = minValue ?? 0
  }
  if (minValue !== null && normalized < minValue) {
    normalized = minValue
  }
  if (maxValue !== null && normalized > maxValue) {
    normalized = maxValue
  }
  // coupon.stake = stake;
  if(props.betSlipType === 'Combo') {
    const targetCombo = props.syncAll ? null : props.combo
    return couponStore.updateComboWinnings(normalized, targetCombo);
  } else {
    return couponStore.updateWinnings({
      stake: normalized,
      id: "all",
    });
  }
};

const toggleKeyboard = () => {
  const nextKey = keyboardVisible.value ? null : keyboardKey.value
  couponStore.setActiveKeyboardKey(nextKey)
};

function onKeyClick(type, value) {
  let stake = props.stake?.toString() || '';
  let finalStake;
  switch (type) {
    case "number":
      // Append clicked number to the display
      if (stake.length < 7) {
        if (typeof value === "number") {
          if (stake === "") {
            finalStake = value;
          } else {
            finalStake = parseFloat(stake) + value;
          }
        } else {
          finalStake = stake + value;
        }
        updateStake(finalStake);
      }
      break;
    case "dot":
      // Append dot to the display
      if (stake.length < 6 && !stake.includes(".")) {
        stake += ".";
        updateStake(stake);
      }
      break;
    case "double-zero":
      // Append double zero to the display
      if (stake.length < 6) {
        stake += "00";
        updateStake(stake);
      }
      break;
    case "clear":
      // Clear the display
      stake = "";
      updateStake(stake);
      break;
    case "delete":
      // Remove the last character from the display
      stake = stake.toString().slice(0, -1);
      updateStake(stake);
      break;
    case "done":
      // Handle the "Done" button click if needed
      couponStore.setActiveKeyboardKey(null)
      break;
    // Add more cases for other button types if necessary
  }
}

</script>
<style>
</style>
