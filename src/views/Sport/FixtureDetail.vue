<template>
  <div>
    <div class="x-prematch-detail">
      <HeaderOther :headerTitle="'Details'"></HeaderOther>
      <div v-if="eventDetail && !isLoading">
        <div class="m-event-title">
          <div class="m-event-league link">
            {{ route.params.sport }} - {{ eventDetail.country }} - {{ eventDetail.tournament }}
          </div>
          <div class="m-event-title-team-horizontal">
            <div class="watermark">
              <div><img :src="'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F' +
                encodeURIComponent(eventDetail.homeTeam.toUpperCase()) +
                '.png?alt=media'
                " draggable="false" class="home" style=""></div>
              <div class="switch-button-left"><svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
                  height="10px" width="10px" class="svg-icon-base">
                  <path d="M5 8.75l.661-.661-2.616-2.62H8.75v-.938H3.045l2.62-2.616L5 1.25 1.25 5 5 8.75z"
                    fill="currentColor"></path>
                </svg></div>
            </div>
            <div class="team">
              <div class="team-icon"><img :src="'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F' +
                encodeURIComponent(eventDetail.homeTeam.toUpperCase()) +
                '.png?alt=media'
                " draggable="false" style=""></div>
              <div class="team-name">{{ eventDetail.homeTeam }}</div>
            </div>
            <div class="date-time">
              <div class="date">
                <div>{{ formatDate(eventDetail.date, 'DD/MM dddd') }}</div>
              </div>
              <div class="time">
                {{ formatDate(eventDetail.date, 'HH:mm') }}
              </div>
            </div>
            <div class="team">
              <div class="team-icon"><img :src="'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F' +
                encodeURIComponent(eventDetail.awayTeam.toUpperCase()) +
                '.png?alt=media'
                " draggable="false" style=""></div>
              <div class="team-name">{{ eventDetail.awayTeam }}</div>
            </div>
            <div class="watermark">
              <div><img :src="'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F' +
                encodeURIComponent(eventDetail.awayTeam.toUpperCase()) +
                '.png?alt=media'
                " draggable="false" class="away" style=""></div>
              <div class="switch-button-right"><svg viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg"
                  height="10px" width="10px" class="svg-icon-base">
                  <path d="M5 8.75l.661-.661-2.616-2.62H8.75v-.938H3.045l2.62-2.616L5 1.25 1.25 5 5 8.75z"
                    fill="currentColor"></path>
                </svg></div>
            </div>
          </div>
          <div class="m-event-time-wrap">
            <div class="m-event-time-left"><span class="event-date"><span class="event-gameid">Game ID {{
              eventDetail.matchID }}</span>

              </span></div>
          </div>
        </div>
        <div style="position: relative"></div>
        <div class="m-tab-navs-wrap">
          <ul class="m-tab-navs">
            <li class="m-nav-item" @click="isH2HShowing = false" :class="isH2HShowing ? '' : 'active'">
              <i class="m-icon m-icon-market"></i>
              <span class="m-text">Markets</span>
            </li>
            <li class="m-nav-item" :class="!isH2HShowing ? '' : 'active'"
              @click="showFixtureAnalysis(eventDetail.matchID)">
              <i class="m-icon m-icon-stat"></i>
              <span class="m-text">Stats</span>
            </li>
          </ul>
        </div>


        <div v-show="!isH2HShowing" class="m-sub-tab">
          <div class="m-snap-nav-wrap m-group" style="overflow: hidden;">
            <ul class="m-snap-nav flex"
              style="transform: translate(0px, 0px) translateZ(0px); transition-duration: 350ms; transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1); width: 645.388px;">
              <li class="m-sport-group-item m-snap-nav-item" :class="{ active: selectedGroupId === null }"
                @click="selectedGroupId = null">
                <span>All</span>
              </li>
              <li v-for="group in sortedMarketGroups" :key="group.id" class="m-sport-group-item m-snap-nav-item"
                :class="{ active: selectedGroupId === group.id }" @click="selectedGroupId = group.id">
                <span>{{ group.name }}</span>
              </li>
            </ul> <i class="controls left-controls"></i> <i class="controls right-controls"></i>
          </div>
          <div v-if="eventDetail.status === 0" class="m-market-group pre-match event-detail">
            <div v-if="hasNoMarketsInSelectedGroup" class="m-sport-market-no-data">
              <div style="white-space: pre-line">
                Sorry, there are no markets available in this category.
              </div>
            </div>
            <div v-else-if="displayGroupedMarkets.length === 0" class="m-sport-market-no-data">
              <div style="white-space: pre-line">
                Sorry, there are no markets available in this category.
              </div>
            </div>
            <div v-else class="m-sport-market">
              <div v-for="(marketGroup, index) in displayGroupedMarkets" :key="index"
                :data-key="'market-' + marketGroup.marketID">
                <div class="m-market m-detail-market-default">
                  <div class="m-market-title" style="flex-basis: 100%">
                    <span class="dis-icon"></span>
                    <span class="text" style="text-transform: capitalize">{{ marketGroup.marketName }}
                    </span>
                    <span class="m-icon-tips"></span>
                  </div>
                  <div class="m-table market-content">
                    <div class="m-table-row" v-for="(market, m) in getChunks(marketGroup.markets[0].outcomes)" :key="m">
                      <template v-if="marketGroup.specifier !== undefined && marketGroup.specifier === ''">
                        <template v-for="(selection, odd) in sortByKey(market, 'outcomeID')" :key="odd">
                          <div class="m-table-cell m-outcome m-detail-outcome-default m-outcome-odds-des" :class="{
                            'm-outcome--checked': isSelected(
                              createID(
                                eventDetail.gameID,
                                eventDetail.matchID,
                                selection.outcomeName,
                                selection.oddID,
                                eventDetail.name
                              ),
                              couponStore.coupon
                            ),
                            'm-outcome-two': market.length === 2,
                            'm-outcome-three': market.length === 3,
                            'm-outcome--disabled': selection.odds < 1
                          }" @click="addToBetslip(marketGroup, selection)">
                            <em style="text-transform: capitalize">{{
                              selection.displayName ?? selection.outcomeName
                            }}</em>
                            <em :class="{ 'm-icon-lock': selection.odds < 1 }">{{
                              selection.odds > 1 ? selection.odds.toFixed(2) : ''
                            }}</em>
                          </div>
                        </template>
                      </template>
                      <template v-else>
                        <div v-if="isTotalOrHandicap(marketGroup)" class="m-table">

                          <div v-for="(mg, idx) in uniqueMarkets(marketGroup.markets)" class="m-table-row" :key="idx">
                            <div
                              class="m-table-cell m-table-cell m-outcome-only-odds m-outcome-combo-title m-specifier-colum-title"
                              :class="{
                                'm-outcome-three': uniqueOutcomes(mg.outcomes).length + 1 === 3,
                                'm-outcome-four': uniqueOutcomes(mg.outcomes).length + 1 === 4
                              }">
                              <em>{{ getSpecifierValue(mg.specifier) }}</em>
                            </div>
                            <template v-for="(outcome, o) in uniqueOutcomes(mg.outcomes)" :key="o">
                              <div
                                class="m-table-cell m-outcome-combo m-outcome-only-odds m-outcome m-detail-outcome-default"
                                @click="addToBetslip(mg, outcome)" :class="{
                                  'm-outcome--checked': isSelected(
                                    createID(
                                      eventDetail.gameID,
                                      eventDetail.matchID,
                                      outcome.outcomeName,
                                      outcome.oddID,
                                      eventDetail.name
                                    ),
                                    couponStore.coupon
                                  ),
                                  'm-outcome-three': uniqueOutcomes(mg.outcomes).length + 1 === 3,
                                  'm-outcome-four': uniqueOutcomes(mg.outcomes).length + 1 === 4,
                                  'm-outcome--disabled': outcome.odds < 1
                                }">
                                <em :class="{ 'm-icon-lock': outcome.odds <= 1 }">{{
                                  outcome.odds > 1 ? outcome.odds.toFixed(2) : ''
                                }}</em>
                              </div>
                            </template>
                          </div>
                        </div>
                        <template v-else v-for="(selection, odd) in sortByKey(market, 'outcomeID')" :key="odd">
                          <div class="m-table-cell m-outcome m-detail-outcome-default m-outcome-odds-des" :class="{
                            'm-outcome--checked': isSelected(
                              createID(
                                eventDetail.gameID,
                                eventDetail.matchID,
                                selection.outcomeName,
                                selection.oddID,
                                eventDetail.name
                              ),
                              couponStore.coupon
                            ),
                            'm-outcome-two': market.length === 2,
                            'm-outcome-three': market.length === 3,
                            'm-outcome--disabled': selection.odds < 1
                          }" @click="addToBetslip(marketGroup, selection)">
                            <em style="text-transform: capitalize">{{
                              getMarketCode(selection.outcomeName)
                            }}</em>
                            <em :class="{ 'm-icon-lock': selection.odds < 1 }">{{
                              selection.odds > 1 ? selection.odds.toFixed(2) : ''
                            }}</em>
                          </div>
                        </template>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="m-sport-market-no-data">
            <div style="white-space: pre-line">
              Sorry, this game is no longer available. Betting has closed. Please choose other
              games.
            </div>
          </div>
        </div>
        <div v-show="isH2HShowing" class="m-sub-tab">
          <div class="m-h2h">
            <div id="sr-widget"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <LoadingSpinner v-if="isLoading"></LoadingSpinner>
  <ErrorDialogue v-else-if="!isLoading && !eventDetail" :message="errorMessage"></ErrorDialogue>
</template>

<script setup>
import HeaderOther from '@/components/HeaderOther.vue'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import { defineComponent, watch, ref, computed, onMounted, onBeforeUnmount } from 'vue'
import { useRoute } from 'vue-router'
import { getFixtureMarkets, getMarketsGrouping, chunks, formatDate, createID, isSelected } from '@/helpers'
// import _ from 'lodash'
import ErrorDialogue from '@/components/ErrorDialogue.vue'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '@/helpers'
import { useMqttService } from '@/composables/useMqtt'
import { useUtilsStore } from '../../stores'

const { subscribe } = useMqttService()
const { sportsMenu } = useUtilsStore()

const eventMarkets = ref()
const eventDetail = ref(null)
const marketGroups = ref([]);
const groupedMarkets = ref([])
const isLoading = ref(false)
const route = useRoute()
const errorMessage = ref()
const couponStore = useCouponStore()
const homeTeam = ref()
const awayTeam = ref()
const isH2HShowing = ref(false)
const updatedOutcomes = ref({})
const updatePending = ref(false)
const unsubscribeFunctions = ref([])
const refetchInterval = ref(null)
const REFETCH_INTERVAL_MS = 60000 // 60 seconds
const selectedGroupId = ref(null) // null means "All"

// Group markets by their group IDs
const groupedMarketsByTab = computed(() => {
  if (!eventMarkets.value || !marketGroups.value) {
    return {}
  }

  const grouped = {}

  // Initialize groups
  marketGroups.value.forEach(group => {
    grouped[group.id] = {
      ...group,
      markets: []
    }
  })

  // Group markets
  eventMarkets.value.forEach(market => {
    marketGroups.value.forEach(group => {
      if (group.marketIDs.includes(market.marketID)) {
        if (!grouped[group.id]) {
          grouped[group.id] = {
            ...group,
            markets: []
          }
        }
        grouped[group.id].markets.push(market)
      }
    })
  })

  return grouped
})

// Get markets for the selected tab
const filteredMarkets = computed(() => {
  if (!eventMarkets.value) {
    return []
  }

  // If "All" is selected (selectedGroupId is null), return all markets
  if (selectedGroupId.value === null) {
    return eventMarkets.value
  }

  // Otherwise, return markets for the selected group
  const group = groupedMarketsByTab.value[selectedGroupId.value]
  return group ? group.markets : []
})

// Group filtered markets by marketID for display
const displayGroupedMarkets = computed(() => {
  return groupByMarketID(filteredMarkets.value)
})

// Get sorted market groups for display (sorted by priority)
const sortedMarketGroups = computed(() => {
  if (!marketGroups.value) {
    return []
  }
  return [...marketGroups.value].sort((a, b) => b.priority - a.priority)
})

// Check if the selected group has no markets (only [0] in marketIDs)
const hasNoMarketsInSelectedGroup = computed(() => {
  if (selectedGroupId.value === null) {
    return false // "All" tab always shows markets if they exist
  }

  const group = marketGroups.value.find(g => g.id === selectedGroupId.value)
  if (!group) {
    return false
  }

  // Check if marketIDs only contains [0] or is empty
  return group.marketIDs.length === 0 ||
    (group.marketIDs.length === 1 && group.marketIDs[0] === 0)
})

watch(
  () => [route.params.event_id, route.name],
  async ([event_id, route_name]) => {
    if (route_name === 'fixtures-detail') {
      await getEventDetail(event_id)
    }
  },
  { immediate: true }
)

function setupMqttSubscriptions(matchId) {
  const componentId = `fixture-detail-${matchId}-${Date.now()}`

  // Subscribe to odds changes
  const oddsChangeTopic = `feeds/prematch/odds_change/${matchId}`
  const unsubscribeOddsChange = subscribe(oddsChangeTopic, (data) => {
    // console.log(`📊 MQTT: Received message on topic ${oddsChangeTopic} for component ${componentId}`)
    handleOddsChange(data)
  })

  // Subscribe to bet stop
  const betStopTopic = `feeds/prematch/bet_stop/${matchId}`
  const unsubscribeBetStop = subscribe(betStopTopic, (data) => {
    // console.log(`⚠️ BET STOP: Received message on topic ${betStopTopic} for component ${componentId}`)
    handleBetStop(data)
  })

  // Store unsubscribe functions in ref
  unsubscribeFunctions.value = [unsubscribeOddsChange, unsubscribeBetStop]
}

function setupPeriodicRefetch(matchId) {
  // Clear any existing interval
  if (refetchInterval.value) {
    clearInterval(refetchInterval.value)
  }

  // Set up new interval
  refetchInterval.value = setInterval(async () => {
    if (eventDetail.value?.statusCode === 0) {
      // Only refetch if match is still available
      // console.log(`🔄 Periodic refetch for match ID: ${matchId}`);
      try {
        const res = await Promise.all([getFixtureMarkets(matchId), getMarketsGrouping(sport_id)])
        if (Object.keys(res[0]).length && res[0].markets) {
          eventMarkets.value = res[0].markets
          groupedMarkets.value = groupByMarketID(res.markets)
          marketGroups.value = res[1]
          // console.log(
          //   `✅ Successfully refetched markets for match ID: ${matchId}`,
          // );
        }
      } catch (error) {
        // console.error(`❌ Error during periodic refetch:`, error);
      }
    } else {
      // console.log(
      //   `⏹️ Match no longer available, stopping periodic refetch for match ID: ${matchId}`,
      // );
      clearInterval(refetchInterval.value)
    }
  }, REFETCH_INTERVAL_MS)

  // console.log(
  //   `⏱️ Set up periodic refetch every ${
  //     REFETCH_INTERVAL_MS / 1000
  //   } seconds for match ID: ${matchId}`,
  // );
}

onBeforeUnmount(() => {
  // Clean up any active subscriptions
  if (unsubscribeFunctions.value.length > 0) {
    // console.log(`🧹 Component: Cleaning up MQTT subscriptions`);
    unsubscribeFunctions.value.forEach((unsubscribe) => unsubscribe())
    unsubscribeFunctions.value = []
  }

  // Clean up refetch interval
  if (refetchInterval.value) {
    // console.log(`🧹 Component: Cleaning up periodic refetch interval`);
    clearInterval(refetchInterval.value)
    refetchInterval.value = null
  }
})

async function getEventDetail(id) {
  isLoading.value = true
  const { sport_id } = sportsMenu.find((x) => x.sport_name == route.params.sport)
  try {
    const res = await Promise.all([getFixtureMarkets(id), getMarketsGrouping(sport_id)])
    console.log(res)
    if (res[0].data && res[0].data.market) {
      eventDetail.value = res[0].data
      eventMarkets.value = res[0].data.market
      // groupedMarkets.value = groupByMarketID(res.market)
      marketGroups.value = res[1].data
      homeTeam.value = res[0].homeTeam
      awayTeam.value = res[0].awayTeam

      // Set up MQTT subscriptions after we have the event details
      // if (res.matchID) {
      //   setupMqttSubscriptions(res.matchID)
      //   setupPeriodicRefetch(res.matchID)
      // }
    } else {
      emitter.emit('showErrorMessage', {
        message: 'This event is no longer available',
        next_route: '/'
      })
    }
  } catch (error) {
    eventDetail.value = null
    emitter.emit('showErrorMessage', {
      message: error.message || 'Failed to load event details',
      next_route: 'home'
    })
  } finally {
    isLoading.value = false
  }
}

function isTotalOrHandicap(market) {
  return (
    (market.specifier.includes('total') &&
      uniqueOutcomes(market.markets[0].outcomes).length === 2) ||
    market.specifier.includes('hcp')
  )
}

const getMarketCode = (name) => {
  const homeTeamRegex = new RegExp(homeTeam.value, 'gi')
  const awayTeamRegex = new RegExp(awayTeam.value, 'gi')
  const drawRegex = /draw/gi
  const orRegex = /or/gi

  // Replace home team name with '1'
  name = name.replace(homeTeamRegex, '1')

  // Replace away team name with '2'
  name = name.replace(awayTeamRegex, '2')

  // Replace 'draw' with 'X'
  name = name.replace(drawRegex, 'X')

  // Replace 'or' with '/'
  name = name.replace(orRegex, '/')

  return name.trim()
}

function getSpecifierValue(specifier) {
  // Check if the specifier includes 'total=', 'hcp=', 'nr=' or 'variant=' and contains a numeric value after the '='
  if (!specifier.includes('|') && /total=|hcp=|nr=|variant=/.test(specifier)) {
    const value = specifier.split('=').pop()
    return !isNaN(parseFloat(value)) ? value : specifier.slice(-2)
  }

  // Check if specifier contains 'total' and includes '|'
  if (specifier.includes('|') && specifier.includes('total')) {
    const value = specifier.split('|')[0].split('=').pop()
    return !isNaN(parseFloat(value)) ? value : specifier.split('=')[1]
  }

  // Handle combined specifier
  const specs = specifier.split('|')
  if (specs.length > 1) {
    const combo2 = specs[1].split('=').pop()
    return combo2
  }

  // Default case
  return specifier.split('=')[0]
}

function sortByKey(array, key, ascending = true) {
  return array.slice().sort((a, b) => {
    const valA = parseInt(a[key], 10)
    const valB = parseInt(b[key], 10)

    if (isNaN(valA) || isNaN(valB)) {
      // Handle cases where parsing fails
      return 0
    }

    return ascending ? valA - valB : valB - valA
  })
}

const getChunks = (outcomes) => {
  let x = uniqueOutcomes(outcomes)
  return chunks(x)
}

const uniqueMarkets = (markets) => {
  // console.log(markets);
  let x = markets.filter(
    (market, index, self) =>
      index ===
      self.findIndex((o) => o.marketID === market.marketID && o.specifier === market.specifier)
  )
  return x
}

const uniqueOutcomes = (outcomes) => {
  let x = outcomes.filter(
    (outcome, index, self) => index === self.findIndex((o) => o.outcomeID === outcome.outcomeID)
  )
  return x
}

function groupByMarketID(data) {
  const groupedMarkets = {}
  data.forEach((marketGroup) => {
    const { marketID, marketName, specifier } = marketGroup
    if (!groupedMarkets[marketID]) {
      groupedMarkets[marketID] = {
        marketID,
        marketName,
        specifier,
        markets: [marketGroup]
      }
    } else {
      groupedMarkets[marketID].markets.push(marketGroup)
    }
  })
  return Object.values(groupedMarkets)
}

function addToBetslip(market, outcome) {
  if (outcome.odds <= 1) return
  let marketId = parseInt(market.marketID)
  if (couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)) {
    emitter.emit(
      'showErrorMessage',
      'This market is not supported in simulation mode. Exit Simulation mode to add to betslip'
    )
    return
  }
  const id = createID(
    eventDetail.value.gameID,
    eventDetail.value.matchID,
    outcome.outcomeName,
    outcome.oddID,
    eventDetail.value.name
  )
  const data = {
    fixture: eventDetail.value,
    market_name: market.marketName,
    market_id: market.marketID,
    ele_id: id,
    outcome: outcome,
    odds: outcome.odds,
    odd_id: outcome.oddID,
    odd_name: outcome.outcomeName,
    type: 'prematch',
    event_id: eventDetail.value.gameID,
    specifier: market.specifier
  }
  // return couponStore.addToCoupon(data)
  const existsInBetslip = isSelected(id, couponStore.coupon)
  return existsInBetslip ? couponStore.removeSelection(id) : couponStore.addToCoupon(data)
}

const showFixtureAnalysis = (id, widgetName = 'headToHead.standalone') => {
  isH2HShowing.value = true
  const statWrapper = document.getElementById('sr-widget')
  window.SIR('addWidget', '#sr-widget', 'headToHead.standalone', {
    gamePulseBtnEnable: true,
    matchId: `${eventDetail.value.matchID}`
  })
}

function handleOddsChange(data) {
  if (!data || !data.markets) return

  const matchId = eventDetail.value.matchID
  const dataMatchId = data.event_id || data.match_id

  if (dataMatchId && String(dataMatchId) !== String(matchId)) {
    return
  }

  if (!updatePending.value) {
    updatePending.value = true

    requestAnimationFrame(() => {
      const markets = data.markets || []

      if (markets.length > 0) {
        const updatedOutcomesCopy = { ...updatedOutcomes.value }

        markets.forEach((market) => {
          if (market.outcomes) {
            market.outcomes.forEach((outcome) => {
              const key = `${market.id}-${outcome.id}-${market.specifiers || ''}`
              updatedOutcomesCopy[key] = {
                odds: outcome.odds,
                active: outcome.active ? 1 : 0,
                timestamp: Date.now()
              }
            })
          }
        })

        updatedOutcomes.value = updatedOutcomesCopy

        if (eventMarkets.value.length > 0) {
          eventMarkets.value = eventMarkets.value.map((market) => {
            const updatedMarket = markets.find(
              (m) => m.id === market.marketID && (m.specifiers || '') === (market.specifier || '')
            )

            if (updatedMarket && updatedMarket.outcomes) {
              market.outcomes = market.outcomes.map((outcome) => {
                const newOutcome = updatedMarket.outcomes.find(
                  (o) => String(o.id) === String(outcome.outcomeID)
                )

                if (newOutcome) {
                  return {
                    ...outcome,
                    odds: newOutcome.odds,
                    active: newOutcome.active ? 1 : 0
                  }
                }
                return outcome
              })
            }
            return market
          })

          // Update grouped markets
          groupedMarkets.value = groupByMarketID(eventMarkets.value)
        }
      }

      updatePending.value = false
    })
  }
}

function handleBetStop(data) {
  const matchId = eventDetail.value.matchID
  const dataMatchId = data.event_id || data.match_id

  if (dataMatchId && String(dataMatchId) !== String(matchId)) {
    // console.log(`📊 MQTT: Ignoring bet stop for match ID ${dataMatchId}, our match ID is ${matchId}`)
    return
  }

  // console.log(`⚠️ BET STOP: Processing bet stop for match ID ${matchId}`)

  // Suspend all markets
  if (eventMarkets.value.length > 0) {
    eventMarkets.value = eventMarkets.value.map((market) => ({
      ...market,
      outcomes: market.outcomes.map((outcome) => ({
        ...outcome,
        odds: 0,
        active: 0
      }))
    }))

    // Update grouped markets
    groupedMarkets.value = groupByMarketID(eventMarkets.value)
  }

  // Check if match time has passed
  const matchTime = new Date(eventDetail.value.date)
  const currentTime = new Date()

  if (matchTime < currentTime) {
    // console.log('Match time has passed, showing unavailable message')
    eventDetail.value.statusCode = 1 // This will trigger the "no longer available" message
  }
}

defineComponent({
  name: 'fixture-detail'
})

onMounted(() => {
  let script = document.createElement('script')
  script.text = `
    (function(a,b,c,d,e,f,g,h,i){a[e]||(i=a[e]=function(){(a[e].q=a[e].q||[]).push(arguments)},i.l=1*new Date,i.o=f,
    g=b.createElement(c),h=b.getElementsByTagName(c)[0],g.async=1,g.src=d,g.setAttribute("n",e),h.parentNode.insertBefore(g,h)
    )})(window,document,"script", "https://widgets.sir.sportradar.com/9a7545262c211f21e8cdaf98d9b86856/widgetloader", "SIR", {
        theme: false, // using custom theme
        language: "en"
    });
    `
  // // script.type = 'text/javascript';
  // script.id = 'sr-tracker'
  // // script.src = 'https://widgets.sir.sportradar.com/sportradar/widgetloader';

  document.body.appendChild(script)
})
</script>

<style scoped>
.x-prematch-detail {
  background-color: #fafafa;
  /* background-color: var(--background-general-primary); */
}

.x-prematch-detail .prematch-detail-loading {
  min-height: 15rem;
}

.x-prematch-detail .m-tab-navs {
  padding-bottom: 0.41666667rem;
}

.x-prematch-detail .m-sport-market {
  overflow: hidden;
}

.x-prematch-detail .m-sport-market .m-market .market-content .m-outcome.m-outcome--disabled {
  background-color: #dcdee5;
  background-color: var(--disable-brand-secondary);
  color: #9ca0ab;
}

.x-prematch-detail .m-footer--preMatch {
  padding-bottom: 3.66666667rem;
}

.m-sport-market-no-data {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #9ca0ab;
  min-height: 100px;
  /* padding: 5rem 2.33333333rem 10rem; */
  padding-left: 2.3rem;
  padding-right: 2.3rem;
  text-align: center;
}

.m-sport-market-no-data::before {
  content: '\e624';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-sport-market-no-data p {
  white-space: nowrap;
  color: #9ca0ab;
}

.m-sport-market-no-data .market-favor-empty-text {
  white-space: initial;
}

.m-sport-market-no-data:before {
  color: #333;
  color: var(--text-type2-secondary);
  font-size: 2.5rem;
}

@media only screen and (max-width: 320px) and (max-height: 480px) {
  .m-sport-market-no-data br {
    display: none;
  }
}

.m-tab-navs-wrap {
  width: 100%;
}

.m-tab-navs {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  padding: 1.25rem 0.83333333rem;
  width: 100%;
}

.m-tab-navs>li {
  background-color: #eaecef;
  background-color: var(--background-type1-tertiary);
  border-radius: 0.16666667rem;
  color: #353a45;
  color: var(--text-type1-primary);
  -webkit-box-flex: 1;
  -webkit-flex: auto;
  -ms-flex: auto;
  flex: auto;
  font-size: 1rem;
  height: 2.33333333rem;
  line-height: 2.33333333rem;
  margin-right: 1px;
  position: relative;
  text-align: center;
  width: 33.33%;
}

.m-tab-navs>li:last-child {
  margin-right: 0;
}

.m-tab-navs>li.active {
  background-color: #1b1e25;
  background-color: var(--c-prematch-active-tab-bg);
  color: #ffffff;
  color: var(--c-prematch-active-tab-text);
}

.m-tab-navs>li.active .m-icon:before {
  color: #ffffff;
  color: var(--c-prematch-active-tab-text);
}

.m-tab-navs .m-icon:before {
  color: #1b1e25;
  color: var(--text-type1-tertiary);
  font-size: 1rem;
  line-height: 2.33333333rem;
}

.m-tab-navs .m-text {
  vertical-align: top;
}

.m-tab-navs .m-count-badge {
  background: #e41827;
  border: 1px solid #ffffff;
  border-radius: 0.54166667rem;
  color: #ffffff;
  font-size: 0.83333333rem;
  font-weight: bold;
  line-height: 0.91666667rem;
  min-width: 0.91666667rem;
  padding: 0 0.16666667rem;
  position: absolute;
  right: 0.41666667rem;
  text-align: center;
  top: -0.54166667rem;
}

.x-prematch-detail .m-tab-navs .m-icon-market::before {
  content: "\e66e";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.x-prematch-detail .m-tab-navs .m-icon-stat::before {
  content: "\e64a";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.x-prematch-detail .m-tab-navs .m-icon-comment::before {
  content: "\e669";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.x-prematch-detail .h-team-wrap {
  -webkit-box-align: baseline;
  -webkit-align-items: baseline;
  -ms-flex-align: baseline;
  align-items: baseline;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  min-width: 0;
}

.x-prematch-detail .h-team-wrap .spacer {
  font-size: 1.16666667rem;
  font-weight: normal;
  padding: 0 0.33333333rem;
}

.x-prematch-detail .h-team-wrap .team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.x-prematch-detail .h-team-wrap .team-name.home {
  -webkit-flex-shrink: 0;
  -ms-flex-negative: 0;
  flex-shrink: 0;
  max-width: 8.33333333rem;
}

.x-prematch-detail .m-event-title {
  min-height: 9.33333333rem !important;
  overflow-x: hidden;
  padding: 0.33333333rem 0.66666667rem;
  position: relative;
}

.x-prematch-detail .m-event-title .m-event-league {
  color: #353a45;
  font-size: 0.83333333rem;
  line-height: normal;
  padding-top: 0;
  text-align: center;
}

.x-prematch-detail .m-event-title .m-event-league.link {
  color: #0D9737;
  text-decoration: underline;
}

.x-prematch-detail .m-event-title .m-event-league.more-top-space {
  padding-top: 0.66666667rem;
}

.x-prematch-detail .m-event-title .m-event-title-team {
  color: #353A45;
  color: var(--text-default-dark);
  margin-top: 0.75rem;
}

.x-prematch-detail .m-event-title .m-event-title-team>div {
  font-size: 1rem;
  font-weight: bold;
  line-height: 1.16666667rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal {
  color: #353A45;
  color: var(--text-default-dark);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  min-height: 5.83333333rem;
  padding: 8px 0;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark img {
  height: 9.16666667rem;
  opacity: 0.1;
  position: absolute;
  top: 2.08333333rem;
  -webkit-user-drag: none;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .away {
  right: -4.08333333rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .home {
  left: -4.08333333rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .switch-button {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-align-self: center;
  -ms-flex-item-align: center;
  align-self: center;
  border-radius: 50%;
  -webkit-box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  -webkit-box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 1.66666667rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  justify-self: center;
  position: relative;
  width: 1.66666667rem;
  color: #9CA0AB;
  color: var(--text-type1-secondary);
  background-color: #FAFAFA;
  background-color: var(--background-general-tertiary);
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .switch-button-left {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-align-self: center;
  -ms-flex-item-align: center;
  align-self: center;
  border-radius: 50%;
  -webkit-box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  -webkit-box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 1.66666667rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  justify-self: center;
  position: relative;
  width: 1.66666667rem;
  color: #9CA0AB;
  color: var(--text-type1-secondary);
  background-color: #FAFAFA;
  background-color: var(--background-general-tertiary);
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .switch-button-right {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  -webkit-align-self: center;
  -ms-flex-item-align: center;
  align-self: center;
  border-radius: 50%;
  -webkit-box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  box-shadow: 0.83px 0.83px 1.67px 0px #0000001A;
  -webkit-box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  box-shadow: 0px 0.83px 1.67px 0.83px #0000001A;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  height: 1.66666667rem;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  justify-self: center;
  position: relative;
  width: 1.66666667rem;
  color: #9CA0AB;
  color: var(--text-type1-secondary);
  background-color: #FAFAFA;
  background-color: var(--background-general-tertiary);
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .watermark .switch-button-right svg {
  -webkit-transform: rotate(180deg);
  -ms-transform: rotate(180deg);
  transform: rotate(180deg);
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .team {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
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
  font-weight: 700;
  -webkit-box-pack: start;
  -webkit-justify-content: start;
  -ms-flex-pack: start;
  justify-content: start;
  line-height: 1.16666667rem;
  padding: 0.33333333rem 0;
  text-align: center;
  width: 7.66666667rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .team .team-icon {
  height: 2.75rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .team .team-icon img {
  height: 2.75rem;
  -webkit-user-drag: none;
  width: 2.75rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .team .team-name {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .date-time {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-orient: vertical;
  -webkit-box-direction: normal;
  -webkit-flex-direction: column;
  -ms-flex-direction: column;
  flex-direction: column;
  font-size: 0.83333333rem;
  font-weight: 700;
  -webkit-box-pack: center;
  -webkit-justify-content: center;
  -ms-flex-pack: center;
  justify-content: center;
  line-height: 0.91666667rem;
  padding: 0 12px;
  text-align: center;
  width: 4.58333333rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .date-time .date {
  font-size: 0.83333333rem;
  font-weight: 400;
  padding-bottom: 0.33333333rem;
}

.x-prematch-detail .m-event-title .m-event-title-team-horizontal .date-time .time {
  background-color: #EAECEF;
  background-color: var(--background-type1-tertiary);
  border-radius: 2px;
  padding: 0 0.16666667rem;
  width: 2.33333333rem;
}

.x-prematch-detail .m-event-title .m-event-time-wrap {
  color: #353A45;
  color: var(--text-default-dark);
  bottom: 0rem;
  font-size: 0.66666667rem;
  height: 0.91666667rem;
  line-height: 0.91666667rem;
  padding: 2px 0;
  text-align: center;
  width: 100%;
}

.x-prematch-detail .m-event-title .m-event-time-wrap>span {
  margin-right: 0.66666667rem;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .event-gameid {
  opacity: 0.5;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .live-in-play::before {
  content: "\e64e";
  font-family: "iconfont" !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .live-in-play::before {
  font-size: 0.66666667rem;
  margin-right: 0.16666667rem;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .event-date {
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

.x-prematch-detail .m-event-title .m-event-time-wrap .event-date span {
  margin-right: 0.33333333rem;
}

.x-prematch-detail .m-event-title .m-event-time-wrap .event-date::before {
  font-size: 0.83333333rem;
  margin-right: 0.16666667rem;
}

.x-prematch-detail .m-event-title .event-delay {
  color: #353A45;
  color: var(--text-default-dark);
}

.x-prematch-detail .m-event-title .event-delay img {
  height: 1.25rem;
  width: 1.25rem;
}

.x-prematch-detail .m-event-title .m-h2h {
  margin: 0 1.25rem;
  padding: 0.83333333rem 0;
}

.x-prematch-detail .m-event-title .labels {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-flex-wrap: wrap;
  -ms-flex-wrap: wrap;
  flex-wrap: wrap;
  height: 1.5rem;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  padding-bottom: 0.33333333rem;
}

.x-prematch-detail .m-event-title .labels .label-group .event-labels {
  margin: 0.33333333rem 0 0 -0.83333333rem;
}

.x-prematch-detail .m-event-title .labels .switch-match-btn-list {
  background-color: #EAECEF;
  background-color: var(--background-type1-tertiary);
  color: #353A45;
  color: var(--text-default-dark);
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  border-radius: 40px;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 0.83333333rem;
  font-weight: 700;
  height: 1.33333333rem;
  padding: 0 0.33333333rem;
}

.x-prematch-detail .m-event-title .labels .switch-match-btn-list .list-icon {
  padding-left: 0.33333333rem;
}

.x-prematch-detail .m-sport-market .m-market .market-content .m-outcome.m-outcome--disabled {
  color: #9CA0AB !important;
  color: var(--c-outcome-text-disabled) !important;
  background-color: #DCDEE5 !important;
  background-color: var(--c-outcome-background-disabled) !important;
}

.x-prematch-detail .m-footer--preMatch {
  padding-bottom: 3.66666667rem;
}

.x-prematch-detail .m-nav-left {
  -webkit-box-flex: 1;
  -webkit-flex-grow: 1;
  -ms-flex-positive: 1;
  flex-grow: 1;
  min-width: 0;
}

.x-prematch-detail .m-outcome.in-range {
  border: 0.08333333rem solid #0D9737 !important;
}


.m-group {
  background-color: #FAFAFA;
  background-color: var(--background-general-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 0 0.33333333rem 0 0;
  width: 100%;
}

.m-group .m-sport-group-item {
  cursor: pointer;
  font-weight: 700;
  height: 4rem;
  line-height: 4rem;
  margin-bottom: -1px;
  padding: 0 0.91666667rem;
}

.m-group .m-sport-group-item .text {
  color: #353A45;
  color: var(--text-type1-primary);
  font-size: 1rem;
}

.m-group .m-sport-group-item.no-border {
  border-bottom: none !important;
}

.m-group .m-sport-group-item.active {
  border-bottom: 4px solid #0D9737;
  border-color: #0D9737;
  border-color: var(--brand-secondary);
}
</style>
