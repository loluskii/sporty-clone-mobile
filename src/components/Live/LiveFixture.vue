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
                    gameData.matchID,
                    odd.outcomeName,
                    odd.oddID,
                    gameData.name
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
import EmptyOdds from '@/components/EmptyOdds.vue';
import LiveOdds from './LiveOdds.vue'
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
const displayTime = ref(props.gameData.eventTime || '00:00')
const matchStatus = ref(props.gameData.matchStatus || '')

// Keep track of updated outcomes
const updatedOutcomes = ref({})

const activeSpecifier = ref()
const specifierOpen = ref(false)

const updatePending = ref(false)

// Time handling functions - now works with minutes only
const parseTimeToMinutes = (timeStr) => {
  if (timeStr === '--:--') return null
  const [minutes] = timeStr.split(':').map(Number)
  return minutes
}

const formatMinutesToTime = (minutes) => {
  return `${minutes.toString().padStart(2, '0')}:00`
}

const stopTimer = () => {
  if (timer.value) {
    clearInterval(timer.value)
    timer.value = null
  }
}

const startTimer = () => {
  stopTimer()

  const initialMinutes = parseTimeToMinutes(displayTime.value)
  if (initialMinutes === null || initialMinutes === 45 || initialMinutes === 90) return

  let currentMinutes = initialMinutes

  timer.value = setInterval(() => {
    currentMinutes++

    // Stop at key match times (halftime and fulltime)
    if (currentMinutes === 45 || currentMinutes === 90) {
      stopTimer()
      return
    }

    displayTime.value = formatMinutesToTime(currentMinutes)
  }, 60000) // Increment every minute
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
  const id = createID(event.gameID, event.matchID, odd.outcomeName, odd.oddID, event.name)
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

// New topic: sports/{sport_id}/match/{match_id}/markets
function handleMarkets(data) {
  if (!data) return

  // status: 0 = Active, 1 = Suspended, 2 = Deactivated
  const isActive = data.status === 0
  const marketId = String(data.market_id)
  const specifier = data.specifier || ''

  if (!updatePending.value) {
    updatePending.value = true

    requestAnimationFrame(() => {
      if (data.outcomes && Array.isArray(data.outcomes)) {
        const updatedOutcomesCopy = { ...updatedOutcomes.value }

        data.outcomes.forEach((outcome) => {
          const outcomeId = outcome.outcome_id ?? outcome.outcomeID
          const key = `${marketId}-${outcomeId}-${specifier}`
          updatedOutcomesCopy[key] = {
            odds: isActive ? parseFloat(outcome.odds) : 0,
            active: isActive ? 1 : 0,
            timestamp: Date.now()
          }
        })

        updatedOutcomes.value = updatedOutcomesCopy

        // Update displayed outcomes if they match this market
        if (outcomes.value.length > 0) {
          outcomes.value = outcomes.value.map((outcome) => {
            const mktId = String(outcome.marketID ?? outcome.market_id)
            const outId = String(outcome.outcomeID ?? outcome.outcome_id)
            const outSpec = outcome.specifier || ''

            // Check if this outcome matches the incoming market update
            if (mktId === marketId && outSpec === specifier) {
              const newOutcome = data.outcomes.find(
                (o) => String(o.outcome_id ?? o.outcomeID) === outId
              )

              if (newOutcome) {
                return {
                  ...outcome,
                  odds: isActive ? parseFloat(newOutcome.odds) : 0,
                  active: isActive ? 1 : 0
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

// New topic: sports/{sport_id}/match/{match_id}/scores
function handleScores(data) {
  requestAnimationFrame(() => {
    scores.value.homeScore = data.home_score
    scores.value.awayScore = data.away_score
    if (data.event_time) {
      displayTime.value = data.event_time
    }
  })
}

// New topic: sports/{sport_id}/match/{match_id}/match_status
function handleMatchStatus(data) {
  // Check if match has ended
  if (data.match_status === 'Ended') {
    stopTimer()
    emitter.emit('match-ended', props.gameData.matchID)
    return
  }

  requestAnimationFrame(() => {
    // Update time and status
    if (data.event_time) {
      displayTime.value = data.event_time
    }
    if (data.match_status) {
      matchStatus.value = data.match_status
    }
    // Restart timer with new time
    startTimer()
  })
}

// New topic: sports/{sport_id}/match/{match_id}/bet_stop
function handleBetStop() {
  // Lock all outcomes (set odds to 0 and inactive)
  outcomes.value = outcomes.value.map((outcome) => ({
    ...outcome,
    odds: 0,
    active: 0
  }))

  // Also update the tracked outcomes
  const updatedOutcomesCopy = { ...updatedOutcomes.value }
  outcomes.value.forEach((outcome) => {
    const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier || ''}`
    updatedOutcomesCopy[key] = {
      odds: 0,
      active: 0,
      timestamp: Date.now()
    }
  })
  updatedOutcomes.value = updatedOutcomesCopy
}

onMounted(() => {
  // Initialize scores from eventInfo.scores or top-level
  scores.value = getInitialScores()

  outcomes.value = props.gameData.outcomes || []
  getOdds()

  const matchId = props.gameData.matchID
  const sportId = props.gameData.sportID

  if (matchId && sportId) {
    // New topic format: sports/{sport_id}/match/{match_id}/{type}
    const topicBase = `sports/${sportId}/match/${matchId}`

    const topics = {
      matchStatus: `${topicBase}/match_status`,
      scores: `${topicBase}/scores`,
      markets: `${topicBase}/markets`,
      betStop: `${topicBase}/bet_stop`
    }

    const handlers = {
      matchStatus: handleMatchStatus,
      scores: handleScores,
      markets: handleMarkets,
      betStop: handleBetStop
    }

    const unsubscribers = Object.entries(topics).map(([key, topic]) => {
      return subscribe(topic, (data) => {
        handlers[key](data)
      })
    })

    onBeforeUnmount(() => {
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
