import { computed } from 'vue'
import { useCouponStore } from '@/stores'

export function useMatchGroupStyle(selectionRef) {
  const couponStore = useCouponStore()

  const matchIdKey = computed(() =>
    String(selectionRef.value?.matchId || selectionRef.value?.fixture?.matchID || '')
  )

  const matchGroupCount = computed(() => {
    if (!matchIdKey.value) return 0
    return couponStore.coupon.selections.filter(
      (selection) =>
        String(selection.matchId || selection.fixture?.matchID || '') === matchIdKey.value
    ).length
  })

  const matchGroupColors = ['#0D9737', '#1E88E5', '#F39C12', '#8E44AD', '#E91E63', '#00ACC1', '#6D4C41']
  const matchGroupColor = computed(() => {
    const key = matchIdKey.value
    if (!key) return 'transparent'
    let hash = 0
    for (let i = 0; i < key.length; i += 1) {
      hash = (hash * 31 + key.charCodeAt(i)) % 0x7fffffff
    }
    return matchGroupColors[hash % matchGroupColors.length]
  })

  const matchGroupStyle = computed(() => {
    if (matchGroupCount.value <= 1) {
      return { width: '3px', backgroundColor: 'transparent' }
    }
    return { width: '3px', backgroundColor: matchGroupColor.value }
  })

  return {
    matchGroupStyle
  }
}
