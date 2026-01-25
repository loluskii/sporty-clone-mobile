<template lang="">
  <div data-op="label-event-live" class="m-event-live x-live-row">
    <div class="m-event-meta">
      <span class="m-event-time">{{ displayTime }}</span>
      <span class="match-status">{{ matchStatusLabel }}</span>
      <span class="m-league-name">{{ gameData.categoryName }} - {{ gameData.tournament }}</span>
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
        <div class="m-market m-event-market-default" style="position: relative">
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
                :class="{ 'af-select-item-active': activeSpecifier === item.value }"
                @click="setActiveSpecifierAndClose(item)"
                v-for="(item, i) in getSpecifiers"
                :key="i"
                >{{ item.value }}</span
              >
            </div>
            <LiveOdds
              v-for="(odd, index) in outcomes"
              @click="addToBetslip(gameData, odd)"
              :selectionClass="
                isSelected(
                  createID(
                    gameData.matchID,
                    odd.marketID,
                    odd.outcomeID,
                    odd.specifier,
                    activeMarket.marketName,
                    odd.outcomeName
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
import { computed, defineComponent, ref, watch } from 'vue'
import LiveOdds from './LiveOdds.vue'
import EmptyOdds from '@/components/EmptyOdds.vue'
import { createID, isSelected, slugify } from '@/helpers'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '@/helpers'
import { useMatchOdds } from '@/composables/useMatchOdds'
import { useLiveTimer } from '@/composables/useLiveTimer'

const couponStore = useCouponStore()

const props = defineProps({
  gameData: Object,
  activeMarket: Object,
  activeSportID: Number
})

const matchStatus = ref(props.gameData.matchStatus)
const scores = ref({
  homeScore:
    props.gameData?.eventInfo?.score?.home ??
    props.gameData?.eventInfo?.scores?.home ??
    props.gameData?.homeScore ??
    0,
  awayScore:
    props.gameData?.eventInfo?.score?.away ??
    props.gameData?.eventInfo?.scores?.away ??
    props.gameData?.awayScore ??
    0
})
const matchStatusLabel = computed(() => {
  if (matchStatus.value === '1st half') return 'H1'
  if (matchStatus.value === '2nd half') return 'H2'
  return matchStatus.value
})

const { displayTime, setDisplayTime, stopTimer } = useLiveTimer(props.gameData.eventTime || '00:00')

const specifierOpen = ref(false)

const matchId = computed(() => props.gameData.matchID)
const baseOutcomes = computed(() => props.gameData.outcomes || [])
const sportId = computed(() => props.gameData?.sportID || props.activeSportID || 1)

const parseTimeToSeconds = (timeStr) => {
  if (timeStr === '--:--') return null
  const parts = timeStr.split(':').map(Number)
  if (parts.length !== 2 || parts.some((value) => Number.isNaN(value))) return null
  return parts[0] * 60 + parts[1]
}

const { outcomes, activeSpecifier, getSpecifiers, setActiveSpecifier } = useMatchOdds({
  matchId,
  activeMarket: computed(() => props.activeMarket),
  baseOutcomes,
  sportId: props.activeSportID || 1,
  onBetStop: () => {
    const currentTime = parseTimeToSeconds(displayTime.value)
    if (currentTime !== null && currentTime >= 90 * 60) {
      stopTimer()
      emitter.emit('match-ended', matchId.value)
    }
  },
  onMessage: (messageType, data) => {
    if (messageType === 'match_status') {
      if (data.status_code === 100) {
        stopTimer()
        return
      }
      if (data.home_score !== undefined) {
        scores.value.homeScore = data.home_score
      }
      if (data.away_score !== undefined) {
        scores.value.awayScore = data.away_score
      }
      if (data.event_time) {
        setDisplayTime(data.event_time)
      }
      matchStatus.value = data.match_status
      return
    }
    if (messageType === 'scores') {
      if (data.home_score !== undefined && data.away_score !== undefined) {
        scores.value.homeScore = data.home_score
        scores.value.awayScore = data.away_score
      }
      if (data.event_time) {
        setDisplayTime(data.event_time)
      }
    }
  }
})

const toggleList = () => {
  specifierOpen.value = !specifierOpen.value
}

const setActiveSpecifierAndClose = (spec) => {
  setActiveSpecifier(spec)
  toggleList()
}

function addToBetslip(event, odd) {
  if (odd.odds <= 1) return
  const id = createID(
    event.matchID,
    odd.marketID,
    odd.outcomeID,
    odd.specifier,
    props.activeMarket.marketName,
    odd.outcomeName
  )
  const marketId = parseInt(odd.marketID)
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
    odd_id: odd.outcomeID,
    odd_name: odd.outcomeName,
    type: 'live',
    event_id: event.matchID,
    specifier: odd.specifier
  }

  const existsInBetslip = isSelected(id, couponStore.coupon)
  return existsInBetslip ? couponStore.removeSelection(id) : couponStore.addToCoupon(data)
}

watch(
  () => props.activeMarket,
  () => {
    specifierOpen.value = false
  }
)

watch(
  () => props.gameData.matchStatus,
  (nextStatus) => {
    if (nextStatus !== undefined) {
      matchStatus.value = nextStatus
    }
  }
)

watch(
  () => props.gameData.eventTime,
  (nextTime) => {
    if (nextTime) {
      setDisplayTime(nextTime)
    }
  }
)

watch(
  () => props.gameData.eventInfo?.score || props.gameData.eventInfo?.scores,
  (nextScores) => {
    if (nextScores && typeof nextScores === 'object') {
      if (nextScores.home !== undefined) {
        scores.value.homeScore = nextScores.home
      }
      if (nextScores.away !== undefined) {
        scores.value.awayScore = nextScores.away
      }
    }
  },
  { deep: true }
)

watch(
  () => [props.gameData.homeScore, props.gameData.awayScore],
  ([homeScore, awayScore]) => {
    if (homeScore !== undefined) {
      scores.value.homeScore = homeScore
    }
    if (awayScore !== undefined) {
      scores.value.awayScore = awayScore
    }
  }
)

defineComponent({
  name: 'LiveHighlightsFixture',
  components: { LiveOdds, EmptyOdds }
})
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
/* Live Fixture */
.m-live-table .m-live-row {
  margin: 0 0.83333333rem;
}

.m-event-specifiers-order {
  padding: 0;
  text-align: center;
  background-color: #50545f;
  font-weight: bold;
  color: #f2f3f5;
}

.af-select-item-active {
  color: var(--brand-live-odds-text);
}
</style>
