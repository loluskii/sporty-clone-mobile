<template>
  <div class="m-bet-container" :class="selection.changed ? 'm-change-item animated' : ''">
    <div class="m-outcomes-color" :style="matchGroupStyle"></div>
    <div class="m-outcome-right">
      <div class="m-selection-header">
        <button type="button" class="m-selection-event" @click="goToGame">
          <span v-if="showSelectionBadges" class="selection-status-badges">
            <span v-if="isLiveSelection" class="selection-status-badge selection-status-badge--live">
              Live
            </span>
            <span
              v-if="selectionStatusBadgeLabel"
              class="selection-status-badge selection-status-badge--state"
              :class="{
                'selection-status-badge--suspended': props.selection.suspended,
                'selection-status-badge--unavailable': props.selection.unavailable
              }"
            >
              {{ selectionStatusBadgeLabel }}
            </span>
          </span>
          <span>{{ selection.eventName }}</span>
        </button>
        <div class="m-selection-actions">
          <button
            v-if="showBanker"
            type="button"
            class="banker-badge"
            :class="{ active: !!selection?.fixed }"
            :aria-pressed="selection?.fixed ? 'true' : 'false'"
            aria-label="Select as banker"
            @click.stop.prevent="toggleBanker"
          >
            B
          </button>
          <button
            type="button"
            class="m-selection-remove"
            aria-label="Remove selection"
            @click.stop.prevent="removeSelection"
          >
            <span class="m-selection-remove-icon"></span>
          </button>
        </div>
      </div>

      <div class="m-selection-body" @click="goToGame">
        <div class="m-team-cell">
          <div class="m-outcome-desc-wrapper">
            <div class="m-outcome-desc" style="text-transform: capitalize">
              {{ selection.outcomeName }}
            </div>
            <div
              class="m-outcome-odds"
              :class="{
                'm-outcome-up': oddUp && !selectionIsUnavailable,
                'm-outcome-down': oddDown && !selectionIsUnavailable
              }"
            >
              <span v-if="!selectionIsUnavailable">{{ getSelectionOdds(selection.odds) }} </span>
            </div>
          </div>

          <div class="m-market-desc-wrapper">
            <div class="selection-market-meta">
              <div class="selection-market-copy">
                <div class="m-market-desc">
                  <span>{{ displayMarketName }}</span>
                  <span v-if="showUnsupportedEarlyWin" class="selection-earlywin-unsupported">
                    - 1UP/2UP not supported
                  </span>
                  <span v-else-if="showUnsupportedEarlyGoal" class="selection-earlywin-unsupported">
                    - Early goal not supported
                  </span>
                </div>
              </div>
              <div v-if="showEarlyWinControls" class="selection-earlywin-controls" @click.stop>
                <button
                  type="button"
                  class="selection-earlywin-pill selection-earlywin-pill--one"
                  :class="{ active: selection.earlyWinMode === '1up' }"
                  aria-label="1UP"
                  :disabled="!canRequestMode('1up') || isLoadingUpMode"
                  @click.stop.prevent="toggleSelectionMode('1up')"
                >
                  <span class="selection-earlywin-pill-surface">
                    <svg
                      class="selection-earlywin-pill-logo selection-earlywin-pill-logo--one"
                      viewBox="0 0 60 30"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.2 6.3L11.8 1.5H17.2V27.4H10.2V10.2L6.1 12.5L3.2 6.3Z"
                        :fill="getEarlyWinAccentFill('1up')"
                      />
                      <path
                        d="M20.5 2.1H27.8V16.7C27.8 19.1 29 20.5 31.3 20.5C33.6 20.5 34.8 19.1 34.8 16.7V2.1H42.1V17C42.1 24.1 38 28 31.3 28C24.6 28 20.5 24.1 20.5 17V2.1Z"
                        :fill="getEarlyWinNeutralFill('1up')"
                      />
                      <path
                        d="M44.7 2.1H52.1C56.7 2.1 59.3 4.7 59.3 8.7C59.3 12.7 56.7 15.3 52.1 15.3H50.7V27.4H44.7V2.1ZM51.4 10.5C52.9 10.5 53.8 9.8 53.8 8.7C53.8 7.5 52.9 6.9 51.4 6.9H50.7V10.5H51.4Z"
                        :fill="getEarlyWinNeutralFill('1up')"
                      />
                      <circle cx="53.1" cy="8.7" r="1.2" :fill="getEarlyWinDotFill('1up')" />
                    </svg>
                  </span>
                </button>
                <button
                  type="button"
                  class="selection-earlywin-pill selection-earlywin-pill--two"
                  :class="{ active: selection.earlyWinMode === '2up' }"
                  aria-label="2UP"
                  :disabled="!canRequestMode('2up') || isLoadingUpMode"
                  @click.stop.prevent="toggleSelectionMode('2up')"
                >
                  <span class="selection-earlywin-pill-surface">
                    <svg
                      class="selection-earlywin-pill-logo selection-earlywin-pill-logo--two"
                      viewBox="0 0 64 30"
                      xmlns="http://www.w3.org/2000/svg"
                      aria-hidden="true"
                    >
                      <path
                        d="M3.5 9.2C3.5 4.3 7.3 1.5 13.1 1.5C18.8 1.5 22.2 4.1 22.2 8.4C22.2 11.6 20.5 13.8 16.7 16.1L11.6 19.2H22.5V27.4H3.6V21.1L13.1 15.1C15 13.9 15.7 12.9 15.7 11.5C15.7 10.1 14.6 9.2 12.9 9.2C11 9.2 9.8 10.4 9.8 12.4H3.5V9.2Z"
                        :fill="getEarlyWinAccentFill('2up')"
                      />
                      <path
                        d="M25.2 2.1H32.5V16.7C32.5 19.1 33.7 20.5 36 20.5C38.3 20.5 39.5 19.1 39.5 16.7V2.1H46.8V17C46.8 24.1 42.7 28 36 28C29.3 28 25.2 24.1 25.2 17V2.1Z"
                        :fill="getEarlyWinNeutralFill('2up')"
                      />
                      <path
                        d="M49.4 2.1H56.8C61.4 2.1 64 4.7 64 8.7C64 12.7 61.4 15.3 56.8 15.3H55.4V27.4H49.4V2.1ZM56.1 10.5C57.6 10.5 58.5 9.8 58.5 8.7C58.5 7.5 57.6 6.9 56.1 6.9H55.4V10.5H56.1Z"
                        :fill="getEarlyWinNeutralFill('2up')"
                      />
                      <circle cx="57.8" cy="8.7" r="1.2" :fill="getEarlyWinDotFill('2up')" />
                    </svg>
                  </span>
                </button>
              </div>
              <div v-else-if="showEarlyGoalControl" class="selection-earlywin-controls" @click.stop>
                <button
                  type="button"
                  class="selection-earlywin-pill selection-earlygoal-pill"
                  :class="{ active: selection.earlyGoalMode === 'earlygoal' }"
                  aria-label="Early Goals"
                  :disabled="couponStore.isEarlyGoalLoading"
                  @click.stop.prevent="toggleSelectionEarlyGoal"
                >
                  <span class="selection-earlywin-pill-surface">
                    <span class="selection-earlygoal-pill-label">Early Goals</span>
                  </span>
                </button>
              </div>
            </div>

            <span
              tabindex="0"
              class="m-keybord-input"
              @click.stop="openKeyboard"
              style="--fontsize: inherit"
              v-html="selection.stake"
              v-if="betSlipType === 'Single' && selectionsLength > 1"
            ></span>
          </div>
        </div>
      </div>
    </div>
    <div>
      <BetlistStakeKeyboard
        :keyboard-visible="isKeyboardVisible"
        @button-click="onKeyClick"
        @hide-keyboard="hideKeyboard"
      ></BetlistStakeKeyboard>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits, computed, toRef, inject } from 'vue'
import { useRouter } from 'vue-router'
import { useCouponStore } from '@/stores'
import BetlistStakeKeyboard from './BetlistStakeKeyboard.vue'
import { useOddsChangeIndicator } from '@/composables/useOddsChangeIndicator'
import { useMatchGroupStyle } from '@/composables/useMatchGroupStyle'
import { useSelectionStakeKeyboard } from '@/composables/useSelectionStakeKeyboard'
import {
  formatEarlyGoalMarketName,
  formatEarlyWinMarketName,
  getBaseMarketIdFromMarketId,
  getDerivedMarketIdForMode,
  stripEarlyGoalSuffix,
  stripEarlyWinSuffix
} from '@/helpers'

const couponStore = useCouponStore()
const emit = defineEmits(['toggle-betslip', 'on-selection-input', 'update-selection', 'toggle-banker'])
const router = useRouter()
const { isLoadingUpMode, isBulkEarlyWinEnabled, setSelectionUpMode } = inject('betslipUpMode', {
  isLoadingUpMode: { value: false },
  isBulkEarlyWinEnabled: { value: false },
  setSelectionUpMode: () => {}
})

const props = defineProps({
  selection: Object,
  betSlipType: String,
  betType: String,
  activeSelectionId: Number,
  showBanker: Boolean
})
const selectionRef = toRef(props, 'selection')
const { oddUp, oddDown } = useOddsChangeIndicator(computed(() => selectionRef.value?.odds))
const { matchGroupStyle } = useMatchGroupStyle(selectionRef)
const { isKeyboardVisible, openKeyboard, hideKeyboard, onKeyClick } = useSelectionStakeKeyboard(
  selectionRef,
  {
    onOpen: () => emit('on-selection-input', selectionRef.value?.matchId || 0),
    onClose: () => emit('on-selection-input', 0)
  }
)

const selectionsLength = computed(() => {
  return couponStore.coupon.selections.length
})

const selectionSportId = computed(() => {
  return Number(
    props.selection?.sportId ||
      props.selection?.sportID ||
      props.selection?.sport_id ||
      props.selection?.fixture?.sport_id ||
      0
  )
})

const isLiveSelection = computed(() => {
  return props.selection?.type === 'live'
})

const selectionIsUnavailable = computed(() => {
  return Boolean(props.selection?.unavailable || props.selection?.suspended)
})

const isEarlyWinModeActive = (mode) => props.selection?.earlyWinMode === mode

const getEarlyWinAccentFill = (mode) => {
  return isEarlyWinModeActive(mode) ? '#111827' : '#9ca3af'
}

const getEarlyWinNeutralFill = (mode) => {
  return isEarlyWinModeActive(mode) ? '#111827' : '#9ca3af'
}

const getEarlyWinDotFill = (mode) => {
  return isEarlyWinModeActive(mode) ? '#111827' : '#d1d5db'
}

const supportsMode = (mode) => {
  return Array.isArray(props.selection?.supportedEarlyWinModes)
    ? props.selection.supportedEarlyWinModes.includes(mode)
    : false
}

const currentSelectionBaseMarketId = computed(() => {
  const marketId = Number(props.selection?.marketId || props.selection?.market_id || 0)
  return Number(props.selection?.baseMarketId || getBaseMarketIdFromMarketId(marketId) || marketId || 0)
})

const canRequestMode = (mode) => {
  if (supportsMode(mode)) return true
  if (currentSelectionBaseMarketId.value !== 1) return false

  const currentMode = props.selection?.earlyWinMode || 'base'
  const hasDerivedContext =
    props.selection?.hasExplicitDerivedMarkets ||
    currentMode === '1up' ||
    currentMode === '2up'
  if (!hasDerivedContext) return false

  return Boolean(
    getDerivedMarketIdForMode(
      currentSelectionBaseMarketId.value,
      mode,
      props.selection?.supportedDerivedMarketIds
    )
  )
}

const displayMarketName = computed(() => {
  const marketName = String(props.selection?.marketName || '').trim()
  const baseMarketName = String(props.selection?.baseMarketName || marketName).trim()

  if (currentSelectionBaseMarketId.value === 18) {
    const normalizedBaseMarketName = stripEarlyGoalSuffix(baseMarketName) || stripEarlyGoalSuffix(marketName) || baseMarketName
    return props.selection?.earlyGoalMode === 'earlygoal'
      ? formatEarlyGoalMarketName(normalizedBaseMarketName, 'earlygoal')
      : normalizedBaseMarketName
  }

  if (currentSelectionBaseMarketId.value === 1) {
    const normalizedBaseMarketName = stripEarlyWinSuffix(baseMarketName) || stripEarlyWinSuffix(marketName) || baseMarketName
    const mode = props.selection?.earlyWinMode || 'base'
    return mode === 'base'
      ? normalizedBaseMarketName
      : formatEarlyWinMarketName(normalizedBaseMarketName, mode)
  }

  return marketName || baseMarketName
})

const showEarlyWinControls = computed(() => {
  return (
    currentSelectionBaseMarketId.value === 1 &&
    Array.isArray(props.selection?.supportedEarlyWinModes) &&
    props.selection.supportedEarlyWinModes.length > 0
  )
})

const showEarlyGoalControl = computed(() => {
  return (
    currentSelectionBaseMarketId.value === 18 &&
    (props.selection?.supportsEarlyGoal || props.selection?.earlyGoalMode === 'earlygoal')
  )
})

const toggleSelectionMode = async (mode) => {
  if (!canRequestMode(mode) || isLoadingUpMode.value) return
  await setSelectionUpMode(props.selection, mode)
}

const toggleSelectionEarlyGoal = async () => {
  if (!showEarlyGoalControl.value || couponStore.isEarlyGoalLoading) return
  await couponStore.setSelectionEarlyGoalMode(props.selection, 'earlygoal')
}

const showUnsupportedEarlyWin = computed(() => {
  return (
    isBulkEarlyWinEnabled.value &&
    selectionSportId.value === 1 &&
    !props.selection?.supportsEarlyWin &&
    currentSelectionBaseMarketId.value === 1 &&
    (props.selection?.earlyWinMode || 'base') === 'base'
  )
})

const showUnsupportedEarlyGoal = computed(() => {
  if (!couponStore.coupon.useEarlyGoal) return false
  if (selectionSportId.value !== 1) return false
  if (currentSelectionBaseMarketId.value !== 18) return false
  if (props.selection?.supportsEarlyGoal) return false
  return true
})

// Add a computed property to get the specific unavailability reason
const getUnavailabilityReason = computed(() => {
  // If explicitly marked as unavailable
  if (props.selection.unavailable) {
    return 'Unavailable'
  }

  // If suspended
  if (props.selection.suspended) {
    return 'Suspended'
  }

  // Check if expired based on time
  // const parsedDate = new Date(props.selection.eventDate);
  // const currentDate = new Date();
  // const difference = currentDate - parsedDate;
  // const hoursDifference = difference / (1000 * 60 * 60);

  // if (hoursDifference >= 3) {
  //   return "unavailable";
  // }

  // return "unavailable";
})

const selectionStatusBadgeLabel = computed(() => {
  if (props.selection?.unavailable) {
    return 'Unavailable'
  }

  if (props.selection?.suspended) {
    return 'Suspended'
  }

  return ''
})

const showSelectionBadges = computed(() => {
  return isLiveSelection.value || Boolean(selectionStatusBadgeLabel.value)
})

const getImageSrc = (sportId, sport) => {
  let imageUrl
  imageUrl = new URL(`../../assets/images/sports/${sportId}.png`, import.meta.url)
  return imageUrl
}

const getSelectionOdds = (odds) => {
  if (typeof odds === 'string') {
    return odds
  } else {
    return odds.toFixed(2)
  }
}

async function removeSelection() {
  await couponStore.removeSelection(props.selection.selectionId || props.selection.id)
}

function goToGame() {
  emit('toggle-betslip')
  let route_name = 'fixtures-detail'
  if (props.selection.type == 'live') {
    route_name = 'live-fixtures-detail'
  }
  return router.push({
    name: route_name,
    params: {
      sport: props.selection.sport,
      tournament_name: props.selection.tournament,
      event_name: props.selection.eventName,
      event_id: props.selection.matchId
    }
  })
}

function toggleBanker() {
  emit('toggle-banker', props.selection)
}
</script>

<style>
.m-bet-container {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  position: relative;
  background-color: #fff;
  border: 1px solid #eaecef;
  border-color: var(--brand-border-type1);
  border-radius: 0.85rem;
  box-shadow: 0 8px 22px rgba(17, 24, 39, 0.05);
  margin: 0.55rem 0.667rem;
  overflow: hidden;
}
.m-bet-container.m-change-item,
.m-bet-container.m-item-error,
.m-bet-container.m-sim-invalid {
  background-color: #ffe3e5;
}
.m-bet-container .m-outcomes-color {
  border-radius: 999px;
  height: calc(100% - 1rem);
  left: 0;
  position: absolute;
  top: 0.5rem;
  width: 4px;
}
.m-bet-container.is-single {
  padding-bottom: 0.5rem;
}
.m-bet-container.is-single .m-outcomes-row .m-outcome-right {
  border-bottom: none;
}
.m-bet-container.is-single .m-outcomes-opt {
  -webkit-align-self: flex-end;
  -ms-flex-item-align: end;
  align-self: flex-end;
  padding-bottom: 0.25rem;
  padding-top: 0.41667rem;
}
.m-bet-container.is-single:not(:last-child)::after {
  background-color: #eaecef;
  background-color: var(--background-type1-tertiary);
  bottom: 0;
  content: '';
  height: 1px;
  position: absolute;
  right: 0;
  width: 90%;
}

.m-bet-container .m-outcomes-row {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  overflow: hidden;
  position: relative;
}
.m-bet-container .m-outcomes-row .m-outcomes-opt {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  text-align: center;
  width: 2rem;
  padding-top: 0.7rem;
}
.m-bet-container .m-outcomes-row .m-outcomes-opt::before {
  content: '\e69a';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-container .m-outcomes-row .m-outcomes-opt:before {
  color: #000000;
  color: var(--c-betslip-item-cross-icon);
  font-size: 1.13333333rem;
}
.m-bet-container .m-outcomes-row .m-outcome-right {
  -webkit-box-flex: 1;
  -webkit-flex: 1 0 0%;
  -ms-flex: 1 0 0%;
  flex: 1 0 0%;
  overflow: hidden;
  border-bottom: 0;
}
.m-bet-container .m-outcomes-row .m-team-row {
  -webkit-align-content: center;
  -ms-flex-line-pack: center;
  align-content: center;
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #353a45;
  color: var(--text-type1-primary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  align-items: flex-start;
  padding: 0.75rem 0.9rem 0.75rem 0.5rem;
  position: relative;
}

.banker-badge {
  align-items: center;
  background: #ffffff;
  border: 2px solid #0d9737;
  border-radius: 50%;
  color: #0d9737;
  display: inline-flex;
  font-size: 0.85rem;
  font-weight: 700;
  height: 26px;
  justify-content: center;
  margin-left: 0.5rem;
  width: 26px;
}
.banker-badge.active {
  background: #0d9737;
  color: #ffffff;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  -webkit-box-flex: 1;
  -webkit-flex: 1 0 0%;
  -ms-flex: 1 0 0%;
  flex: 1 0 0%;
  overflow: hidden;
  /* padding-right: 0.83333333rem; */
  position: relative;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell > a {
  color: #353a45;
  color: var(--text-type1-primary);
  display: block;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-outcome-desc-wrapper,
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-vs-wrapper,
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-market-desc-wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  max-width: 100%;
  overflow: hidden;
  width: 100%;
}

.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-market-desc-wrapper {
  align-items: flex-end;
  gap: 0.75rem;
  margin-top: 0.55rem;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .sim-unavailable-label,
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-vs-wrapper .sim-unavailable-label,
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-market-desc-wrapper
  .sim-unavailable-label {
  background-color: #eaecef;
  color: #9ca0ab;
  padding-left: 1rem;
  padding-right: 1rem;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-outcome-desc-wrapper {
  font-size: 1.1rem;
  font-weight: bold;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-outcome-desc-wrapper .m-outcome-desc {
  -webkit-box-flex: 1;
  -webkit-flex: 1 1 0%;
  -ms-flex: 1 1 0%;
  flex: 1 1 0%;
  overflow: hidden;
  padding-right: 0.83333333rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-desc:before {
  display: inline-block;
  padding-right: 0.41666667rem;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-outcome-desc-wrapper .m-outcome-odds {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  white-space: nowrap;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-odds.m-outcome-up::before {
  content: '\e609';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-odds.m-outcome-up:before {
  color: var(--brand-highlight-text);
  color: var(--brand-secondary);
  display: inline-block;
  padding-right: 0.83333333rem;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-odds.m-outcome-down::before {
  content: '\e605';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-odds.m-outcome-down:before {
  color: #e41827;
  color: var(--warning-primary);
  display: inline-block;
  padding-right: 0.83333333rem;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-odds.m-outcome-del {
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
  font-size: 1rem;
  text-decoration: line-through;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-odds.m-outcome-del:before {
  content: '';
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-outcome-desc-wrapper .m-outcome-boost {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  margin-left: 0.58333333rem;
  overflow: hidden;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .number-grow-warp {
  background: -webkit-gradient(linear, left top, right top, from(#40208c), to(#1e0e53));
  background: -webkit-linear-gradient(left, #40208c, #1e0e53);
  background: linear-gradient(to right, #40208c, #1e0e53);
  font-size: 1.33333333rem;
  height: 1.66666667rem;
  line-height: 1.66666667rem;
  padding: 0.08333333rem 0.25rem;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-suspended,
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-outcome-desc-wrapper
  .m-outcome-unavailable {
  background-color: #eaecef;
  background-color: var(--background-type1-tertiary);
  border-radius: 2px;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  font-size: 0.83333333rem;
  height: 1.33333333rem;
  line-height: 1.33333333rem;
  padding: 0 0.83333333rem;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-outcome-desc-wrapper .m-status-fixed {
  height: 1.066rem;
  line-height: 1.066rem;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-vs-wrapper {
  color: #6b7280;
  font-size: 0.92rem;
  line-height: 1.35;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-vs-wrapper .m-icon-live {
  background-color: var(--brand-secondary);
  filter: opacity(0.5);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #fff;
  /* color: var(--c-betslip-live-label-text); */
  display: block;
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  font-size: 1rem;
  height: 1.33333333rem;
  line-height: 1.33333333rem;
  margin-right: 0.41666667rem;
  padding: 0 0.25rem;
  position: relative;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-vs-wrapper > div:nth-of-type(1) {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  padding-right: 0.83333333rem;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-vs-wrapper > div:last-child {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-market-desc-wrapper {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  font-size: 1.066rem;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-market-desc-wrapper .m-market-desc {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  margin-right: 0.66666667rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-market-desc-wrapper
  .m-market-desc
  .delay-icon {
  line-height: 1;
  margin-left: 0.33333333rem;
  vertical-align: -10%;
  width: 1rem;
}
.m-bet-container .m-outcomes-row .m-team-row .m-team-cell .m-market-desc-wrapper .m-desc {
  color: #353a45;
  color: var(--text-type1-primary);
  display: inline-block;
  margin-left: 3.33333333rem;
  max-width: calc(100% - 1.66666667rem);
  overflow: hidden;
  text-overflow: ellipsis;
  vertical-align: middle;
  white-space: nowrap;
}
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-market-desc-wrapper
  .m-outcome-suspended,
.m-bet-container
  .m-outcomes-row
  .m-team-row
  .m-team-cell
  .m-market-desc-wrapper
  .m-outcome-unavailable {
  background-color: #eaecef;
  background-color: var(--background-type1-tertiary);
  border-radius: 2px;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  font-size: 0.83333333rem;
  height: 1.33333333rem;
  line-height: 1.33333333rem;
  padding: 0 0.83333333rem;
}

.m-bet-container .m-outcomes-row .m-team-row .m-outcome-dan-wrapper {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
}
.m-bet-container:last-child .m-outcome-right {
  border: 0px;
}

.selection-market-meta {
  align-items: flex-end;
  display: flex;
  flex: 1;
  gap: 0.75rem;
  min-width: 0;
}

.selection-market-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
}

.selection-market-copy .m-market-desc {
  color: #67707c;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.selection-earlywin-controls {
  align-items: center;
  display: inline-flex;
  flex-wrap: wrap;
  gap: 0.45rem;
}

.selection-earlywin-pill {
  align-items: center;
  background: transparent;
  border: 0;
  cursor: pointer;
  display: inline-flex;
  justify-content: center;
  padding: 0;
  transition: transform 0.18s ease;
}

.selection-earlywin-pill-surface {
  --badge-border: linear-gradient(to bottom right, #d1d5db, #9ca3af);
  align-items: center;
  background: linear-gradient(to bottom, #ffffff 0%, #f3f4f6 50%, #e5e7eb 100%);
  border-radius: 1rem;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.05);
  display: inline-flex;
  height: 2.1rem;
  justify-content: center;
  overflow: hidden;
  padding: 0 0.3rem;
  position: relative;
  transition:
    background 0.18s ease,
    box-shadow 0.18s ease;
}

.selection-earlywin-pill--one .selection-earlywin-pill-surface {
  min-width: 3.5rem;
}

.selection-earlywin-pill--two .selection-earlywin-pill-surface {
  min-width: 3.5rem;
}

.selection-earlygoal-pill .selection-earlywin-pill-surface {
  min-width: 5.8rem;
  padding: 0 0.75rem;
}

.selection-earlywin-pill-surface::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  padding: 2px;
  background: var(--badge-border);
  -webkit-mask:
    linear-gradient(#fff 0 0) content-box,
    linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
}

.selection-earlywin-pill-surface::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 1rem;
  background: linear-gradient(to bottom, rgba(255, 255, 255, 0.55), rgba(255, 255, 255, 0));
  pointer-events: none;
}

.selection-earlywin-pill-logo {
  display: block;
  height: auto;
  position: relative;
  z-index: 3;
}

.selection-earlywin-pill-logo--one {
  width: 2.2rem;
}

.selection-earlywin-pill-logo--two {
  width: 2.2rem;
}

.selection-earlygoal-pill-label {
  color: #9ca3af;
  font-size: 0.72rem;
  font-style: italic;
  font-weight: 800;
  letter-spacing: 0.03em;
  position: relative;
  text-transform: uppercase;
  z-index: 3;
}

.selection-earlywin-pill.active .selection-earlywin-pill-surface {
  --badge-border: linear-gradient(to bottom right, #cbd5e1, #6b7280);
  background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 45%, #edf2f7 100%);
}

.selection-earlywin-pill--one.active .selection-earlywin-pill-surface {
  --badge-border: linear-gradient(to bottom right, #cbd5e1, #6b7280);
  background: linear-gradient(to bottom, #ffffff 0%, #f8fafc 45%, #edf2f7 100%);
}

.selection-earlygoal-pill.active .selection-earlygoal-pill-label {
  color: #111827;
}

.selection-earlywin-pill:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.selection-earlywin-unsupported {
  color: #8d929b;
  display: inline;
  font-size: 0.76rem;
  font-weight: 600;
  line-height: 1.3;
  margin-left: 0.2rem;
  white-space: nowrap;
}

.m-keybord-input {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  border: 1px solid #9ca0ab;
  border-color: #9ca0ab;
  border-color: var(--text-disable-type1-primary);
  border-radius: 0.25rem;
  color: #353a45;
  color: var(--text-type1-primary);
  display: inline-block;
  height: 2.33333333rem;
  line-height: 2.33333333rem;
  outline: none;
  padding: 0 0.83333333rem;
  position: relative;
  -webkit-tap-highlight-color: rgba(0, 0, 0, 0);
  text-align: right;
  width: 7.5rem;
}

.m-bet-container .m-outcome-right {
  padding-left: 0.9rem;
}

.m-selection-header {
  align-items: center;
  border-bottom: 1px solid #e7ebf0;
  border-bottom-color: var(--brand-border-type1);
  display: flex;
  gap: 0.75rem;
  justify-content: space-between;
  padding: 0.8rem 0.95rem 0.75rem 0;
}

.m-selection-event {
  align-items: center;
  background: transparent;
  border: 0;
  color: #4b5563;
  cursor: pointer;
  display: flex;
  flex: 1;
  font-size: 0.9rem;
  font-weight: 700;
  gap: 0.45rem;
  min-width: 0;
  padding: 0;
  text-align: left;
}

.selection-status-badges {
  align-items: center;
  display: inline-flex;
  flex: 0 0 auto;
  flex-wrap: wrap;
  gap: 0.35rem;
}

.selection-status-badge {
  align-items: center;
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  line-height: 1;
  min-height: 1.35rem;
  padding: 0.2rem 0.5rem;
  text-transform: uppercase;
  white-space: nowrap;
}

.selection-status-badge--live {
  background: linear-gradient(135deg, #ff6b6b 0%, #e03131 100%);
  color: #ffffff;
}

.selection-status-badge--state {
  background: #f3f4f6;
  color: #6b7280;
}

.selection-status-badge--suspended {
  background: linear-gradient(135deg, #fff4db 0%, #ffe8b3 100%);
  color: #9a6700;
}

.selection-status-badge--unavailable {
  background: linear-gradient(135deg, #f1f3f5 0%, #e5e7eb 100%);
  color: #6b7280;
}

.m-selection-event > span:last-child {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-selection-actions {
  align-items: center;
  display: inline-flex;
  gap: 0.45rem;
}

.m-selection-remove {
  align-items: center;
  background: #eff2f5;
  border: 0;
  border-radius: 999px;
  color: #6b7280;
  cursor: pointer;
  display: inline-flex;
  flex: 0 0 auto;
  height: 1.9rem;
  justify-content: center;
  padding: 0;
  width: 1.9rem;
}

.m-selection-remove-icon::before {
  content: '\e69a';
  font-family: 'iconfont' !important;
  font-size: 0.9rem;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-selection-body {
  cursor: pointer;
  padding: 0.95rem 0.95rem 0.95rem 0;
}

.m-selection-body .m-team-cell {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
}

.m-selection-body .m-outcome-desc-wrapper,
.m-selection-body .m-market-desc-wrapper {
  align-items: center;
  display: flex;
  justify-content: space-between;
  gap: 0.8rem;
  max-width: 100%;
  width: 100%;
}

.m-selection-body .m-market-desc-wrapper {
  align-items: flex-end;
}

.m-selection-body .m-outcome-desc-wrapper {
  font-size: 1.1rem;
  font-weight: 700;
}

.m-selection-body .m-outcome-desc {
  flex: 1 1 0%;
  min-width: 0;
  padding-right: 0.83333333rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-selection-body .m-outcome-odds {
  flex: 0 0 auto;
  white-space: nowrap;
}

.m-selection-body .selection-market-meta {
  align-items: flex-start;
  display: flex;
  flex: 1;
  gap: 0.75rem;
  min-width: 0;
}

.m-selection-body .selection-market-copy {
  display: flex;
  flex: 1;
  flex-direction: column;
  gap: 0.18rem;
  min-width: 0;
}

.m-selection-body .selection-market-copy .m-market-desc {
  color: #67707c;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.m-selection-body .selection-earlywin-unsupported {
  margin-left: 0;
}
</style>
