<template>
  <div class="sim-pitch-card">
    <div class="sim-pitch">
      <img
        class="sim-pitch-gif"
        :key="gifToken"
        :src="currentGif"
        alt="Simulation pitch"
      />

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
import simStart from '@/assets/images/SIM/SIM_START.gif'
import homeGoalH1 from '@/assets/images/SIM/Home_Goal_H1.gif'
import homeGoalH2 from '@/assets/images/SIM/Home_Goal_H2.gif'
import homeNoGoalH1 from '@/assets/images/SIM/Home_NoGoal_H1.gif'
import homeNoGoalH2 from '@/assets/images/SIM/Home_NoGoal_H2.gif'
import awayGoalH1 from '@/assets/images/SIM/Away_Goal_H1.gif'
import awayGoalH2 from '@/assets/images/SIM/Away_Goal_H2.gif'
import awayNoGoalH1 from '@/assets/images/SIM/Away_NoGoal_H1.gif'
import awayNoGoalH2 from '@/assets/images/SIM/Away_NoGoal_H2.gif'

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
  }
})

const goalOverlay = ref(false)
const goalTitle = ref('')
const goalSubtitle = ref('')
const goalMeta = ref('')
const overlayTimers = []
const ftPinned = ref(false)
const fulltimeShown = ref(false)
const halftimeShown = ref(false)

const currentGif = ref(homeNoGoalH1)
const gifToken = ref(0)

const START_DURATION = 3
const CLIP_DURATION = 4
const HALFTIME_DURATION = 1
const BANNER_OFFSET = 3.8

const h1HomeBannerTime = START_DURATION + BANNER_OFFSET
const h1AwayBannerTime = START_DURATION + CLIP_DURATION + BANNER_OFFSET
const halftimeStartTime = START_DURATION + CLIP_DURATION + CLIP_DURATION
const h2HomeBannerTime = halftimeStartTime + HALFTIME_DURATION + BANNER_OFFSET
const h2AwayBannerTime = halftimeStartTime + HALFTIME_DURATION + CLIP_DURATION + BANNER_OFFSET
const fulltimeTime = START_DURATION + CLIP_DURATION + CLIP_DURATION + HALFTIME_DURATION + CLIP_DURATION + CLIP_DURATION

const goalTimeline = computed(() => props.simulationData?.goalEvents || [])

const gifMap = {
  start: simStart,
  home: { goal: { 1: homeGoalH1, 2: homeGoalH2 }, noGoal: { 1: homeNoGoalH1, 2: homeNoGoalH2 } },
  away: { goal: { 1: awayGoalH1, 2: awayGoalH2 }, noGoal: { 1: awayNoGoalH1, 2: awayNoGoalH2 } }
}

const bannerShown = ref({
  h1_home: false,
  h1_away: false,
  h2_home: false,
  h2_away: false
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

const getScoreAt = (minute) => {
  const goals = goalTimeline.value.filter((g) => g.time <= minute)
  const home = goals.filter((g) => g.team === 'home').length
  const away = goals.filter((g) => g.team === 'away').length
  return `${home}-${away}`
}

const getGoalsInHalf = (team, half) => {
  return goalTimeline.value.filter((goal) => {
    const inHalf = half === 1 ? goal.time <= 45 : goal.time > 45
    return inHalf && goal.team === team
  })
}

const goalsUntilHalf = (team, half) => {
  if (half === 1) {
    return goalTimeline.value.filter((goal) => goal.time <= 45 && goal.team === team).length
  }
  return goalTimeline.value.filter((goal) => goal.team === team).length
}

const getLastGoalMinute = (team, half) => {
  const goals = getGoalsInHalf(team, half)
  if (!goals.length) return null
  return goals[goals.length - 1].time
}

const showOverlay = ({ title, subtitle, meta }, options = {}) => {
  goalTitle.value = title
  goalSubtitle.value = subtitle
  goalMeta.value = meta
  goalOverlay.value = true
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
    }, duration)
  )
}

const setGif = (nextGif) => {
  if (!nextGif) return
  currentGif.value = nextGif
  gifToken.value += 1
}

const showTeamBanner = (team, half) => {
  const halfGoals = getGoalsInHalf(team, half).length
  const totalGoals = goalsUntilHalf(team, half)
  const isGoal = halfGoals > 0
  const title = isGoal ? `Goal! x${totalGoals}` : 'No Goal'
  const subtitle = team === 'away' ? awayTeamName.value : homeTeamName.value
  const minute = isGoal ? getLastGoalMinute(team, half) : null
  const meta = isGoal && minute ? `${minute}'` : `H${half}`
  showOverlay({ title, subtitle, meta }, { duration: 1000 })
}

const currentStage = computed(() => {
  const t = props.currentTime
  if (t < START_DURATION) return 'start'
  if (t < START_DURATION + CLIP_DURATION) return 'h1_home'
  if (t < START_DURATION + CLIP_DURATION + CLIP_DURATION) return 'h1_away'
  if (t < START_DURATION + CLIP_DURATION + CLIP_DURATION + HALFTIME_DURATION) return 'halftime'
  if (t < START_DURATION + CLIP_DURATION + CLIP_DURATION + HALFTIME_DURATION + CLIP_DURATION) {
    return 'h2_home'
  }
  if (t < fulltimeTime) return 'h2_away'
  return 'fulltime'
})

watch(currentStage, (stage) => {
  if (stage === 'start') {
    setGif(gifMap.start)
    return
  }
  if (stage === 'h1_home') {
    const team = 'home'
    const half = 1
    setGif(getGoalsInHalf(team, half).length ? gifMap.home.goal[half] : gifMap.home.noGoal[half])
    return
  }
  if (stage === 'h1_away') {
    const team = 'away'
    const half = 1
    setGif(getGoalsInHalf(team, half).length ? gifMap.away.goal[half] : gifMap.away.noGoal[half])
    return
  }
  if (stage === 'halftime' && !halftimeShown.value) {
    halftimeShown.value = true
    showOverlay(
      {
        title: 'HALF TIME',
        subtitle: getScoreAt(45),
        meta: "45'"
      },
      { duration: HALFTIME_DURATION * 1000 }
    )
    return
  }
  if (stage === 'h2_home') {
    const team = 'home'
    const half = 2
    setGif(getGoalsInHalf(team, half).length ? gifMap.home.goal[half] : gifMap.home.noGoal[half])
    return
  }
  if (stage === 'h2_away') {
    const team = 'away'
    const half = 2
    setGif(getGoalsInHalf(team, half).length ? gifMap.away.goal[half] : gifMap.away.noGoal[half])
    return
  }
  if (stage === 'fulltime' && !fulltimeShown.value) {
    fulltimeShown.value = true
    const finalScore = props.simulationData?.finalScoreText || getScoreAt(90)
    const eventLabel = props.selection.eventName || `${homeTeamName.value} vs ${awayTeamName.value}`
    showOverlay(
      {
        title: 'FULL TIME',
        subtitle: eventLabel,
        meta: `FT | ${finalScore}`
      },
      { persistent: true }
    )
  }
})

watch(
  () => props.currentTime,
  (value) => {
    if (value >= h1HomeBannerTime && !bannerShown.value.h1_home) {
      bannerShown.value.h1_home = true
      showTeamBanner('home', 1)
    }
    if (value >= h1AwayBannerTime && !bannerShown.value.h1_away) {
      bannerShown.value.h1_away = true
      showTeamBanner('away', 1)
    }
    if (value >= h2HomeBannerTime && !bannerShown.value.h2_home) {
      bannerShown.value.h2_home = true
      showTeamBanner('home', 2)
    }
    if (value >= h2AwayBannerTime && !bannerShown.value.h2_away) {
      bannerShown.value.h2_away = true
      showTeamBanner('away', 2)
    }
  }
)

onBeforeUnmount(() => {
  overlayTimers.forEach((timer) => clearTimeout(timer))
})

onMounted(() => {
  setGif(gifMap.start)
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

.sim-pitch-gif {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
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
