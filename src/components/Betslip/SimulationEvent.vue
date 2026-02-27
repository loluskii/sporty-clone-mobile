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
      <div class="sim-bet-odds">
        <span>{{ selection.outcomeName }} @ {{ selection.odds }}</span>
        <span
          v-if="showResultIcon"
          class="sim-result-icon"
          :class="resultClass"
          aria-hidden="true"
        ></span>
      </div>
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
  scorePhase: {
    type: Number,
    default: 0
  },
  showPitch: {
    type: Boolean,
    default: true
  },
  selectionResult: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['pause'])

const goalTimeline = computed(() => props.simulationData?.goalEvents || [])
const halfScores = computed(() => {
  if (!props.simulationData) {
    return { h1Home: 0, h1Away: 0, h2Home: 0, h2Away: 0 }
  }
  const h1Home = goalTimeline.value.filter((g) => g.team === 'home' && g.time <= 45).length
  const h1Away = goalTimeline.value.filter((g) => g.team === 'away' && g.time <= 45).length
  const h2Home = goalTimeline.value.filter((g) => g.team === 'home' && g.time > 45).length
  const h2Away = goalTimeline.value.filter((g) => g.team === 'away' && g.time > 45).length
  return { h1Home, h1Away, h2Home, h2Away }
})

const displayScore = computed(() => {
  if (props.timerEnded && props.simulationData?.finalScore) {
    return {
      home: props.simulationData.finalScore.home,
      away: props.simulationData.finalScore.away
    }
  }
  if (props.scorePhase === 0) {
    return { home: 0, away: 0 }
  }
  if (props.scorePhase === 1) {
    return { home: halfScores.value.h1Home, away: 0 }
  }
  if (props.scorePhase === 2) {
    return { home: halfScores.value.h1Home, away: halfScores.value.h1Away }
  }
  if (props.scorePhase === 3) {
    return {
      home: halfScores.value.h1Home + halfScores.value.h2Home,
      away: halfScores.value.h1Away
    }
  }
  return {
    home: halfScores.value.h1Home + halfScores.value.h2Home,
    away: halfScores.value.h1Away + halfScores.value.h2Away
  }
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

const resultClass = computed(() => {
  const won = props.selectionResult?.won
  if (won === 1 || won === '1') return 'win'
  if (won === 0 || won === '0') return 'lose'
  return ''
})

const showResultIcon = computed(() => {
  return Boolean(resultClass.value) && props.timerEnded
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
  align-items: center;
}

.sim-bet-market {
  font-weight: 600;
  color: #1b1e25;
}

.sim-bet-odds {
  text-align: right;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
}

.sim-result-icon {
  align-items: center;
  border-radius: 50%;
  display: inline-flex;
  height: 1rem;
  justify-content: center;
  position: relative;
  width: 1rem;
}

.sim-result-icon.win {
  background: #0d9737;
}

/* .sim-result-icon.win::before {
  content: '';
  width: 0.35rem;
  height: 0.6rem;
  border: 2px solid #ffffff;
  border-top: 0;
  border-left: 0;
  transform: rotate(45deg);
  margin-top: -0.05rem;
} */

.sim-result-icon.lose {
  background: #b42318;
}

/* .sim-result-icon.lose::before {
  content: '';
  width: 0.55rem;
  height: 0.55rem;
  border-top: 2px solid #ffffff;
  border-left: 2px solid #ffffff;
  transform: rotate(45deg);
} */
</style>
