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
      <div class="x-table-cell score" :class="{ 'score--breakdown': liveScoreboard.hasBreakdown }">
        <template v-if="liveScoreboard.hasBreakdown">
          <div class="score-strip">
            <div v-for="column in liveScoreboard.columns" :key="`${column.key}-home`" class="score-cell">
              {{ column.home }}
            </div>
          </div>
          <div class="score-strip">
            <div v-for="column in liveScoreboard.columns" :key="`${column.key}-away`" class="score-cell">
              {{ column.away }}
            </div>
          </div>
        </template>
        <template v-else>
          <div class="set-score">{{ scores.homeScore }}</div>
          <div class="set-score">{{ scores.awayScore }}</div>
        </template>
      </div>

      <div class="x-table-cell m-market-cell">
        <div class="m-market m-event-market-default" style="position: relative">
          <template v-if="outcomes && outcomes.length">
            <div
              v-if="activeMarket.specifier !== '' && Number(activeMarket.marketID || 0) !== 1601"
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
                isSelected(getSelectionElementId(gameData, activeMarket, odd), couponStore.coupon)
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
import {
  buildCouponSelectionElementId,
  buildCouponSelectionPayload,
  getLiveScoreboard,
  isSelected,
  slugify
} from '@/helpers'
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
const periodScores = ref(props.gameData?.eventInfo?.period_scores || [])
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
const liveFixtureData = computed(() => ({
  ...props.gameData,
  homeScore: scores.value.homeScore,
  awayScore: scores.value.awayScore,
  eventInfo: {
    ...(props.gameData?.eventInfo || {}),
    period_scores: periodScores.value,
    score: {
      ...(props.gameData?.eventInfo?.score || {}),
      home: scores.value.homeScore,
      away: scores.value.awayScore
    },
    scores: {
      ...(props.gameData?.eventInfo?.scores || {}),
      home: scores.value.homeScore,
      away: scores.value.awayScore
    }
  }
}))
const liveScoreboard = computed(() => getLiveScoreboard(liveFixtureData.value, 'list'))

const { displayTime, setDisplayTimeFromApi, setDisplayTimeFromMqtt, stopTimer } = useLiveTimer(
  props.gameData.eventTime || '00:00'
)

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
  // Use bet_stop to end matches only after full time.
  onBetStop: () => {
    const currentTime = parseTimeToSeconds(displayTime.value)
    if (currentTime !== null && currentTime >= 90 * 60) {
      stopTimer()
      emitter.emit('match-ended', matchId.value)
    }
  },
  onMessage: (messageType, data) => {
    // console.log(messageType, data)
    if (messageType === 'match_status') {
      const matchStatusText = String(data?.match_status || '').toLowerCase()
      if (matchStatusText === 'ended') {
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
        setDisplayTimeFromMqtt(data.event_time)
      }
      if (Array.isArray(data.period_scores)) {
        periodScores.value = data.period_scores
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
        setDisplayTimeFromMqtt(data.event_time)
      }
      if (Array.isArray(data.period_scores)) {
        periodScores.value = data.period_scores
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

const getSelectionElementId = (fixture, market, outcome) =>
  buildCouponSelectionElementId({ fixture, market, outcome })

function addToBetslip(event, odd) {
  if (odd.active === 0 || odd.odds <= 1) return
  const marketId = parseInt(odd.marketID)
  if (couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)) {
    emitter.emit(
      'showErrorMessage',
      'This market is not supported in simulation mode. Exit Simulation mode to add to betslip'
    )
    return
  }
  const data = buildCouponSelectionPayload({
    fixture: event,
    market: props.activeMarket,
    outcome: odd,
    type: 'live'
  })

  return couponStore.toggleCouponSelection(data)
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
      setDisplayTimeFromApi(nextTime)
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
  () => props.gameData.eventInfo?.period_scores,
  (nextPeriodScores) => {
    if (Array.isArray(nextPeriodScores)) {
      periodScores.value = nextPeriodScores
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

.score--breakdown {
  width: auto;
  min-width: 4.5rem;
}

.score-strip {
  display: flex;
  justify-content: flex-end;
  gap: 0.16666667rem;
}

.score-cell {
  min-width: 1.25rem;
  text-align: center;
}
</style>
