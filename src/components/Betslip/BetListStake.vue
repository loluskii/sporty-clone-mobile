<template>
  <div class="m-betslips-stake-wrapper">
    <div class="m-betslips-stake">
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
        <div class="alternative-bet-type-option insure-option" style="width: 100%;">
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
            <div class="insure-products-row insure-products-row--primary">
              <label
                class="insure-option"
                :class="{ disabled: !hasDerivedMarkets || isLoadingUpMode }"
              >
                <input
                  type="checkbox"
                  class="insure-option-input"
                  :checked="isBulkEarlyWinEnabled && bulkMode === '1up'"
                  :disabled="!hasDerivedMarkets || isLoadingUpMode"
                  @change="handleBulkEarlyWinMode('1up')"
                />
                <svg
                  class="insure-chip-logo insure-chip-logo--one"
                  viewBox="0 0 60 30"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="1UP"
                >
                  <path
                    d="M3.2 6.3L11.8 1.5H17.2V27.4H10.2V10.2L6.1 12.5L3.2 6.3Z"
                    fill="currentColor"
                  />
                  <path
                    d="M20.5 2.1H27.8V16.7C27.8 19.1 29 20.5 31.3 20.5C33.6 20.5 34.8 19.1 34.8 16.7V2.1H42.1V17C42.1 24.1 38 28 31.3 28C24.6 28 20.5 24.1 20.5 17V2.1Z"
                    fill="currentColor"
                  />
                  <path
                    d="M44.7 2.1H52.1C56.7 2.1 59.3 4.7 59.3 8.7C59.3 12.7 56.7 15.3 52.1 15.3H50.7V27.4H44.7V2.1ZM51.4 10.5C52.9 10.5 53.8 9.8 53.8 8.7C53.8 7.5 52.9 6.9 51.4 6.9H50.7V10.5H51.4Z"
                    fill="currentColor"
                  />
                  <circle cx="53.1" cy="8.7" r="1.2" fill="currentColor" />
                </svg>
              </label>

              <label
                class="insure-option"
                :class="{ disabled: !hasDerivedMarkets || isLoadingUpMode }"
              >
                <input
                  type="checkbox"
                  class="insure-option-input"
                  :checked="isBulkEarlyWinEnabled && bulkMode === '2up'"
                  :disabled="!hasDerivedMarkets || isLoadingUpMode"
                  @change="handleBulkEarlyWinMode('2up')"
                />
                <svg
                  class="insure-chip-logo insure-chip-logo--two"
                  viewBox="0 0 64 30"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-label="2UP"
                >
                  <path
                    d="M3.5 9.2C3.5 4.3 7.3 1.5 13.1 1.5C18.8 1.5 22.2 4.1 22.2 8.4C22.2 11.6 20.5 13.8 16.7 16.1L11.6 19.2H22.5V27.4H3.6V21.1L13.1 15.1C15 13.9 15.7 12.9 15.7 11.5C15.7 10.1 14.6 9.2 12.9 9.2C11 9.2 9.8 10.4 9.8 12.4H3.5V9.2Z"
                    fill="currentColor"
                  />
                  <path
                    d="M25.2 2.1H32.5V16.7C32.5 19.1 33.7 20.5 36 20.5C38.3 20.5 39.5 19.1 39.5 16.7V2.1H46.8V17C46.8 24.1 42.7 28 36 28C29.3 28 25.2 24.1 25.2 17V2.1Z"
                    fill="currentColor"
                  />
                  <path
                    d="M49.4 2.1H56.8C61.4 2.1 64 4.7 64 8.7C64 12.7 61.4 15.3 56.8 15.3H55.4V27.4H49.4V2.1ZM56.1 10.5C57.6 10.5 58.5 9.8 58.5 8.7C58.5 7.5 58.5 6.9 56.1 6.9H55.4V10.5H56.1Z"
                    fill="currentColor"
                  />
                  <circle cx="57.8" cy="8.7" r="1.2" fill="currentColor" />
                </svg>
              </label>

              <label
                class="insure-option"
                :class="{ disabled: isCutOneDisabled, loading: isCutOneLoadingState }"
              >
                <input
                  type="checkbox"
                  class="insure-option-input"
                  :checked="isCutOneEnabled"
                  :disabled="isCutOneDisabled"
                  @change="handleCutOneToggle"
                />
                <svg
                  class="insure-chip-icon insure-chip-icon--cut"
                  viewBox="0 0 256 228"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M256 223V5C256 2.23858 253.762 0 251 0H5C2.23858 0 0 2.23857 0 4.99999V223C0 225.761 2.23858 228 5 228H251C253.762 228 256 225.761 256 223Z"
                    fill="white"
                  />
                  <path
                    d="M46.5 53.5L69 30H171.5V228H102V89H46.5V53.5Z"
                    fill="currentColor"
                  />
                </svg>
                <span class="insure-option-label">Cut 1</span>
              </label>

              <label
                class="insure-option"
                :class="{ disabled: isFlexDisabled, loading: isFlexLoadingState }"
              >
                <input
                  type="checkbox"
                  class="insure-option-input"
                  :checked="isFlexEnabled"
                  :disabled="isFlexDisabled"
                  @change="handleFlexToggle"
                />
                <svg
                  class="insure-chip-icon insure-chip-icon--flex"
                  viewBox="0 0 256 228"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M256 228V0H0V228H256Z"
                    fill="white"
                  />
                  <path
                    d="M36 64L71 30H221L201 82.5H92V109.5H206.5L185.5 162H92V228H36V64Z"
                    fill="currentColor"
                  />
                </svg>
                <span class="insure-option-label">Flex</span>
              </label>

              <button
                type="button"
                class="insure-more-toggle"
                :class="{ open: isMoreOptionsOpen }"
                :aria-expanded="isMoreOptionsOpen"
                aria-controls="insure-secondary-row"
                @click.prevent="toggleMoreOptions"
              >
                <span>More</span>
                <span class="insure-more-toggle-caret" aria-hidden="true"></span>
              </button>
            </div>

            <Transition name="insure-row-expand">
              <div
                v-if="isMoreOptionsOpen"
                id="insure-secondary-row"
                class="insure-products-row insure-products-row--secondary"
              >
                <label class="insure-option disabled">
                  <input type="checkbox" class="insure-option-input" disabled />
                  <svg
                    class="insure-chip-icon insure-chip-icon--goals"
                    viewBox="0 0 256 230"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      d="M256 229V1H0V229H256Z"
                      fill="white"
                    />
                    <path
                      d="M162.303 0L51 133.25H111.186L86.8644 230L206 93.2314H137.569L162.303 0Z"
                      fill="currentColor"
                    />
                  </svg>
                  <span class="insure-option-label">Early Goals</span>
                </label>
              </div>
            </Transition>

            <Transition name="insure-row-expand">
              <div v-if="isFlexEnabled" class="insure-flex-stepper">
                <span class="insure-flex-stepper-label">Min. no. of selections to win</span>
                <div class="insure-flex-stepper-control">
                  <button
                    type="button"
                    class="insure-flex-stepper-action"
                    :disabled="flexAmount <= minFlexAmount || isFlexDisabled"
                    aria-label="Decrease flex amount"
                    @click.prevent="decrementFlexAmount"
                  >
                    &minus;
                  </button>
                  <span class="insure-flex-stepper-value">{{ flexAmount }}</span>
                  <button
                    type="button"
                    class="insure-flex-stepper-action"
                    :disabled="flexAmount >= maxFlexAmount || isFlexDisabled"
                    aria-label="Increase flex amount"
                    @click.prevent="incrementFlexAmount"
                  >
                    +
                  </button>
                </div>
              </div>
            </Transition>

          </div>
        </div>
      </div>

      <template v-if="taxEnabled && !betslipMode">
        <div class="bonus mg-b-5">
          <span>Stake After Tax</span>
          <span
            >{{ SportsbookGlobalVariable.Currency }}
            {{ parseFloat(stakeAfterTax).toFixed(2) }}</span
          >
        </div>
      </template>

      <div class="bonus mg-b-5" v-if="isSingleMulti">
        <span>Total Stake</span>
        <span>{{ totalStakeDisplay }}</span>
      </div>

      <div class="total-odds mg-b-5" v-if="showTotalOdds">
        <span>Total Odds</span>
        <span>{{ totalOddsDisplay }}</span>
      </div>

      <div v-if="showMaxBonusRow" class="bonus mg-b-5">
        <span>Max Bonus</span>
        <span>{{ SportsbookGlobalVariable.Currency }} {{ formatNumber(maxBonus) }}</span>
      </div>

      <template v-if="taxEnabled && !betslipMode">
        <div class="bonus mg-b-5">
          <span>Excise Tax</span>
          <span
            >{{ SportsbookGlobalVariable.Currency }} {{ parseFloat(exciseTax).toFixed(2) }}</span
          >
        </div>

        <div v-if="wthTax > 0" class="bonus mg-b-5">
          <span>Withholding Tax</span>
          <span>{{ SportsbookGlobalVariable.Currency }} {{ formatNumber(wthTax) }}</span>
        </div>
      </template>

      <div
        v-if="
          userStore.currentUser &&
          userStore.currentUser.sportBonusBalance > 0 &&
          !couponStore.betslipMode &&
          !isInsureBonusSuppressed
        "
        class="bonus mg-b-5"
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
          !couponStore.betslipMode &&
          !isInsureBonusSuppressed
        "
        class="bonus mg-b-5"
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
          <span class="m-value" :class="{ 'm-value--loading': isPotentialWinLoading }">
            {{ SportsbookGlobalVariable.Currency }}
            {{ potentialWin }}
            <span v-if="isPotentialWinLoading" class="potential-win-spinner" aria-hidden="true"></span>
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
import { computed, ref, toRefs, inject, watch } from 'vue'
import { useRouter } from 'vue-router'
import BetlistStakeKeyboard from './BetlistStakeKeyboard.vue'
import emitter from '@/plugins/emitter'
// import placeBet2
const props = defineProps({
  betSlipType: String,
  betType: String
})
const couponStore = useCouponStore()
const utilsStore = useUtilsStore()
const { SportsbookGlobalVariable } = utilsStore
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
  isBulkEarlyWinEnabled,
  toggleBulkUpMode,
  setBulkUpMode
} = inject('betslipUpMode')
const isSubmitting = computed(() => {
  return couponStore.isBetslipLoading || couponStore.isBetslipBooking
})
const isCutOneFeatureActive = computed(() =>
  Boolean(utilsStore.SportsbookFeatureConfig?.cutOne?.is_active)
)
const isFlexFeatureActive = computed(() =>
  Boolean(utilsStore.SportsbookFeatureConfig?.flex?.is_active)
)
const isCutOneEnabled = computed(() => couponStore.coupon.useCutOne)
const isCutOneLoadingState = computed(() => couponStore.isCutOneLoading && couponStore.coupon.useCutOne)
const isCutOneDisabled = computed(() => {
  return (
    !isCutOneFeatureActive.value ||
    couponStore.isCutOneLoading ||
    (!couponStore.coupon.useCutOne && !couponStore.canSelectCutOne())
  )
})
const isFlexEnabled = computed(() => couponStore.coupon.useFlex)
const isFlexLoadingState = computed(() => couponStore.isFlexLoading && couponStore.coupon.useFlex)
const isFlexDisabled = computed(() => {
  return (
    !isFlexFeatureActive.value ||
    couponStore.isFlexLoading ||
    (!couponStore.coupon.useFlex && !couponStore.canSelectFlex())
  )
})
const flexAmount = computed(() => Number(couponStore.coupon.flexAmount || 1))
const minFlexAmount = computed(() => 1)
const maxFlexAmount = computed(() => couponStore.getFlexMaximumWins())
const isInsureBonusSuppressed = computed(() => {
  return Boolean(couponStore.coupon.useCutOne || couponStore.coupon.useFlex)
})
const showMaxBonusRow = computed(() => {
  return !isInsureBonusSuppressed.value
})
const isPotentialWinLoading = computed(() => isCutOneLoadingState.value || isFlexLoadingState.value)
const minimumStake = computed(() => {
  return couponStore.getMinStakeForBetslipType(betSlipType.value)
})

const goToDeposit = () => {
  emit('toggle-betslip')
  return router.push({ name: 'account-deposit' })
}

const placeBetDisabled = computed(() => {
  return (
    totalStakeAmount.value < minimumStake.value ||
    couponStore.isBetslipLoading ||
    couponStore.isCutOneLoading ||
    couponStore.isFlexLoading ||
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

const isMoreOptionsOpen = ref(false)

function toggleMoreOptions() {
  isMoreOptionsOpen.value = !isMoreOptionsOpen.value
}

async function handleBulkEarlyWinMode(mode) {
  if (!hasDerivedMarkets.value || isLoadingUpMode.value) return

  if (isBulkEarlyWinEnabled.value && bulkMode.value === mode) {
    await toggleBulkUpMode()
    return
  }

  if (!isBulkEarlyWinEnabled.value) {
    bulkMode.value = mode
    await toggleBulkUpMode()
    return
  }

  await setBulkUpMode(mode)
}

async function handleCutOneToggle() {
  if (couponStore.isCutOneLoading) return
  await couponStore.toggleCutOne()
}

async function handleFlexToggle() {
  if (couponStore.isFlexLoading) return
  await couponStore.toggleFlex()
}

async function incrementFlexAmount() {
  if (isFlexDisabled.value) return
  await couponStore.setFlexAmount(flexAmount.value + 1)
}

async function decrementFlexAmount() {
  if (isFlexDisabled.value) return
  await couponStore.setFlexAmount(flexAmount.value - 1)
}

function handleAcceptChange() {
  // Set acceptChanges to true in the coupon store
  couponStore.coupon.acceptChanges = true

  // Clear the changed flag for all selections
  couponStore.coupon.selections.forEach((selection) => {
    selection.changed = false
  })
}

watch(
  () => couponStore.coupon.useBonus,
  async () => {
    if (couponStore.coupon.betslip_type === 'Multiple' && couponStore.coupon.bet_type === 'Multiple') {
      await couponStore.refreshMultipleBetslipPreview()
    }
  }
)

watch(
  () => couponStore.coupon.useCashback,
  async () => {
    if (couponStore.coupon.betslip_type === 'Multiple' && couponStore.coupon.bet_type === 'Multiple') {
      await couponStore.refreshMultipleBetslipPreview()
    }
  }
)
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
  padding: 0px 0.66666667rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win .m-value,
.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .to-win .m-value {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: inline-block;
  padding: 0.08333333rem 0.25rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .m-betslips-stake .potential-win .m-value.m-value--loading {
  align-items: center;
  display: inline-flex;
  gap: 0.35rem;
}

.potential-win-spinner {
  border: 2px solid rgba(53, 58, 69, 0.16);
  border-radius: 50%;
  border-top-color: var(--brand-primary-button);
  display: inline-block;
  flex: 0 0 auto;
  height: 0.78rem;
  width: 0.78rem;
  -webkit-animation: loading-rotate 0.85s linear infinite;
  animation: loading-rotate 0.85s linear infinite;
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
  margin: 0.35rem 0rem;
}

.m-bet-detail-wrap .m-betslips-stake-wrapper .mg-b-5 {
  margin-bottom: 0px;
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
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  font-size: 1rem;
  padding-bottom: 1rem;
  position: relative;
  column-gap: 16px;
  background: #f5f7fa;
  border: 1px solid #e5e9ef;
  border-radius: 1rem;
  margin-top: 0.2rem;
  overflow: hidden;
  padding: 2.2rem 0.95rem 0.9rem;
}

.alternative-bet-type-option .sporty-insure-logo {
  left: 0;
  position: absolute;
  top: 0;
  width: -webkit-max-content;
  width: -moz-max-content;
  width: max-content;
  
}
.alternative-bet-type-option .desc {
  background: linear-gradient(135deg, #12b56c 0%, #0d9737 100%);
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
  margin-right: 1rem;
  padding-left: 1rem;
  position: relative;
  font-weight: 800;
  letter-spacing: 0.01em;
  box-shadow: 0 10px 24px rgba(13, 151, 55, 0.18);
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
  gap: 0.8rem;
}

.insure-panel {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.5rem;
  width: 100%;
  padding-top: 30px;
}

.insure-products-row {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.insure-products-row--secondary {
  margin-top: 0.1rem;
}

.insure-option {
  align-items: center;
  color: #9b9da1;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.9rem;
  font-weight: 600;
  gap: 0.4rem;
  padding: 0.25rem 0.1rem;
}

.insure-option:not(.disabled) {
  color: #000;
}

.insure-option.disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.insure-option.loading {
  opacity: 0.7;
}

.insure-option-input {
  appearance: none;
  -webkit-appearance: none;
  background: #ffffff;
  border: 1.5px solid #c8ced8;
  border-radius: 50%;
  cursor: inherit;
  flex: 0 0 auto;
  height: 1.35rem;
  margin: 0;
  padding: 0;
  position: relative;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease;
  width: 1.35rem;
}

.insure-option-input:checked {
  background: var(--brand-secondary);
  border-color: var(--brand-secondary);
}

.insure-option-input:checked::after {
  background: #ffffff;
  border-radius: 50%;
  content: '';
  height: 0.55rem;
  left: 50%;
  position: absolute;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 0.55rem;
}

.insure-option-input:disabled {
  cursor: not-allowed;
}

.insure-option-label {
  font-size: 0.95rem;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.insure-chip-logo {
  display: block;
  height: 1rem;
}

.insure-chip-logo--one {
  width: 2rem;
}

.insure-chip-logo--two {
  width: 2.13rem;
}

.insure-chip-icon {
  display: block;
  flex: 0 0 auto;
  height: 1.1rem;
  width: 1.23rem;
}

.insure-chip-icon path {
  transition: fill 0.18s ease;
}

.insure-option:not(.disabled) .insure-chip-icon path:nth-of-type(1) {
  fill: #000;
}

.insure-option.disabled .insure-chip-icon path:nth-of-type(1) {
  fill: #9b9da1;
}

.insure-option:not(.disabled) .insure-chip-icon path:nth-of-type(2) {
  fill: #fff;
}

.insure-option:not(.disabled) .insure-chip-icon--goals path:nth-of-type(2) {
  fill: #ffc107;
}

.insure-more-toggle {
  align-items: center;
  align-self: center;
  background: transparent;
  border: 0;
  color: #6b7280;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  font-size: 0.8rem;
  font-weight: 700;
  gap: 0.3rem;
  margin-left: auto;
  padding: 0.35rem 0.4rem;
}

.insure-more-toggle.open {
  color: var(--brand-primary-button);
}

.insure-more-toggle-caret {
  border-left: 4px solid transparent;
  border-right: 4px solid transparent;
  border-top: 5px solid currentColor;
  display: inline-block;
  height: 0;
  transition: transform 0.2s ease;
  width: 0;
}

.insure-more-toggle.open .insure-more-toggle-caret {
  transform: rotate(180deg);
}

.insure-flex-stepper {
  align-items: center;
  display: flex;
  gap: 0.6rem;
  justify-content: space-between;
  margin-top: 0.55rem;
  padding: 0.4rem 0.75rem;
}

.insure-flex-stepper-label {
  color: #353a45;
  font-size: 0.88rem;
  font-weight: 700;
}

.insure-flex-stepper-control {
  align-items: center;
  border: 1px solid #e5e9ef;
  border-radius: 0.55rem;
  display: inline-flex;
  overflow: hidden;
}

.insure-flex-stepper-action {
  align-items: center;
  background: transparent;
  border: 0;
  color: #353a45;
  cursor: pointer;
  display: inline-flex;
  font-size: 1.05rem;
  font-weight: 700;
  height: 1.85rem;
  justify-content: center;
  padding: 0;
  transition: background-color 0.18s ease, color 0.18s ease;
  width: 1.85rem;
}

.insure-flex-stepper-action:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.06);
}

.insure-flex-stepper-action:disabled {
  color: #c8ced8;
  cursor: not-allowed;
}

.insure-flex-stepper-value {
  border-left: 1px solid #e5e9ef;
  border-right: 1px solid #e5e9ef;
  color: #000;
  font-size: 0.95rem;
  font-weight: 700;
  min-width: 3rem;
  padding: 0 0.6rem;
  text-align: center;
}

.insure-row-expand-enter-active,
.insure-row-expand-leave-active {
  transition:
    opacity 0.22s ease,
    transform 0.22s ease,
    max-height 0.28s ease;
  max-height: 8rem;
  overflow: hidden;
}

.insure-row-expand-enter-from,
.insure-row-expand-leave-to {
  opacity: 0;
  max-height: 0;
  transform: translateY(-6px);
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
