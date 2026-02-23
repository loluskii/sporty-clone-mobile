import { computed, ref, watch } from 'vue'

const DERIVED_MARKET_IDS = {
  '1up': 60100,
  '2up': 60200
}

const flattenFixtures = (fixtures) => {
  if (Array.isArray(fixtures)) return fixtures
  if (fixtures && typeof fixtures === 'object') {
    return Object.values(fixtures).flat()
  }
  return []
}

export const useUpMode = ({
  fixtures,
  activeMarket,
  marketsGroup,
  enabledSportId = 1
}) => {
  const upMode = ref('none')

  const hasDerivedMarkets = computed(() => {
    return flattenFixtures(fixtures?.value).some((fixture) => {
      const derived = fixture?.derived_market_id || fixture?.derived_market_ids
      return Array.isArray(derived) && derived.length > 0
    })
  })

  const isEligibleMarket = computed(() => {
    const marketId = Number(activeMarket?.value?.marketID || 0)
    const marketSportId = Number(activeMarket?.value?.sportID || activeMarket?.value?.sportId || 0)
    if (enabledSportId && marketSportId !== enabledSportId) return false
    return marketId === 1
  })

  const showUpToggle = computed(() => {
    return isEligibleMarket.value && hasDerivedMarkets.value
  })

  const sanitizeMarkets = (list = []) => {
    return (list || []).filter((market) => {
      const marketId = Number(market.marketID)
      return marketId !== DERIVED_MARKET_IDS['1up'] && marketId !== DERIVED_MARKET_IDS['2up']
    })
  }

  const filterFixturesByUpMode = (list, mode) => {
    if (!list || mode === 'none') return list
    const targetId = DERIVED_MARKET_IDS[mode]
    if (!targetId) return list
    if (Array.isArray(list)) {
      return list.filter((fixture) => {
        const derived = fixture?.derived_market_id || fixture?.derived_market_ids
        return Array.isArray(derived) && derived.map(Number).includes(targetId)
      })
    }
    const next = {}
    Object.entries(list).forEach(([key, group]) => {
      const filtered = (group || []).filter((fixture) => {
        const derived = fixture?.derived_market_id || fixture?.derived_market_ids
        return Array.isArray(derived) && derived.map(Number).includes(targetId)
      })
      if (filtered.length) {
        next[key] = filtered
      }
    })
    return next
  }

  const filteredFixtures = computed(() => {
    return filterFixturesByUpMode(fixtures?.value, upMode.value)
  })

  const effectiveMarket = computed(() => {
    if (upMode.value === 'none') return activeMarket?.value
    const baseMarket = activeMarket?.value || {}
    const derivedMarketId = DERIVED_MARKET_IDS[upMode.value]
    return {
      ...baseMarket,
      marketID: derivedMarketId,
      marketName: baseMarket.marketName
        ? `${baseMarket.marketName} - ${upMode.value.toUpperCase()}`
        : baseMarket.marketName,
      outcomes: Array.isArray(baseMarket.outcomes) ? baseMarket.outcomes : []
    }
  })

  const setUpMode = (mode) => {
    const nextMode = upMode.value === mode ? 'none' : mode
    upMode.value = nextMode
    if (nextMode !== 'none' && marketsGroup?.value) {
      const baseMarket = marketsGroup.value.find((market) => Number(market.marketID) === 1)
      if (baseMarket && activeMarket) {
        activeMarket.value = baseMarket
      }
    }
  }

  const resetUpMode = () => {
    upMode.value = 'none'
  }

  watch(
    () => activeMarket?.value?.marketID,
    (marketId) => {
      if (Number(marketId || 0) !== 1) {
        upMode.value = 'none'
      }
    }
  )

  return {
    upMode,
    setUpMode,
    resetUpMode,
    showUpToggle,
    effectiveMarket,
    filteredFixtures,
    sanitizeMarkets
  }
}
