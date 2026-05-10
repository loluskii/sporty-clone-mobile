<template>
  <div class="m-betslips-stake-wrapper">
    <div class="m-betslips-stake">
      <BetslipBonusBar v-if="parseFloat(maxBonus) > 0"></BetslipBonusBar>
      <div class="m-input-keyboard-wrapper m-input mg-b-10">
        <div class="m-input-wrapper">
          <span data-cms-key="total_stake">
            {{ isSingleMulti ? 'Stake per bet (' + selectionsLength + ' bets)' : 'Total Stake' }}
          </span>

          <span style="text-align: end">
            <span class="currency"
              ><em>{{ SportsbookGlobalVariable.Currency }}</em></span
            >
            <span
              tabindex="0"
              :class="{ 'm-keybord-input multiple-stake-input': betSlipType !== 'Combo' }"
              v-html="stakeDisplay"
              @click="toggleKeyboard"
            ></span>
          </span>
        </div>
        <div v-if="balanceLowerThanStake" class="m-error-info">
          <p>
            You need a balance of {{ SportsbookGlobalVariable.Currency }}
            {{ totalStakeDisplay }} to place this bet. Please deposit an additional
            {{ amountNeededToStake }}
          </p>
          <p @click.prevent="goToDeposit" class="m-deposit-link-wrapper">
            <a class="m-deposit-link">
              <span>Go to Deposit</span>
            </a>
            <i class="arrow-right"></i>
          </p>
        </div>
        <BetlistStakeKeyboard
          :keyboard-visible="keyboardVisible"
          @button-click="onKeyClick"
        ></BetlistStakeKeyboard>
      </div>

      <div class="sporty-insure-container">
        <div class="alternative-bet-type-option insure-option">
          <div class="sporty-insure-logo">
            <div class="desc">
              <span>Insure</span>
              <svg
                viewBox="0 0 14 15"
                xmlns="http://www.w3.org/2000/svg"
                height="14px"
                width="14px"
                class="info-icon svg-icon-base"
              >
                <path
                  d="M6.991.5a6.991 6.991 0 100 13.983A6.991 6.991 0 006.991.5zm0 2.533a.902.902 0 110 1.804.902.902 0 010-1.804zm.923 8.064a.925.925 0 01-.923.923.925.925 0 01-.922-.923v-4.13c0-.507.415-.922.922-.922.508 0 .923.415.923.922v4.13z"
                  fill="currentColor"
                  fill-rule="evenodd"
                ></path>
              </svg>
            </div>
          </div>
          <div class="insure-panel">
            <div class="insure-product insure-product--interactive">
              <button
                type="button"
                class="insure-product-main"
                :class="{ active: isBulkEarlyWinEnabled, disabled: !hasDerivedMarkets || isLoadingUpMode }"
                :disabled="!hasDerivedMarkets || isLoadingUpMode"
                @click.prevent="handleBulkEarlyWinToggle"
              >
                <span class="insure-product-check" :class="{ active: isBulkEarlyWinEnabled }">
                  <svg viewBox="-1.5 -1.5 15 14">
                    <polyline points="1 6.29411765 4.5 10 11 1"></polyline>
                  </svg>
                </span>
                <span class="insure-product-copy">
                  <span class="insure-product-name">{{ earlyWinTitle }}</span>
                </span>
              </button>
              <div class="insure-product-picker">
                <button
                  type="button"
                  class="insure-product-caret-button"
                  :class="{ active: isBulkEarlyWinEnabled, disabled: !hasDerivedMarkets || isLoadingUpMode }"
                  :disabled="!hasDerivedMarkets || isLoadingUpMode"
                  @click.stop.prevent="toggleEarlyWinMenu"
                >
                  <span class="insure-product-caret" :class="{ open: showEarlyWinMenu }"></span>
                </button>
                <div v-if="showEarlyWinMenu" class="insure-product-menu">
                  <button
                    v-for="mode in earlyWinModes"
                    :key="mode"
                    type="button"
                    class="insure-product-menu-option"
                    :class="{ active: bulkMode === mode }"
                    @click.stop.prevent="selectBulkMode(mode)"
                  >
                    {{ mode.toUpperCase() }}
                  </button>
                </div>
              </div>
            </div>

            <div
              v-for="placeholder in insurePlaceholderProducts"
              :key="placeholder"
              class="insure-product insure-product--placeholder"
            >
              <div class="insure-product-main is-static disabled">
                <span class="insure-product-check"></span>
                <span class="insure-product-copy">
                  <span class="insure-product-name">{{ placeholder }}</span>
                  <span class="insure-product-sub">Coming soon</span>
                </span>
              </div>
            </div>

            <p v-if="isBulkEarlyWinEnabled && hasUnsupportedSelections" class="earlywin-helper">
              {{ unsupportedSelectionsLabel }}
            </p>
          </div>
        </div>
      </div>

      <template v-if="taxEnabled && !betslipMode">
        <div class="bonus mg-b-10">
          <span>Stake After Tax</span>
          <span
            >{{ SportsbookGlobalVariable.Currency }}
            {{ parseFloat(stakeAfterTax).toFixed(2) }}</span
          >
        </div>
      </template>

      <div class="bonus mg-b-10" v-if="isSingleMulti">
        <span>Total Stake</span>
        <span>{{ totalStakeDisplay }}</span>
      </div>

      <div class="total-odds mg-b-10" v-if="showTotalOdds">
        <span>Total Odds</span>
        <span>{{ totalOddsDisplay }}</span>
      </div>

      <div class="bonus mg-b-10">
        <span>Max Bonus</span>
        <span>{{ SportsbookGlobalVariable.Currency }} {{ formatNumber(maxBonus) }}</span>
      </div>

      <template v-if="taxEnabled && !betslipMode">
        <div class="bonus mg-b-10">
          <span>Excise Tax</span>
          <span
            >{{ SportsbookGlobalVariable.Currency }} {{ parseFloat(exciseTax).toFixed(2) }}</span
          >
        </div>

        <div v-if="wthTax > 0" class="bonus mg-b-10">
          <span>Withholding Tax</span>
          <span>{{ SportsbookGlobalVariable.Currency }} {{ formatNumber(wthTax) }}</span>
        </div>
      </template>

      <div
        v-if="
          userStore.currentUser &&
          userStore.currentUser.sportBonusBalance > 0 &&
          !couponStore.betslipMode
        "
        class="bonus mg-b-10"
      >
        <span>Use Bonus</span>
        <div style="display: flex; align-items: center">
          <input
            type="checkbox"
            style="margin-right: 7px; accent-color: var(--brand-secondary)"
            v-model="couponStore.coupon.useBonus"
            id=""
          />
          <span
            >{{ SportsbookGlobalVariable.Currency }}
            {{ userStore.currentUser.sportBonusBalance }}</span
          >
        </div>
      </div>

      <div
        v-if="
          userStore.currentUser &&
          userStore.currentUser.sportBonusBalance < 1 &&
          userStore.activeCashback &&
          !couponStore.betslipMode
        "
        class="bonus mg-b-10"
      >
        <span>Use Cashback</span>
        <div style="display: flex; align-items: center">
          <input
            type="checkbox"
            style="margin-right: 7px; accent-color: var(--brand-secondary)"
            v-model="couponStore.coupon.useCashback"
            id=""
          />
        </div>
      </div>


      <div class="potential-win bold real-theme">
        <span data-cms-key="potential_win" data-cms-page="component_betslip">Potential Win</span>
        <span>
          <span class="m-value">
            {{ SportsbookGlobalVariable.Currency }}
            {{ potentialWin }}
          </span>
        </span>
      </div>

      <div class="m-submit">
        <div
          class="betslip-action bet-accept-change"
          v-if="!acceptedChanges"
          @click="handleAcceptChange"
        >
          <span>Accept Changes</span>
        </div>

        <template v-else>
          <div class="betslip-action-row" v-if="!betslipMode">
            <button
              class="betslip-action betslip-action-secondary"
              :class="{ 'bet-disabled': isSubmitting }"
              :disabled="isSubmitting"
              @click="book"
            >
              Book Bet
            </button>
            <button
              class="betslip-action betslip-action-primary"
              :class="[{ 'bet-disabled': placeBetDisabled }, { 'betslip-action-loading': isSubmitting }]"
              @click="placeBet"
            >
              <span>{{ isSubmitting ? '' : 'Place Bet' }}</span>
              <span class="betslip-action-sub" v-if="!isSubmitting">
                {{ totalStake != 0 ? `About to pay ${totalStake}` : 'Select stake amount' }}
              </span>
            </button>
          </div>
          <button
            v-else
            class="betslip-action betslip-action-primary"
            :class="[{ 'bet-disabled': placeBetDisabled }, { 'betslip-action-loading': isSubmitting }]"
            @click="placeBet"
          >
            <span>{{ isSubmitting ? '' : 'Place Simulate Bet' }}</span>
            <span class="betslip-action-sub" v-if="!isSubmitting && totalStake != 0">
              {{ totalStake != 0 ? `About to pay ${totalStake}` : 'Select stake amount' }}
            </span>
          </button>
        </template>
      </div>
    </div>
  </div>
</template>
<script setup>
import { useCouponStore, useUsersStore, useUtilsStore } from '@/stores'
import { formatNumber } from '@/helpers'
import { useBetslipCalculations } from '@/composables/useBetslipCalculations'
import BetslipBonusBar from './BetslipBonusBar.vue'
import { computed, onMounted, toRefs, inject, ref } from 'vue'
import { useRouter } from 'vue-router'
import BetlistStakeKeyboard from './BetlistStakeKeyboard.vue'
import emitter from '@/plugins/emitter'
// import placeBet2
const props = defineProps({
  betSlipType: String,
  betType: String
})
const couponStore = useCouponStore()
const { SportsbookGlobalVariable } = useUtilsStore()
const userStore = useUsersStore()
const router = useRouter()
const emit = defineEmits(['toggle-show', 'toggle-betslip', 'book-bet'])
const { betSlipType, betType } = toRefs(props)
const {
  selectionsLength,
  isSingleMulti,
  stakeDisplay,
  totalStakeAmount,
  totalStakeDisplay,
  totalStake,
  taxEnabled,
  exciseTax,
  stakeAfterTax,
  wthTax,
  showTotalOdds,
  totalOddsDisplay,
  maxBonus,
  potentialWin,
  updateStake
} = useBetslipCalculations({ betSlipType, betType })
const keyboardKey = 'betlist:total'
const keyboardVisible = computed(() => couponStore.activeKeyboardKey === keyboardKey)
const {
  bulkMode,
  isLoadingUpMode,
  hasDerivedMarkets,
  hasUnsupportedSelections,
  unsupportedSelectionsCount,
  isBulkEarlyWinEnabled,
  toggleBulkUpMode,
  setBulkUpMode
} = inject('betslipUpMode')
const isSubmitting = computed(() => {
  return couponStore.isBetslipLoading || couponStore.isBetslipBooking
})
const showEarlyWinMenu = ref(false)
const earlyWinModes = ['1up', '2up']
const insurePlaceholderProducts = ['Cut 1', 'Flex']

const goToDeposit = () => {
  emit('toggle-betslip')
  return router.push({ name: 'account-deposit' })
}

const placeBetDisabled = computed(() => {
  return (
    totalStakeAmount.value < parseFloat(SportsbookGlobalVariable.MinBetStake) ||
    couponStore.isBetslipLoading ||
    hasSuspendedSelections.value ||
    balanceLowerThanStake.value
  )
})

const balanceLowerThanStake = computed(() => {
  return (
    userStore.currentUser &&
    totalStakeAmount.value > userStore.currentUser?.sportBonusBalance &&
    totalStakeAmount.value > userStore.currentUser?.availableBalance
  )
})

const amountNeededToStake = computed(() => {
  return `${SportsbookGlobalVariable.Currency} ${formatNumber(totalStakeAmount.value - parseFloat(userStore.balance))}`
})

const acceptedChanges = computed(() => {
  return couponStore.coupon.acceptChanges
})

const bulkModeLabel = computed(() => {
  return String(bulkMode.value || '2up').toUpperCase()
})

const earlyWinTitle = computed(() => {
  return isBulkEarlyWinEnabled.value ? `EarlyWin - ${bulkModeLabel.value}` : 'EarlyWin'
})

const unsupportedSelectionsLabel = computed(() => {
  const count = Number(unsupportedSelectionsCount.value || 0)
  return count === 1
    ? '1 selection keeps base mode because EarlyWin is not supported.'
    : `${count} selections keep base mode because EarlyWin is not supported.`
})

const toggleKeyboard = () => {
  const nextKey = keyboardVisible.value ? null : keyboardKey
  couponStore.setActiveKeyboardKey(nextKey)
}

const betslipMode = computed(() => {
  return couponStore.betslipMode
})

// Add this computed property to check for suspended selections
const hasSuspendedSelections = computed(() => {
  return couponStore.coupon.selections.some(
    (selection) => selection.suspended || selection.unavailable
  )
})

async function book(e) {
  try {
    if (totalStake.value < 1) {
      return
    }

    e.target.classList.add('loading-icon')
    couponStore.isBetslipBooking = true

    const res = await couponStore.placeBet(e, 'book')
    couponStore.isBetslipBooking = false
    e.target.classList.remove('loading-icon')

    if (res.success) {
      emit('book-bet', res)
    } else {
      // Handle error display or other actions as needed
      emit('toggle-betslip')
      emitter.emit('showErrorMessage', res.message)
    }
  } catch (error) {
    emit('toggle-betslip')
    // Handle error display or other actions as needed
    emitter.emit('showErrorMessage', error)
  }
}

function placeBet() {
  if (hasSuspendedSelections.value) {
    emit('toggle-betslip')
    emitter.emit('showErrorMessage', 'Some selections are suspended')
    return
  }
  if (!userStore.currentUser) {
    emit('toggle-betslip')
    return router.push({ name: 'sign-in' })
  } else if (placeBetDisabled.value) {
    // return
  } else if (hasSuspendedSelections.value) {
    emit('toggle-betslip')
    emitter.emit('showErrorMessage', 'Some selections are suspended')
    return
  }
  emit('toggle-show')
}

function onKeyClick(type, value) {
  let stake = Number(stakeDisplay.value) === 0 ? '' : stakeDisplay.value.toString()
  let finalStake
  switch (type) {
    case 'number':
      // Append clicked number to the display
      if (stake.length < 7) {
        if (typeof value === 'number') {
          if (stake === '') {
            finalStake = value
          } else {
            finalStake = parseFloat(stake) + value
          }
        } else {
          finalStake = stake + value
        }
        updateStake(finalStake)
      }
      break
    case 'dot':
      // Append dot to the display
      if (stake.length < 6 && !stake.includes('.')) {
        stake += '.'
        updateStake(stake)
      }
      break
    case 'double-zero':
      // Append double zero to the display
      if (stake.length < 6) {
        stake += '00'
        updateStake(stake)
      }
      break
    case 'clear':
      // Clear the display
      stake = ''
      updateStake(stake)
      break
    case 'delete':
      // Remove the last character from the display
      stake = stake.toString().slice(0, -1)
      updateStake(stake)
      break
    case 'done':
      // Handle the "Done" button click if needed
      couponStore.setActiveKeyboardKey(null)
      break
    // Add more cases for other button types if necessary
  }
}

function toggleEarlyWinMenu() {
  if (!hasDerivedMarkets.value || isLoadingUpMode.value) return
  showEarlyWinMenu.value = !showEarlyWinMenu.value
}

async function handleBulkEarlyWinToggle() {
  if (!hasDerivedMarkets.value || isLoadingUpMode.value) return
  showEarlyWinMenu.value = false
  await toggleBulkUpMode()
}

async function selectBulkMode(mode) {
  showEarlyWinMenu.value = false
  await setBulkUpMode(mode)
}

function handleAcceptChange() {
  // Set acceptChanges to true in the coupon store
  couponStore.coupon.acceptChanges = true

  // Clear the changed flag for all selections
  couponStore.coupon.selections.forEach((selection) => {
    selection.changed = false
  })

  // Recalculate winnings after accepting changes
  couponStore.updateWinnings({
    stake: couponStore.coupon.totalStake,
    id: 'all'
  })
}

onMounted(() => {
  couponStore.updateWinnings({
    stake: stakeDisplay.value
  })
})
</script>
<style>
.m-bet-detail-wrap {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  /* max-height: calc(94% - 25.5%); */
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
  background-color: #fff;
  display: block;
  font-size: 1.066rem;
  overflow-x: hidden;
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

/* 1UP/2UP UI block. */
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-row {
  align-items: center;
  justify-content: space-between;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-label {
  color: #353a45;
  color: var(--text-type1-primary);
  font-weight: 700;
  min-width: 30%;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-trigger {
  align-items: center;
  background: #f2f3f5;
  background: var(--background-type1-primary);
  border: 1px solid #eaecef;
  border: 1px solid var(--line-type1-primary);
  border-radius: 0.5rem;
  color: #353a45;
  color: var(--text-type1-primary);
  cursor: pointer;
  display: flex;
  flex: 1;
  font-weight: 600;
  justify-content: space-between;
  padding: 0.25rem 0.66666667rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-current {
  font-size: 0.95rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-caret {
  border-left: 2px solid transparent;
  border-right: 2px solid transparent;
  border-top: 4px solid #353a45;
  border-top-color: var(--text-type1-primary);
  height: 0;
  margin-left: 0.5rem;
  transition: transform 0.2s ease;
  width: 0;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-caret.open {
  transform: rotate(180deg);
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-panel {
  display: flex;
  gap: 0.75rem;
  padding: 0 1.33333333rem 0.83333333rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-option {
  align-items: center;
  background: #f9fafb;
  background: var(--background-general-primary);
  border: 1px solid #eaecef;
  border: 1px solid var(--line-type1-primary);
  border-radius: 0.5rem;
  color: #353a45;
  color: var(--text-type1-primary);
  cursor: pointer;
  display: inline-flex;
  gap: 0.4rem;
  justify-content: center;
  min-width: 3.5rem;
  padding: 0.25rem 0.6rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .up-toggle-option.active {
  background: #1b1e25;
  background: var(--text-type1-tertiary);
  border-color: #1b1e25;
  border-color: var(--text-type1-tertiary);
  color: #ffffff;
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

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake > .confirm-wrap {
  padding: 0;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .total-stake,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .bonus,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .total-odds {
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

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .flex {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .one-cut-text-gap {
  gap: 0.25rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .total-stake,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .total-odds,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .bonus {
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .still-win .label-with-img {
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
  padding: 0.8rem 0.667rem;
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

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .loading-icon::before {
  content: '\e654';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .loading-icon:before {
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
  content: '\e63d';
  font-family: 'iconfont' !important;
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
  color: var(--brand-highlight-text);
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
  background: var(--brand-highlight-text);
  background: var(--brand-secondary);
  color: #ffffff;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .place-bet.bet-disabled {
  background: #dcdee5;
  background: var(--disable-brand-secondary);
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
}

.bet-accept-change {
  background: var(--brand-highlight-text);
  color: #ffffff;
  padding: 1.1rem 0.75rem !important;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .place-bet.bet-submit {
  background: var(--brand-highlight-text);
  background: var(--brand-quaternary);
  color: #ffffff;
  color: var(--brand-tertiary);
}

.m-bet-detail-wrap
  .m-betslips-stake-wrapper
  .m-betslips-stake
  .m-submit
  .place-bet.bet-submit::before {
  content: '\e654';
  font-family: 'iconfont' !important;
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
  content: '\e654';
  font-family: 'iconfont' !important;
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

.betslip-action-row {
  display: flex;
  width: 100%;
  gap: 5px
}

.betslip-action {
  border: none;
  border-radius: 0.5rem;
  padding: 0.7rem 0.75rem;
  font-weight: 700;
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}

.betslip-action-primary {
  background: var(--brand-primary-button);
  color: #ffffff;
}

.sim-theme .betslip-action-primary {
  background: var(--sim-primary);
  color: #1b1e25;
}

.betslip-action-secondary {
  background: #353a45;
  color: #ffffff;
  width: 40%
}

.betslip-action-sub {
  font-size: 0.75rem;
  font-weight: 600;
  opacity: 0.8;
}

.betslip-action.bet-disabled {
  opacity: 0.5;
  pointer-events: none;
}

/* Loading state for place bet button during submission. */
.betslip-action-loading::before {
  content: '\e654';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
  margin-right: 0.35rem;
  animation: circles 1s infinite linear;
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

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .m-submit .place-bet .m-pay-num {
  font-size: 1rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .alternative-bet-label-bottom {
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

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .flexibet-wrap .flexibet-label-body {
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

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .flexibet-wrap .flexibet-num-wrap {
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
  color: var(--brand-highlight-text);
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
  content: '\e62d';
  font-family: 'iconfont' !important;
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
  content: '\e6a3';
  font-family: 'iconfont' !important;
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
  color: var(--brand-highlight-text);
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

.alternative-bet-type-option {
  -webkit-box-align: start;
  -webkit-align-items: flex-start;
  -ms-flex-align: start;
  align-items: flex-start;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: row;
  -ms-flex-direction: row;
  flex-direction: row;
  font-size: 1rem;
  padding-bottom: 1rem;
  position: relative;
  row-gap: 16px;
}

.alternative-bet-type-option .sporty-insure-logo {
  margin-left: -1.33333333rem;
  width: -webkit-max-content;
  width: -moz-max-content;
  width: max-content;
}
.alternative-bet-type-option .desc {
  background-color: #0d9737;
  color: #ffffff;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  line-height: 1.91666667rem;
  margin-right: 1.33333333rem;
  padding-left: 1.33333333rem;
  position: relative;
}
.alternative-bet-type-option .desc:before {
  border-color: #0d9737 transparent transparent #0d9737;
  border-style: solid;
  border-width: 1.91666667rem 1.25rem 0 0;
  border-left-width: 1px;
  content: '';
  position: absolute;
  right: -1.25rem;
  top: 0px;
  border-top-color: #0d9737;
  border-left-color: #0d9737;
}
.alternative-bet-type-option .desc svg {
  margin-left: 4px;
}
.alternative-bet-type-option .check-group-container {
  -webkit-box-align: start;
  -webkit-align-items: flex-start;
  -ms-flex-align: start;
  align-items: flex-start;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  gap: 0.66666667rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: flex-end;
  -ms-flex-pack: justify;
  justify-content: flex-end;
  width: 100%;
}
.alternative-bet-type-option .check-group-container .checkbox-group {
  -webkit-column-gap: 0.5rem;
  -moz-column-gap: 0.5rem;
  column-gap: 0.5rem;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-wrap: wrap;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  gap: 0.9rem;
}
.alternative-bet-type-option .check-group-container .checkbox-group.ml-pt-sw {
  margin-left: 16px;
}
.alternative-bet-type-option .check-group-container .checkbox-group .span-no-warp {
  white-space: pre;
}
.alternative-bet-type-option .check-group-container .checkbox-group .txt-disabled {
  color: #dcdee5;
}
.alternative-bet-type-option
  .check-group-container
  .checkbox-group
  .af-checkbox
  .check-stroke-wrapper {
  background-color: #fafafa;
  margin-right: 3px !important;
  border-color: #32ce62;
}
.alternative-bet-type-option
  .check-group-container
  .checkbox-group
  .af-checkbox
  .check-stroke-wrapper.disabled {
  border-color: #dcdee5;
}
.alternative-bet-type-option
  .check-group-container
  .checkbox-group
  .af-checkbox
  input[type='checkbox']:checked
  + .check-stroke-wrapper {
  background-color: #32ce62;
  margin-right: 3px !important;
}
.alternative-bet-type-option
  .check-group-container
  .checkbox-group
  .af-checkbox.two-up-loading
  .check-stroke-wrapper {
  border-color: #dcdee5;
}
.alternative-bet-type-option
  .check-group-container
  .checkbox-group
  .af-checkbox.two-up-loading
  input[type='checkbox']:checked
  + .check-stroke-wrapper {
  background: #9ca0ab;
  border-color: #9ca0ab;
}

.alternative-bet-type-option .check-group-container .checkbox-group.need-wrap {
  -webkit-flex-wrap: wrap;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
}

.insure-option {
  align-items: flex-start;
  gap: 0.9rem;
}

.insure-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.55rem;
}

.insure-product {
  position: relative;
}

.insure-product--interactive {
  align-items: stretch;
  display: flex;
  gap: 0.55rem;
}

.insure-product-main,
.insure-product-caret-button {
  align-items: center;
  background: #f6f7f9;
  border: 1px solid #d6dae1;
  border-radius: 0.75rem;
  color: #353a45;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.9rem;
  font-weight: 700;
  gap: 0.6rem;
  min-height: 3rem;
  padding: 0 1rem;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.insure-product-main {
  flex: 1;
  justify-content: flex-start;
  text-align: left;
}

.insure-product-main.is-static {
  width: 100%;
}

.insure-product-main.active,
.insure-product-caret-button.active {
  background: rgba(13, 151, 55, 0.09);
  border-color: var(--brand-primary-button);
  color: var(--brand-primary-button);
}

.insure-product-main.disabled,
.insure-product-caret-button.disabled,
.insure-product-main:disabled,
.insure-product-caret-button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.insure-product-check {
  align-items: center;
  background: #ffffff;
  border: 1px solid #c8ced8;
  border-radius: 0.45rem;
  color: transparent;
  display: inline-flex;
  height: 1.3rem;
  justify-content: center;
  width: 1.3rem;
}

.insure-product-check svg {
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 1.35;
}

.insure-product-check.active {
  background: var(--brand-primary-button);
  border-color: var(--brand-primary-button);
  color: #ffffff;
}

.insure-product-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.12rem;
}

.insure-product-name {
  font-size: 0.92rem;
  font-weight: 800;
}

.insure-product-sub {
  color: #8b919c;
  font-size: 0.74rem;
  font-weight: 600;
}

.insure-product-picker {
  position: relative;
}

.insure-product-caret-button {
  justify-content: center;
  min-width: 3rem;
  padding: 0 0.85rem;
}

.insure-product-caret {
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid currentColor;
  height: 0;
  transition: transform 0.18s ease;
  width: 0;
}

.insure-product-caret.open {
  transform: rotate(180deg);
}

.insure-product-menu {
  background: #ffffff;
  border: 1px solid #d6dae1;
  border-radius: 0.85rem;
  box-shadow: 0 10px 30px rgba(27, 30, 37, 0.12);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 6.25rem;
  padding: 0.4rem;
  position: absolute;
  right: 0;
  top: calc(100% + 0.45rem);
  z-index: 30;
}

.insure-product-menu-option {
  background: transparent;
  border: 0;
  border-radius: 0.6rem;
  color: #353a45;
  cursor: pointer;
  font-size: 0.88rem;
  font-weight: 800;
  padding: 0.7rem 0.85rem;
  text-align: left;
}

.insure-product-menu-option.active {
  background: rgba(13, 151, 55, 0.09);
  color: var(--brand-primary-button);
}

.earlywin-helper {
  color: #7b818c;
  font-size: 0.78rem;
  font-weight: 600;
  line-height: 1.35;
  margin: 0;
}
.alternative-bet-type-option .check-group-container .more-options-wrapper {
  max-width: 4.66666667rem;
  white-space: nowrap;
}
.alternative-bet-type-option .check-group-container .more-options-wrapper span {
  font-size: 1.16666667rem;
  font-weight: 500;
  line-height: 1.66666667rem;
  margin-right: 0.16666667rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.alternative-bet-type-option .label {
  font-size: 1.16666667rem;
}
.alternative-bet-type-option .icon {
  margin-right: 2px !important;
}
.alternative-bet-type-option .any-win-icon {
  color: #32ce62;
  line-height: 16px;
}
.alternative-bet-type-option .any-win-icon.disabled {
  color: #dcdee5;
}
.alternative-bet-type-option .any-win-icon.disabled path:first-child {
  fill: #fafafa;
}
@media screen and (min-width: 320px) and (max-width: 360px) {
  .m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .alternative-bet-type-option {
    font-size: 0.91666667rem;
  }
}
</style>
