<template>
  <div class="m-event-list" id="m-event-list" ref="container">
    <div class="mt-lg-4 pt-lg-4" style="width: 100%; height: 48px"></div>
    <HeaderGame :SportsName="getActiveSport"></HeaderGame>
    <ChooseBarPad :active-sport="getActiveSport" />
    <template v-if="!isLoading && !isEmptyResponse">
      <div v-show="marketsGroup?.length" class="m-snap-nav-container" id="m-sanp-nav-container">
        <div
          class="m-snap-nav-wrap m-sport-type has-live"
          :class="{ 'm-sport-type-fixed': isTop }"
        >
          <ul class="m-snap-nav flex market-tabs-scroll">
            <li v-for="(market, m) in marketsGroup" :key="m"
              :class="market.marketID === activeMarket.marketID ? 'active' : ''"
              class="m-sport-type-item m-snap-nav-item" @click="selectMarket(market)">
              {{ market.marketName === '1x2' ? '1X2':market.marketName }}
            </li>
          </ul>
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
              @click="handleUpModeChange(option.key)"
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
      <div class="m-bet-content" style="position: relative">
        <FixtureGroupingTournament :fixtures-list="filteredFixtures" :active-market="effectiveMarket"
          v-if="fixtureGroupingType === 'tournament'" />
        <FixtureGroupingDefault :fixtures-list="filteredFixtures" :active-market="effectiveMarket" v-else />
        <LoadingSpinner v-show="fetchingMore"></LoadingSpinner>
      </div>
    </template>
    <div id="scroll-sentinel" style="height: 10px"></div>
    <LoadingSpinner v-show="isLoading"></LoadingSpinner>
    <LoadingError v-show="loadingError && !isLoading"></LoadingError>
    <div v-if="isEmptyResponse && !loadingError" class="no-data">
      <div style="white-space: pre-line">
        <p>Sorry, there are no games currently available</p>
        <p>in this category. Please try later.</p>
        <p>Thank you.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { defineComponent, ref, watch, onMounted, computed, onUnmounted } from 'vue'
import HeaderGame from '@/components/HeaderGame.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import LoadingError from '@/components/Loaders/LoadingError.vue'
import { useRoute } from 'vue-router'
import _ from 'lodash'
import { useUtilsStore } from '@/stores'
import ChooseBarPad from '@/components/ChooseBarPad.vue'
import FixtureGroupingTournament from '@/components/FixtureGrouping/FixtureGroupingTournament.vue'
import FixtureGroupingDefault from '@/components/FixtureGrouping/FixtureGroupingDefault.vue'
import {
  getSportHighlights,
  getFixturesByCategories,
  getFixturesByTournamentId,
  getSportUpcoming,
  getToday2,
  extractIdsFromURL,
  getDateRange,
  FEED_TOGGLE
} from '@/helpers'
import emitter from '@/plugins/emitter'
import { useUpMode } from '@/composables/useUpMode'

const utilsStore = useUtilsStore()
const route = useRoute()
const baseFixturesList = ref(null)
const derivedFixturesList = ref(null)

const marketsGroup = ref({})
const activeMarket = ref({})

const isCollectionEmpty = (value) => {
  if (value === null || value === undefined) return true
  if (Array.isArray(value)) return value.length === 0
  return typeof value === 'object' ? Object.keys(value).length === 0 : true
}

const mergeFixtureCollections = (baseList, derivedList) => {
  if (Array.isArray(baseList) || Array.isArray(derivedList)) {
    const merged = []
    const seenMatchIds = new Set()
    ;[...(Array.isArray(baseList) ? baseList : []), ...(Array.isArray(derivedList) ? derivedList : [])].forEach(
      (fixture) => {
        const matchId = String(
          fixture?.matchID ?? fixture?.match_id ?? fixture?.gameID ?? fixture?.game_id ?? ''
        )
        const dedupeKey = matchId || JSON.stringify(fixture)
        if (seenMatchIds.has(dedupeKey)) return
        seenMatchIds.add(dedupeKey)
        merged.push(fixture)
      }
    )
    return merged
  }

  const merged = {}
  const allKeys = new Set([
    ...Object.keys(baseList || {}),
    ...Object.keys(derivedList || {})
  ])

  allKeys.forEach((key) => {
    const baseGroup = Array.isArray(baseList?.[key]) ? baseList[key] : []
    const derivedGroup = Array.isArray(derivedList?.[key]) ? derivedList[key] : []
    const seenMatchIds = new Set()
    const nextList = []

    ;[...baseGroup, ...derivedGroup].forEach((fixture) => {
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

const fixturesList = computed(() => {
  if (upMode.value === 'none') {
    return mergeFixtureCollections(baseFixturesList.value, derivedFixturesList.value)
  }
  return derivedFixturesList.value
})

const isLoading = ref(false)
const isEmptyResponse = computed(() => {
  const list = fixturesList.value
  return (
    !isLoading.value &&
    (list === null ||
      (Array.isArray(list) && list.length === 0) ||
      (typeof list === 'object' && Object.keys(list).length === 0))
  )
})

const {
  upMode,
  setUpMode,
  resetUpMode,
  showUpToggle,
  modeOptions,
  effectiveMarket,
  filteredFixtures,
  sanitizeMarkets
} = useUpMode({
  fixtures: fixturesList,
  activeMarket,
  marketsGroup,
  enabledSportId: 1,
  requireDerivedFixturesForToggle: false,
  filterFixturesByDerived: false
})

const isModeLoading = computed(() => isLoading.value && upMode.value !== 'none')

watch(
  () => [route.name, route.params.sport, route.query.period, route.query.startDate, route.query.endDate],
  () => {
    resetUpMode()
    baseFixturesList.value = null
    derivedFixturesList.value = null
  }
)

const loadingError = ref(false)

const page = ref(1)
const isPaginated = ref(false)
const fetchingMore = ref(false)
const container = ref(null)
const isLastPage = ref(false)
const lastPage = ref(null)

// const filterQuery = ref()

const getSportbyName = (name) => {
  return utilsStore.sportsMenu.find((x) => x.sport_name == name)
}

const getActiveSport = computed(() => {
  return getSportbyName(route.params.sport)
})

const fixtureGroupingType = computed(() => {
  return filteredFixtures.value !== null && !Array.isArray(filteredFixtures.value)
    ? 'tournament'
    : 'default'
})

const getDerivedOnlyParam = () => {
  return upMode.value === 'none' ? '' : 1
}

watch(
  () => [route.name, route.query.period, route.query.startDate, route.query.endDate],
  async ([routeName, period, startDate, endDate]) => {
    const { sport_id } = getSportbyName(route.params.sport)
    const { tournament_id } = route.params
    const { category_id } = route.params
    isLoading.value = true
    switch (routeName) {
      case 'fixtures-by-tournaments':
        await getTournamentFixtures(sport_id, tournament_id)
        break

      case 'fixtures-by-category':
        await getCategoryFixtures(sport_id, category_id)
        break

      case 'today-fixtures':
      case 'fixtures-by-sports':
        await fetchFixturesByActiveSport(sport_id, period)
        break

      default:
        // Handle other routes or provide a default behavior
        break
    }
    // console.log(container.value.clientHeight)
  },
  { immediate: true } // Trigger the watch callback immediately on component mount
)

async function getTournamentFixtures(sid) {
  if (!FEED_TOGGLE) return;
  const routeExtractedTIds = extractIdsFromURL(route.params.tournaments, 'tournament')
  console.log(routeExtractedTIds)
  const selectedMarketId = Number(activeMarket.value?.marketID || 0)
  const isDerivedRequest = upMode.value !== 'none'

  try {
    isLoading.value = true
    const results = await Promise.allSettled(
      routeExtractedTIds.map((cat) =>
        getSportHighlights({
          page: page.value,
          sid: sid,
          per_page: 30,
          tournament_id: cat.tournamentID,
          derived_only: getDerivedOnlyParam()
        })
      )
    )
    const fixtures = results.reduce((acc, res) => {
      if (res.status === 'fulfilled' && res.value.data.fixtures) {
        acc = { ...acc, ..._.groupBy(res.value.data.fixtures, 'tournament') }
      }
      return acc
    }, {})

    if (isDerivedRequest) {
      derivedFixturesList.value = { ...fixtures }
    } else {
      baseFixturesList.value = { ...fixtures }
    }
    const filteredMarkets = sanitizeMarkets(results[0].value?.data.markets || [])
    marketsGroup.value = filteredMarkets
    activeMarket.value =
      filteredMarkets.find((market) => Number(market.marketID) === selectedMarketId) ||
      (filteredMarkets.length ? filteredMarkets[0] : {})
    isLoading.value = false
  } catch (error) {
    console.error('Error fetching fixtures:', error)
    isLoading.value = false
  }
}

async function getCategoryFixtures(sid, cid) {
  if (!FEED_TOGGLE) return;
  const selectedMarketId = Number(activeMarket.value?.marketID || 0)
  const isDerivedRequest = upMode.value !== 'none'
  try {
    const res = await getSportHighlights({
      sid,
      per_page: 30,
      category_id: cid,
      derived_only: getDerivedOnlyParam()
    })
    const { fixtures, markets, per_page, page: currentPage, total } = res.data
    lastPage.value = Math.ceil(total / per_page)
    if (fixtures.length) {
      isPaginated.value = true
      if (isDerivedRequest) {
        derivedFixturesList.value = _.groupBy(fixtures, 'tournament')
      } else {
        baseFixturesList.value = _.groupBy(fixtures, 'tournament')
      }
      isLastPage.value = lastPage.value === page.value
      const filteredMarkets = sanitizeMarkets(markets || [])
      marketsGroup.value = filteredMarkets
      activeMarket.value =
        filteredMarkets.find((market) => Number(market.marketID) === selectedMarketId) ||
        (filteredMarkets.length ? filteredMarkets[0] : {})
      isLoading.value = false
    } else {
      throw Error
    }
  } catch (error) {
    isLoading.value = false
    loadingError.value = true
    console.error(error)
  }
}

async function fetchFixturesByActiveSport(id, period = null) {
  if (!FEED_TOGGLE) return;
  const selectedMarketId = Number(activeMarket.value?.marketID || 0)
  const isDerivedRequest = upMode.value !== 'none'
  try {
    let payload = {
      sid: id,
      page: page.value,
      per_page: 30,
      derived_only: getDerivedOnlyParam()
    }
    if (period) {
      if (period === 'tomorrow') {
        payload.tomorrow = 1
      } else if (period === 'today') {
        payload.today = 1
      } else if (period === 'today_tomorrow') {
        payload.today = 1
        payload.tomorrow = 1 
      } else {
        let { startDate, endDate } = getDateRange(period)
        payload.start = startDate
        payload.end = endDate
        payload.upcoming = 1
      }
    }
    const res = await getSportHighlights(payload)
    const { fixtures, markets, per_page, currentPage, total } = res.data
    lastPage.value = Math.ceil(total / per_page)
    if (fixtures.length) {
      isPaginated.value = true
      const targetFixtures = isDerivedRequest ? derivedFixturesList : baseFixturesList
      targetFixtures.value = Array.isArray(targetFixtures.value) && targetFixtures.value.length
        ? [...targetFixtures.value, ...fixtures]
        : [...fixtures]
      isLastPage.value = lastPage.value === page.value
      const filteredMarkets = sanitizeMarkets(markets || [])
      marketsGroup.value = filteredMarkets
      activeMarket.value =
        filteredMarkets.find((market) => Number(market.marketID) === selectedMarketId) ||
        (filteredMarkets.length ? filteredMarkets[0] : {})
    } else {
      throw Error
    }
    isLoading.value = false
  } catch (error) {
    isLoading.value = false
    isEmptyResponse.value = true
    console.error(error)
  }
}

async function selectMarket(market) {
  activeMarket.value = market
}

async function refreshFixturesForCurrentRoute() {
  const sport = getSportbyName(route.params.sport)
  if (!sport) return
  const needsDerivedData = upMode.value !== 'none'
  const hasRequiredData = needsDerivedData
    ? !isCollectionEmpty(derivedFixturesList.value)
    : !isCollectionEmpty(baseFixturesList.value)

  if (hasRequiredData) {
    return
  }

  page.value = 1
  isLastPage.value = false
  lastPage.value = null
  isPaginated.value = false
  if (needsDerivedData) {
    derivedFixturesList.value =
      route.name === 'fixtures-by-tournaments' || route.name === 'fixtures-by-category' ? {} : []
  } else {
    baseFixturesList.value =
      route.name === 'fixtures-by-tournaments' || route.name === 'fixtures-by-category' ? {} : []
  }
  isLoading.value = true

  switch (route.name) {
    case 'fixtures-by-tournaments':
      await getTournamentFixtures(sport.sport_id, route.params.tournament_id)
      break

    case 'fixtures-by-category':
      await getCategoryFixtures(sport.sport_id, route.params.category_id)
      break

    case 'today-fixtures':
    case 'fixtures-by-sports':
      await fetchFixturesByActiveSport(sport.sport_id, route.query.period)
      break

    default:
      isLoading.value = false
      break
  }
}

async function handleUpModeChange(mode) {
  setUpMode(mode)
  await refreshFixturesForCurrentRoute()
}

const getAssistModeLabel = (option = {}) => {
  if (option.key === 'earlygoal') return 'EG'
  return option.label || ''
}

const getAssistModeAriaLabel = (option = {}) => {
  return option.key === 'earlygoal' ? 'Toggle Early Goals' : `Toggle ${option.label || option.key}`
}

const isScrolled = ref(false)
const isTop = ref(false)
const divPosition = ref(null)

const observer = ref(null)

const handleScroll = async () => {
  isScrolled.value = window.scrollY > 50
  const specificDiv = document.getElementById('m-sanp-nav-container')
  divPosition.value = specificDiv ? specificDiv.getBoundingClientRect().top : 0
  isTop.value = divPosition.value <= 59
}

const observeElement = (element) => {
  // console.log('Initializing observer...')
  if (observer.value) {
    // console.log('Disconnecting existing observer...')
    observer.value.disconnect()
  }
  observer.value = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && !isLastPage.value) {
      // console.log('Sentinel element is intersecting. Fetching more data...')
      fetchMoreData()
    }
  })
  if (element) {
    observer.value.observe(element)
  } else {
    // console.log('Element not found:', element)
  }
}

const fetchMoreData = async () => {
  if (fetchingMore.value || !isPaginated.value) return
  fetchingMore.value = true
  page.value++
  // console.log(`Fetching data for page ${page.value}...`)
  try {
    const { sport_id } = getSportbyName(route.params.sport)
    const { period } = route.query
    const { tournament_id, category_id } = route.params

    // let newData = []
    switch (route.name) {
      case 'fixtures-by-tournaments':
        await getTournamentFixtures(sport_id, tournament_id)
        break

      case 'fixtures-by-category':
        await getCategoryFixtures(sport_id, category_id)
        break

      case 'today-fixtures':
      case 'fixtures-by-sports':
        await fetchFixturesByActiveSport(sport_id, period)
        break

      default:
        // Handle other routes or provide a default behavior
        break
    }
  } catch (error) {
    console.error('Error fetching more data:', error)
  } finally {
    fetchingMore.value = false
  }
}

const removeFixtureByMatchId = (matchID) => {
  const removeFromCollection = (collection) => {
    if (!collection.value) return
    if (Array.isArray(collection.value)) {
      collection.value = collection.value.filter(
        (fixture) =>
          String(fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id) !==
          String(matchID)
      )
      return
    }

    Object.keys(collection.value).forEach((tournament) => {
      collection.value[tournament] = collection.value[tournament].filter(
        (fixture) =>
          String(fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id) !==
          String(matchID)
      )
      if (collection.value[tournament].length === 0) {
        delete collection.value[tournament]
      }
    })
  }

  removeFromCollection(baseFixturesList)
  removeFromCollection(derivedFixturesList)
}

const applyValidatedSelections = (selections) => {
  console.log('[odds-validated][FixtureView] incoming', selections)
  if (!Array.isArray(selections) || selections.length === 0) return
  const selectionsByMatch = selections.reduce((acc, selection) => {
    const key = String(selection.match_id ?? selection.matchID ?? selection.matchId ?? '')
    if (!key) return acc
    if (!acc[key]) acc[key] = []
    acc[key].push(selection)
    return acc
  }, {})
  console.log('[odds-validated][FixtureView] matches', Object.keys(selectionsByMatch).length)

  const updateFixture = (fixture) => {
    const fixtureMatchId = String(
      fixture.matchID ?? fixture.match_id ?? fixture.gameID ?? fixture.game_id ?? ''
    )
    const matchSelections = selectionsByMatch[fixtureMatchId]
    if (!matchSelections) return fixture
    if (!Array.isArray(fixture.outcomes)) {
      console.log('[odds-validated][FixtureView] no outcomes for match', fixtureMatchId)
      return fixture
    }
    if (!matchSelections || !Array.isArray(fixture.outcomes)) return fixture
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
      console.log('[odds-validated][FixtureView] update', {
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
  }

  const applyToCollection = (collection) => {
    if (Array.isArray(collection.value)) {
      collection.value = collection.value.map(updateFixture)
    } else if (collection.value && typeof collection.value === 'object') {
      Object.keys(collection.value).forEach((tournament) => {
        collection.value[tournament] = collection.value[tournament].map(updateFixture)
      })
    }
  }

  applyToCollection(baseFixturesList)
  applyToCollection(derivedFixturesList)
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
  const sentinel = document.querySelector('#scroll-sentinel')
  localStorage.removeItem('categoryIds')
  observeElement(sentinel)

  // Add event listener for removing fixtures
  emitter.on('remove-fixture', removeFixtureByMatchId)
  emitter.on('odds-validated', applyValidatedSelections)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
  if (observer.value) observer.value.disconnect()
  emitter.off('remove-fixture', removeFixtureByMatchId)
  emitter.off('odds-validated', applyValidatedSelections)
})

defineComponent({
  name: 'fixture-view',
  components: { HeaderGame, LoadingSpinner, LoadingError }
})
</script>

<style>
.m-event-list {
  background-color: inherit;
  color: #353a45;
  -webkit-overflow-scrolling: none;
  overscroll-behavior: none;
}

.m-event-list .m-topnav .title {
  font-size: 1.66666667rem;
}

.m-event-list .m-topnav .arrow-icon {
  font-family: 'iconfont';
  width: auto;
}

.m-event-list .m-topnav .arrow-icon:before {
  content: '\e6A3';
  display: inline-block;
  font-size: 0.66666667rem;
  font-family: 'iconfont';
  line-height: 1;
  position: relative;
  -webkit-transform: rotate(0);
  -ms-transform: rotate(0);
  transform: rotate(0);
  -webkit-transform-origin: center;
  -ms-transform-origin: center;
  transform-origin: center;
  -webkit-transition: -webkit-transform 0.3s ease;
  transition: -webkit-transform 0.3s ease;
  transition: transform 0.3s ease;
  transition:
    transform 0.3s ease,
    -webkit-transform 0.3s ease;
  vertical-align: middle;
}

.m-event-list .m-topnav .arrow-icon.open:before {
  -webkit-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
}

.m-event-list .m-topnav .trans-select {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}

.m-event-list .m-topnav .trans-select .sport-select.af-select {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  height: 2rem;
  position: static;
}

.m-event-list .m-topnav .trans-select .sport-select.af-select .af-select-title {
  display: none;
}

.m-event-list .m-topnav .trans-select .sport-select.af-select .af-select-title .af-select-input {
  display: hidden;
}

.m-event-list .m-topnav .trans-select .sport-select.af-select .af-select-list {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  border: none;
  border-top: 1px solid;
  -webkit-box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.2);
  box-shadow: 0 1px 4px 0 rgba(0, 0, 0, 0.2);
  margin-top: 1.66666667rem;
  max-height: 80vh;
  overflow: auto;
  position: absolute;
  z-index: 1001;
  border-top-color: #eaecef;
  border-top-color: var(--brand-border-type1);
}

.m-event-list .m-topnav .trans-select .sport-select.af-select .af-select-list .af-select-item {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: block;
  font-size: 1.066rem;
  height: 3rem;
  line-height: 3rem;
  padding-left: 3rem;
  text-align: left;
  color: #353a45;
  color: var(--text-type1-primary);
}

.m-event-list .m-topnav .trans-select .sport-select.af-select .af-select-list .af-select-item.active {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: var(--brand-secondary);
}

.m-event-list .m-topnav .trans-select .sport-select.af-select .af-select-list .af-select-item.active:after {
  color: var(--brand-secondary);
  content: '\e611';
  float: right;
  font-family: 'iconfont';
  font-size: 1.33333333rem;
  padding-right: 1.66666667rem;
}

.m-event-list .m-topnav .trans-select .sport-select.af-select .af-select-list .af-select-item.hover {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
}

.m-event-list .m-topnav .home-link {
  padding: 0 1rem 0 0.66666667rem;
}

.m-event-list .m-topnav .slot-container {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
}

.m-event-list .m-topnav .slot-container>a {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 100%;
}

.m-event-list .m-topnav .slot-container .search-icon {
  padding: 0 0.66666667rem 0 1.25rem;
}

.m-event-list .m-topnav .slot-container .search-icon::before {
  content: '\e613';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-event-list .m-topnav .slot-container .search-icon:before {
  font-size: 1.75rem;
  position: relative;
  top: 0.08333333rem;
}

.m-event-list .m-sport-bet-error {
  color: #353a45;
  color: var(--text-type1-primary);
  padding: 2.5rem 0 0.83333333rem;
}

.m-event-list .no-data {
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
  padding: 2.33333333rem;
  text-align: center;
}

.m-event-list .no-data::before {
  content: '\e624';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-event-list .no-data:before {
  color: #dcdee5;
  color: var(--disable-brand-secondary);
  font-size: 2.5rem;
}

.m-event-list .m-loading-wrap {
  margin-top: 15%;
}

.m-event-list .m-sanp-nav-container {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  border-bottom: 1px solid;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  /* height: 4rem; */
  width: 100%;
  border-bottom-color: #eaecef;
  border-bottom-color: var(--brand-border-type1);
}

.m-event-list .m-sport-type {
  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  background-color: var(--background-type1-primary);
}

.m-event-list .m-sport-type .m-sport-type-item {
  font-size: 1.066rem;
  font-weight: normal;
  padding: 0.61666667rem 1.25rem;
  text-transform: capitalize;
  /* border-radius: 30px; */
}

.m-event-list .m-sport-type .m-sport-type-item.active {
  border-bottom: 3px solid var(--brand-active-tab-bg);
}

.m-event-list .m-sport-type .m-sport-type-item:last-child {
  margin-right: 0.83333333rem;
}

.m-event-list .m-sport-type.m-sport-type-fixed {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  left: 0;
  position: fixed;
  right: 0;
  top: 3.66666667rem;
  -webkit-transition: top 0.3s;
  transition: top 0.3s;
  z-index: 100;
  border-bottom: 1px solid #eaecef;
}

/* .m-event-list .m-sport-type.m-sport-type-fixed.has-live {
  top: 7rem;
} */
.m-event-list .m-sport-type.m-sport-type-fixed.nav-down {
  top: 7.33333333rem;
}

.m-event-list .m-sport-type.m-sport-type-fixed.nav-down.has-live {
  top: 10.66666667rem;
}

.m-event-list .m-sport-type.m-sport-type-fixed.choose-open {
  z-index: -1;
}

.m-event-list .m-sport-type.has-live {
  align-items: center;
  display: flex;
  overflow: hidden;
}

.market-tabs-scroll {
  flex: 1 1 auto;
  flex-wrap: nowrap;
  min-width: 0;
  overflow-x: auto;
  scrollbar-width: none;
}

.market-tabs-scroll::-webkit-scrollbar {
  display: none;
}

.market-assist-rail {
  align-items: center;
  background: linear-gradient(
    90deg,
    rgba(250, 250, 250, 0) 0%,
    var(--background-type1-primary, #fafafa) 28%,
    var(--background-type1-primary, #fafafa) 100%
  );
  display: flex;
  flex: 0 0 auto;
  gap: 0.3rem;
  min-height: 3rem;
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
  border-radius: 999px;
  display: inline-flex;
  font-size: 0.66rem;
  height: 1.12rem;
  justify-content: center;
  line-height: 1;
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

.m-event-list .m-outright-bar {
  border-bottom: solid 0.08333333rem;
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  width: 100%;
  border-bottom-color: #eaecef;
  border-bottom-color: var(--brand-border-type1);
}

.m-event-list .m-outright-bar .m-match-type-item {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  font-size: 1.066rem;
  font-weight: bold;
  padding: 0.66666667rem 1.25rem;
  width: 100%;
}

.m-event-list .m-outright-bar .m-match-type-item.active {
  border-bottom: 4px solid var(--brand-text-secondary);
}

.m-event-list .m-outright-bar .m-match-type-item.m-snap-nav-item--disabled {
  background-color: #eaecef;
  background-color: var(--background-type1-tertiary);
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
}

.af-select-item {
  display: inline-block;
  text-align: center;
  width: 100%;
}

.af-select-item.active {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: var(--brand-highlight-text);
  color: var(--brand-quaternary);
}

.af-select-item.hover {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
}
</style>
