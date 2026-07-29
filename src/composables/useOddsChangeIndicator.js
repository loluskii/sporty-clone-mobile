import { ref, watch, onBeforeUnmount } from 'vue'

export function useOddsChangeIndicator(oddsRef, options = {}) {
  const oddUp = ref(false)
  const oddDown = ref(false)
  const previousOdds = ref(oddsRef.value ?? null)
  const timeoutMs = options.timeoutMs || 5000
  let arrowTimer = null

  const clearArrowTimer = () => {
    if (arrowTimer) {
      clearTimeout(arrowTimer)
      arrowTimer = null
    }
  }

  watch(
    oddsRef,
    (newValue) => {
      if (previousOdds.value === null) {
        previousOdds.value = newValue
        return
      }

      if (newValue !== previousOdds.value) {
        if (parseFloat(newValue) > parseFloat(previousOdds.value)) {
          oddUp.value = true
          oddDown.value = false
        } else if (parseFloat(newValue) < parseFloat(previousOdds.value)) {
          oddUp.value = false
          oddDown.value = true
        }

        clearArrowTimer()
        arrowTimer = setTimeout(() => {
          oddUp.value = false
          oddDown.value = false
        }, timeoutMs)

        previousOdds.value = newValue
      }
    }
  )

  onBeforeUnmount(() => {
    clearArrowTimer()
  })

  return {
    oddUp,
    oddDown
  }
}
