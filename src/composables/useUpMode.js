import { computed, ref, watch } from 'vue'
import {
  DEFAULT_DERIVED_MARKET_CONFIG,
  formatEarlyGoalMarketName,
  formatEarlyWinMarketName
} from '@/helpers'

const flattenFixtures = (fixtures) => {
  if (Array.isArray(fixtures)) return fixtures
  if (fixtures && typeof fixtures === 'object') {
    return Object.values(fixtures).flat()
  }
  return []
}

const getDerivedIds = (config) => {
  return Object.values(config || {}).flatMap((entry) =>
    (entry?.modes || []).map((mode) => Number(mode.id)).filter((id) => Number.isFinite(id))
  )
}

export const useUpMode = ({
  fixtures,
  activeMarket,
  marketsGroup,
  enabledSportId = 1,
  derivedMarketConfig = DEFAULT_DERIVED_MARKET_CONFIG,
  requireDerivedFixturesForToggle = true,
  filterFixturesByDerived = true
}) => {
  const upMode = ref('none')

  const allDerivedIds = computed(() => {
    return new Set(getDerivedIds(derivedMarketConfig))
  })

  const activeConfig = computed(() => {
    const marketId = Number(activeMarket?.value?.marketID || 0)
    return derivedMarketConfig?.[marketId] || null
  })

  const modeOptions = computed(() => {
    return activeConfig.value?.modes || []
  })

  const baseLabel = computed(() => {
    return activeConfig.value?.baseLabel || 'Base'
  })

  const modeIdMap = computed(() => {
    const map = new Map()
    modeOptions.value.forEach((option) => {
      map.set(option.key, Number(option.id))
    })
    return map
  })

  const hasDerivedMarkets = computed(() => {
    const targetIds = modeOptions.value.map((option) => Number(option.id))
    if (!targetIds.length) return false
    return flattenFixtures(fixtures?.value).some((fixture) => {
      const derived = fixture?.derived_market_id || fixture?.derived_market_ids
      return Array.isArray(derived) && derived.map(Number).some((id) => targetIds.includes(id))
    })
  })

  const isEligibleMarket = computed(() => {
    const marketId = Number(activeMarket?.value?.marketID || 0)
    const marketSportId = Number(activeMarket?.value?.sportID || activeMarket?.value?.sportId || 0)
    if (enabledSportId && marketSportId !== enabledSportId) return false
    return Boolean(activeConfig.value) && marketId > 0
  })

  const showUpToggle = computed(() => {
    return (
      isEligibleMarket.value &&
      (!requireDerivedFixturesForToggle || hasDerivedMarkets.value)
    )
  })

  const sanitizeMarkets = (list = []) => {
    const derivedIds = allDerivedIds.value
    return (list || []).filter((market) => {
      const marketId = Number(market.marketID)
      return !derivedIds.has(marketId)
    })
  }

  const filterFixturesByUpMode = (list, mode) => {
    if (!list || mode === 'none') return list
    const targetId = modeIdMap.value.get(mode)
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
    // Some screens refetch from the API on mode change instead of filtering the current list.
    if (!filterFixturesByDerived) {
      return fixtures?.value
    }
    return filterFixturesByUpMode(fixtures?.value, upMode.value)
  })

  const effectiveMarket = computed(() => {
    if (upMode.value === 'none') return activeMarket?.value
    const baseMarket = activeMarket?.value || {}
    const derivedMarketId = modeIdMap.value.get(upMode.value)
    const marketName =
      upMode.value === 'earlygoal'
        ? formatEarlyGoalMarketName(baseMarket.marketName, upMode.value)
        : formatEarlyWinMarketName(baseMarket.marketName, upMode.value)
    return {
      ...baseMarket,
      marketID: derivedMarketId,
      marketName,
      outcomes: Array.isArray(baseMarket.outcomes) ? baseMarket.outcomes : []
    }
  })

  const setUpMode = (mode) => {
    if (mode === 'none') {
      upMode.value = 'none'
      return
    }
    const validModes = new Set(modeOptions.value.map((option) => option.key))
    if (!validModes.has(mode)) {
      upMode.value = 'none'
      return
    }
    const nextMode = upMode.value === mode ? 'none' : mode
    upMode.value = nextMode
    if (nextMode !== 'none' && marketsGroup?.value) {
      const baseMarketId = Number(activeMarket?.value?.marketID || 0)
      const baseMarket = marketsGroup.value.find(
        (market) => Number(market.marketID) === baseMarketId
      )
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
      if (!derivedMarketConfig?.[Number(marketId || 0)]) {
        upMode.value = 'none'
      }
    }
  )

  return {
    upMode,
    setUpMode,
    resetUpMode,
    showUpToggle,
    modeOptions,
    baseLabel,
    effectiveMarket,
    filteredFixtures,
    sanitizeMarkets
  }
}
