import { ref, watch, onBeforeUnmount } from 'vue'

export function useLiveTimer(initialTime = '00:00') {
  const displayTime = ref(initialTime || '00:00')
  const timer = ref(null)

  const parseTimeToSeconds = (timeStr) => {
    if (timeStr === '--:--') return null
    const parts = timeStr.split(':').map(Number)
    if (parts.length !== 2 || parts.some((value) => Number.isNaN(value))) return null
    return parts[0] * 60 + parts[1]
  }

  const formatSecondsToTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const stopTimer = () => {
    if (timer.value) {
      clearInterval(timer.value)
      timer.value = null
    }
  }

  const startTimer = () => {
    stopTimer()
    const initialSeconds = parseTimeToSeconds(displayTime.value)
    if (initialSeconds === null || initialSeconds === 45 * 60 || initialSeconds === 90 * 60) return

    let currentSeconds = initialSeconds
    displayTime.value = formatSecondsToTime(currentSeconds)

    timer.value = setInterval(() => {
      currentSeconds += 1

      if (currentSeconds === 45 * 60 || currentSeconds === 90 * 60) {
        stopTimer()
        return
      }

      displayTime.value = formatSecondsToTime(currentSeconds)
    }, 1000)
  }

  const setDisplayTime = (timeValue) => {
    displayTime.value = timeValue || '00:00'
  }

  watch(
    () => displayTime.value,
    (newTime) => {
      if (newTime) {
        startTimer()
      }
    },
    { immediate: true }
  )

  onBeforeUnmount(() => {
    stopTimer()
  })

  return {
    displayTime,
    setDisplayTime,
    startTimer,
    stopTimer
  }
}
