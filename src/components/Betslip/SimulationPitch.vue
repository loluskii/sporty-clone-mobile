<template>
  <div class="sim-pitch-card">
    <div class="sim-pitch">
      <svg class="sim-pitch-svg" viewBox="0 0 100 64" preserveAspectRatio="xMidYMid meet">
        <defs>
          <pattern id="pitchStripes" width="10" height="64" patternUnits="userSpaceOnUse">
            <rect width="10" height="64" fill="#6fbf4a" />
            <rect width="5" height="64" fill="#64b245" />
          </pattern>
        </defs>
        <rect width="100" height="64" fill="url(#pitchStripes)" />
        <rect x="2" y="2" width="96" height="60" fill="none" stroke="#dfe8d8" stroke-width="0.8" />
        <line x1="50" y1="2" x2="50" y2="62" stroke="#dfe8d8" stroke-width="0.6" />
        <circle cx="50" cy="32" r="6" fill="none" stroke="#dfe8d8" stroke-width="0.6" />
        <circle cx="50" cy="32" r="0.7" fill="#dfe8d8" />
        <rect x="2" y="22" width="8" height="20" fill="none" stroke="#dfe8d8" stroke-width="0.6" />
        <rect x="90" y="22" width="8" height="20" fill="none" stroke="#dfe8d8" stroke-width="0.6" />
      </svg>

      <div v-if="goalOverlay" class="sim-goal-overlay">
        <div class="sim-goal-panel">
        <div class="sim-goal-kicker">{{ goalTitle }}</div>
        <div class="sim-goal-team">{{ goalSubtitle }}</div>
        <div class="sim-goal-meta">{{ goalMeta }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

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
  }
})

const emit = defineEmits(['pause'])

const goalOverlay = ref(false)
const goalTitle = ref('')
const goalSubtitle = ref('')
const goalMeta = ref('')
const goalTeam = ref('')
const goalMinute = ref(0)
const goalScoreText = ref('0-0')
const lastGoalIndex = ref(-1)
const overlayTimers = []
const ftPinned = ref(false)
const kickoffShown = ref(false)
const halftimeShown = ref(false)
const fulltimeShown = ref(false)

const goalTimeline = computed(() => props.simulationData?.goalEvents || [])
const currentMinute = computed(() => Math.min(90, Math.round(props.currentTime * 10)))

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

const goalTeamLabel = computed(() => (goalTeam.value === 'away' ? awayTeamName.value : homeTeamName.value))

const getScoreAt = (minute) => {
  const goals = goalTimeline.value.filter((g) => g.time <= minute)
  const home = goals.filter((g) => g.team === 'home').length
  const away = goals.filter((g) => g.team === 'away').length
  return `${home}-${away}`
}

const showOverlay = ({ title, subtitle, meta }, options = {}) => {
  goalTitle.value = title
  goalSubtitle.value = subtitle
  goalMeta.value = meta
  goalOverlay.value = true
  if (options.pause) {
    emit('pause', true)
  }
  if (options.persistent) {
    ftPinned.value = true
    return
  }
  const duration = Number.isFinite(options.duration) ? options.duration : 1600
  overlayTimers.push(
    setTimeout(() => {
      if (!ftPinned.value) {
        goalOverlay.value = false
      }
      if (options.pause) {
        emit('pause', false)
      }
    }, duration)
  )
}

const triggerGoal = (goal, burstCount = 1, burstTeams = []) => {
  goalTeam.value = goal.team
  goalMinute.value = goal.time
  goalScoreText.value = getScoreAt(goal.time)
  const burstLabel = burstCount > 1 ? `Goal! x${burstCount}` : 'Goal!'
  const hasMultipleTeams = burstTeams.length > 1
  showOverlay({
    title: burstLabel,
    subtitle: hasMultipleTeams ? 'Multiple goals' : goalTeamLabel.value,
    meta: `${goalMinute.value}' | ${goalScoreText.value}`
  }, { pause: true, duration: 1000 })
}

watch(currentMinute, (minute) => {
  const events = goalTimeline.value
  if (lastGoalIndex.value + 1 < events.length && events[lastGoalIndex.value + 1].time <= minute) {
    const nextMinute = events[lastGoalIndex.value + 1].time
    const burstWindow = 2
    let burstCount = 0
    const burstTeamSet = new Set()
    let lastBurstTime = nextMinute

    while (lastGoalIndex.value + 1 < events.length && events[lastGoalIndex.value + 1].time <= minute) {
      const upcoming = events[lastGoalIndex.value + 1]
      if (upcoming.time - nextMinute <= burstWindow) {
        burstCount += 1
        burstTeamSet.add(upcoming.team)
        lastBurstTime = upcoming.time
      } else {
        break
      }
      lastGoalIndex.value += 1
    }

    // Use the last goal in the burst to compute score/meta.
    const lastGoal = events[lastGoalIndex.value]
    goalScoreText.value = getScoreAt(lastBurstTime)
    triggerGoal(lastGoal, burstCount || 1, Array.from(burstTeamSet))
  }

  if (!kickoffShown.value) {
    kickoffShown.value = true
    showOverlay({
      title: 'KICKOFF',
      subtitle: `${homeTeamName.value} vs ${awayTeamName.value}`,
      meta: "0'"
    })
  }

  if (!halftimeShown.value && minute >= 45) {
    halftimeShown.value = true
    showOverlay({
      title: 'HALF TIME',
      subtitle: getScoreAt(45),
      meta: "45'"
    })
  }

  if (!fulltimeShown.value && (minute >= 90 || props.timerEnded)) {
    fulltimeShown.value = true
    const finalScore = props.simulationData?.finalScoreText || getScoreAt(90)
    const eventLabel = props.selection.eventName || `${homeTeamName.value} vs ${awayTeamName.value}`
    showOverlay({
      title: 'FULL TIME',
      subtitle: eventLabel,
      meta: `FT | ${finalScore}`
    }, { persistent: true })
  }
})

onBeforeUnmount(() => {
  overlayTimers.forEach((timer) => clearTimeout(timer))
})

onMounted(() => {
  if (!kickoffShown.value) {
    kickoffShown.value = true
    showOverlay({
      title: 'KICKOFF',
      subtitle: `${homeTeamName.value} vs ${awayTeamName.value}`,
      meta: "0'"
    })
  }
})
</script>

<style scoped>
.sim-pitch-card {
  width: 100%;
}

.sim-pitch {
  position: relative;
  overflow: hidden;
  height: 180px;
  width: 100%;
  padding-bottom: 15px;
}

.sim-pitch-svg {
  width: 100%;
  height: 100%;
  display: block;
}

.sim-goal-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 35%, rgba(12, 18, 40, 0.6), rgba(8, 10, 20, 0.9));
  color: #ffffff;
  text-transform: uppercase;
  font-family: 'Roboto-Bold';
  z-index: 3;
  animation: goalReveal 0.25s ease;
}

.sim-goal-panel {
  position: relative;
  background: linear-gradient(135deg, rgba(20, 44, 120, 0.9), rgba(12, 22, 60, 0.95));
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 0.9rem;
  padding: 0.75rem 1.4rem;
  text-align: center;
  min-width: 56%;
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.sim-goal-panel::before {
  content: '';
  position: absolute;
  inset: -40% -20%;
  background: repeating-linear-gradient(
    120deg,
    rgba(255, 255, 255, 0.08) 0px,
    rgba(255, 255, 255, 0.08) 8px,
    transparent 8px,
    transparent 18px
  );
  opacity: 0.6;
  transform: rotate(6deg);
}

.sim-goal-kicker {
  position: relative;
  font-size: 1.7rem;
  letter-spacing: 0.15rem;
}

.sim-goal-team {
  position: relative;
  font-size: 1rem;
  letter-spacing: 0.14rem;
  margin-top: 0.2rem;
  opacity: 0.85;
}

.sim-goal-meta {
  position: relative;
  font-size: 0.75rem;
  letter-spacing: 0.12rem;
  margin-top: 0.3rem;
  opacity: 0.85;
}

@keyframes goalReveal {
  from {
    opacity: 0;
    transform: scale(0.96);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}
</style>
