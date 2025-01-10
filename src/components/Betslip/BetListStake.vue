<template>
  <div class="m-betslips-stake-wrapper">
    <div class="m-betslips-stake">
      <BetslipBonusBar v-if="parseFloat(maxBonus) > 0"></BetslipBonusBar>
      <div class="m-input-keyboard-wrapper m-input mg-b-10">
        <div class="m-input-wrapper">
          <span data-cms-key="total_stake">
            {{
              betSlipType !== "Multiple"
                ? "Stake per bet (" + selectionsLength + " bets)"
                : "Total Stake"
            }}
          </span>

          <span class="currency"
            ><em>{{ couponStore.SportsbookGlobalVariable.CurrencyCode }}</em></span
          >
          <span
            tabindex="0"
            type="text"
            disabled
            class="m-keybord-input multiple-stake-input"
            v-html="betlistStake"
            @click="toggleKeyboard"
          ></span>
        </div>
        <BetlistStakeKeyboard
          :keyboard-visible="keyboardVisible"
          @button-click="onKeyClick"
        ></BetlistStakeKeyboard>
      </div>

      <div class="total-odds mg-b-10" v-if="betSlipType === 'Multiple'">
        <span>Total Odds</span>
        <span>{{ totalOdds }}</span>
      </div>

      <div class="bonus mg-b-10">
        <span>Max Bonus</span>
        <span
          >{{ couponStore.SportsbookGlobalVariable.Currency }}
          {{ parseFloat(maxBonus).toFixed(2) }}</span
        >
      </div>

      <template v-if="taxEnabled">
        <div class="bonus mg-b-10">
          <span>Excise Tax</span>
          <span
            >{{ couponStore.SportsbookGlobalVariable.Currency }}
            {{ parseFloat(exciseTax).toFixed(2) }}</span
          >
        </div>

        <div class="bonus mg-b-10">
          <span>Withholding Tax</span>
          <span
            >{{ couponStore.SportsbookGlobalVariable.Currency }}
            {{ parseFloat(wthTax).toFixed(2) }}</span
          >
        </div>
      </template>

      <div
        v-if="userStore.currentUser && userStore.currentUser.sportBonusBalance > 0"
        class="bonus mg-b-10"
      >
        <span>Use Bonus</span>
        <div style="display: flex; align-items: center">
          <input
            type="checkbox"
            style="margin-right: 7px; accent-color: var(--brand-primary)"
            v-model="couponStore.coupon.useBonus"
            id=""
          />
          <span
            >{{ couponStore.SportsbookGlobalVariable.Currency }}
            {{ userStore.currentUser.sportBonusBalance }}</span
          >
        </div>
      </div>

      <div class="potential-win bold real-theme">
        <span data-cms-key="potential_win" data-cms-page="component_betslip"
          >Potential Win</span
        >
        <span>
          <span class="m-value">
            {{ couponStore.SportsbookGlobalVariable.Currency }}
            {{ formatNumber(potentialWin) }}
          </span>
        </span>
      </div>

      <div class="m-submit">
        <div
          class="place-bet bet-accept-change bet-disabled"
          v-if="!acceptedChanges"
          @click="handleAcceptChange"
        >
          <span>Accept Changes</span>
        </div>
        <template v-else>
          <div
            class="m-book-btn"
            :class="couponStore.coupon.totalStake < 100 ? 'bet-disabled' : ''"
            @click="book"
          >
            <div>Book Bet</div>
          </div>
          <div
            class="place-bet"
            :class="couponStore.coupon.totalStake < 100 ? 'bet-disabled' : ''"
            @click="placeBet"
          >
            <span>Place Bet</span>
            <div class="m-pay-num" v-if="totalStake != 0">
              <span>About to pay {{ totalStake }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useCouponStore, useUsersStore } from "../../stores";
import { formatNumber } from "../../helpers";
import BetslipBonusBar from "./BetslipBonusBar.vue";
import { computed, ref, onBeforeUnmount, onMounted } from "vue";
import { useRouter } from "vue-router";
import BetlistStakeKeyboard from "./BetlistStakeKeyboard.vue";
import emitter from "../../plugins/emitter";
// import placeBet2
defineProps({
  betSlipType: String,
  betType: String,
});
const couponStore = useCouponStore();
const userStore = useUsersStore();
const router = useRouter();
const emit = defineEmits(["toggle-show", "toggle-betslip", "book-bet"]);
const keyboardVisible = ref(false);

const updateStake = (stake) => {
  couponStore.coupon.stake = stake;
  return couponStore.updateWinnings({
    stake: stake,
    id: "all",
  });
};

const betlistStake = computed(() => {
  return couponStore.coupon.totalStake;
});

const acceptedChanges = computed(() => {
  return couponStore.coupon.acceptChanges;
});

const taxEnabled = computed(
  () => couponStore.SportsbookGlobalVariable.taxEnabled === "1"
);
const exciseTax = computed(() =>
  parseFloat(couponStore.SportsbookGlobalVariable.exciseTax || 0)
);
const wthTax = computed(() =>
  parseFloat(couponStore.SportsbookGlobalVariable.wthTax || 0)
); // Defaults to 0 if undefined

// Computed property for potential winnings
const potentialWin = computed(() => {
  const stake = betlistStake.value;
  const totalOdd = couponStore.coupon.totalOdds;

  if (taxEnabled.value) {
    let finalPayout = stake * totalOdds;

    if (exciseTax.value > 0) {
      const excise = stake * (exciseTax.value / 100);
      const stakeAfterTax = stake - excise;
      finalPayout = stakeAfterTax * totalOdd;
    }

    if (wthTax.value > 0) {
      // wth tax
      const witholdingTax = finalPayout * (wthTax.value / 100);
      finalPayout = finalPayout - witholdingTax;
    }
    return finalPayout;
  }

  const isSingleBet = betSlipType === "Single" && selectionsLength === 1;
  const isMultipleBet = betSlipType === "Multiple";

  return isMultipleBet || isSingleBet ? maxWin : `${minWin} ~ ${maxWin}`;
});

const toggleKeyboard = () => {
  keyboardVisible.value = !keyboardVisible.value;
};

const totalOdds = computed(() => {
  return formatNumber(couponStore.coupon.totalOdds);
});

const maxBonus = computed(() => {
  return couponStore.coupon.maxBonus;
});

const selectionsLength = computed(() => {
  return couponStore.coupon.selections.length;
});

const minWin = computed(() => {
  return formatNumber(couponStore.coupon.minWin);
});

const maxWin = computed(() => {
  return formatNumber(couponStore.coupon.maxWin);
});

const totalStake = computed(() => {
  return couponStore.coupon.totalStake === ""
    ? 0.0
    : formatNumber(couponStore.coupon.totalStake);
});

async function book(e) {
  try {
    if (totalStake.value < 1) {
      return;
    }

    e.target.classList.add("loading-icon");
    couponStore.isBetslipBooking = true;

    const res = await couponStore.placeBet(e, "book");
    couponStore.isBetslipBooking = false;
    e.target.classList.remove("loading-icon");

    if (res.success) {
      emit("book-bet", res);
    } else {
      // Handle error display or other actions as needed
      emit("toggle-betslip");
      emitter.emit("showErrorMessage", res.message);
    }
  } catch (error) {
    emit("toggle-betslip");
    // Handle error display or other actions as needed
    emitter.emit("showErrorMessage", error);
  }
}

function placeBet() {
  if (!userStore.currentUser) {
    emit("toggle-betslip");
    return router.push({ name: "sign-in" });
  }
  emit("toggle-show");
}

function onKeyClick(type, value) {
  let stake = betlistStake.value.toString();
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
      keyboardVisible.value = false;
      break;
    // Add more cases for other button types if necessary
  }
}

const handleAcceptChange = () => {
  couponStore.coupon.acceptChanges = true;
  couponStore.coupon.selections.forEach((selection) => {
    if (selection.suspended && selection.unavailable) {
      let element_id = selection.element_id;
      couponStore.removeSelection(element_id);
      return couponStore.updateWinnings({
        stake: couponStore.coupon.totalStake,
        id: selection.selectionId,
      });
    } else if (selection.changed) {
      selection.changed = false;
    }
  });
};

onMounted(() => {
  couponStore.updateWinnings({
    stake: betlistStake.value,
  });
});
</script>
<style>
.m-bet-detail-wrap {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  max-height: calc(94% - 25.5%);
  overflow: auto;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper {
  font-weight: 500;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .bold {
  font-weight: bold;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .change-wrong-message {
  background: #7b0911;
  background: var(--warning-secondary);
  color: #ffffff;
  height: 1.83333333rem;
  line-height: 1.83333333rem;
  padding-left: 1.25rem;
  text-align: center;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake {
  background-color: #ffffff;
  border-top: 0.16666667rem solid #eaecef;
  display: block;
  font-size: 1.066rem;
  overflow-x: hidden;
  padding-bottom: 5rem;
  padding-top: 0.83333333rem;
  position: relative;
  border-color: #eaecef;
  border-color: var(--brand-border-type1);
  color: #353a45;
  color: var(--text-type1-primary);
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake > div {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  padding: 0 1.33333333rem;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  > div.alternative-bet-active-content-panel {
  display: initial;
  padding: 0;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake > div > span {
  display: block;
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake > div > span:last-child {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  padding-left: 10px;
  text-align: right;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .alternative-bet-type-option {
  margin-left: -1.33333333rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake > .confirm-wrap {
  padding: 0;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .total-stake,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .bonus,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .total-odds,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .still-win {
  height: 2.25rem;
  line-height: 2.25rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .to-win {
  margin: 0 0.66666667rem;
  padding: 6px 0.66666667rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win .m-value,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .to-win .m-value {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: inline-block;
  padding: 0.08333333rem 0.25rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win .is--boost,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .to-win .is--boost {
  background: -webkit-gradient(linear, left top, right top, from(#40208c), to(#1e0e53));
  background: -webkit-linear-gradient(left, #40208c, #1e0e53);
  background: linear-gradient(to right, #40208c, #1e0e53);
  background: var(--background-flash-odds);
  color: #ffffff;
  line-height: 1.66666667rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win.real-theme,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .to-win.real-theme {
  background-color: rgba(13, 151, 55, 0.2);
  background-color: var(--c-betslip-to-win-bg);
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .flex {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .one-cut-text-gap {
  gap: 0.25rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win.real-theme {
  background-color: #f2f2f2;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .total-stake,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .total-odds,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .bonus {
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .still-win
  .label-with-img {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  gap: 0.25rem;
  vertical-align: middle;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .mg-t-10 {
  margin-top: 10px;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .message-tip {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background: #3685e2;
  font-size: 1rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  line-height: 2rem;
  z-index: 0;
}
@media only screen and (max-width: 320px) {
  .m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .message-tip {
    font-size: 0.75rem;
  }
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .message-tip svg {
  color: #ffffff;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .alternative-bet-type-option {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.066rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  margin-left: -1.33333333rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-input {
  display: block;
  padding: 0;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .full-screen-mask {
  background-color: rgba(0, 0, 0, 0.7);
  height: 100vh;
  left: 0;
  padding: 0;
  position: fixed;
  top: 0;
  width: 100vw;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit {
  bottom: 0;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  padding: 0 0 env(safe-area-inset-bottom) 0;
  position: fixed;
  width: 100%;
  z-index: 1;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .m-book-icon,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .m-book-btn,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .m-share-btn {
  background-color: #353a45;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  height: 4rem;
  line-height: 4rem;
  text-align: center;
  color: #fff;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .m-book-btn {
  width: 33.33%;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .m-book-icon {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: grid;
  width: 4rem;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .loading-icon::before {
  content: "\e654";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .loading-icon:before {
  -webkit-animation: circles 1s infinite;
  animation: circles 1s infinite;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  display: inline-block;
  vertical-align: top;
  width: 100%;
  color: #ffffff;
  color: var(--brand-tertiary);
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .m-share-btn {
  padding: 0 1.83333333rem;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .m-share-btn
  .m-share-text {
  font-size: 1.33333333rem;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .m-share-btn
  .m-icon-share::before {
  content: "\e63d";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .m-share-btn
  .m-icon-share:before {
  color: #0d9737;
  color: var(--brand-secondary);
  font-size: 1.33333333rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .place-bet {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: block;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  font-size: 1.33333333rem;
  height: 4rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  text-align: center;
  background: #0d9737;
  background: var(--brand-secondary);
  color: #ffffff;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-disabled {
  background: #dcdee5;
  background: var(--disable-brand-secondary);
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-accept-change {
  background: #0d9737;
  background: var(--brand-secondary);
  color: #ffffff;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-accept-change:active {
  background: #33ea6a;
}

.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-submit {
  background: #0d9737;
  background: var(--brand-quaternary);
  color: #ffffff;
  color: var(--brand-tertiary);
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-submit::before {
  content: "\e654";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-submit:before {
  -webkit-animation: circles 1s infinite;
  animation: circles 1s infinite;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  display: inline-block;
  vertical-align: top;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-submit
  > span {
  display: inline-block;
  padding-left: 0.83333333rem;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-submit:active {
  background: #33ea6a;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-flexibet-loading::before {
  content: "\e654";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-flexibet-loading:before {
  -webkit-animation: circles 1s infinite;
  animation: circles 1s infinite;
  -webkit-animation-timing-function: linear;
  animation-timing-function: linear;
  display: inline-block;
  font-size: 1.66666667rem;
  vertical-align: top;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-flexibet-loading
  > span {
  display: inline-block;
  padding-left: 0.83333333rem;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.required-change {
  background-color: #50545f;
  background-color: var(--disable-type1-primary);
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet
  .m-pay-num {
  font-size: 1rem;
}

.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .alternative-bet-label-bottom {
  color: #9ca0ab;
  font-size: 1.066rem;
  font-style: italic;
  font-weight: normal;
  margin-bottom: 10px;
  margin-left: 1.33333333rem;
  margin-right: 1.33333333rem;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .flexibet-wrap {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.066rem;
  line-height: 1;
  position: relative;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-label-body {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: start;
  -webkit-justify-content: flex-start;
  -ms-flex-pack: start;
  justify-content: flex-start;
  line-height: 1;
  overflow: hidden;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  -webkit-box-pack: end;
  -webkit-justify-content: flex-end;
  -ms-flex-pack: end;
  justify-content: flex-end;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap
  .flexibet-action {
  -webkit-align-content: center;
  -ms-flex-line-pack: center;
  align-content: center;
  border: 1px solid #f2f3f5;
  border-radius: 0.16666667rem;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.33333333rem;
  font-weight: bold;
  height: 34px;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  line-height: 2.5rem;
  text-align: center;
  vertical-align: middle;
  width: 34px;
  color: #0d9737;
  color: var(--c-betslip-flexibet-action);
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap
  .flexibet-action
  .arrow-up {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap
  .flexibet-action
  .arrow-up::before {
  content: "\e62d";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap
  .flexibet-action
  .arrow-down {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap
  .flexibet-action
  .arrow-down::before {
  content: "\e6a3";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap
  .flexibet-action.disabled {
  color: #9ca0ab;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap
  .flexibet-num {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: inline-block;
  text-align: center;
  vertical-align: middle;
  width: 5.33333333rem;
}
.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .flexibet-wrap
  .flexibet-num-wrap
  .flexibet-num.flexibet-change {
  background-color: #d6ebdc;
  background-color: var(--c-betslip-flexibet-change-bg);
  font-weight: bold;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .sporty-insure-container {
  display: block !important;
  position: relative;
}
.m-bet-detail-wrap .m-betslips-stake-wrapper .mg-b-10 {
  margin-bottom: 10px;
}
.m-bet-detail-wrap .m-scroll {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  max-height: 100%;
  overflow-y: auto;
  width: 100%;
}
.m-bet-detail-wrap .m-scroll .no-items {
  color: #9ca0ab;
  font-size: 1.16666667rem;
  position: absolute;
  text-align: center;
  top: 50%;
  width: 100%;
}
.m-bet-detail-wrap .m-betslip-confirm .es-dialog-body {
  font-size: 1.66666667rem;
  font-weight: 700;
}
.m-bet-detail-wrap .m-betslip-flexibet-confirm.es-dialog {
  padding: 0;
}
.m-bet-detail-wrap .m-betslip-flexibet-confirm.es-dialog .es-dialog-body .es-dialog-main {
  padding: 0;
}
.m-bet-detail-wrap .fade-enter,
.m-bet-detail-wrap .fade-leave-to {
  background: rgba(0, 0, 0, 0);
}
.m-bet-detail-wrap .fade-enter-active,
.m-bet-detail-wrap .fade-leave-active {
  -webkit-transition: 0.3s ease;
  transition: 0.3s ease;
}
.m-bet-detail-wrap .sportycoin-dialog.es-dialog .es-dialog-head h1 {
  white-space: nowrap;
}
.m-bet-detail-wrap .m-scroll {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  max-height: 100%;
  overflow-y: auto;
  width: 100%;
}
.m-bet-detail-wrap .m-scroll .no-items {
  color: #9ca0ab;
  font-size: 1.066rem;
  position: absolute;
  text-align: center;
  top: 50%;
  width: 100%;
}
.m-bet-detail-wrap .bottom-toast .container {
  background: black;
  border-radius: 32px;
  color: white;
  margin-left: 0.66666667rem;
  margin-right: 0.66666667rem;
  opacity: 0.7;
  padding: 16px;
}
.m-bet-detail-wrap .add-selections-btn {
  border-bottom: 0.16666667rem solid #eaecef;
  -webkit-justify-content: space-around;
  -ms-flex-pack: distribute;
  justify-content: space-around;
  margin-bottom: 14px;
  padding-bottom: 10px;
  padding-top: 3px;
  border-color: #eaecef;
  border-color: var(--background-type1-tertiary);
  color: #0d9737;
  color: var(--brand-secondary);
}
.m-bet-detail-wrap .icon-plus {
  font-size: 2rem;
  line-height: 1.5rem;
  margin-right: 5px;
}
.m-bet-detail-wrap .edit-info {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  font-size: 1rem;
  -webkit-justify-content: space-around;
  -ms-flex-pack: distribute;
  justify-content: space-around;
  margin-top: 0.66666667rem;
}
</style>
