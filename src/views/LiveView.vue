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
      <div v-if="Object.keys(filteredLiveData).length" class="m-sanp-nav-container">
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
        </div>
      </div>

      <!-- Fixtures List -->
      <div v-if="Object.keys(filteredLiveData).length" class="m-bet-content">
        <div
          v-for="(fixtures, tournamentKey) in filteredLiveData"
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
                  <template v-for="(outcome, o) in _.sortBy(activeMarket?.outcomes || [], 'outcomeID')" :key="o">
                    <div class="outcome-name">
                      <span>{{ getOutcomeDisplayName(activeMarket?.marketName, outcome.outcomeID, outcome.outcomeName) }}</span>
                    </div>
                  </template>
                </div>
              </div>

              <!-- Fixtures -->
              <LiveFixture
                v-for="(fixture, index) in fixtures"
                :key="fixture.matchID"
                :gameData="fixture"
                :activeMarket="activeMarket"
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
import { getFeedsLiveFixtures } from '@/helpers'
import { sportsList } from '@/helpers/constants'
import { ref, computed, watch } from 'vue'
import HeaderOther from '@/components/HeaderOther.vue'
import _ from 'lodash'

const isEmptyResponse = ref(false)
const utilsStore = useUtilsStore()
const activeSportID = ref(utilsStore.activeLiveSportID || 1)

// Map outcome IDs to standard display names for common markets
const outcomeNameMap = {
  '1X2': { 1: '1', 2: 'X', 3: '2' },
  'DC': { 9: '1X', 10: '12', 11: 'X2' },
  'DNB': { 4: '1', 5: '2' },
  'Over/Under': { 12: 'Over', 13: 'Under' },
  'Odd/Even': { 70: 'Odd', 72: 'Even' },
  'GG/NG': { 74: 'GG', 76: 'NG' }
}

//Fallback Markets
const fallbackMarketsBySport =[
  {
    "marketID": 1,
    "marketName": "1x2",
    "specifier": "",
    "outcomes": [
        {
            "outcomeName": "1",
            "outcomeID": "1"
        },
        {
            "outcomeName": "X",
            "outcomeID": "2"
        },
        {
            "outcomeName": "2",
            "outcomeID": "3"
        }
    ],
    "sportID": 1
  },
  {
    "marketID": 10,
    "marketName": "DC",
    "specifier": "",
    "outcomes": [
        {
            "outcomeName": "12",
            "outcomeID": "10"
        },
        {
            "outcomeName": "X2",
            "outcomeID": "11"
        },
        {
            "outcomeName": "1X",
            "outcomeID": "9"
        }
    ],
    "sportID": 1
  },
  {
    "marketID": 11,
    "marketName": "draw no bet",
    "specifier": "",
    "outcomes": [
        {
            "outcomeName": "1",
            "outcomeID": "4"
        },
        {
            "outcomeName": "2",
            "outcomeID": "5"
        }
    ],
    "sportID": 1
  },
  {
    "marketID": 18,
    "marketName": "Over/Under",
    "specifier": "total",
    "outcomes": [
        {
            "outcomeName": "Over",
            "outcomeID": "12"
        },
        {
            "outcomeName": "Under",
            "outcomeID": "13"
        }
    ],
    "sportID": 1
  },
  {
    "marketID": 14,
    "marketName": "handicap",
    "specifier": "handicap",
    "outcomes": [
        {
            "outcomeName": "1",
            "outcomeID": "1711"
        },
        {
            "outcomeName": "X",
            "outcomeID": "1712"
        },
        {
            "outcomeName": "2",
            "outcomeID": "1713"
        }
    ],
    "sportID": 1
  },
  {
    "marketID": 29,
    "marketName": "GG/NG",
    "specifier": "",
    "outcomes": [
        {
            "outcomeName": "GG",
            "outcomeID": "74"
        },
        {
            "outcomeName": "NG",
            "outcomeID": "76"
        }
    ],
    "sportID": 1
  },
  {
    "marketID": 19,
    "marketName": "Home Over/Under",
    "specifier": "total",
    "outcomes": [
        {
            "outcomeName": "Over",
            "outcomeID": "12"
        },
        {
            "outcomeName": "Under",
            "outcomeID": "13"
        }
    ],
    "sportID": 1
  },
  {
    "marketID": 26,
    "marketName": "odd/even",
    "specifier": "",
    "outcomes": [
        {
            "outcomeName": "Odd",
            "outcomeID": "70"
        },
        {
            "outcomeName": "Even",
            "outcomeID": "72"
        }
    ],
    "sportID": 1
  }
]

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
  isLoading
} = useQuery(
  ['liveViewData'],
  () => getFeedsLiveFixtures(0, 0, 0, 'priority'), // sport_id=0 fetches all sports
  {
    // Prevent automatic refetching which can cause recursive updates
    refetchOnWindowFocus: false,
    refetchOnMount: true,
    refetchOnReconnect: false,
    // Use a longer stale time to prevent unnecessary refetches
    staleTime: 60000, // 1 minute
    // Add cacheTime to control how long data stays in cache
    cacheTime: 300000, // 5 minutes
    // Update refetch interval to 10 minutes
    refetchInterval: 60000 * 10, // 10 minutes
    // Add retry logic with exponential backoff
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error.response && error.response.status >= 400 && error.response.status < 500) {
        return false
      }
      return failureCount < 3 // retry up to 3 times
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    onError: (err) => {
      console.error('Error fetching live data:', err)
    },
    onSuccess: (response) => {
      if (response?.data.fixtures && response.data.fixtures.length > 0) {
        isEmptyResponse.value = false
      } else {
        isEmptyResponse.value = true
      }
    }
  }
)

// Derive sports list from response data with fixture counts per sport
const sportsListData = computed(() => {
  if (!completeLiveData.value?.data.fixtures) {
    return []
  }
  // Group fixtures by sport and count
  const sportCounts = new Map()
  completeLiveData.value.data.fixtures.forEach(fixture => {
    if (!sportCounts.has(fixture.sportID)) {
      sportCounts.set(fixture.sportID, {
        sportID: fixture.sportID,
        sportName: fixture.sportName || sportsList.find(s => s.sport_id === fixture.sportID)?.name || `Sport ${fixture.sportID}`,
        count: 0
      })
    }
    sportCounts.get(fixture.sportID).count++
  })
  return Array.from(sportCounts.values()).sort((a, b) => a.sportID - b.sportID)
})

const filteredLiveData = computed(() => {
  if (!completeLiveData.value?.data.fixtures || isEmptyResponse.value) {
    return {}
  }

  // Filter by selected sport, sort and group by category
  const fixtures = completeLiveData.value.data.fixtures
    .filter(fixture => fixture.sportID === activeSportID.value)
    .sort((a, b) => {
      // First sort by tournamentID
      if (a.tournamentID !== b.tournamentID) {
        return a.tournamentID - b.tournamentID
      }
      // If same tournament, maintain original order
      return 0
    })

  return _.groupBy(fixtures, 'categoryName')
})

const marketsGroup = computed(() => {
  if (!completeLiveData.value?.data.markets || isEmptyResponse.value) {
    return []
  }
  return completeLiveData.value.data.markets
})

// Filter markets by active sport
const activeSportMarkets = computed(() => {
  const markets = marketsGroup.value.filter(m => m.sportID === activeSportID.value)
  if(markets.length){
    return _.sortBy(markets, 'marketID')
  }

  return fallbackMarketsBySport.filter((m) => m.sportID === activeSportID.value);
})

const activeMarket = computed(() => {
  return utilsStore.activeLiveMarkets
})

watch(activeSportMarkets, (newValue) => {
  // Update activeMarket when activeSportMarkets changes
  if (newValue.length) {
    utilsStore.activeLiveMarkets = newValue[0]
  } else {
    utilsStore.activeLiveMarkets = []
  }
})

// Auto-select first sport when data loads if current sport has no fixtures
watch(sportsListData, (newValue) => {
  if (newValue.length > 0) {
    // Check if current activeSportID exists in the list
    const currentSportExists = newValue.some(s => s.sportID === activeSportID.value)
    if (!currentSportExists) {
      activeSportID.value = newValue[0].sportID
    }
  }
})

function setActiveSport(sid) {
  activeSportID.value = parseInt(sid)
  document.getElementById('live_' + sid)?.scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

function selectMarket(market) {
  utilsStore.activeLiveMarkets = market
}

// Function to handle odds changes
const handleOddsChange = (data) => {
  // console.log('⚙️ LiveView: Received odds change:', data)

  if (!completeLiveData.value?.fixtures) {
    // console.log('⚙️ LiveView: No fixtures data available, skipping odds update')
    return
  }

  // Find and update the fixture with matching matchID
  const fixtureIndex = completeLiveData.value.fixtures.findIndex(
    (fixture) => String(fixture.matchID) === String(data.matchID)
  )

  if (fixtureIndex !== -1) {
    // console.log(`⚙️ LiveView: Updating odds for match ID ${data.matchID}`)

    // Update the fixture's outcomes
    completeLiveData.value.fixtures[fixtureIndex] = {
      ...completeLiveData.value.fixtures[fixtureIndex],
      outcomes: completeLiveData.value.fixtures[fixtureIndex].outcomes.map((outcome) => {
        if (String(outcome.outcomeID) === String(data.outcomeID)) {
          return {
            ...outcome,
            odds: data.odds,
            active: data.active
          }
        }
        return outcome
      })
    }
  }
}

// Function to handle bet stops
const handleBetStop = (data) => {
  // console.log('⚙️ LiveView: Received bet stop:', data)

  if (!completeLiveData.value?.fixtures) {
    // console.log('⚙️ LiveView: No fixtures data available, skipping bet stop update')
    return
  }

  // Find and update the fixture with matching matchID
  const fixtureIndex = completeLiveData.value.fixtures.findIndex(
    (fixture) => String(fixture.matchID) === String(data.matchID)
  )

  if (fixtureIndex !== -1) {
    // console.log(`⚙️ LiveView: Processing bet stop for match ID ${data.matchID}`)

    // Update all outcomes to be inactive with odds 0
    completeLiveData.value.fixtures[fixtureIndex] = {
      ...completeLiveData.value.fixtures[fixtureIndex],
      outcomes: completeLiveData.value.fixtures[fixtureIndex].outcomes.map((outcome) => ({
        ...outcome,
        odds: 0,
        active: false
      }))
    }
  }
}

// Function to set up MQTT subscriptions
const setupMqttSubscriptions = () => {
  // console.log('⚙️ LiveView: Setting up MQTT subscriptions')

  if (!completeLiveData.value?.fixtures) {
    // console.log('⚙️ LiveView: No fixtures available for MQTT subscriptions')
    return
  }

  // Get unique match IDs from fixtures
  const matchIds = [
    ...new Set(completeLiveData.value.fixtures.map((fixture) => String(fixture.matchID)))
  ]

  // Subscribe to odds changes and bet stops for each match
  matchIds.forEach((matchId) => {
    const oddsChangeUnsubscribe = mqttService.subscribe(`odds_change/${matchId}`, handleOddsChange)

    const betStopUnsubscribe = mqttService.subscribe(`bet_stop/${matchId}`, handleBetStop)

    unsubscribeFunctions.value.push(oddsChangeUnsubscribe, betStopUnsubscribe)
  })
}

onMounted(async () => {
  if (completeLiveData.value && completeLiveData.value.fixtures.length) {
    activeSportID.value = completeLiveData.value.fixtures[0].sportID
    setupMqttSubscriptions()
  }
})

onBeforeUnmount(() => {
  // Clean up MQTT subscriptions
  unsubscribeFunctions.value.forEach((unsubscribe) => unsubscribe())
  unsubscribeFunctions.value = []
})

defineComponent({
  methods: {
    // Manually trigger a refetch without making a new network request
    handleManualRefetch() {
      refetch()
    }
  }
})

// Add watcher for activeSportID to update store
watch(activeSportID, (newValue) => {
  utilsStore.activeLiveSportID = newValue
})
</script>

<style scoped>
.m-event-list {
  background-color: #000825;
  color: #fff;
  min-height: 100vh;
}

/* Sports Navigation */
.nav-container {
  background-color: #000825;
}

.m-sport-type {
  background-color: #000825;
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
  background-color: #000825;
  position: sticky;
  top: 4.5rem;
  z-index: 100;
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
  background-color: #000825;
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
