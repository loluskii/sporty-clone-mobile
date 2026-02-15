<template>
  <div id="Simulate">
    <SimulationHeader
      :timer-ended="timerEnded"
      :timer-display="timerDisplay"
      :is-winner="isWinner"
      :simulation-results="simulationResults"
    />

    <!-- Simulation Events -->
    <div class="ticket-wrapper">
      <div class="ticket">
        <div class="events-container">
      <SimulationEvent
        v-for="selection in couponStore.coupon.selections"
        :key="selection.matchId || selection.match_id"
        :selection="selection"
        :simulation-data="simulationData[selection.matchId || selection.match_id]"
        :current-time="currentTime"
        :timer-ended="timerEnded"
      />
        </div>
      </div>
    </div>

    <SimulationControls
      :timer-ended="timerEnded"
      :timer-started="timerStarted"
      @exit="handleSimulationExit"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useCouponStore, useUtilsStore } from '@/stores'
import SimulationHeader from './SimulationHeader.vue'
import SimulationEvent from './SimulationEvent.vue'
import SimulationControls from './SimulationControls.vue'

// Store and Props
const couponStore = useCouponStore()
const { SportsbookGlobalVariable } = useUtilsStore()
const props = defineProps({
  simulationResults: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['exit'])
// Constants
const SIMULATION_DURATION = 9 // seconds
const UPDATE_INTERVAL = 250 // milliseconds
const INITIAL_DELAY = 1000 // milliseconds

// Reactive State
const currentTime = ref(0)
const intervalId = ref(0)

// Computed Properties
const normalizedResults = computed(() => {
  return props.simulationResults?.data || props.simulationResults || {}
})

const simulationData = computed(() => {
  try {
    const rawEvents = normalizedResults.value?.events
    const events = Array.isArray(rawEvents)
      ? rawEvents
      : typeof rawEvents === 'string'
        ? JSON.parse(rawEvents)
        : []

    return events.reduce((acc, ev) => {
      if (!ev) return acc

      // New payload shape.
      const matchId = Number(ev.match_id || ev.matchId)
      const timeline = Array.isArray(ev.timeline) ? ev.timeline : []
      const goalEvents = timeline
        .filter((item) => item?.type === 'goal')
        .map((item) => ({
          time: Number(item.minute || 0),
          team: item.team === 'away' ? 'away' : 'home'
        }))
        .sort((a, b) => a.time - b.time)

      let finalScore = { home: Number(ev.home_goals || 0), away: Number(ev.away_goals || 0) }
      if (typeof ev.final_score === 'string' && ev.final_score.includes('-')) {
        const [home, away] = ev.final_score.split('-').map((value) => Number(value))
        if (Number.isFinite(home) && Number.isFinite(away)) {
          finalScore = { home, away }
        }
      }

      acc[matchId] = {
        goalEvents,
        timeline,
        homeGoals: finalScore.home,
        awayGoals: finalScore.away,
        finalScoreText: `${finalScore.home}-${finalScore.away}`,
        finalScore,
        halfTime: null,
        status: ev.status ?? ev.statusCode ?? null
      }
      return acc
    }, {})
  } catch (error) {
    console.error('Error processing simulation data:', error)
    return {}
  }
})

const timerStarted = computed(() => currentTime.value > 0)
const timerEnded = computed(() => currentTime.value >= SIMULATION_DURATION)
const betSummary = computed(() => {
  return normalizedResults.value?.bets?.[0] || normalizedResults.value || {}
})

const isWinner = computed(() => {
  const statusCode = Number(betSummary.value?.statusCode)
  if (statusCode === 2) return true
  if (statusCode === 1 && Number(betSummary.value?.amountWon || 0) > 0) return true
  return false
})

const timerDisplay = computed(() => {
  if (!timerStarted.value) return 'Starting Game...'
  const minute = Math.min(90, Math.round(currentTime.value * 10))
  return `${minute}'`
})

// Methods
const handleSimulationExit = (action) => {
  if (action === 'skip') {
    currentTime.value = SIMULATION_DURATION
    clearInterval(intervalId.value)
    return
  }

  if (action === 'close') {
    emit('exit')
  }
}

// Lifecycle Hooks
onMounted(() => {
  currentTime.value = 0

  setTimeout(() => {
    intervalId.value = setInterval(() => {
      if (currentTime.value >= SIMULATION_DURATION) {
        currentTime.value = SIMULATION_DURATION
        clearInterval(intervalId.value)
        return
      }
      currentTime.value = +(currentTime.value + 0.1).toFixed(1)
    }, UPDATE_INTERVAL)
  }, INITIAL_DELAY)
})

onUnmounted(() => {
  if (intervalId.value) {
    clearInterval(intervalId.value)
  }
})
</script>

<style>
#Simulate {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: #353a45;
  color: var(--text-type1-primary);
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}

#Simulate .ticket-wrapper {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  flex-grow: 1;
  overflow: auto;
}

#Simulate .ticket-wrapper .ticker-bar {
  align-items: center;
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  display: flex;
  justify-content: space-between;
}

#Simulate .ticket-wrapper .ticker-bar .left {
  font-family: 'Roboto-Medium';
}

#Simulate .ticket-wrapper .ticker-bar .rotate {
  transform: rotate(180deg);
}

#Simulate .border-bottom {
  border-bottom: 1px solid #eaecef;
  border-bottom-color: #eaecef;
}

#Simulate .c-pointer {
  cursor: pointer;
}

#Simulate .flex-center {
  align-items: center;
  display: flex;
}
</style>
