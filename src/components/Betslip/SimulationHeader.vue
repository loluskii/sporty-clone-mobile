<template>
  <div
    class="simulation-header"
    :class="{ 'celebration-bg': shouldShowCelebration }"
    :style="simulationHeaderStyles"
  >
    <!-- Timer/Progress Display -->
    <span v-if="!timerEnded" class="timer-display">
      {{ timerDisplay }}
    </span>

    <!-- Results Display -->
    <span v-else class="result-display">
      <span v-if="isWinner">
        Congratulations! <br />
        You won {{ formattedWinAmount }}
      </span>
      <span v-else>Sorry you lost!</span>
    </span>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useUtilsStore } from '@/stores'

const { SportsbookGlobalVariable } = useUtilsStore()

const props = defineProps({
  timerEnded: {
    type: Boolean,
    required: true
  },
  timerDisplay: {
    type: String,
    required: true
  },
  isWinner: {
    type: Boolean,
    required: true
  },
  simulationResults: {
    type: Object,
    required: true
  }
})

const betSummary = computed(() => {
  const base = props.simulationResults?.data || props.simulationResults || {}
  return base?.bets?.[0] || base || {}
})

const formattedWinAmount = computed(() => {
  const amount = Number(betSummary.value?.possibleWin || betSummary.value?.amountWon || 0)
  return `${SportsbookGlobalVariable.Currency ?? 'NGN'}${amount.toLocaleString('en')}`
})

const simulationHeaderStyles = computed(() => ({
  'min-height': '100px',
  'text-align': 'center',
  'background-color': '#ececec',
  width: '100%',
  display: 'flex',
  'align-items': 'center',
  'justify-content': 'center',
  color: 'green',
  'font-size': '20px',
  ...(shouldShowCelebration.value && {
    'background-image': "url('/confetti2.gif')",
    'background-position': 'center',
    'background-size': 'cover'
  })
}))

const shouldShowCelebration = computed(() => {
  const statusCode = Number(betSummary.value?.statusCode)
  return props.timerEnded && (statusCode === 2 || (statusCode === 1 && betSummary.value?.amountWon))
})
</script>
