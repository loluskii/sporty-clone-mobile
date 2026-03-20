<template lang="">
  <div class="m-sports" id="m-sports">
    <div class="m-sports-title" :class="{ fixed: isTop }">
      <span class="m-title-sport">Sports </span>
      <div class="m-snap-nav-wrap m-sport-type">
        <ul
          class="m-snap-nav flex"
          style="
            transform: translate(0px, 0px) translateZ(0px);
            transition-duration: 350ms;
            transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1);
            width: 100%;
            display: flex;
            align-items: center;
          "
        >
          <li
            v-for="(sport, index) in sportsListData"
            :class="sport.sport_id === activeSportID ? 'active' : ''"
            @click="setActiveSport(sport.sport_id)"
            :key="index"
            :id="'highlights_' + sport.sport_id"
            class="m-sport-type-item m-snap-nav-item"
          >
            <Transition name="bounce">
              <span>{{ sport.sport_name }}</span>
            </Transition>
          </li>
        </ul>
      </div>
    </div>
    <div
      :class="{ 'nav-fixed': isTop }"
      class="m-pre-opts m-tabs m-tabs-mini m-tabs-no-animation"
      style="overflow: hidden"
    >
      <div
        class="m-tabs-nav"
        style="
          transform: translate(0px, 0px);
          transition-duration: 0s;
          transition-timing-function: cubic-bezier(0.25, 0.46, 0.45, 0.94);
          width: 100%;
        "
      >
        <div
          class="m-tabs-tab"
          v-for="tab in tabList"
          @click="setActiveTab(tab)"
          :class="tabView == tab.toLowerCase() ? 'm-tabs-tab-active' : ''"
        >
          {{tab}}
        </div>
      </div>
      <div class="m-tabs-content">
        <div v-show="tabView !== 'countries'" class="m-tabs-tabpane">
          <div class="m-highlights-wrap" style="position: relative">
            <Highlights
              :highlightsData="filteredFixtures"
              :view="tabView"
              :marketsGroup="marketsGroup"
              :activeMarket="activeMarket"
              :effectiveMarket="effectiveMarket"
              :upMode="upMode"
              :isModeLoading="isModeLoading"
              :showUpToggle="showUpToggle"
              :modeOptions="modeOptions"
              :baseLabel="baseLabel"
              @select-market="getFixturesByMarkets"
              @set-up-mode="handleUpModeChange"
              v-if="!loadingError"
            ></Highlights>

            <LoadingSpinner v-show="isLoading"></LoadingSpinner>
            <LoadingError v-show="loadingError"></LoadingError>
          </div>
        </div>
        <div v-show="tabView === 'countries'" class="m-tabs-tabpane">
          <Countries
            v-if="countriesData.length"
            :countriesData="countriesData"
            :activeSportID="activeSportID"
          ></Countries>
        </div> 
      </div>
    </div>
  </div>
</template>
<script setup>
import { useUtilsStore } from '@/stores/utils.store'
import Highlights from '@/components/Home/Highlights.vue'
import Countries from '@/components/Home/Countries.vue'
import LoadingError from '@/components/Loaders/LoadingError.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'

import { getSportHighlights, getToday2, getCategoriesBySport, FEED_TOGGLE } from '@/helpers'
import { defineComponent, onMounted, ref, onUnmounted, computed } from 'vue'
import _ from 'lodash'
import emitter from '@/plugins/emitter'
import { useUpMode } from '@/composables/useUpMode'

const utilsStore = useUtilsStore()

const highlightsData = ref([])
const todayData = ref([]);
const derivedHighlightsData = ref([])
const derivedTodayData = ref([])
const fixturesList = ref([])
const countriesData = ref([])
// Track last selected market per tab for consistent UX.
const activeMarketByTab = ref({
  highlights: null,
  today: null
})

const tabList = ["Highlights", "Today", "Countries"];
const tabView = ref('highlights')
const prevTabView = ref('')

const prevSportID = ref(1)
const activeSportID = ref(1)
const marketsGroup = ref({})
const activeMarket = ref({})

const isCollectionEmpty = (value) => {
  if (!value) return true
  if (Array.isArray(value)) return value.length === 0
  return Object.keys(value).length === 0
}

const mergeGroupedFixtures = (baseGroups = {}, derivedGroups = {}) => {
  const merged = {}
  const allKeys = new Set([
    ...Object.keys(baseGroups || {}),
    ...Object.keys(derivedGroups || {})
  ])

  allKeys.forEach((key) => {
    const baseList = Array.isArray(baseGroups?.[key]) ? baseGroups[key] : []
    const derivedList = Array.isArray(derivedGroups?.[key]) ? derivedGroups[key] : []
    const seenMatchIds = new Set()
    const nextList = []

    ;[...baseList, ...derivedList].forEach((fixture) => {
      const matchId = String(
        fixture?.matchID ?? fixture?.match_id ?? fixture?.gameID ?? fixture?.game_id ?? ''
      )
      const dedupeKey = matchId || JSON.stringify(fixture)
      if (seenMatchIds.has(dedupeKey)) return
      seenMatchIds.add(dedupeKey)
      nextList.push(fixture)
    })

    if (nextList.length) {
      merged[key] = nextList
    }
  })

  return merged
}

const getTabDatasets = (tab) => {
  if (tab === 'today') {
    return {
      base: todayData,
      derived: derivedTodayData
    }
  }

  return {
    base: highlightsData,
    derived: derivedHighlightsData
  }
}

const baseTabFixtures = computed(() => {
  const { base, derived } = getTabDatasets(tabView.value)
  if (upMode.value === 'none') {
    return mergeGroupedFixtures(base.value, derived.value)
  }
  return derived.value
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
  fixtures: baseTabFixtures,
  activeMarket,
  marketsGroup,
  enabledSportId: 1,
  requireDerivedFixturesForToggle: false,
  filterFixturesByDerived: false
})

const isLoading = ref(false)
const isModeLoading = ref(false)
const loadingError = ref(false)

function setActiveTab(tab) {
  prevTabView.value = tabView.value
  tabView.value = tab.toLowerCase()
  // Reset 1UP/2UP when switching tabs so each tab starts with full fixtures.
  resetUpMode()
  tab === 'countries' ? getCountriesList() : getHighlightGames()
}

const sportsListData = computed(() => {
  return utilsStore.sportsMenu
})

async function setActiveSport(sid) {
  // set the active sport id
  prevSportID.value = activeSportID.value
  activeSportID.value = sid
  resetUpMode()
  // Clear cached market selection when sport changes to avoid mismatches.
  activeMarketByTab.value = { highlights: null, today: null }
  highlightsData.value = []
  todayData.value = []
  derivedHighlightsData.value = []
  derivedTodayData.value = []
  await getHomeData()
  document.getElementById('highlights_' + sid).scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

const getDerivedOnlyParam = () => {
  return upMode.value === 'none' ? '' : 1
}

async function getHighlightGames({ force = false, preserveContent = false } = {}) {
  if(!FEED_TOGGLE) return;
  const { base, derived } = getTabDatasets(tabView.value)
  const isDerivedRequest = upMode.value !== 'none'
  const targetDataset = isDerivedRequest ? derived : base
  const currentTabHasData = !isCollectionEmpty(targetDataset.value)
  const currentTabHasMarkets = Array.isArray(marketsGroup.value) && marketsGroup.value.length
  const isNewActiveSport = activeSportID.value !== prevSportID.value
  try {
    if(force || !currentTabHasData || !currentTabHasMarkets || isNewActiveSport) {
      // Keep the existing highlights visible while derived mode is loading.
      if (preserveContent) {
        isModeLoading.value = true
      } else {
        isLoading.value = true
      }
      const response = await getSportHighlights({
        sid: activeSportID.value, 
        today: tabView.value === 'today' ? 1 : 0,
        order_type: 'priority|desc',
        per_page: 30,
        derived_only: getDerivedOnlyParam()
      })
      if (response.data.fixtures && response.data.markets) {
        fixturesList.value = _.groupBy(response.data.fixtures, (fixture) => fixture.date.split('T')[0])
        targetDataset.value = fixturesList.value
        
        // Hard reset the active market to avoid stale specifier state when swapping tabs.
        activeMarket.value = {}
        const filteredMarkets = sanitizeMarkets(response.data.markets || [])
        marketsGroup.value = filteredMarkets.length ? filteredMarkets : []
        const cachedMarketId = activeMarketByTab.value[tabView.value]
        const nextMarket =
          marketsGroup.value.find((market) => Number(market.marketID) === Number(cachedMarketId)) ||
          marketsGroup.value[0] ||
          {}
        activeMarket.value = nextMarket
      } else {
        targetDataset.value = []
        marketsGroup.value = []
      }
    } else {
      fixturesList.value = baseTabFixtures.value
      // Hard reset the active market to avoid stale specifier state when reusing cached markets.
      activeMarket.value = {}
      marketsGroup.value = marketsGroup.value || []
      const cachedMarketId = activeMarketByTab.value[tabView.value]
      const nextMarket =
        marketsGroup.value.find((market) => Number(market.marketID) === Number(cachedMarketId)) ||
        marketsGroup.value[0] ||
        {}
      activeMarket.value = nextMarket
    }
  } finally {
    isLoading.value = false
    isModeLoading.value = false
  }
}

async function handleUpModeChange(mode) {
  setUpMode(mode)
  await getHighlightGames({ preserveContent: true })
}

async function getCountriesList() {
  if(!FEED_TOGGLE) return;
  countriesData.value = (await getCategoriesBySport(activeSportID.value, null)).data.filter((x) => x.games > 0) || []
}

function getFixturesByMarkets(market) {
  activeMarket.value = market
  activeMarketByTab.value[tabView.value] = market?.marketID || null
}

async function getHomeData() {
  if(!FEED_TOGGLE) return;
  isLoading.value = true
  loadingError.value = false
  Promise.all([getHighlightGames(), getCountriesList()])
    .then(() => {
      isLoading.value = false
    })
    .catch((error) => {
      // Handle errors for any of the promises
      isLoading.value = false
      loadingError.value = true
      console.error('An error occurred:', error)
    })
}

const isScrolled = ref(false)
const isTop = ref(false)
const divPosition = ref(null)

const handleScroll = () => {
  isScrolled.value = window.scrollY > 50
  const specificDiv = document.getElementById('m-sports')
  divPosition.value = specificDiv ? specificDiv.getBoundingClientRect().top : 0

  if (divPosition.value <= 59) {
    isTop.value = true
  } else {
    isTop.value = false
  }
}

const removeFixtureByMatchId = (matchID) => {
  const removeFromGroups = (groups) => {
    Object.keys(groups).forEach((date) => {
      groups[date] = groups[date].filter(
        (fixture) =>
          String(fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id) !==
          String(matchID)
      )
      if (groups[date].length === 0) {
        delete groups[date]
      }
    })
  }

  if (highlightsData.value && Object.keys(highlightsData.value).length) {
    removeFromGroups(highlightsData.value)
  }
  if (todayData.value && Object.keys(todayData.value).length) {
    removeFromGroups(todayData.value)
  }
}

const applyValidatedSelections = (selections) => {
  console.log('[odds-validated][HighlightsContainer] incoming', selections)
  if (!Array.isArray(selections) || selections.length === 0) return
  const selectionsByMatch = selections.reduce((acc, selection) => {
    const key = String(selection.match_id ?? selection.matchID ?? selection.matchId ?? '')
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(selection)
    return acc
  }, {})
  console.log('[odds-validated][HighlightsContainer] matches', Object.keys(selectionsByMatch).length)

  const updateGroups = (groups) => {
    Object.keys(groups).forEach((date) => {
      groups[date] = groups[date].map((fixture) => {
        const fixtureMatchId = String(
          fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id ?? ''
        )
        const matchSelections = selectionsByMatch[fixtureMatchId]
        if (!matchSelections) {
          return fixture
        }
        if (!Array.isArray(fixture.outcomes)) {
          console.log('[odds-validated][HighlightsContainer] no outcomes for match', fixtureMatchId)
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
          console.log('[odds-validated][HighlightsContainer] update', {
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
  }

  if (highlightsData.value && Object.keys(highlightsData.value).length) {
    updateGroups(highlightsData.value)
  }
  if (todayData.value && Object.keys(todayData.value).length) {
    updateGroups(todayData.value)
  }
}

onMounted(async () => {
  window.addEventListener('scroll', handleScroll)
  await getHomeData()

  // Add event listener for removing fixtures
  emitter.on('remove-fixture', removeFixtureByMatchId)
  emitter.on('odds-validated', applyValidatedSelections)
})

onUnmounted(() => {
  // Remove scroll event listener when the component is unmounted
  window.removeEventListener('scroll', handleScroll)
  emitter.off('remove-fixture', removeFixtureByMatchId)
  emitter.off('odds-validated', applyValidatedSelections)
})

defineComponent({
  components: {
    Highlights,
    Countries,
    LoadingError,
    LoadingSpinner
  }
})
</script>

<style scoped>
.m-sports-title {
  top: 3.66666667rem;
  position: sticky;
  /* z-index: 220; */
}

.header-appear {
  background-color: red;
  position: sticky;
  top: 0px;
}

</style>





