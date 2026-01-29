<template>
  <div style="background-color: #1b1e25">
    <HeaderOther :headerTitle="'Details'"></HeaderOther>
    <div class="m-event-detail-wrap">
      <template v-if="isLoading">
        <LoadingSpinner v-show="isLoading"></LoadingSpinner>
      </template>
      <template v-else>
        <div class="tracker-content" id="sr-widget" style="padding: 20px 0"></div>
        <div class="m-match-tracker-icons-above-wrapper" style="height: auto">
          <div v-if="!isLiveTrackerShowing" class="m-event-title">
            <div class="change-match-overly" style="display: none"></div>
            <div>
              <div class="m-event-league">
                <div class="m-event-title-time">
                  <p class="category-league">
                    <span v-if="eventDetail?.country !== ''">{{
                      eventDetail.country
                    }}</span>
                    - {{ eventDetail.tournament }}
                  </p>
                </div>
                <div class="event-time">
                  <span>{{ matchHasEnded ? '' : eventTime }} {{ eventDetail.matchStatus }}</span>
                </div>
              </div>
              <div class="m-event-team-wrap">
                <div class="home-team-name">
                  <span class="team">{{ eventDetail.homeTeam }}</span>
                  <span class="score"><em class="setScore">{{ scores.homeScore }}</em>
                  </span>
                </div>
                <div class="away-team-name">
                  <span class="team">{{ eventDetail.awayTeam }}</span>
                  <span class="score"><em class="setScore">{{ scores.awayScore }}</em>
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div class="m-event-tracker">
            <div class="event-tracker-button-wrapper">
              <span class="match-tracker" :class="{ active: isLiveTrackerShowing }"
                @click="openWidget('lmtPlus')"></span>
              <span class="match-statistics" @click="openWidget('Statistics')"></span>
            </div>
          </div>
        </div>

        <div class="live-match event-detail">
          <div class="m-snap-nav-wrap m-group" style="overflow: hidden;">
            <ul class="m-snap-nav flex" style="transform: translate(0px, 0px) translateZ(0px); transition-duration: 350ms; transition-timing-function: cubic-bezier(0.1, 0.57, 0.1, 1);">
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
          <div v-if="(!matchHasEnded && !isLoading)" class="m-sport-market">
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
                  <div class="m-market-title">
                    <span class="dis-icon"></span>
                    <span class="text" style="text-transform: capitalize;">{{ marketGroup.marketName }} </span>
                  </div>
                  <div class="m-table market-content">
                    <div class="m-table-row" v-for="(market, m) in getChunks(marketGroup.markets[0].outcomes)" :key="m">
                      <template v-if="marketGroup.specifier !== undefined && marketGroup.specifier === ''">
                        <template v-for="(selection, odd) in sortByKey(market, 'outcomeID')" :key="odd">
                          <div class="m-table-cell m-outcome m-detail-outcome-default m-outcome-odds-des" :class="{
                            'm-outcome--checked': isSelected(
                              createID(
                                eventDetail.matchID,
                                selection.marketID,
                                selection.outcomeID,
                                selection.specifier,
                                marketGroup.marketName,
                                selection.outcomeName
                              ),
                              couponStore.coupon
                            ),
                            'm-outcome-two': market.length === 2,
                            'm-outcome-three': market.length === 3,
                            'm-outcome--disabled': selection.active === 0 || selection.odds <= 1 || !selection.odds
                          }" @click="addToBetslip(marketGroup, selection)">
                            <em style="text-transform: capitalize">{{
                              selection.displayName
                            }}</em>
                            <em :class="{ 'm-icon-lock': selection.active === 0 || selection.odds <= 1 || !selection.odds}">{{
                              selection.active === 0 || selection.odds <= 1 || !selection.odds ? '':selection.odds.toFixed(2)
                            }}</em>
                          </div>
                        </template>
                      </template>
                      <template v-else>
                        <div class="m-table" v-if="isTotalOrHandicap(marketGroup)">
                          
                          <div v-for="(mg, idx) in marketGroup.markets" class="m-table-row" :key="idx">
                            <!-- {{ mg }} -->
                            <div
                              class="m-table-cell m-table-cell m-outcome-only-odds m-outcome-combo-title m-specifier-colum-title"
                              :class="{
                                'm-outcome-three': mg?.outcomes?.length + 1 === 3,
                                'm-outcome-four': mg?.outcomes?.length + 1 === 4
                              }">
                              <em>{{ getSpecifierValue(mg.specifier) }}</em>
                            </div>
                            <template v-for="(outcome, o) in mg?.outcomes" :key="o">
                              <div
                                class="m-table-cell m-outcome-combo m-outcome-only-odds m-outcome m-detail-outcome-default"
                                @click="addToBetslip(mg, outcome)" :class="{
                                  'm-outcome--checked': isSelected(
                                    createID(
                                      eventDetail.matchID,
                                      outcome.marketID,
                                      outcome.outcomeID,
                                      outcome.specifier,
                                      mg.marketName,
                                      outcome.outcomeName
                                    ),
                                    couponStore.coupon
                                  ),
                                  'm-outcome-three': mg?.outcomes?.length + 1 === 3,
                                  'm-outcome-four': mg?.outcomes?.length + 1 === 4,
                                  'm-outcome--disabled': outcome.active === 0 || outcome.odds <= 1 || !outcome.odds
                                }">
                                <em :class="{ 'm-icon-lock': outcome.active === 0 || outcome.odds <= 1 || !outcome.odds }">{{
                                  outcome.active === 0 || outcome.odds <= 1 || !outcome.odds ? '' : outcome?.odds?.toFixed(2)
                                }}</em>
                              </div>
                            </template>
                          </div>
                        </div>
                        <template v-for="(selection, odd) in sortByKey(market, 'outcomeID')" :key="odd" v-else>
                          <div class="m-table-cell m-outcome m-detail-outcome-default m-outcome-odds-des" :class="{
                            'm-outcome--checked': isSelected(
                              createID(
                                eventDetail.matchID,
                                selection.marketID,
                                selection.outcomeID,
                                selection.specifier,
                                marketGroup.marketName,
                                selection.outcomeName
                              ),
                              couponStore.coupon
                            ),
                            'm-outcome-two': market.length === 2,
                            'm-outcome-three': market.length === 3,
                            'm-outcome--disabled': selection.active === 0 || selection.odds <= 1 || !selection.odds
                          }" @click="addToBetslip(marketGroup, selection)">
                            <em style="text-transform: capitalize">{{
                              selection.displayName
                            }}</em>
                            <em :class="selection.active === 0 || selection.odds <= 1 || !selection.odds ? 'm-icon-lock' : ''">{{
                              selection.active === 0 || selection.odds <= 1 || !selection.odds ? '' : selection.odds.toFixed(2) }}</em>
                          </div>
                        </template>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div v-else class="m-sport-market-no-data" style="padding: 5rem 2.33333333rem 10rem">
            <div style="white-space: pre-line">
              Sorry, this game is no longer available. Betting has closed. Please choose other
              games.
            </div>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup>
import HeaderOther from '@/components/HeaderOther.vue'
import { defineComponent, watch, ref, computed, onMounted, onUnmounted, reactive } from 'vue'
import { useRoute } from 'vue-router'
import { getFixtureMarkets, getMarketsGrouping, chunks, createID, isSelected } from '@/helpers'
import LoadingSpinner from '@/components/Loaders/LoadingSpinner.vue'
import _ from 'lodash'
import { useCouponStore, useUtilsStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '@/helpers'
import { useMqttService } from '@/composables/useMqtt'

const { sportsMenu } = useUtilsStore()
const eventMarkets = ref()
const eventDetail = ref()
const scores = reactive({
  homeScore: 0,
  awayScore: 0
})
const eventTime = ref('00:00')
const timer = ref(null)
const isLoading = ref(false)
const route = useRoute()
const refetchInterval = ref(null)
const REFETCH_INTERVAL_MS = 60000 // 60 seconds

const couponStore = useCouponStore()
const homeTeam = ref()
const awayTeam = ref()
const isLiveTrackerShowing = ref(false)
const { subscribe } = useMqttService()
const unsubscribeFunctions = ref([])
const isClockStopped = ref(false)
const marketGroups = ref()
const selectedGroupId = ref(null) // null means "All"
// Tracks bet_stop so API refresh doesn't re-activate markets.
const betStopped = ref(false)

// Market grouping computed properties
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

// Other computed properties
const matchHasEnded = computed(() => {
  return eventDetail.value.matchStatus === 'Ended'
})

const noMarkets = computed(() => {
  return eventMarkets.value?.length === 0
})

// Time handling functions
const parseTimeToSeconds = (timeStr) => {
  if (timeStr === '--:--') return null
  const [minutes, seconds] = timeStr.split(':').map(Number)
  return minutes * 60 + seconds
}

const formatSecondsToTime = (seconds) => {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const startTimer = () => {
  stopTimer()

  const initialTime = parseTimeToSeconds(eventTime.value)
  if (initialTime === null || initialTime === 45 * 60 || initialTime === 90 * 60) return

  let currentSeconds = initialTime
  eventTime.value = formatSecondsToTime(currentSeconds)

  timer.value = setInterval(() => {
    currentSeconds++

    // Stop at key match times (45:00 and 90:00)
    if (currentSeconds === 45 * 60 || currentSeconds === 90 * 60) {
      stopTimer()
      return
    }

    eventTime.value = formatSecondsToTime(currentSeconds)
  }, 1000)
}

// MQTT handlers
function handleFixtureStatus(data) {
  // Handle match end
  requestAnimationFrame(() => {
    if (data.event_time) {
      eventTime.value = data.event_time
    }
    if (eventDetail.value) {
      eventDetail.value.matchStatus = data.match_status
    }
  })
}

function handleBetStop(data) {
  const matchId = eventDetail.value?.matchID
  const dataMatchId = data.event_id || data.match_id

  if (dataMatchId && String(dataMatchId) !== String(matchId)) return

  // Bet stop locks all outcomes until next market update.
  betStopped.value = true
  if (eventMarkets.value?.length > 0) {
    eventMarkets.value = eventMarkets.value.map((market) => ({
      ...market,
      outcomes: market.outcomes.map((outcome) => ({
        ...outcome,
        active: 0
      }))
    }))
  }
}

function handleOddsChange(data, match_id) {
  if (!data || !data.outcomes) return

  const dataMatchId = data.match_id
  if (String(dataMatchId) !== String(match_id)) return

  const outcomes = data.outcomes || []
  if (outcomes.length === 0) return

  // Use requestAnimationFrame for DOM updates
  if (eventMarkets.value) {
    requestAnimationFrame(() => {
      let marketFound = false
      let shouldRemoveMarket = false
      const statusName = data.status_name ? data.status_name.toLowerCase() : ''

      if (betStopped.value) {
        // First market update after bet_stop re-activates markets.
        betStopped.value = false
        eventMarkets.value = eventMarkets.value.map((market) => ({
          ...market,
          outcomes: market.outcomes.map((outcome) => ({
            ...outcome,
            active: 1
          }))
        }))
      }

      // First, try to update existing market
      eventMarkets.value = eventMarkets.value.map((market) => {
        // Match by both marketID and specifier (important for markets like Handicap, Totals)
        const marketMatches = market.marketID === data.market_id
        const specifierMatches = (market.specifier || '') === (data.specifier || '')

        if (!marketMatches || !specifierMatches) {
          return market // Not the market we're updating
        }

        marketFound = true

        // Check if market is deactivated - mark for removal
        if (statusName === 'deactivated') {
          shouldRemoveMarket = true
          return null // Will be filtered out
        }

        // Update outcomes for matching market
        const updatedMarket = {
          ...market,
          statusName: data.status_name || market.statusName,
          outcomes: market.outcomes.map((outcome) => {
            const updatedOutcome = outcomes.find(
              (o) => String(o.outcome_id) === String(outcome.outcomeID)
            )

            if (updatedOutcome) {
              return {
                ...outcome,
                odds: updatedOutcome.odds,
                active: statusName === 'suspended' ? 0 : (updatedOutcome.active ? 1 : 0),
                probability: updatedOutcome.probability || outcome.probability
              }
            }

            // Ensure suspended markets lock existing outcomes.
            if (statusName === 'suspended') {
              return {
                ...outcome,
                active: 0
              }
            }

            return outcome
          })
        }

        return updatedMarket
      }).filter(market => market !== null) // Remove deactivated markets

      // If market not found and not deactivated, add it as a new market
      if (!marketFound && statusName !== 'deactivated') {
        // console.log(`➕ Adding new market: ${data.market_name} (ID: ${data.market_id}, Specifier: ${data.specifier || 'none'})`)

        const newMarket = {
          marketID: data.market_id,
          marketName: data.market_name,
          specifier: data.specifier || '',
          statusName: data.status_name || 'Active',
          sportID: data.sport_id || 0,
          outcomes: outcomes.map(outcome => ({
            outcomeID: outcome.outcome_id,
            outcomeName: outcome.outcome_name,
            displayName: outcome.alias || outcome.outcome_name,
            odds: outcome.odds,
            active: statusName === 'suspended' ? 0 : (outcome.active ? 1 : 0),
            probability: outcome.probability || 0
          })),
        }

        eventMarkets.value.push(newMarket)
      }
    })
  }
}

// MQTT setup
function setupMqttSubscriptions(matchId, sport_id) {
  const baseTopic = `sports/${sport_id}/match/${matchId}`
  const topics = {
    markets: `${baseTopic}/markets`,
    betStop: `${baseTopic}/bet_stop`,
    matchStatus: `${baseTopic}/match_status`,
    scores: `${baseTopic}/scores`
  }

  const unsubscribers = [
    subscribe(topics.markets, (data) => {
      handleOddsChange(data, matchId)
    }),
    subscribe(topics.betStop, (data) => {
      handleBetStop(data, matchId)
    }),
    subscribe(topics.matchStatus, (data) => {
      handleFixtureStatus(data, matchId)
    }),
    subscribe(topics.scores, (data) => {
      if (data.home_score !== undefined && data.away_score !== undefined) {
        scores.homeScore = data.home_score
        scores.awayScore = data.away_score
      }
      if (data.event_time) {
        eventTime.value = data.event_time
      }
    })
  ]
  unsubscribeFunctions.value = unsubscribers
}

// Periodic refetch setup
function setupPeriodicRefetch(matchId) {
  if (refetchInterval.value) {
    clearInterval(refetchInterval.value)
  }

  refetchInterval.value = setInterval(async () => {
    if (!matchHasEnded.value) {
      try {
        const res = await getFixtureMarkets(matchId)
        if (Object.keys(res.data).length && res.data.markets.length) {
          const fetchedMarkets = res.data?.market.filter((market) => market.statusName !== 'Suspended')
          // Preserve bet_stop state across API refreshes.
          eventMarkets.value = betStopped.value
            ? fetchedMarkets.map((market) => ({
                ...market,
                outcomes: market.outcomes.map((outcome) => ({
                  ...outcome,
                  active: 0
                }))
              }))
            : fetchedMarkets
          scores.homeScore =
            res.data?.eventInfo?.score?.home ??
            res.data?.eventInfo?.scores?.home ??
            res.data.homeScore ??
            scores.homeScore
          scores.awayScore =
            res.data?.eventInfo?.score?.away ??
            res.data?.eventInfo?.scores?.away ??
            res.data.awayScore ??
            scores.awayScore
          eventTime.value = res.data.eventTime

        } 
      } catch (error) {
        // Silently handle periodic refetch errors
      }
    } else {
      clearInterval(refetchInterval.value)
    }
  }, REFETCH_INTERVAL_MS)
}

// Lifecycle hooks
onMounted(() => {
  let script = document.createElement('script')
  script.text =
    '(function(a,b,c,d,e,f,g,h,i){a[e]||(i=a[e]=function(){(a[e].q=a[e].q||[]).push(arguments)},i.l=1*new Date,i.o=f,g=b.createElement(c),h=b.getElementsByTagName(c)[0],g.async=1,g.src=d,g.setAttribute("n",e),h.parentNode.insertBefore(g,h))})(window,document,"script","https://widgets.sir.sportradar.com/9a7545262c211f21e8cdaf98d9b86856/widgetloader","SIR", {language: "en"});'
  script.id = 'sr-tracker'
  document.body.appendChild(script)
})

onUnmounted(() => {
  // Clean up MQTT subscriptions
  if (unsubscribeFunctions.value.length > 0) {
    unsubscribeFunctions.value.forEach((unsubscribe) => unsubscribe())
    unsubscribeFunctions.value = []
  }

  // Clean up intervals
  if (refetchInterval.value) {
    clearInterval(refetchInterval.value)
    refetchInterval.value = null
  }

  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }

  // Clean up SR tracker script
  document.getElementById('sr-tracker')?.remove()
})

// Watchers
watch(
  () => route.params.event_id,
  async (provider_id) => {
    await getEventDetail(provider_id)
  },
  { immediate: true }
)

watch(
  () => eventTime.value,
  (newTime) => {
    if (newTime) {
      // startTimer()
    }
  },
  { immediate: true }
)

function isTotalOrHandicap(market) {
  return (
    (market.specifier.includes('total') && market.markets[0].outcomes.length === 2) ||
    market.specifier.includes('hcp')
  )
}

async function getEventDetail(id) {
  isLoading.value = true
  const { sport_id } = sportsMenu.find((x) => x.sport_name == route.params.sport)
  try {
    const res = await Promise.all([getFixtureMarkets(id), getMarketsGrouping(sport_id)])
    isLoading.value = false
    if (res[0].data) {
      eventDetail.value = res[0].data
      eventMarkets.value = res[0].data?.market?.filter((market) => market.statusName !== 'Suspended')
      if (betStopped.value && eventMarkets.value?.length) {
        eventMarkets.value = eventMarkets.value.map((market) => ({
          ...market,
          outcomes: market.outcomes.map((outcome) => ({
            ...outcome,
            active: 0
          }))
        }))
      }
      marketGroups.value = res[1].data
      homeTeam.value = res[0].data.homeTeam
      awayTeam.value = res[0].data.awayTeam
      scores.homeScore =
        res[0].data?.eventInfo?.score?.home ??
        res[0].data?.eventInfo?.scores?.home ??
        res[0].data.homeScore ??
        0
      scores.awayScore =
        res[0].data?.eventInfo?.score?.away ??
        res[0].data?.eventInfo?.scores?.away ??
        res[0].data.awayScore ??
        0
      eventTime.value = res[0].data.eventTime
      startTimer()
      setupMqttSubscriptions(res[0].data.matchID, sport_id)
      setupPeriodicRefetch(res[0].data.matchID)
    } 
  } catch (error) {
    console.log(error)
    eventDetail.value = null
    isLoading.value = false
  }
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
  return outcomes ? chunks(outcomes) : []
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
  console.log(Object.values(groupedMarkets))
  return Object.values(groupedMarkets)
}

function addToBetslip(market, outcome) {
  if (outcome.active === 0 || outcome.odds <= 1) return
  let marketId = parseInt(market.marketID)
  if (couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)) {
    emitter.emit(
      'showErrorMessage',
      'This market is not supported in simulation mode. Exit Simulation mode to add to betslip'
    )
    return
  }

  const id = createID(
    eventDetail.value.matchID,
    outcome.marketID,
    outcome.outcomeID,
    outcome.specifier,
    market.marketName,
    outcome.outcomeName
  )
  const data = {
    fixture: eventDetail.value,
    market_name: market.marketName,
    market_id: market.marketID,
    ele_id: id,
    outcome: outcome,
    odds: outcome.odds,
    odd_id: outcome.outcomeID,
    odd_name: outcome.outcomeName,
    type: 'live',
    event_id: eventDetail.value.matchID,
    specifier: market.specifier
  }
  const existsInBetslip = isSelected(id, couponStore.coupon)
  return existsInBetslip ? couponStore.removeSelection(id) : couponStore.addToCoupon(data)
}

const openWidget = (widgetName) => {
  isLiveTrackerShowing.value = !isLiveTrackerShowing.value
  const statWrapper = document.getElementById('sr-widget')
  // statWrapper.parentElement.classList.toggle("brClosed");

  if (statWrapper.innerHTML === '') {
    statWrapper.innerHTML = `<div class="m-loading-wrap">
      <div class="m-loading light">
        <div class="loading"></div>
      </div>
    </div>`

    window.SIR('addWidget', '#sr-widget', `match.${widgetName}`, {
      matchId: eventDetail.value.matchID
    })
  } else {
    statWrapper.innerHTML = ''
    window.SIR('removeWidget', '#sr-widget', `match.${widgetName}`)
  }
}

function getSpecifierValue(specifier) {
  // Check if the specifier includes 'total=', 'hcp=', 'nr=' or 'variant=' and contains a numeric value after the '='
  if (!specifier.includes('|') && /total=|hcp=|goalnr=|nr=|variant=/.test(specifier)) {
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

defineComponent({
  name: 'fixture-detail'
})
</script>

<style>
@import url('@/assets/css/theme.css');

.liveMatch-eventView-loading {
  min-height: 15rem;
}

.m-navbar .nav-change .change-icon:before {
  font-size: 0.83333333rem;
}

.m-navbar .nav-change .change-icon.active {
  -webkit-transform: rotate(-180deg);
  -ms-transform: rotate(-180deg);
  transform: rotate(-180deg);
}

.m-event-detail-wrap {
  background-color: #1b1e25;
  background-color: var(--brand-background-live);
  color: #ffffff;
  color: var(--text-type2-primary);
}

.m-event-detail-wrap .m-match-tracker-icons-above-wrapper {
  overflow: auto;
}

.m-event-detail-wrap .m-match-tracker-icons-above-wrapper.overflow-visible {
  overflow: initial;
}

.m-event-detail-wrap .m-broadcast {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  border-bottom: 1px solid rgba(234, 236, 239, 0.15);
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  line-height: 2rem;
  width: 100%;
  z-index: 1001 !important;
  background-color: #1b1e25;
  background-color: var(--brand-background-live);
}

.m-event-detail-wrap .m-event-tracker {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1rem;
  margin: 0 0.83333333rem 1.41666667rem 0.83333333rem;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper {
  margin-left: auto;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span {
  border-radius: 2px;
  display: inline-block;
  height: 1.66666667rem;
  line-height: 1.66666667rem;
  padding: 0.33333333rem 1.08333333rem;
  color: #dcdee5;
  color: var(--disable-brand-secondary);
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span:last-child {
  margin-right: 0px;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span::before {
  display: inline-block;
  vertical-align: top;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span.live-stream::before {
  background: url(//s.sporty.net/global/main/modules/common-wap/assets/img/stv.b89a6457ad.png);
  background-position: top left;
  background-size: 100% 100%;
  content: '';
  height: 1.41666667rem;
  margin-top: 0.1rem;
  padding-right: 0.41666667rem;
  width: 1.06666667rem;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span.match-tracker::before {
  content: '\e64f';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span.match-tracker::before {
  color: #ffb404;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span.match-statistics::before {
  content: '\e64a';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span.match-statistics::before {
  color: #03bdff;
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span.active {
  background-color: var(--brand-secondary);
}

.m-event-detail-wrap .m-event-tracker .event-tracker-button-wrapper>span.active:before {
  color: #353a45;
  -webkit-filter: grayscale(100%);
  filter: grayscale(100%);
}

.m-event-detail-wrap .tracker-content .m-tracker-wrap {
  background-color: #353a45;
  background-color: var(--background-type2-secondary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  margin-bottom: 0.83333333rem;
}

.m-event-detail-wrap .tracker-content .m-tracker-wrap .m-livetracker {
  background-color: #353a45;
  background-color: var(--background-type2-secondary);
}

.m-event-detail-wrap .tracker-content .m-tracker-wrap .arro {
  background-color: #1b1e25;
  background-color: var(--brand-background-live);
  border-top: 3px solid;
  position: relative;
  border-top-color: #353a45;
  border-top-color: var(--line-type1-tertiary);
}

.m-event-detail-wrap .tracker-content .m-tracker-wrap .arro i {
  background: url(//s.sporty.net/global/main/modules/main/mobile/liveBetting/img/arra.7efb3af0fd.svg);
  background-position: top left;
  background-size: 100% 100%;
  display: block;
  height: 1.91666667rem;
  left: 50%;
  line-height: 1.91666667rem;
  margin-left: -2.58333333rem;
  position: relative;
  text-align: center;
  top: -3px;
  width: 6.16666667rem;
}

.m-event-detail-wrap .m-event-title {
  padding-bottom: 1.25rem;
}

.m-event-detail-wrap .m-event-title .m-event-league {
  color: var(--brand-secondary);
  line-height: 1.2;
  overflow: hidden;
  padding: 0.66666667rem 0;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-event-detail-wrap .m-event-title .m-event-league .event-time {
  font-size: 1.066rem;
  padding: 0.66666667rem 0.66666667rem 0;
}

.m-event-detail-wrap .m-event-title .m-event-title-time {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  padding: 0.33333333rem 0.83333333rem 0.33333333rem 0;
}

.m-event-detail-wrap .m-event-title .m-event-title-time .category-league {
  overflow: hidden;
  padding-left: 0.66666667rem;
  text-decoration: underline;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-event-detail-wrap .m-event-title .m-event-title-time .category-league.disabled {
  color: #9ca0ab;
  text-decoration: none;
}

.m-event-detail-wrap .event-detail .m-group {
  background-color: #1b1e25;
  background-color: var(--brand-background-live);
  border-bottom: 1px solid rgba(234, 236, 239, 0.15);
}

.m-event-detail-wrap .event-detail .m-sport-market-no-data:before {
  color: rgba(242, 243, 245, 0.15);
}

.m-event-detail-wrap .event-detail .m-sport-market {
  overflow: hidden;
}

.m-event-detail-wrap .event-detail .m-sport-market .m-market .m-market-title {
  border-top: 1px solid #353a45;
  color: #ffffff;
  color: var(--text-type2-primary);
}

.m-event-detail-wrap .event-detail .m-sport-market .m-market .market-content .m-table-row .m-outcome {
  background: rgba(214, 235, 220, 0.13);
  color: var(--brand-secondary);
}

.m-event-detail-wrap .event-detail .m-sport-market .m-market .market-content .m-table-row .m-outcome--checked {
  background-color: var(--brand-secondary);
  color: #ffffff;
}

.m-event-detail-wrap .event-detail .m-sport-market .m-market .market-content .m-table-row .m-outcome--checked:before {
  color: #ffffff !important;
}

.m-event-detail-wrap .event-detail .m-sport-market .m-market .market-content .m-table-row .m-outcome--disabled {
  background: #22252d;
  color: #50545f;
}

.m-event-detail-wrap .event-detail .m-sport-market .m-market .market-content .m-table-row .m-outcome--up:before,
.m-event-detail-wrap .event-detail .m-sport-market .m-market .market-content .m-table-row .m-outcome--down:before {
  color: #33ea6a;
}

.m-event-detail-wrap .event-detail .m-sport-market .m-market .market-content .m-table-row .m-outcome-combo-title {
  background-color: rgba(234, 236, 239, 0.15);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #dcdee5;
  font-size: 1rem;
}

.m-event-detail-wrap .event-detail .m-sport-market .m-market .market-content .m-table-row .m-outcome-combo-column-title {
  background-color: rgba(234, 236, 239, 0.15);
  color: #f2f3f5;
}

.m-event-detail-wrap .live-match.event-detail {
  background-color: #1b1e25;
  background-color: var(--brand-background-live);
}

.m-event-detail-wrap .live-match.event-detail .m-group {
  border-bottom-color: #1b1e25;
}

.m-event-detail-wrap .live-match.event-detail .m-detail-market-default .m-market-title {
  background-color: #1b1e25;
  background-color: var(--brand-background-live);
}

.m-event-detail-wrap .live-match.event-detail .m-detail-market-default .count {
  color: #ffffff;
  color: var(--text-type2-primary);
}

.m-event-team-wrap {
  margin: 0 0.83333333rem;
}

.m-event-team-wrap>div {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
}

.m-event-team-wrap>div>span {
  display: block;
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
}

.m-event-team-wrap .home-team-name {
  margin-bottom: 0.16666667rem;
}

.m-event-team-wrap .home-team-name,
.m-event-team-wrap .away-team-name {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 1.066rem;
  -webkit-box-pack: stretch;
  -webkit-justify-content: stretch;
  -ms-flex-pack: stretch;
  justify-content: stretch;
}

.m-event-team-wrap .home-team-name>span,
.m-event-team-wrap .away-team-name>span {
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  height: 1.83333333rem;
  line-height: 1.83333333rem;
}

.m-event-team-wrap .home-team-name .score,
.m-event-team-wrap .away-team-name .score {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  font-weight: 700;
  text-align: right;
}

.m-event-team-wrap .home-team-name .score .setScore,
.m-event-team-wrap .away-team-name .score .setScore,
.m-event-team-wrap .home-team-name .score .gameScore,
.m-event-team-wrap .away-team-name .score .gameScore {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  display: inline-block;
  height: 100%;
  line-height: normal;
  text-align: center;
  vertical-align: top;
}

.m-event-team-wrap .home-team-name .score .setScore,
.m-event-team-wrap .away-team-name .score .setScore {
  background-color: var(--brand-secondary);
  color: #fff;
  padding: 0.16666667rem 0.5rem;
}

.m-event-team-wrap .home-team-name .score .gameScore,
.m-event-team-wrap .away-team-name .score .gameScore {
  background-color: rgba(234, 236, 239, 0.15);
  color: var(--brand-secondary);
  min-width: 1.83333333rem;
  padding: 0.16666667rem 0;
}

.m-event-team-wrap .home-team-name .team,
.m-event-team-wrap .away-team-name .team {
  background: rgba(234, 236, 239, 0.15);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  font-weight: 500;
  font-weight: 700;
  line-height: 1.2;
  margin-right: 0.16666667rem;
  overflow: hidden;
  padding: 0.25rem 0 0.25rem 0.41666667rem;
  width: 50%;
}

.event-detail {
  width: 100%;
}

.event-detail.live-match .m-group .m-sport-group-item {
  color: #ffffff;
}

.event-detail.pre-match .m-group .m-sport-group-item {
  color: #000000;
  color: var(--text-default);
}

.event-detail .m-group {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  padding: 0 0.33333333rem;
  width: 100%;
}

.event-detail .m-group .m-sport-group-item {
  cursor: pointer;
  font-weight: 700;
  height: 4rem;
  line-height: 4rem;
  margin-bottom: -1px;
  padding: 0 0.91666667rem;
}

.event-detail .m-group .m-sport-group-item .text {
  color: #353a45;
  color: var(--text-type1-primary);
  font-size: 1rem;
}

.event-detail .m-group .m-sport-group-item.active {
  border-bottom: 4px solid #0d9737;
  border-color: #0d9737;
  border-color: var(--brand-secondary);
}

.event-detail .m-sport-market-no-data {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  color: #9ca0ab;
  /* padding: 5rem 2.33333333rem 10rem; */
  padding-left: 2.3rem;
  padding-right: 2.3rem;
  text-align: center;
}

.event-detail .m-sport-market-no-data::before {
  content: '\e624';
  font-family: 'iconfont' !important;
  font-size: 16px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  font-style: normal;
}

.event-detail .m-sport-market-no-data p {
  white-space: nowrap;
}

.event-detail .m-sport-market-no-data .market-favor-empty-text {
  white-space: initial;
}

.event-detail .m-sport-market-no-data:before {
  color: #f2f3f5;
  color: var(--text-type2-secondary);
  font-size: 2.5rem;
}

@media only screen and (max-width: 320px) and (max-height: 480px) {
  .event-detail .m-sport-market-no-data br {
    display: none;
  }
}

.event-detail .m-sport-market-favor-empty {
  margin-top: 3.33333333rem;
  text-align: center;
}

.event-detail .market-favor-empty-image {
  width: 17.5rem;
}

.event-detail .market-favor-empty-text {
  color: #9ca0ab;
  color: var(--text-type2-tertiary);
  font-size: 1.066rem;
  margin: 2.5rem auto 0;
  padding-bottom: 3.33333333rem;
  width: 22rem;
}

.event-detail .m-sport-market {
  position: relative;
  z-index: 10;
}
</style>
