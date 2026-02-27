<template lang="">
  <div class="live-container">
    <div class="m-bet-tab">
      <div class="x-live-title">
        <span data-cms-key="live" data-cms-page="wap_home">Live</span>
        <div class="m-snap-nav-wrap m-sport-type" style="overflow: auto">
          <ul
            class="m-snap-nav flex"
            style="
              transform: translate(0px, 0px) translateZ(0px);
              transition-duration: 350ms;
              transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1);
            "
          >
            <li
              v-for="(sport, index) in sportsListData"
              :class="sport.sportID === activeSportID ? 'active' : ''"
              @click="setActiveSport(sport.sportID)"
              :key="index"
              :id="'live_' + sport.sportID"
              class="m-sport-type-item m-snap-nav-item"
              data-op="home_live-tabFootball"
            >
              {{ sport.sportName }}
            </li>
          </ul>
          <i class="controls left-controls"></i>
          <i class="controls right-controls"></i>
        </div>
      </div>
      <template v-if="isLoading">
        <LoadingSpinner v-show="isLoading"></LoadingSpinner>
        <LoadingError v-show="loadingError"></LoadingError>
      </template>
      <template v-else-if="!isLoading && !isEmptyResponse">
        <div style="position: relative">
          <div class="m-bet-content">
            <div class="m-market-tab m-tabs m-tabs-mini m-tabs-no-animation" style="overflow: auto">
              <div class="m-tabs-nav">
                <div
                  v-for="(market, m) in activeSportMarkets"
                  :key="m"
                  class="m-tabs-tab"
                  :class="market.marketID === activeMarket.marketID ? 'm-tabs-tab-active' : ''"
                  @click="selectMarket(market)"
                >
                  {{ market.marketName }}
                </div>
              </div>
            </div>
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
            <div class="x-table x-live-table football">
              <div class="x-table-row m-name-row">
                <div class="x-table-cell m-name-cell">
                  <div class="m-name">
                    <template v-for="(market, m) in effectiveMarket.outcomes" :key="m">
                      <div class="market-name">
                        <span> {{ market.outcomeName }} </span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
              <LiveHighlightsFixture
                v-for="(fixture, index) in visibleFixtures"
                :gameData="fixture"
                :key="`${fixture.matchID}-${fixture.updateTimestamp || index}`"
                :activeMarket="effectiveMarket"
                :activeSportID="activeSportID"
              ></LiveHighlightsFixture>
            </div>
            <div v-if="totalFixtures > 10" @click="$router.push('/Live')" class="view-all">
              <a class=""> View All Live {{ totalFixtures }} </a>
            </div>
          </div>
        </div>
      </template>
      <div
        v-else-if="!isLoading && (isEmptyResponse || accumulatedFixtures.length === 0)"
        class="no-data"
      >
        <div style="white-space: pre-line">
          <p>Sorry, there are no games currently available</p>
          <p>in this category. Please try later.</p>
          <p>Thank you.</p>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup>
import LiveHighlightsFixture from '@/components/Live/LiveHighlightsFixture.vue'
import { useUtilsStore } from '@/stores/utils.store'
import LoadingError from '@/components/Loaders/LoadingError.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import { useQuery } from 'vue-query'
import { getLiveHighlights, FEED_TOGGLE } from '@/helpers'
import _ from 'lodash'
import { defineComponent, onMounted, onBeforeUnmount, ref, computed, toRef, watch } from 'vue'
import emitter from '@/plugins/emitter'
import { useUpMode } from '@/composables/useUpMode'

const fallbackMarketsBySport = {
  1: [
    {
      marketID: 1,
      marketName: '1x2',
      specifier: '',
      outcomes: [
        {
          outcomeName: '1',
          outcomeID: '1'
        },
        {
          outcomeName: 'X',
          outcomeID: '2'
        },
        {
          outcomeName: '2',
          outcomeID: '3'
        }
      ],
      sportID: 0
    },
    {
      marketID: 10,
      marketName: 'DC',
      specifier: '',
      outcomes: [
        {
          outcomeName: '12',
          outcomeID: '10'
        },
        {
          outcomeName: 'X2',
          outcomeID: '11'
        },
        {
          outcomeName: '1X',
          outcomeID: '9'
        }
      ],
      sportID: 0
    },
    {
      marketID: 11,
      marketName: 'draw no bet',
      specifier: '',
      outcomes: [
        {
          outcomeName: '1',
          outcomeID: '4'
        },
        {
          outcomeName: '2',
          outcomeID: '5'
        }
      ],
      sportID: 0
    },
    {
      marketID: 18,
      marketName: 'Over/Under',
      specifier: 'total',
      outcomes: [
        {
          outcomeName: 'Over',
          outcomeID: '12'
        },
        {
          outcomeName: 'Under',
          outcomeID: '13'
        }
      ],
      sportID: 0
    },
    {
      marketID: 14,
      marketName: 'handicap',
      specifier: 'handicap',
      outcomes: [
        {
          outcomeName: '1',
          outcomeID: '1711'
        },
        {
          outcomeName: 'X',
          outcomeID: '1712'
        },
        {
          outcomeName: '2',
          outcomeID: '1713'
        }
      ],
      sportID: 0
    },
    {
      marketID: 29,
      marketName: 'GG/NG',
      specifier: '',
      outcomes: [
        {
          outcomeName: 'GG',
          outcomeID: '74'
        },
        {
          outcomeName: 'NG',
          outcomeID: '76'
        }
      ],
      sportID: 0
    },
    {
      marketID: 19,
      marketName: 'Home Over/Under',
      specifier: 'total',
      outcomes: [
        {
          outcomeName: 'Over',
          outcomeID: '12'
        },
        {
          outcomeName: 'Under',
          outcomeID: '13'
        }
      ],
      sportID: 0
    },
    {
      marketID: 26,
      marketName: 'odd/even',
      specifier: '',
      outcomes: [
        {
          outcomeName: 'Odd',
          outcomeID: '70'
        },
        {
          outcomeName: 'Even',
          outcomeID: '72'
        }
      ],
      sportID: 0
    },
    {
      marketID: 60100,
      marketName: '1x2 - 1up',
      specifier: '',
      outcomes: [
        {
          outcomeName: '1',
          outcomeID: '1'
        },
        {
          outcomeName: 'X',
          outcomeID: '2'
        },
        {
          outcomeName: '2',
          outcomeID: '3'
        }
      ],
      sportID: 0
    },
    {
      marketID: 60200,
      marketName: '1x2 - 2up',
      specifier: '',
      outcomes: [
        {
          outcomeName: '1',
          outcomeID: '1'
        },
        {
          outcomeName: 'X',
          outcomeID: '2'
        },
        {
          outcomeName: '2',
          outcomeID: '3'
        }
      ],
      sportID: 0
    }
  ],
  2: [
    {
    marketID: 186,
    marketName: 'winner',
    specifier: '',
    outcomes: [
      {
        outcomeName: '1',
        outcomeID: '4'
      },
      {
        outcomeName: '2',
        outcomeID: '5'
      }
    ],
    sportID: 2
  },
  ],
  5:[
    {
    marketID: 192,
    marketName: 'Home to win a set',
    specifier: '',
    outcomes: [
      {
        outcomeName: 'yes',
        outcomeID: '74'
      },
      {
        outcomeName: 'no',
        outcomeID: '76'
      }
    ],
    sportID: 0
  },
  {
    marketID: 187,
    marketName: 'game handicap',
    specifier: 'handicap',
    outcomes: [
      {
        outcomeName: '1 (-4.5)',
        outcomeID: '1714'
      },
      {
        outcomeName: '2 (+4.5)',
        outcomeID: '1715'
      }
    ],
    sportID: 0
  },
  {
    marketID: 190,
    marketName: 'Home Over/Under games',
    specifier: 'total',
    outcomes: [
      {
        outcomeName: 'over 12.5',
        outcomeID: '12'
      },
      {
        outcomeName: 'under 12.5',
        outcomeID: '13'
      }
    ],
    sportID: 0
  }
  ]
}

const activeSportID = ref(1)
const isEmptyResponse = ref(false)
const loadingError = ref(false)
const utilsStore = useUtilsStore()
// Keep a writable ref to the active market for up-mode state changes.
const activeMarket = toRef(utilsStore, 'activeLiveMarkets')
const totalFixtures = ref(1)
const accumulatedFixtures = ref([])
const accumulatedMarkets = ref([])

const { isLoading, refetch: refetchLiveData } = useQuery('liveData', getLiveHighlights, {
  enabled: FEED_TOGGLE,
  refetchOnWindowFocus: false,
  refetchOnMount: true,
  refetchOnReconnect: false,
  staleTime: 0, // Always fetch fresh data (don't use cache)
  cacheTime: 300000, // Keep in cache for 5 minutes after unmount
  // Rely on MQTT updates for live odds; avoid periodic API refreshes.
  refetchInterval: false,
  retry: (failureCount, error) => {
    // Don't retry on 4xx errors
    if (error.response && error.response.status >= 400 && error.response.status < 500) {
      return false
    }
    return failureCount < 3
  },
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  onError: (err) => {
    console.error('Error fetching live data:', err)
    loadingError.value = true
    isEmptyResponse.value = true
  },
  onSuccess: (response) => {
    loadingError.value = false

    if (response.data.fixtures && response.data.fixtures.length > 0) {
      // Trust the API - replace fixtures entirely
      // API is the source of truth: if a match isn't returned, it shouldn't be shown
      accumulatedFixtures.value = response.data.fixtures
      accumulatedMarkets.value = response.data.markets || []

      totalFixtures.value = response.data.fixtures.length
      isEmptyResponse.value = false
    } else {
      // No fixtures from API - clear everything
      accumulatedFixtures.value = []
      accumulatedMarkets.value = []
      totalFixtures.value = 0
      isEmptyResponse.value = true
    }
  }
})

const sportsListData = computed(() => {
  if (isEmptyResponse.value || accumulatedFixtures.value.length === 0) {
    return []
  }

  // Use Map for O(1) deduplication
  const uniqueMap = new Map()

  accumulatedFixtures.value.forEach((fixture) => {
    if (!uniqueMap.has(fixture.sportID)) {
      uniqueMap.set(fixture.sportID, {
        sportID: fixture.sportID,
        sportName: fixture.sportName
      })
    }
  })

  return Array.from(uniqueMap.values()).sort((a, b) => a.sportID - b.sportID)
})

// Base fixtures list for the active sport before applying up-mode filtering.
const sportFixtures = computed(() => {
  if (accumulatedFixtures.value.length === 0 || isEmptyResponse.value) {
    return []
  }

  return accumulatedFixtures.value
    .filter((fixture) => fixture.sportID === activeSportID.value)
    .sort((a, b) => {
      // Group by tournament, maintain order within tournament
      if (a.tournamentID !== b.tournamentID) {
        return a.tournamentID - b.tournamentID
      }
      return 0
    })
})

/**
 * COMPUTED: All markets with sorted outcomes
 * Used to derive active sport markets
 */
const marketsGroup = computed(() => {
  if (accumulatedMarkets.value.length === 0 || isEmptyResponse.value) {
    return []
  }

  return accumulatedMarkets.value.map((m) => ({
    ...m,
    outcomes: [...m.outcomes].sort((a, b) => a.outcomeID - b.outcomeID)
  }))
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

// Limit the live preview to the first 10 fixtures after up-mode filtering.
const visibleFixtures = computed(() => {
  return (filteredFixtures.value || []).slice(0, 10)
})

/**
 * COMPUTED: Markets for currently selected sport
 * These populate the market tabs (1X2, Over/Under, etc.)
 */
const activeSportMarkets = computed(() => {
  // Strip derived markets from tabs to keep the base list clean.
  const markets = sanitizeMarkets(marketsGroup.value).filter(
    (m) => m.sportID === activeSportID.value
  )
  if (markets.length) {
    return _.sortBy(markets, 'marketID')
  }

  return fallbackMarketsBySport[activeSportID.value] || []
})

/**
 * WATCHER: Auto-select first market when sport changes
 * Ensures a market is always selected for odds display
 */
watch(activeSportMarkets, (newValue) => {
  if (newValue.length) {
    // Keep store in sync with the active market selection.
    activeMarket.value = newValue[0]
  } else {
    activeMarket.value = []
  }
})

/**
 * WATCHER: Auto-select first sport when sports list changes
 * Prevents showing no sport when fixtures load
 */
watch(
  sportsListData,
  (newSportsList) => {
    if (
      newSportsList.length > 0 &&
      !newSportsList.some((sport) => sport.sportID === activeSportID.value)
    ) {
      activeSportID.value = newSportsList[0].sportID
      // Reset up-mode when the auto-selected sport changes.
      resetUpMode()
    }
  },
  { immediate: true }
)

function setActiveSport(sid) {
  activeSportID.value = sid
  // Reset up-mode when the active sport changes.
  resetUpMode()
  document.getElementById('live_' + sid).scrollIntoView({
    behavior: 'smooth',
    block: 'nearest',
    inline: 'center'
  })
}

function selectMarket(market) {
  // Use the shared active market ref so up-mode stays consistent.
  activeMarket.value = market
}

defineComponent({
  components: {
    LoadingError,
    LoadingSpinner
  },
  methods: {
    // Manually trigger a refetch without making a new network request
    handleManualRefetch() {
      refetchLiveData()
    }
  }
})

onMounted(() => {
  // Listen for match-ended events from child components
  emitter.on('match-ended', (matchId) => {
    accumulatedFixtures.value = accumulatedFixtures.value.filter(
      (fixture) => String(fixture.matchID) !== String(matchId)
    )
    totalFixtures.value = accumulatedFixtures.value.length
  })
})

onBeforeUnmount(() => {
  emitter.off('match-ended')
})
</script>

<style type="text/css">
.live-container {
  background-color: #000825;
  background-color: var(--brand-background-live);
  color: #ffffff;
  color: var(--text-type2-primary);
}
.live-container .m-market-tab {
  background-color: #000825;
  background-color: var(--brand-background-live);
  position: -webkit-sticky;
  position: sticky;
  top: 7.41666667rem;
  width: 100%;
  z-index: 26;
}

.live-container .m-market-tab .m-tabs-nav .m-tabs-ink-bar {
  background-color: #0d9737;
}
.live-container .m-market-tab .m-tabs-nav .m-tabs-tab {
  color: #ffffff;
  -webkit-box-flex: initial;
  -webkit-flex: initial;
  -ms-flex: initial;
  flex: initial;
  font-size: 1.066rem;
  font-weight: 500;
  margin-right: 0;
  padding: 1.33333333rem 0.83333333rem;
  text-transform: capitalize;
}
.live-container .m-market-tab .m-tabs-nav .m-tabs-tab-active {
  color: #ffffff;
  font-weight: bold;
  border-bottom: 0.23333333rem solid var(--brand-live-odds-text);
}

.live-container .up-mode-bar {
  display: flex;
  gap: 0;
  padding: 0.5rem 0;
  width: 100%;
}

.live-container .up-mode-tab {
  background: transparent;
  border: none;
  border-bottom: 3px solid transparent;
  color: #ffffff;
  cursor: pointer;
  flex: 1;
  font-size: 0.9rem;
  font-weight: 700;
  padding: 0.4rem 0;
  text-align: center;
  text-transform: uppercase;
}

.live-container .up-mode-tab.active {
  border-bottom-color: var(--c-prematch-tab-name-active);
}
.live-container .m-bet-tab {
  /* background-color: var(--brand-background-live); */
  background-color: var(--brand-background-live);
  padding-bottom: 10px;
}
.live-container .m-bet-tab .x-live-title {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  margin: 0;
  padding: 1.066rem 1rem;
  position: -webkit-sticky;
  position: sticky;
  top: 3.66666667rem;
  z-index: 200;
  background: var(--brand-background-live);
}
.live-container .m-bet-tab .x-live-title > span {
  border-right: 1px solid;
  font-size: 1.5rem;
  font-weight: bold;
  line-height: 1;
  margin-right: 0.83333333rem;
  padding-right: 0.83333333rem;
  border-right-color: #9ca0ab;
  border-right-color: var(--text-type2-tertiary);
}
.live-container .m-bet-tab .m-sport-type {
  /* background-color: #1b1e25; */
  /* background-color: var(--brand-background-live); */
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
}
.live-container .m-bet-tab .m-sport-type .m-sport-type-item {
  font-size: 1.066rem;
  font-weight: normal;
  line-height: 1;
}
.live-container .m-bet-tab .m-sport-type .m-sport-type-item.active {
  color: var(--brand-live-odds-text);
  font-weight: bold;
}
.live-container .m-bet-tab .m-bet-content .x-live-table .m-name-row {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}
.live-container .m-bet-tab .m-bet-content .x-live-table .m-name-row .m-name-cell {
  background-color: #3a3c42;
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: end;
  -webkit-justify-content: flex-end;
  -ms-flex-pack: end;
  justify-content: flex-end;
  padding: 0 0.83333333rem;
}
.live-container .m-bet-tab .m-bet-content .x-live-table .m-name-row .m-name-cell .m-name {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  width: 55%;
}
.live-container .m-bet-tab .m-bet-content .x-live-table .m-name-row .m-name-cell .m-name > div {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  height: 2rem;
  line-height: 2rem;
  text-align: center;
}
.live-container .m-bet-tab .m-bet-content .x-live-table.tennis .m-info-cell {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding-right: 0.83333333rem;
  width: 26%;
}
.live-container .m-bet-tab .m-bet-content .view-all a,
.live-container .m-bet-tab .m-bet-content .view-all a:hover,
.live-container .m-bet-tab .m-bet-content .view-all a:visited,
.live-container .m-bet-tab .m-bet-content .view-all a:active,
.live-container .m-bet-tab .m-bet-content .view-all a:after {
  /* color: var(--c-event-normal-text); */
  text-decoration: none;
}
.live-container .no-data:before {
  color: rgba(234, 236, 239, 0.15);
}
.live-container .m-loading.dark {
  /* background-color: #1b1e25; */
  background-color: var(--brand-background-live);
}
</style>
