<template>
  <div style="position: relative">
    <div class="m-bet-content">
      <div class="market-wrapper">
        <div class="market-header">
          <div class="m-today-tab m-tabs m-tabs-mini m-tabs-no-animation" style="overflow: hidden">
            <div class="m-tabs-nav" style="width:">
              <!-- <div class="m-tabs-ink-bar" style="display: block; width: 51.0469px; left: 0px"></div> -->
              <div
                v-for="(market, m) in marketsGroup"
                :key="m"
                class="m-tabs-tab"
                :class="market.marketID === activeMarket.marketID ? 'm-tab-active' : ''"
                @click="selectMarket(market)"
              >
                {{ market.marketName }}
              </div>
            </div>
          </div>
          <div
            v-if="showUpToggle"
            class="market-assist-rail"
            :class="{ active: upMode !== 'none', loading: isModeLoading }"
          >
            <span class="market-assist-divider"></span>
            <button
              v-for="option in modeOptions"
              :key="option.key"
              class="market-assist-pill"
              :class="[
                `market-assist-pill--${option.key}`,
                { active: upMode === option.key }
              ]"
              type="button"
              :disabled="isModeLoading"
              :aria-pressed="upMode === option.key ? 'true' : 'false'"
              :aria-label="getAssistModeAriaLabel(option)"
              @click="setUpMode(option.key)"
            >
              <span v-if="option.key === 'earlygoal'" class="market-assist-icon">⚡</span>
              <svg
                v-else-if="option.key === '1up'"
                class="market-assist-logo market-assist-logo--one"
                viewBox="0 0 60 30"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
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
              <svg
                v-else-if="option.key === '2up'"
                class="market-assist-logo market-assist-logo--two"
                viewBox="0 0 64 30"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
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
                  d="M49.4 2.1H56.8C61.4 2.1 64 4.7 64 8.7C64 12.7 61.4 15.3 56.8 15.3H55.4V27.4H49.4V2.1ZM56.1 10.5C57.6 10.5 58.5 9.8 58.5 8.7C58.5 7.5 57.6 6.9 56.1 6.9H55.4V10.5H56.1Z"
                  fill="currentColor"
                />
                <circle cx="57.8" cy="8.7" r="1.2" fill="currentColor" />
              </svg>
              <span v-else class="market-assist-label">{{ getAssistModeLabel(option) }}</span>
            </button>
          </div>
        </div>
      </div>
      <div class="fixtures-content">
        <div v-if="showLoadingMask" class="up-mode-loading-mask">
          <LoadingSpinner></LoadingSpinner>
        </div>
        <template v-if="Object.keys(fixtures).length">
          <div
            v-for="(group, index) in fixtures"
            :key="index"
            class="x-table m-sports-table football"
          >
            <div class="x-table-row m-date-row">
              <div class="x-table-cell m-date">
                {{ formatDate(index, 'DD/MM dddd') }}
              </div>
              <div class="x-table-cell market-title">
                <div
                  v-if="displayMarket.specifier !== ''"
                  style="text-transform: capitalize"
                  class="each-module is-multiline"
                >
                  {{ displayMarket.specifier }}
                </div>
                <template
                  v-for="(market, m) in _.sortBy(displayMarket.outcomes, 'outcomeID')"
                  :key="m"
                >
                  <div>
                    <span>{{ market.outcomeName }}</span>
                  </div>
                </template>
              </div>
            </div>
            <PrematchFixture
              v-for="(event, index) in group"
              :key="index"
              :eventData="event"
              :activeMarket="displayMarket"
            ></PrematchFixture>
          </div>
        </template>
        <div v-else-if="!isLoading" class="no-data">
          <div style="white-space: pre-line">
            Sorry, there are no games currently<br />available in this category. Please try later.<br />Thank
            you.!
          </div>
        </div>
      </div>
      <div class="view-all">
        <a href="#" @click.prevent="viewMore" class="">View More</a>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, computed, onMounted, onBeforeUnmount, ref, watch } from 'vue'
import { formatDate } from '@/helpers'
import PrematchFixture from '@/components/Prematch/PrematchFixture.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import _ from 'lodash'
import { useRouter } from 'vue-router'
import { useUtilsStore } from '@/stores'
import { slugify } from '@/helpers'
import emitter from '@/plugins/emitter'

const props = defineProps({
  highlightsData: Object,
  marketsGroup: Object,
  activeMarket: Object,
  effectiveMarket: Object,
  isLoading: {
    type: Boolean,
    default: false
  },
  upMode: {
    type: String,
    default: 'none'
  },
  isModeLoading: {
    type: Boolean,
    default: false
  },
  showUpToggle: {
    type: Boolean,
    default: false
  },
  modeOptions: {
    type: Array,
    default: () => []
  },
  baseLabel: {
    type: String,
    default: 'Base'
  }
})
defineComponent({
  name: 'highlights-games'
})

const emits = defineEmits(['select-market', 'set-up-mode'])
const router = useRouter()
const utilsStore = useUtilsStore()
const fixtures = ref(props.highlightsData || {})
const isLoading = computed(() => props.isLoading)
const upMode = computed(() => props.upMode || 'none')
const modeOptions = computed(() => props.modeOptions || [])

const getSportbyId = computed(() => {
  return utilsStore.sportsMenu.find((sport) => sport.sport_id == props.activeMarket.sportID)
})

const showUpToggle = computed(() => props.showUpToggle)
const isModeLoading = computed(() => props.isModeLoading)
const showLoadingMask = computed(() => props.isModeLoading)

const displayMarket = computed(() => {
  return props.effectiveMarket || props.activeMarket || {}
})

function viewMore() {
  return router.push({
    name: 'fixtures-by-sports',
    params: { sport: slugify(getSportbyId.value.sport_name) }
  })
}

const selectMarket = (market) => {
  emits('select-market', market)
}

const setUpMode = (mode) => {
  // Emit exclusive derived-market toggle state to parent.
  const nextMode = props.upMode === mode ? 'none' : mode
  emits('set-up-mode', nextMode)
}

const getAssistModeLabel = (option = {}) => {
  if (option.key === 'earlygoal') return 'EG'
  return option.label || ''
}

const getAssistModeAriaLabel = (option = {}) => {
  return option.key === 'earlygoal' ? 'Toggle Early Goals' : `Toggle ${option.label || option.key}`
}

const removeFixtureByMatchId = (matchId) => {
  const current = fixtures.value || {}
  const next = {}
  Object.entries(current).forEach(([key, list]) => {
    const filtered = (list || []).filter(
      (fixture) =>
        String(fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id) !==
        String(matchId)
    )
    if (filtered.length) {
      next[key] = filtered
    }
  })
  fixtures.value = next
}

const applyValidatedSelections = (selections) => {
  console.log('[odds-validated][Highlights] incoming', selections)
  if (!Array.isArray(selections) || selections.length === 0) return
  const selectionsByMatch = selections.reduce((acc, selection) => {
    const key = String(selection.match_id ?? selection.matchID ?? selection.matchId ?? '')
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(selection)
    return acc
  }, {})
  console.log('[odds-validated][Highlights] matches', Object.keys(selectionsByMatch).length)

  const next = {}
  Object.entries(fixtures.value || {}).forEach(([key, list]) => {
    next[key] = (list || []).map((fixture) => {
      const fixtureMatchId = String(
        fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id ?? ''
      )
      const matchSelections = selectionsByMatch[fixtureMatchId]
      if (!matchSelections) {
        return fixture
      }
      if (!Array.isArray(fixture.outcomes)) {
        console.log('[odds-validated][Highlights] no outcomes for match', fixtureMatchId)
        return fixture
      }
      if (!matchSelections || !Array.isArray(fixture.outcomes)) {
        return fixture
      }
      const nextOutcomes = fixture.outcomes.map((outcome) => {
        const match = matchSelections.find((sel) => {
          const specifier = String(outcome.specifier || '')
          const selSpecifier = String(sel.specifier || '')
          return (
            String(outcome.marketID) === String(sel.market_id) &&
            String(outcome.outcomeID) === String(sel.outcome_id) &&
            specifier === selSpecifier
          )
        })
        if (!match) {
          return outcome
        }
        console.log('[odds-validated][Highlights] update', {
          matchId: fixtureMatchId,
          marketId: outcome.marketID,
          outcomeId: outcome.outcomeID,
          specifier: outcome.specifier || '',
          from: outcome.odds,
          to: match.odds,
          status: match.status_name
        })
        if (!match) return outcome
        const statusName = String(match.status_name || '').toLowerCase()
        const active =
          statusName === 'suspended' || statusName === 'deactivated'
            ? 0
            : match.active ?? outcome.active
        return {
          ...outcome,
          odds: match.odds ?? outcome.odds,
          active
        }
      })
      return { ...fixture, outcomes: nextOutcomes }
    })
  })
  fixtures.value = next
}

watch(
  () => props.highlightsData,
  (nextValue) => {
    fixtures.value = nextValue || {}
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  emitter.on('remove-fixture', removeFixtureByMatchId)
  emitter.on('odds-validated', applyValidatedSelections)
})

onBeforeUnmount(() => {
  emitter.off('remove-fixture', removeFixtureByMatchId)
  emitter.off('odds-validated', applyValidatedSelections)
})

// const activeMarketId = ref(props.marketsGroup.markets[0].id)
</script>

<style scoped>
.home .m-sports .m-today-tab .m-tabs-tab {
  color: #353a45;
  color: var(--c-sports-prematch-market-title-text);
  -webkit-box-flex: initial;
  -webkit-flex: initial;
  -ms-flex: initial;
  flex: initial;
  font-size: 1.066rem;
  margin: 0;
  padding: 0.33333333rem 0.91666667rem;
  text-transform: capitalize;
  /* width: calc(100); */
}

.market-header {
  align-items: center;
  display: flex;
  gap: 0.25rem;
  overflow: hidden;
}

.market-header .m-today-tab {
  flex: 1;
  min-width: 0;
}

.market-assist-rail {
  align-items: center;
  background: linear-gradient(
    90deg,
    rgba(250, 250, 250, 0) 0%,
    var(--background-general-primary, #fafafa) 28%,
    var(--background-general-primary, #fafafa) 100%
  );
  display: flex;
  flex: 0 0 auto;
  gap: 0.3rem;
  min-height: 2.75rem;
  padding: 0 0.55rem 0 0.25rem;
  position: relative;
  z-index: 2;
}

.market-assist-divider {
  background: #c8cdd7;
  border-radius: 999px;
  display: inline-block;
  height: 1.7rem;
  margin-right: 0.15rem;
  width: 1px;
}

.market-assist-pill {
  align-items: center;
  background: linear-gradient(180deg, #ffffff 0%, #f5f7fa 48%, #edf1f5 100%);
  border: 1px solid #d5dbe5;
  border-radius: 999px;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.9),
    0 2px 6px rgba(16, 24, 40, 0.06);
  color: #8f96a5;
  cursor: pointer;
  display: inline-flex;
  font-size: 0.82rem;
  font-weight: 900;
  gap: 0.18rem;
  height: 2.05rem;
  justify-content: center;
  letter-spacing: -0.03em;
  min-width: 3.05rem;
  padding: 0 0.58rem;
  text-transform: uppercase;
  transition:
    background 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.market-assist-pill.active {
  background: linear-gradient(180deg, #ffffff 0%, #f8fffb 46%, #eaf8ef 100%);
  border-color: #20bd62;
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.95),
    0 0 0 1px rgba(32, 189, 98, 0.1),
    0 4px 12px rgba(21, 168, 83, 0.12);
  color: #111827;
}

.market-assist-pill:active {
  transform: translateY(1px);
}

.market-assist-pill:disabled {
  cursor: wait;
  opacity: 0.72;
}

.market-assist-pill--earlygoal {
  min-width: 3.25rem;
}

.market-assist-pill--1up,
.market-assist-pill--2up {
  min-width: 3.45rem;
  padding: 0 0.48rem;
}

.market-assist-logo {
  display: block;
  height: 1.18rem;
  width: auto;
}

.market-assist-logo--one {
  width: 2.45rem;
}

.market-assist-logo--two {
  width: 2.62rem;
}

.market-assist-icon {
  align-items: center;
  background: currentColor;
  border-radius: 999px;
  color: inherit;
  display: inline-flex;
  font-size: 0.66rem;
  height: 1.12rem;
  justify-content: center;
  line-height: 1;
  position: relative;
  width: 1.12rem;
}

.market-assist-pill:not(.active) .market-assist-icon {
  background: #eef2f7;
  color: #9aa3b2;
}

.market-assist-pill.active .market-assist-icon {
  background: #18b95f;
  color: #ffffff;
}

.fixtures-content {
  position: relative;
}

.up-mode-loading-mask {
  align-items: center;
  background: rgba(250, 250, 250, 0.85);
  display: flex;
  inset: 0;
  justify-content: center;
  position: absolute;
  z-index: 3;
}

.m-sports .nav-fixed .market-wrapper {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  position: fixed;
  top: 7.55rem;
  -webkit-transition: top 0.3s ease !important;
  transition: top 0.3s ease !important;
  width: 100%;
  z-index: 100;
}

.m-tabs-tab {
  line-height: 2rem !important;
  margin-right: 10px !important;
}

.m-tabs-tab:last-child {
  margin-right: 0px !important;
}
.m-tab-active {
  border-bottom: 3px solid var(--c-prematch-tab-name-active);
}

.m-tabs-tab {
  width: auto !important;
}
</style>
