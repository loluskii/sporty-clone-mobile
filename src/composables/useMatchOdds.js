import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { sortArr } from '@/helpers'
import { useMqttService } from '@/composables/useMqtt'

export function useMatchOdds({
  matchId,
  activeMarket,
  baseOutcomes,
  sportId = 1,
  onBetStop,
  onMessage
}) {
  const outcomes = ref([])
  const activeSpecifier = ref('')
  const activeSpecifierKey = ref('')
  const updatedOutcomes = ref({})
  // Tracks bet_stop state so API refreshes don't re-activate markets prematurely.
  const betStopped = ref(false)
  // Tracks deactivated markets so they can be hidden until API removes them.
  const deactivatedMarkets = ref(new Set())

  const { subscribe } = useMqttService()

  const getDisplaySpecifierValue = (specifier = '') => {
    const rawSpecifier = String(specifier || '').trim()
    if (!rawSpecifier) return ''

    const segments = rawSpecifier
      .split('|')
      .map((segment) => segment.trim())
      .filter(Boolean)

    const totalSegment = segments.find((segment) => segment.startsWith('total='))
    if (totalSegment) {
      return totalSegment.split('=')[1] || ''
    }

    const hcpSegment = segments.find((segment) => segment.startsWith('hcp='))
    if (hcpSegment) {
      return hcpSegment.split('=')[1] || ''
    }

    const lastKeyValueSegment = [...segments].reverse().find((segment) => segment.includes('='))
    if (lastKeyValueSegment) {
      return lastKeyValueSegment.split('=').slice(1).join('=') || ''
    }

    return rawSpecifier
  }

  const uniqueOutcomes = (items) => {
    return items.filter(
      (outcome, index, self) =>
        index ===
        self.findIndex(
          (o) =>
            String(o.outcomeID) === String(outcome.outcomeID) &&
            String(o.specifier || '') === String(outcome.specifier || '')
        )
    )
  }

  const applyUpdates = (items) => {
    return items.map((outcome) => {
      const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier || ''}`
      const cached = updatedOutcomes.value[key]
      const oddsValue = cached?.odds ?? outcome.odds
      // MQTT overrides odds/active; bet_stop forces inactive regardless of API odds.
      const activeValue = betStopped.value ? 0 : cached?.active ?? outcome.active
      return {
        ...outcome,
        odds: oddsValue,
        active: activeValue
      }
    })
  }

  const buildMarketKey = (marketId, specifiers = '') => {
    return `${marketId}-${specifiers || ''}`
  }

  const pruneUpdatedOutcomes = (items) => {
    // Remove MQTT overrides that no longer exist in the API payload.
    const validKeys = new Set(
      (items || []).map(
        (outcome) => `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier || ''}`
      )
    )
    const pruned = { ...updatedOutcomes.value }
    Object.keys(pruned).forEach((key) => {
      if (!validKeys.has(key)) {
        delete pruned[key]
      }
    })
    updatedOutcomes.value = pruned
  }

  const applySuspension = (marketId, specifiers = '') => {
    // Suspended market: keep odds but force outcomes inactive.
    const items = baseOutcomes.value || []
    const filtered = items.filter(
      (item) =>
        String(item.marketID) === String(marketId) &&
        String(item.specifier || '') === String(specifiers || '')
    )
    if (!filtered.length) return
    const updatedOutcomesCopy = { ...updatedOutcomes.value }
    filtered.forEach((outcome) => {
      const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier || ''}`
      updatedOutcomesCopy[key] = {
        odds: outcome.odds,
        active: 0,
        timestamp: Date.now()
      }
    })
    updatedOutcomes.value = updatedOutcomesCopy
    refreshOutcomes()
  }

  const getSpecifiers = computed(() => {
    if (!activeMarket.value || !activeMarket.value.specifier) return []
    const items = baseOutcomes.value || []
    const filtered = items.filter(
      (item) => String(item.marketID) === String(activeMarket.value.marketID)
    )
    const uniqueFiltered = uniqueOutcomes(filtered)
    const specifiers = uniqueFiltered
      .map((item) => {
        const specifier = item.specifier || ''
        const value = getDisplaySpecifierValue(specifier)
        return { specifier, value }
      })
      .filter((item) => item.specifier !== '')
    const uniqueSpecifiers = specifiers.filter(
      (item, index, self) => index === self.findIndex((t) => t.value === item.value)
    )
    return uniqueSpecifiers.sort((a, b) => a.value - b.value)
  })

  const refreshOutcomes = () => {
    const market = activeMarket.value
    if (!market || !market.marketID) {
      outcomes.value = []
      return
    }
    const marketKey = buildMarketKey(market.marketID, market.specifier || '')
    if (deactivatedMarkets.value.has(marketKey)) {
      outcomes.value = []
      return
    }
    const items = baseOutcomes.value || []
    // Keep MQTT overrides only for outcomes still present in API.
    pruneUpdatedOutcomes(items)
    const filtered = items.filter(
      (item) => String(item.marketID) === String(market.marketID)
    )
    let uniqueFiltered = uniqueOutcomes(filtered)
    uniqueFiltered = applyUpdates(uniqueFiltered)

    if (market.specifier && market.specifier !== '') {
      const availableSpecifiers = uniqueFiltered.map((item) => item.specifier || '')
      // If the previous specifier doesn't exist in the new market, fall back to the first one.
      let specifierKey = activeSpecifierKey.value
      if (!specifierKey || !availableSpecifiers.includes(specifierKey)) {
        specifierKey = uniqueFiltered[0]?.specifier || ''
      }
      if (specifierKey) {
        uniqueFiltered = uniqueFiltered.filter((item) => item.specifier === specifierKey)
        activeSpecifierKey.value = specifierKey
        activeSpecifier.value = getDisplaySpecifierValue(specifierKey)
      }
    } else {
      activeSpecifierKey.value = ''
      activeSpecifier.value = ''
    }

    outcomes.value = uniqueFiltered.length ? sortArr(uniqueFiltered, 'outcomeID') : []
  }

  const setActiveSpecifier = (spec) => {
    activeSpecifierKey.value = spec?.specifier || ''
    activeSpecifier.value = spec?.value || ''
    refreshOutcomes()
  }

  const normalizeMarkets = (data) => {
    // Normalize MQTT market payload to internal shape.
    if (data.market_id !== undefined && Array.isArray(data.outcomes)) {
      return [
        {
          id: data.market_id,
          specifiers: data.specifier || '',
          statusName: data.status_name || data.statusName,
          outcomes: data.outcomes.map((o) => ({
            id: o.outcome_id ?? o.outcomeID ?? o.id,
            outcomeName: o.outcome_name ?? o.outcomeName ?? o.name,
            odds: o.odds,
            active: o.active
          }))
        }
      ]
    }
    return []
  }

  const applyMarketUpdate = (data) => {
    // Apply a single-market MQTT update.
    const dataStatus = data?.status_name || data?.statusName
    if (String(dataStatus || '').toLowerCase() === 'deactivated' && data?.market_id !== undefined) {
      const nextDeactivated = new Set(deactivatedMarkets.value)
      nextDeactivated.add(buildMarketKey(data.market_id, data.specifier || ''))
      deactivatedMarkets.value = nextDeactivated
      refreshOutcomes()
      return
    }
    if (String(dataStatus || '').toLowerCase() === 'suspended' && data?.market_id !== undefined) {
      applySuspension(data.market_id, data.specifier || '')
      return
    }
    const markets = normalizeMarkets(data)
    if (!markets.length) return
    const updatedOutcomesCopy = { ...updatedOutcomes.value }

    if (betStopped.value) {
      // First market update after bet_stop re-activates markets.
      betStopped.value = false
      const items = baseOutcomes.value || []
      items.forEach((outcome) => {
        const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier || ''}`
        updatedOutcomesCopy[key] = {
          odds: outcome.odds,
          active: 1,
          timestamp: Date.now()
        }
      })
    }

    markets.forEach((marketItem) => {
      const marketStatus = marketItem.statusName || marketItem.status_name
      if (String(marketStatus || '').toLowerCase() === 'deactivated') {
        const nextDeactivated = new Set(deactivatedMarkets.value)
        nextDeactivated.add(buildMarketKey(marketItem.id, marketItem.specifiers || ''))
        deactivatedMarkets.value = nextDeactivated
        return
      }
      if (String(marketStatus || '').toLowerCase() === 'suspended') {
        applySuspension(marketItem.id, marketItem.specifiers || '')
        return
      }
      const nextDeactivated = new Set(deactivatedMarkets.value)
      nextDeactivated.delete(buildMarketKey(marketItem.id, marketItem.specifiers || ''))
      deactivatedMarkets.value = nextDeactivated
      const marketId = marketItem.id
      const specifiers = marketItem.specifiers || ''
      const marketOutcomes = marketItem.outcomes || []
      marketOutcomes.forEach((outcome) => {
        const outcomeId = outcome.id ?? outcome.outcome_id ?? outcome.outcomeID
        const key = `${marketId}-${outcomeId}-${specifiers}`
        updatedOutcomesCopy[key] = {
          odds: outcome.odds,
          active: outcome.active,
          timestamp: Date.now()
        }
      })
    })
    updatedOutcomes.value = updatedOutcomesCopy
    refreshOutcomes()
  }

  const applyBetStop = () => {
    // Bet stop: lock all markets; keep odds from API.
    betStopped.value = true
    updatedOutcomes.value = {}
    if (onBetStop) {
      onBetStop()
    }
    refreshOutcomes()
  }

  watch([activeMarket, baseOutcomes], refreshOutcomes, { immediate: true })

  onMounted(() => {
    const matchIdValue = matchId.value
    if (!matchIdValue) return
    const sportIdValue = sportId?.value ?? sportId ?? 1
    const baseTopic = `sports/${sportIdValue}/match/${matchIdValue}`
    const topics = {
      markets: `${baseTopic}/markets`,
      betStop: `${baseTopic}/bet_stop`,
      matchStatus: `${baseTopic}/match_status`,
      scores: `${baseTopic}/scores`
    }

    const unsubscribers = [
      subscribe(topics.markets, (data) => {
        applyMarketUpdate(data)
        if (onMessage) {
          onMessage('markets', data)
        }
      }),
      subscribe(topics.betStop, () => {
        applyBetStop()
      }),
      subscribe(topics.matchStatus, (data) => {
        if (onMessage) {
          onMessage('match_status', data)
        }
      }),
      subscribe(topics.scores, (data) => {
        if (onMessage) {
          onMessage('scores', data)
        }
      })
    ]

    onBeforeUnmount(() => {
      unsubscribers.forEach((unsubscribe) => unsubscribe())
    })
  })

  return {
    outcomes,
    activeSpecifier,
    getSpecifiers,
    setActiveSpecifier,
    refreshOutcomes
  }
}
