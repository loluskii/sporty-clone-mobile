<template lang="">
  <div data-op="label-event-live" class="m-event-live x-live-row">
    <div class="m-event-meta">
      <span class="m-event-time">{{ displayTime }}</span>
      <span class="match-status">{{
        matchStatus == '1st half'
          ? 'H1'
          : matchStatus == '2nd half'
            ? 'H2'
            : matchStatus
      }}</span>
      <!-- <span class="m-league-name">{{ gameData.categoryName }} - {{ gameData.tournament }}</span> -->
      <div class="live-marker" data-cms-key="live">Live</div>
    </div>
    <div class="x-table-row x-live-table">
      <div
        @click="
          $router.push({
            name: 'live-fixtures-detail',
            params: {
              sport: slugify(gameData.sportName),
              tournament_name: slugify(gameData.tournament),
              event_name: slugify(gameData.name),
              event_id: gameData.matchID
            }
          })
        "
        class="x-table-cell m-info-cell"
      >
        <div class="team">{{ gameData.homeTeam }}</div>
        <div class="team">{{ gameData.awayTeam }}</div>
      </div>
      <div class="x-table-cell score">
        <div class="set-score">{{ scores.homeScore }}</div>
        <div class="set-score">{{ scores.awayScore }}</div>
      </div>

      <div class="x-table-cell m-market-cell">
        <div class="m-market m-event-market-default">
          <template v-if="outcomes && outcomes.length">
            <div
              v-if="activeMarket.specifier !== ''"
              @click="toggleList"
              class="m-outcome m-event-outcome-default specifiers-select"
            >
              <div tabindex="0" class="grid-specifier-select">
                <div class="grid-specifier-select-label">
                  {{ activeSpecifier }}
                </div>
                <div class="grid-specifier-select-icon">
                  <em class="icon">^</em>
                </div>
              </div>
            </div>
            <div
              class="af-select-list m-event-specifiers-order"
              v-if="specifierOpen"
              :class="'af-select-list-' + gameData.matchID"
              style="width: 67px; opacity: 1; position: absolute; top: 37px; left: 0"
            >
              <span
                class="af-select-item"
                @click="setActiveSpecifier(item)"
                v-for="(item, i) in getSpecifiers"
                :key="i"
                >{{ item.value }}</span
              >
            </div>
            <LiveOdds
              v-for="(odd, index) in uniqueOutcomes(outcomes)"
              @click="addToBetslip(gameData, odd)"
              :selectionClass="
                isSelected(
                  createID(
                    gameData.gameID,
                    activeMarket.marketID,
                    odd.outcomeName,
                    odd.outcomeID,
                    gameData.name,
                    odd.specifier
                  ),
                  couponStore.coupon
                )
                  ? 'm-outcome--checked'
                  : ''
              "
              :key="index"
              :odds="odd"
            ></LiveOdds>
          </template>
          <EmptyOdds v-for="(odd, index) in activeMarket.outcomes" :key="index" v-else></EmptyOdds>
        </div>
      </div>
    </div>
    <div class="m-event-footer">
      <div class="m-market-size">+{{ gameData.activeMarkets }}&gt;</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch, onBeforeUnmount } from 'vue'
import LiveOdds from './LiveOdds.vue'
import EmptyOdds from '@/components/EmptyOdds.vue'
import { sortArr, createID, isSelected, slugify } from '@/helpers'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '@/helpers'
import { useMqttService } from '@/composables/useMqtt'

// Import MQTT service
const { subscribe } = useMqttService()

const couponStore = useCouponStore()

const props = defineProps({
  gameData: Object,
  activeMarket: Object
})

// Get scores from eventInfo.scores if available
const getInitialScores = () => {
  const eventInfo = props.gameData?.eventInfo
  if (eventInfo?.scores) {
    return {
      homeScore: eventInfo.scores.home ?? 0,
      awayScore: eventInfo.scores.away ?? 0
    }
  }
  // Fallback to top-level homeScore/awayScore if they exist
  return {
    homeScore: props.gameData?.homeScore ?? 0,
    awayScore: props.gameData?.awayScore ?? 0
  }
}

const scores = ref(getInitialScores())
const outcomes = ref([])
const timer = ref(null)
const matchStatus = ref(props.gameData.matchStatus || '')

// Keep track of updated outcomes
const updatedOutcomes = ref({})

const activeSpecifier = ref()
const specifierOpen = ref(false)

const updatePending = ref(false)

// Sports that have a running clock (sportID)
// 1 = Soccer, 4 = Ice Hockey, 29 = Futsal
const TIMED_SPORTS = [1, 4, 29]

// Check if sport has a running clock
const isTimedSport = () => {
  const sportId = props.gameData.sportID
  return TIMED_SPORTS.includes(sportId)
}

// Time handling functions
const parseTime = (timeString) => {
  if (!timeString || timeString === '--:--') return null
  const parts = timeString.split(':')
  if (parts.length >= 2) {
    return {
      minutes: parseInt(parts[0], 10),
      seconds: parseInt(parts[1], 10)
    }
  } else if (parts.length === 1) {
    return {
      minutes: parseInt(parts[0], 10),
      seconds: 0
    }
  }
  return null
}

const formatTime = (minutes, seconds) => {
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
}

// Latency compensation for MQTT event_time (in seconds)
const MQTT_LATENCY_COMPENSATION = 2

// Adjust time received from MQTT to compensate for backend latency
const adjustTimeForLatency = (timeStr) => {
  if (!timeStr || timeStr === '--:--') return timeStr

  // Only adjust for timed sports
  if (!isTimedSport()) return timeStr

  const parsed = parseTime(timeStr)
  if (!parsed) return timeStr

  let { minutes, seconds } = parsed

  // Add latency compensation
  seconds += MQTT_LATENCY_COMPENSATION

  // Handle overflow
  if (seconds >= 60) {
    minutes += Math.floor(seconds / 60)
    seconds = seconds % 60
  }

  // Cap at halftime/fulltime boundaries
  const status = (props.gameData.matchStatus || '').toLowerCase()
  if (status.includes('2nd') || status.includes('second')) {
    // Second half: cap at 90 minutes
    if (minutes >= 90) {
      minutes = 90
      seconds = 0
    }
  } else if (!status.includes('halftime') && !status.includes('half time') && !status.includes('ht')) {
    // First half: cap at 45 minutes
    if (minutes >= 45) {
      minutes = 45
      seconds = 0
    }
  }

  return formatTime(minutes, seconds)
}

// Calculate elapsed match time from kick-off (only for timed sports)
const calculateElapsedTime = (kickOffDateStr) => {
  if (!kickOffDateStr) return null

  // Only calculate for timed sports like Soccer
  if (!isTimedSport()) return null

  const kickOffTime = new Date(kickOffDateStr).getTime()
  const now = Date.now()
  const elapsedMs = now - kickOffTime

  // If kick-off hasn't started yet or invalid date
  if (elapsedMs < 0) return null

  const elapsedMinutes = Math.floor(elapsedMs / 60000)
  const elapsedSeconds = Math.floor((elapsedMs % 60000) / 1000)

  // Handle halftime: if elapsed > 45 mins but match status is still 1st half or halftime
  const status = props.gameData.matchStatus?.toLowerCase() || ''

  if (status.includes('2nd') || status.includes('second')) {
    // Second half: cap at 90 minutes
    const adjustedMinutes = Math.min(elapsedMinutes, 90)
    return { minutes: adjustedMinutes, seconds: elapsedSeconds }
  } else if (status.includes('halftime') || status.includes('half time') || status.includes('ht')) {
    // Halftime: cap at 45:00
    return { minutes: 45, seconds: 0 }
  } else {
    // First half or unknown: cap at 45 mins
    const cappedMinutes = Math.min(elapsedMinutes, 45)
    return { minutes: cappedMinutes, seconds: elapsedSeconds }
  }
}

// Get initial display time - use eventTime from API response
// TODO: Re-enable time calculation from kick-off when needed
const getInitialDisplayTime = () => {
  // Temporarily disabled: time calculation from kick-off
  // if (isTimedSport()) {
  //   const kickOffDate = props.gameData.date
  //   if (kickOffDate) {
  //     const calculated = calculateElapsedTime(kickOffDate)
  //     if (calculated) {
  //       return formatTime(calculated.minutes, calculated.seconds)
  //     }
  //   }
  // }

  // Use eventTime directly from API response
  return props.gameData.eventTime || '--:--'
}

const displayTime = ref(getInitialDisplayTime())

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const startTimer = () => {
  stopTimer()

  // Don't run timer for non-timed sports (Tennis, Basketball, etc.)
  if (!isTimedSport()) return

  const initialTime = parseTime(displayTime.value)
  if (initialTime === null || initialTime.minutes === 45 || initialTime.minutes === 90) return

  let currentMinutes = initialTime.minutes
  let currentSeconds = initialTime.seconds

  timer.value = setInterval(() => {
    currentSeconds++

    if (currentSeconds >= 60) {
      currentSeconds = 0
      currentMinutes++
    }

    // Stop at key match times (halftime and fulltime)
    if (currentMinutes === 45 || currentMinutes === 90) {
      stopTimer()
      return
    }

    displayTime.value = formatTime(currentMinutes, currentSeconds)
  }, 1000) // Increment every second
}

// Watch for gameData changes to start timer
watch(
  () => displayTime.value,
  (newTime) => {
    if (newTime) {
      startTimer()
    }
  },
  { immediate: true }
)

const getOdds = () => {
  if (props.activeMarket && props.gameData.activeMarkets > 0) {
    if (props.gameData.outcomes) {
      // Find and return the odds based on marketID and outcomeID
      const odds = props.gameData.outcomes
      let filtered = odds.filter((item) => item.marketID == props.activeMarket.marketID)
      let uniqueFiltered = uniqueOutcomes(filtered)

      if (props.activeMarket.specifier && props.activeMarket.specifier !== '') {
        let defaultSpecifier = uniqueFiltered[0]?.specifier
        if (defaultSpecifier) {
          uniqueFiltered = uniqueFiltered.filter((item) => item.specifier === defaultSpecifier)
          activeSpecifier.value = defaultSpecifier.split('=')[1]
        }
      }

      // Apply any updates we've received from MQTT
      uniqueFiltered = uniqueFiltered.map((outcome) => {
        const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier}`
        if (updatedOutcomes.value[key]) {
          return {
            ...outcome,
            odds: updatedOutcomes.value[key].odds,
            active: updatedOutcomes.value[key].active
          }
        }
        return outcome
      })

      if (uniqueFiltered.length) {
        outcomes.value = sortArr(uniqueFiltered, 'outcomeID')
      } else {
        outcomes.value = []
      }
    }
  }
}

const uniqueOutcomes = (outcomes) => {
  let x = outcomes.filter(
    (outcome, index, self) =>
      index ===
      self.findIndex((o) => o.outcomeID === outcome.outcomeID && o.specifier == outcome.specifier)
  )
  return x
}

watch(
  [() => props.activeMarket, () => props.gameData.outcomes],
  () => {
    getOdds()
  },
  { immediate: true }
)

function addToBetslip(event, odd) {
  if (odd.odds <= 1) return
  const id = createID(event.gameID, odd.marketID, odd.outcomeName, odd.outcomeID, event.name, odd.specifier)
  let marketId = parseInt(odd.marketID)
  if (couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)) {
    emitter.emit(
      'showErrorMessage',
      'This market is not supported in simulation mode. Exit Simulation mode to add to betslip'
    )
    return
  }
  const data = {
    fixture: event,
    market_name: props.activeMarket.marketName,
    market_id: odd.marketID,
    ele_id: id,
    outcome: odd,
    odds: odd.odds,
    odd_id: odd.oddID,
    odd_name: odd.outcomeName,
    type: 'live',
    event_id: event.gameID,
    specifier: props.activeMarket.specifier
  }

  const existsInBetslip = isSelected(id, couponStore.coupon)
  return existsInBetslip ? couponStore.removeSelection(id) : couponStore.addToCoupon(data)
}

// Function to handle odds changes
function handleOddsChange(data) {
  if (!data || !data.markets) return

  const matchId = props.gameData.matchID
  const dataMatchId = data.event_id || data.match_id

  if (dataMatchId && String(dataMatchId) !== String(matchId)) {
    return
  }

  if (!updatePending.value) {
    updatePending.value = true

    requestAnimationFrame(() => {
      scores.value.homeScore = data.sport_event_status.home_score
      scores.value.awayScore = data.sport_event_status.away_score

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

        if (outcomes.value.length > 0) {
          outcomes.value = outcomes.value.map((outcome) => {
            const market = markets.find(
              (m) => m.id === outcome.marketID && (m.specifiers || '') === (outcome.specifier || '')
            )

            if (market && market.outcomes) {
              const newOutcome = market.outcomes.find(
                (o) => String(o.id) === String(outcome.outcomeID)
              )

              if (newOutcome) {
                return {
                  ...outcome,
                  odds: newOutcome.odds,
                  active: newOutcome.active ? 1 : 0
                }
              }
            }

            return outcome
          })
        }
      }

      updatePending.value = false
    })
  }
}

// Function to handle bet stop
function handleBetStop(data) {
  // First, verify this update is for the correct match
  const matchId = props.gameData.matchID
  const dataMatchId = data.event_id || data.match_id

  // If the data doesn't match our event, ignore it
  if (dataMatchId && String(dataMatchId) !== String(matchId)) {
    // console.log(`📊 MQTT: Ignoring bet stop for match ID ${dataMatchId}, our match ID is ${matchId}`);
    return
  }

  // console.log(`⚠️ BET STOP: Processing bet stop for match ID ${matchId}`);

  // Immediately suspend all outcomes in the component
  outcomes.value = outcomes.value.map((outcome) => ({
    ...outcome,
    odds: 0,
    active: 0
  }))
}

// Function to handle fixture status updates
function handleFixtureStatus(data) {
  // Handle match end
  if (data.status_code === 100) {
    stopTimer()
    emitter.emit('match-ended', props.gameData.matchID)
    return
  }

  requestAnimationFrame(() => {
    // Update scores
    scores.value.homeScore = data.home_score
    scores.value.awayScore = data.away_score

    // Update time and status (with latency compensation)
    displayTime.value = adjustTimeForLatency(data.event_time)
    matchStatus.value = data.match_status

    // Restart timer with new time
    startTimer()
  })
}

// Function to handle match ended - remove fixture from list
function handleMatchEnded(data) {
  stopTimer()
  emitter.emit('match-ended', props.gameData.matchID)
}

onMounted(() => {
  // console.log(`🏗️ Component: Setting up MQTT subscriptions for match ID: ${props.gameData.matchID}`);

  // Initialize scores from eventInfo.scores or top-level
  scores.value = getInitialScores()

  outcomes.value = props.gameData.outcomes || []
  getOdds()

  const matchId = props.gameData.matchID

  if (matchId) {
    const componentId = `live-fixture-${matchId}-${Date.now()}`

    const topics = {
      oddsChange: `sbe/feeds/live/odds_change/${matchId}`,
      betStop: `sbe/feeds/live/bet_stop/${matchId}`,
      fixtureStatus: `sbe/feeds/live/fixture_status/${matchId}`,
      matchEnded: `sbe/feeds/live/match_ended/${matchId}`
    }

    const handlers = {
      oddsChange: handleOddsChange,
      betStop: handleBetStop,
      fixtureStatus: handleFixtureStatus,
      matchEnded: handleMatchEnded
    }

    const unsubscribers = Object.entries(topics).map(([key, topic]) => {
      // console.log(`📊 Subscribing to ${key} on topic: ${topic}`);
      return subscribe(topic, (data) => {
        // console.log(`📊 MQTT: Received message on topic ${topic} for component ${componentId}`, data);
        handlers[key](data)
      })
    })

    onBeforeUnmount(() => {
      // console.log(`🧹 Component: Cleaning up MQTT subscriptions for match ID: ${matchId}`);
      unsubscribers.forEach((unsubscribe) => unsubscribe())
      stopTimer()
    })
  }
})

const getSpecifiers = computed(() => {
  if (props.gameData.outcomes) {
    const odds = props.gameData.outcomes
    let filtered = odds.filter((item) => item.marketID == props.activeMarket.marketID)
    let uniqueFiltered = uniqueOutcomes(filtered)
    let specifiers = uniqueFiltered.map((item) => {
      return {
        value: item.specifier.split('=')[1],
        specifier: item.specifier
      }
    })
    let uniqueSpecifiers = specifiers.filter(
      (item, index, self) => index === self.findIndex((t) => t.value === item.value)
    )
    return uniqueSpecifiers
  }
  return []
})

function toggleList() {
  specifierOpen.value = !specifierOpen.value
}

function setActiveSpecifier(item) {
  activeSpecifier.value = item.value
  specifierOpen.value = false
  if (props.gameData.outcomes) {
    const odds = props.gameData.outcomes
    let filtered = odds.filter((odd) => odd.marketID == props.activeMarket.marketID)
    let uniqueFiltered = uniqueOutcomes(filtered)
    uniqueFiltered = uniqueFiltered.filter((odd) => odd.specifier === item.specifier)
    outcomes.value = sortArr(uniqueFiltered, 'outcomeID')
  }
}
</script>

<style scoped>
.m-table {
  display: block;
  width: 100%;
}

.m-table .m-table-row {
  display: table;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  width: 100%;
}

.m-table .m-table-cell {
  display: table-cell;
  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  min-width: 1%;
}

.m-event-specifiers-order {
  padding: 0;
  text-align: center;
}
</style>
