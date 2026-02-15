<template>
  <div class="sim-event-card">
    <div class="sim-event-top">
      <div class="sim-team sim-team-home" :title="homeTeamName">{{ homeTeamName }}</div>
      <div class="sim-score">
        <span class="sim-score-value">{{ displayScore.home }} - {{ displayScore.away }}</span>
        <span v-if="timerEnded" class="sim-score-status">FT</span>
      </div>
      <div class="sim-team sim-team-away" :title="awayTeamName">{{ awayTeamName }}</div>
    </div>

    <SimulationPitch
      v-if="showPitch"
      :selection="selection"
      :simulation-data="simulationData"
      :current-time="currentTime"
      :timer-ended="timerEnded"
      @pause="emit('pause', $event)"
    />

    <div class="sim-bet-details">
      <div class="sim-bet-market">{{ selection.marketName }}</div>
      <div class="sim-bet-odds">{{ selection.outcomeName }} @ {{ selection.odds }}</div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import SimulationPitch from './SimulationPitch.vue'

const props = defineProps({
  selection: {
    type: Object,
    required: true
  },
  simulationData: {
    type: Object,
    required: true
  },
  currentTime: {
    type: Number,
    required: true
  },
  timerEnded: {
    type: Boolean,
    required: true
  },
  showPitch: {
    type: Boolean,
    default: true
  }
})

const emit = defineEmits(['pause'])

const goalTimeline = computed(() => props.simulationData?.goalEvents || [])
const currentMinute = computed(() => Math.min(90, Math.round(props.currentTime * 10)))

const currentScore = computed(() => {
  if (!props.simulationData) return { home: 0, away: 0 }
  return {
    home: goalTimeline.value.filter((g) => g.team === 'home' && g.time <= currentMinute.value).length,
    away: goalTimeline.value.filter((g) => g.team === 'away' && g.time <= currentMinute.value).length
  }
})

const displayScore = computed(() => {
  if (props.timerEnded && props.simulationData?.finalScore) {
    return {
      home: props.simulationData.finalScore.home,
      away: props.simulationData.finalScore.away
    }
  }
  return currentScore.value
})

const homeTeamName = computed(() => {
  if (props.selection.homeTeam) return props.selection.homeTeam
  if (props.selection.home) return props.selection.home
  if (props.selection.eventName && props.selection.eventName.includes(' vs ')) {
    return props.selection.eventName.split(' vs ')[0]
  }
  return 'Home'
})

const awayTeamName = computed(() => {
  if (props.selection.awayTeam) return props.selection.awayTeam
  if (props.selection.away) return props.selection.away
  if (props.selection.eventName && props.selection.eventName.includes(' vs ')) {
    return props.selection.eventName.split(' vs ')[1]
  }
  return 'Away'
})
</script>

<style scoped>
.sim-event-card {
  background: #ffffff;
  border-radius: 0.75rem;
  box-shadow: 0 10px 20px rgba(17, 24, 39, 0.08);
  padding: 0.9rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 15px;
}

.sim-event-top {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 0.5rem;
  font-family: 'Roboto-Bold';
}

.sim-team {
  font-size: 0.95rem;
  color: #1b1e25;
  text-overflow: unset;
  overflow: visible;
  white-space: normal;
  word-break: break-word;
}

.sim-team-home {
  text-align: left;
}

.sim-team-away {
  text-align: right;
}

.sim-score {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2rem;
}

.sim-score-value {
  font-size: 1.35rem;
  font-weight: 700;
  color: #111827;
}

.sim-score-status {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08rem;
  color: #9ca0ab;
}


.sim-bet-details {
  display: flex;
  justify-content: space-between;
  gap: 0.5rem;
  font-size: 0.85rem;
  color: #6c727f;
}

.sim-bet-market {
  font-weight: 600;
  color: #1b1e25;
}

.sim-bet-odds {
  text-align: right;
}
</style>
