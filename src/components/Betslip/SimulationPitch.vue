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
        <div
          class="sim-goal-panel"
          :class="{
            'sim-goal-panel--start': isStartOverlay,
            'sim-goal-panel--fulltime': isFulltimeOverlay
          }"
        >
          <template v-if="isStartOverlay">
            <div class="sim-start-row">
              <img
                v-if="homeLogoUrl && homeLogoVisible"
                class="sim-start-logo"
                :src="homeLogoUrl"
                alt="Home team logo"
                @error="homeLogoVisible = false"
              />
              <div v-else class="sim-start-logo sim-start-logo--fallback">
                {{ homeLogoFallback }}
              </div>
              <div class="sim-start-title">{{ goalTitle }}</div>
              <img
                v-if="awayLogoUrl && awayLogoVisible"
                class="sim-start-logo"
                :src="awayLogoUrl"
                alt="Away team logo"
                @error="awayLogoVisible = false"
              />
              <div v-else class="sim-start-logo sim-start-logo--fallback">
                {{ awayLogoFallback }}
              </div>
            </div>
          </template>
          <template v-else-if="isFulltimeOverlay">
            <div class="sim-goal-kicker">{{ goalTitle }}</div>
            <div class="sim-finish-row">
              <img
                v-if="homeLogoUrl && homeLogoVisible"
                class="sim-start-logo"
                :src="homeLogoUrl"
                alt="Home team logo"
                @error="homeLogoVisible = false"
              />
              <div v-else class="sim-start-logo sim-start-logo--fallback">
                {{ homeLogoFallback }}
              </div>
              <div class="sim-finish-score">{{ overlayScore }}</div>
              <img
                v-if="awayLogoUrl && awayLogoVisible"
                class="sim-start-logo"
                :src="awayLogoUrl"
                alt="Away team logo"
                @error="awayLogoVisible = false"
              />
              <div v-else class="sim-start-logo sim-start-logo--fallback">
                {{ awayLogoFallback }}
              </div>
            </div>
            <div v-if="goalSubtitle" class="sim-goal-team">{{ goalSubtitle }}</div>
          </template>
          <template v-else>
            <div class="sim-goal-kicker">{{ goalTitle }}</div>
            <div v-if="goalSubtitle" class="sim-goal-team">{{ goalSubtitle }}</div>
            <div v-if="goalMeta" class="sim-goal-meta">{{ goalMeta }}</div>
          </template>
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
const overlayScore = ref('')
const overlayTimers = []
const ftPinned = ref(false)
const fulltimeShown = ref(false)
const halftimeShown = ref(false)
const startShown = ref(false)
const overlayVariant = ref('')
// Style tweak for the SIM_START match-title banner.
const isStartOverlay = computed(() => goalOverlay.value && overlayVariant.value === 'start')
// Style tweak for the full-time banner layout.
const isFulltimeOverlay = computed(() => goalOverlay.value && overlayVariant.value === 'fulltime')
// Use the same team logo convention as fixture detail.
const logoBaseUrl =
  'https://firebasestorage.googleapis.com/v0/b/iron-envelope-405217.appspot.com/o/teams%2F'
const homeLogoVisible = ref(true)
const awayLogoVisible = ref(true)

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

const splitEventName = (name) => {
  if (!name || typeof name !== 'string') return []
  const separators = [' vs ', ' vs. ', ' v ', ' - ', ' @ ']
  for (const sep of separators) {
    if (name.includes(sep)) {
      return name.split(sep).map((part) => part.trim())
    }
  }
  return []
}

const homeTeamName = computed(() => {
  if (props.selection.homeTeam) return props.selection.homeTeam
  if (props.selection.home) return props.selection.home
  if (props.selection.fixture?.homeTeam) return props.selection.fixture.homeTeam
  if (props.selection.fixture?.home_team) return props.selection.fixture.home_team
  if (props.selection.fixture?.competitor1) return props.selection.fixture.competitor1
  const [home] = splitEventName(
    props.selection.eventName || props.selection.name || props.selection.fixture?.name
  )
  return home || 'Home'
})

const awayTeamName = computed(() => {
  if (props.selection.awayTeam) return props.selection.awayTeam
  if (props.selection.away) return props.selection.away
  if (props.selection.fixture?.awayTeam) return props.selection.fixture.awayTeam
  if (props.selection.fixture?.away_team) return props.selection.fixture.away_team
  if (props.selection.fixture?.competitor2) return props.selection.fixture.competitor2
  const [, away] = splitEventName(
    props.selection.eventName || props.selection.name || props.selection.fixture?.name
  )
  return away || 'Away'
})
const homeLogoUrl = computed(() => {
  if (!homeTeamName.value) return ''
  return `${logoBaseUrl}${encodeURIComponent(homeTeamName.value.toUpperCase())}.png?alt=media`
})
const awayLogoUrl = computed(() => {
  if (!awayTeamName.value) return ''
  return `${logoBaseUrl}${encodeURIComponent(awayTeamName.value.toUpperCase())}.png?alt=media`
})

const getInitials = (name) => {
  if (!name || typeof name !== 'string') return ''
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

const homeLogoFallback = computed(() => getInitials(homeTeamName.value))
const awayLogoFallback = computed(() => getInitials(awayTeamName.value))

watch(homeLogoUrl, () => {
  homeLogoVisible.value = true
})

watch(awayLogoUrl, () => {
  awayLogoVisible.value = true
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

const showOverlay = ({ title, subtitle, meta, score }, options = {}) => {
  goalTitle.value = title
  goalSubtitle.value = subtitle
  goalMeta.value = meta
  overlayScore.value = score || ''
  overlayVariant.value = options.variant || ''
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
  showOverlay({ title, subtitle, meta }, { duration: 1000, variant: 'goal' })
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
    if (!startShown.value) {
      startShown.value = true
      const eventLabel = props.selection.eventName || `${homeTeamName.value} vs ${awayTeamName.value}`
      // Show match title while SIM_START plays (exactly START_DURATION seconds).
      showOverlay(
        {
          title: eventLabel,
          subtitle: '',
          meta: ''
        },
        { duration: START_DURATION * 1000, variant: 'start' }
      )
    }
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
      { duration: HALFTIME_DURATION * 1000, variant: 'halftime' }
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
        score: finalScore
      },
      { persistent: true, variant: 'fulltime' }
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
  if (currentStage.value === 'start' && !startShown.value) {
    startShown.value = true
    const eventLabel = props.selection.eventName || `${homeTeamName.value} vs ${awayTeamName.value}`
    showOverlay(
      {
        title: eventLabel,
        subtitle: '',
        meta: ''
      },
      { duration: START_DURATION * 1000, variant: 'start' }
    )
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
  max-width: calc(100% - 1.5rem);
  box-shadow: 0 16px 30px rgba(0, 0, 0, 0.35);
  overflow: hidden;
}

.sim-goal-panel--start,
.sim-goal-panel--fulltime,
.sim-goal-panel--halftime {
  /* Wider banners that don't touch edges. */
  min-width: calc(100% - 2.5rem);
  padding: 0.9rem 1.6rem;
}

.sim-start-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.8rem;
}

.sim-start-logo {
  width: 2.7rem;
  height: 2.7rem;
  object-fit: contain;
  filter: drop-shadow(0 6px 12px rgba(0, 0, 0, 0.35));
}

.sim-start-logo--fallback {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.25);
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.08rem;
  color: #ffffff;
}

.sim-finish-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.9rem;
  margin-top: 0.4rem;
}

.sim-finish-score {
  font-size: 1.4rem;
  font-weight: 700;
  letter-spacing: 0.18rem;
  padding: 0.2rem 0.6rem;
  border-radius: 0.6rem;
  background: rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.sim-start-title {
  font-size: 1.15rem;
  letter-spacing: 0.12rem;
  line-height: 1.3;
  text-align: center;
}

.sim-goal-panel--start .sim-goal-kicker {
  font-size: 1.3rem;
  letter-spacing: 0.12rem;
  line-height: 1.25;
  white-space: normal;
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
