<template>
  <div class="m-event-list">
    <HeaderOther :header-title="'Live'" />
    <div v-if="isLoading">
      <LoadingSpinner />
    </div>
    <template v-else>
      <!-- Sports Navigation -->
      <div class="nav-container" style="position: sticky; top: 0; z-index: 200">
        <div class="m-snap-nav-wrap m-sport-type" style="overflow: auto">
          <ul class="m-snap-nav flex">
            <li
              v-for="(sport, s) in sportsListData"
              :class="{ active: sport.sportID == activeSportID }"
              :key="s"
              class="m-sport-type-item m-snap-nav-item"
              @click="setActiveSport(sport.sportID)"
              :id="'live_' + sport.sportID"
            >
              <span class="m-event-size">{{ sport.count }}</span>
              <img
                :src="getImageSrc(sport.sportID)"
                loading="lazy"
                width="22"
                height="22"
              />
              <div class="m-sport-text">
                {{ sport.sportName }}
              </div>
            </li>
          </ul>
        </div>
      </div>

      <!-- Markets Navigation -->
      <div v-if="Object.keys(groupedFixtures).length" class="m-sanp-nav-container">
        <div class="m-snap-nav-wrap m-mkt-type" style="overflow: auto">
          <ul class="m-snap-nav flex">
            <li
              v-for="(market, m) in activeSportMarkets"
              :key="m"
              @click="selectMarket(market)"
              :class="market.marketID === activeMarket.marketID ? 'active' : ''"
              class="m-sport-type-item m-snap-nav-item"
            >
              {{ market.marketName }}
            </li>
          </ul>
          <div v-if="showUpToggle" class="up-mode-bar">
            <button
              class="up-mode-tab"
              type="button"
              :class="{ active: upMode === 'none' }"
              @click="setUpMode('none')"
            >
              {{ baseLabel }}
            </button>
            <button
              v-for="option in modeOptions"
              :key="option.key"
              class="up-mode-tab"
              type="button"
              :class="{ active: upMode === option.key }"
              @click="setUpMode(option.key)"
            >
              {{ option.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- Fixtures List -->
      <div v-if="Object.keys(groupedFixtures).length" class="m-bet-content">
        <div
          v-for="(fixtures, tournamentKey) in groupedFixtures"
          :key="tournamentKey"
          class="m-league event-league"
        >
          <!-- Tournament Header -->
          <div class="m-league-title" @click="toggleTournament($event, tournamentKey)">
            <span class="icon-triangle"></span>
            <span class="text">{{ fixtures[0].categoryName }} - {{ fixtures[0].tournament }}</span>
          </div>

          <!-- Tournament Content -->
          <div class="m-league-conent" :id="'league-content-' + tournamentKey">
            <div class="x-table m-sports-table">
              <!-- Market Headers Row -->
              <div class="x-table-row m-date-row">
                <div class="x-table-cell m-date">
                  <span class="live-indicator">LIVE</span>
                </div>
                <div class="x-table-cell market-title">
                  <template v-for="(outcome, o) in _.sortBy(effectiveMarket?.outcomes || [], 'outcomeID')" :key="o">
                    <div class="outcome-name">
                      <span>{{ getOutcomeDisplayName(effectiveMarket?.marketName, outcome.outcomeID, outcome.outcomeName) }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Fixtures -->
              <LiveFixture
                v-for="(fixture, index) in fixtures"
                :key="fixture.matchID"
                :gameData="fixture"
                :activeMarket="effectiveMarket"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- No Data -->
      <div v-else class="no-data">
        <div style="white-space: pre-line">
          Sorry, there are no games currently<br />available in this category. Please try
          later.<br />Thank you.
        </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import LiveFixture from '@/components/Live/LiveFixture.vue'
import { useUtilsStore } from '@/stores'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import { useQuery } from 'vue-query'
import { getLiveHighlights, FEED_TOGGLE, normalizeFixtureMarkets } from '@/helpers'
import { defineComponent, onMounted, ref, computed, watch, onBeforeUnmount, toRef } from 'vue'
import HeaderOther from '@/components/HeaderOther.vue'
import _ from 'lodash'
import emitter from '@/plugins/emitter'
import { useUpMode } from '@/composables/useUpMode'
import { EXCLUDED_LIVE_SPORT_IDS } from '@/helpers/constants'

const isEmptyResponse = ref(false)
const utilsStore = useUtilsStore()
const activeSportID = ref(utilsStore.activeLiveSportID || 1)
const accumulatedFixtures = ref([])
const accumulatedMarkets = ref([])
const isAllowedLiveSport = (sportID) => !EXCLUDED_LIVE_SPORT_IDS.includes(Number(sportID))
// Keep a writable ref to the active market for up-mode state changes.
const activeMarket = toRef(utilsStore, 'activeLiveMarkets')

// Map outcome IDs to standard display names for common markets
const outcomeNameMap = {
  '1X2': { 1: '1', 2: 'X', 3: '2' },
  'DC': { 9: '1X', 10: '12', 11: 'X2' },
  'DNB': { 4: '1', 5: '2' },
  'Over/Under': { 12: 'Over', 13: 'Under' },
  'Odd/Even': { 70: 'Odd', 72: 'Even' },
  'GG/NG': { 74: 'GG', 76: 'NG' }
}

const getOutcomeDisplayName = (marketName, outcomeID, originalName) => {
  const marketMap = outcomeNameMap[marketName]
  if (marketMap && marketMap[outcomeID]) {
    return marketMap[outcomeID]
  }
  return originalName
}

const getImageSrc = (sportId) => {
  const imageUrl = new URL(`../assets/images/sports/${sportId}.png`, import.meta.url)
  return imageUrl
}

const {
  data: completeLiveData,
  isLoading,
  refetch
} = useQuery('liveData', getLiveHighlights, {
  enabled: FEED_TOGGLE,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: false,
  staleTime: 60000,
  cacheTime: 300000,
  refetchInterval: 60000 * 10,
  retry: (failureCount, error) => {
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false
    }
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (err) => {
    console.error('Error fetching live data:', err)
    isEmptyResponse.value = true
  },
  onSuccess: (response) => {
    applyLiveData(response)
  }
})

function applyLiveData(response) {
  if (!FEED_TOGGLE) return
  const fixtures = (response?.fixtures || response?.data?.fixtures || []).filter((fixture) =>
    isAllowedLiveSport(fixture.sportID)
  )
  const markets = normalizeFixtureMarkets(
    (response?.markets || response?.data?.markets || []).filter((market) =>
      isAllowedLiveSport(market.sportID)
    )
  )

  if (fixtures.length > 0) {
    accumulatedFixtures.value = fixtures
    accumulatedMarkets.value = markets
    isEmptyResponse.value = false
  } else {
    accumulatedFixtures.value = []
    accumulatedMarkets.value = []
    isEmptyResponse.value = true
  }
}

const sportsListData = computed(() => {
  if (isEmptyResponse.value) {
    return []
  }
  const sportCountMap = new Map()

  accumulatedFixtures.value.forEach((fixture) => {
    const key = fixture.sportID
    if (sportCountMap.has(key)) {
      const sportData = sportCountMap.get(key)
      sportData.count += 1
    } else {
      sportCountMap.set(key, {
        sportID: fixture.sportID,
        sportName: fixture.sportName,
        count: 1
      })
    }
  })

  return Array.from(sportCountMap.values()).sort((a, b) => a.sportID - b.sportID)
})

// Base fixtures list for the active sport before applying up-mode filtering.
const sportFixtures = computed(() => {
  return accumulatedFixtures.value.length && !isEmptyResponse.value
    ? accumulatedFixtures.value
        .filter((s) => s.sportID == activeSportID.value)
        .sort((a, b) => {
          if (a.tournamentID !== b.tournamentID) {
            return a.tournamentID - b.tournamentID
          }
          return 0
        })
    : []
})

const marketsGroup = computed(() => {
  return accumulatedFixtures.value.length && !isEmptyResponse.value
    ? accumulatedMarkets.value
    : []
})

const {
  upMode,
  setUpMode,
  resetUpMode,
  showUpToggle,
  modeOptions,
  baseLabel,
  effectiveMarket,
  filteredFixtures,
  sanitizeMarkets
} = useUpMode({
  fixtures: sportFixtures,
  activeMarket,
  marketsGroup,
  enabledSportId: 1
})

// Group fixtures after up-mode filtering to keep tournament sections intact.
const groupedFixtures = computed(() => {
  return _.groupBy(filteredFixtures.value || [], 'tournament')
})

const activeSportMarkets = computed(() => {
  // Strip derived markets from tabs to keep the base list clean.
  const activeMarkets = sanitizeMarkets(marketsGroup.value)
    .filter((s) => Number(s.sportID ?? s.sportId ?? s.sport_id) === Number(activeSportID.value))
  return activeMarkets
})

watch(activeSportMarkets, (newValue) => {
  if (newValue.length) {
    // Keep store in sync with the active market selection.
    activeMarket.value = newValue[0]
  } else {
    activeMarket.value = []
  }
})

function setActiveSport(sid) {
  activeSportID.value = parseInt(sid)
  // Reset up-mode when the active sport changes.
  resetUpMode()
  document.getElementById('live_' + sid)?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

function selectMarket(market) {
  // Use the shared active market ref so up-mode stays consistent.
  activeMarket.value = market
}

function toggleTournament(e, tournamentKey) {
  const childId = 'league-content-' + tournamentKey
  const childElement = document.getElementById(childId)
  const element = e.currentTarget
  const isHidden = element.classList.contains('hide')

  if (isHidden) {
    childElement?.classList.remove('d-none')
    element.classList.remove('hide')
  } else {
    childElement?.classList.add('d-none')
    element.classList.add('hide')
  }
}

const handleMatchEnded = (matchId) => {
  if (!accumulatedFixtures.value.length) return

  accumulatedFixtures.value = accumulatedFixtures.value.filter(
    (fixture) => String(fixture.matchID) !== String(matchId)
  )
}

onMounted(async () => {
  if (!FEED_TOGGLE) {
    accumulatedFixtures.value = []
    accumulatedMarkets.value = []
    isEmptyResponse.value = true
    return
  }
  if (accumulatedFixtures.value.length) {
    activeSportID.value = accumulatedFixtures.value[0].sportID
  }
  emitter.on('match-ended', handleMatchEnded)
})

onBeforeUnmount(() => {
  emitter.off('match-ended', handleMatchEnded)
})

watch(activeSportID, (newValue) => {
  utilsStore.activeLiveSportID = newValue
})

watch(
  sportsListData,
  (newSportsList) => {
    if (newSportsList.length > 0) {
      if (
        !activeSportID.value ||
        !newSportsList.some((sport) => sport.sportID === activeSportID.value)
      ) {
        activeSportID.value = newSportsList[0].sportID
        // Reset up-mode when the auto-selected sport changes.
        resetUpMode()
      }
    }
  },
  { immediate: true }
)

watch(
  () => completeLiveData.value,
  (response) => {
    if (response) {
      applyLiveData(response)
    }
  },
  { immediate: true }
)

defineComponent({
  methods: {
    handleManualRefetch() {
      refetch()
    }
  }
})
</script>

<style scoped>
.m-event-list {
  background-color: #0a0c12;
  color: #fff;
  min-height: 100vh;
}

/* Sports Navigation */
.nav-container {
  background-color: #0a0c12;
}

.m-sport-type {
  background-color: #0a0c12;
  padding: 0.5rem 0;
}

.m-sport-type .m-sport-type-item {
  box-sizing: border-box;
  color: #9ca0ab;
  flex: none;
  font-size: 0.9rem;
  line-height: 1rem;
  min-height: 4rem;
  padding: 0.5rem 0.25rem 0.33333333rem;
  position: relative;
  text-align: center;
  width: 5rem;
}

.m-sport-type .m-sport-type-item:first-child {
  margin-left: 0.83333333rem;
}

.m-sport-type .m-sport-type-item:last-child {
  margin-right: 0.83333333rem;
}

.m-sport-type .m-sport-type-item.active {
  border-bottom: 3px solid var(--brand-primary);
  color: #ffffff;
}

.m-sport-type .m-sport-type-item .m-event-size {
  background: #393c43;
  border-radius: 2px;
  color: #fff;
  display: block;
  font-size: 0.75rem;
  line-height: 0.9rem;
  min-width: 1.5rem;
  position: absolute;
  right: 0.5rem;
  text-align: center;
  top: 0.25rem;
}

.m-sport-type .m-sport-type-item .m-sport-text {
  margin-top: 0.25rem;
  white-space: normal;
}

.m-sport-type .m-sport-type-item img {
  filter: brightness(0) invert(0.6);
}

.m-sport-type .m-sport-type-item.active img {
  filter: brightness(0) invert(1);
}

/* Markets Navigation */
.m-sanp-nav-container {
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  background-color: #0a0c12;
  position: sticky;
  top: 4.5rem;
  z-index: 100;
}

.up-mode-bar {
  display: flex;
  gap: 0;
  width: 100%;
}

.up-mode-tab {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #9ca0ab;
  cursor: pointer;
  flex: 1;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.62rem 0;
  text-align: center;
  text-transform: uppercase;
}

.up-mode-tab.active {
  border-bottom-color: var(--brand-secondary);
  color: #ffffff;
}

.m-mkt-type .m-sport-type-item {
  box-sizing: border-box;
  font-size: 1rem;
  font-weight: normal;
  padding: 0.75rem 1rem;
  color: #9ca0ab;
}

.m-mkt-type .m-sport-type-item.active {
  border-bottom: 3px solid var(--brand-primary);
  color: #ffffff;
}

.m-mkt-type .m-sport-type-item:first-child {
  margin-left: 0.83333333rem;
}

/* Tournament Groups */
.m-league {
  margin: 0;
}

.m-league-title {
  align-items: center;
  background-color: #0a1628;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  color: var(--brand-primary);
  cursor: pointer;
  display: flex;
  font-size: 0.9rem;
  padding: 0.75rem 0.83333333rem;
}

.m-league-title .icon-triangle {
  border-left: 5px solid transparent;
  border-right: 5px solid transparent;
  border-top: 6px solid var(--brand-primary);
  height: 0;
  margin-right: 0.5rem;
  transition: transform 0.2s;
  width: 0;
}

.m-league-title.hide .icon-triangle {
  transform: rotate(-90deg);
}

.m-league-title .text {
  flex: 1;
}

.m-league-title .m-event-size {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  color: #fff;
  font-size: 0.75rem;
  padding: 0.15rem 0.5rem;
}

.m-league-conent {
  background-color: #0a0c12;
}

.m-league-conent.d-none {
  display: none;
}

/* Table Styles */
.m-sports-table {
  width: 100%;
}

.m-date-row {
  align-items: center;
  background-color: #0a1628;
  display: flex;
  padding: 0.5rem 0.83333333rem;
}

.m-date-row .m-date {
  flex: 0 0 45%;
}

.m-date-row .live-indicator {
  background: var(--brand-primary);
  border-radius: 2px;
  color: #fff;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 0.15rem 0.4rem;
}

.m-date-row .market-title {
  display: flex;
  flex: 0 0 55%;
}

.m-date-row .market-title > div {
  color: #9ca0ab;
  flex: 1;
  font-size: 0.8rem;
  text-align: center;
}

.m-date-row .market-title .outcome-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 100%;
}

/* No Data */
.no-data {
  color: #9ca0ab;
  padding: 3rem 2rem;
  text-align: center;
}

.no-data::before {
  content: '\e624';
  font-family: 'iconfont' !important;
  font-size: 16px;
}

.no-data:before {
  color: rgba(234, 236, 239, 0.15);
  font-size: 2.5rem;
}

/* Utility */
.flex {
  display: flex;
}

.m-snap-nav {
  list-style: none;
  margin: 0;
  padding: 0;
}

.m-snap-nav-item {
  cursor: pointer;
  flex-shrink: 0;
}
</style>
