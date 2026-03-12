import { ref, computed, watch } from 'vue'
import { useCouponStore } from '@/stores'
import { validateBetslipSelections } from '@/helpers'
import { DEFAULT_DERIVED_MARKET_CONFIG } from './useUpMode'

const buildDerivedMarketIdMap = () => {
  const map = {}
  Object.values(DEFAULT_DERIVED_MARKET_CONFIG).forEach((entry) => {
    ;(entry.modes || []).forEach((mode) => {
      map[mode.key] = mode.id
    })
  })
  return map
}

export function useBetslipUpMode() {
  const couponStore = useCouponStore()

  const upMode = ref('none')
  const isLoadingUpMode = ref(false)

  const DERIVED_MARKET_IDS = buildDerivedMarketIdMap()

  const hasDerivedMarkets = computed(() => {
    const selections = couponStore.coupon.selections || []
    return selections.some((sel) => sel.isDerived)
  })

  const applyDerivedMode = async (mode) => {
    const derivedMarketId = DERIVED_MARKET_IDS[mode]
    if (!derivedMarketId) return

    const eligible = (couponStore.coupon.selections || []).filter((sel) => sel.isDerived)
    if (!eligible.length) return

    isLoadingUpMode.value = true
    try {
      const payload = eligible.map((sel) => ({
        match_id: parseInt(sel.matchId),
        market_id: derivedMarketId,
        outcome_id: String(sel.outcomeId),
        producer_id: sel.producerId || 3,
        specifier: sel.specifier || ''
      }))

      const res = await validateBetslipSelections(payload)
      if (res.status_code === 200 && res.data) {
        const validated = Array.isArray(res.data) ? res.data : Object.values(res.data)
        validated.forEach((v) => {
          const sel = eligible.find(
            (s) =>
              String(s.matchId) === String(v.match_id) &&
              String(s.outcomeId) === String(v.outcome_id)
          )
          if (!sel) return
          if (sel._originalMarketId === undefined) {
            sel._originalMarketId = sel.marketId
          }
          if (v.status_name === 'Active' && parseFloat(v.odds) > 1) {
            sel.marketId = derivedMarketId
            sel.odds = String(parseFloat(v.odds).toFixed(2))
          }
        })
        couponStore.updateWinnings({ stake: couponStore.coupon.totalStake, id: 'all' })
      }
    } catch (e) {
      console.error('[upMode] validate error', e)
    } finally {
      isLoadingUpMode.value = false
    }
  }

  const restoreOriginalMode = async () => {
    const selections = couponStore.coupon.selections || []
    const switched = selections.filter((sel) => sel._originalMarketId !== undefined)
    if (!switched.length) return

    isLoadingUpMode.value = true
    try {
      const payload = switched.map((sel) => ({
        match_id: parseInt(sel.matchId),
        market_id: sel._originalMarketId,
        outcome_id: String(sel.outcomeId),
        producer_id: sel.producerId || 3,
        specifier: sel.specifier || ''
      }))

      const res = await validateBetslipSelections(payload)
      if (res.status_code === 200 && res.data) {
        const validated = Array.isArray(res.data) ? res.data : Object.values(res.data)
        validated.forEach((v) => {
          const sel = switched.find(
            (s) =>
              String(s.matchId) === String(v.match_id) &&
              String(s.outcomeId) === String(v.outcome_id)
          )
          if (!sel) return
          sel.marketId = sel._originalMarketId
          if (v.status_name === 'Active' && parseFloat(v.odds) > 1) {
            sel.odds = String(parseFloat(v.odds).toFixed(2))
          }
          delete sel._originalMarketId
        })
        couponStore.updateWinnings({ stake: couponStore.coupon.totalStake, id: 'all' })
      } else {
        switched.forEach((sel) => {
          sel.marketId = sel._originalMarketId
          delete sel._originalMarketId
        })
      }
    } catch (e) {
      console.error('[upMode] restore error', e)
      switched.forEach((sel) => {
        sel.marketId = sel._originalMarketId
        delete sel._originalMarketId
      })
    } finally {
      isLoadingUpMode.value = false
    }
  }

  const setUpMode = (mode) => {
    if (isLoadingUpMode.value) return
    upMode.value = upMode.value === mode ? 'none' : mode
  }

  watch(upMode, async (newMode, oldMode) => {
    if (oldMode !== 'none') await restoreOriginalMode()
    if (newMode !== 'none') await applyDerivedMode(newMode)
  })

  watch(hasDerivedMarkets, (val) => {
    if (!val) upMode.value = 'none'
  })

  return { upMode, isLoadingUpMode, hasDerivedMarkets, setUpMode }
}
