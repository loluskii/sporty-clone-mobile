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

  const { subscribe } = useMqttService()

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
      if (cached) {
        return {
          ...outcome,
          odds: cached.odds,
          active: cached.active
        }
      }
      return outcome
    })
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
        const value = specifier.includes('=') ? specifier.split('=')[1] : specifier
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
    const items = baseOutcomes.value || []
    const filtered = items.filter(
      (item) => String(item.marketID) === String(market.marketID)
    )
    let uniqueFiltered = uniqueOutcomes(filtered)
    uniqueFiltered = applyUpdates(uniqueFiltered)

    if (market.specifier && market.specifier !== '') {
      let specifierKey = activeSpecifierKey.value || uniqueFiltered[0]?.specifier || ''
      if (specifierKey) {
        uniqueFiltered = uniqueFiltered.filter((item) => item.specifier === specifierKey)
        activeSpecifierKey.value = specifierKey
        activeSpecifier.value = specifierKey.includes('=')
          ? specifierKey.split('=')[1]
          : specifierKey
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
    if (data.market_id !== undefined && Array.isArray(data.outcomes)) {
      return [
        {
          id: data.market_id,
          specifiers: data.specifier || '',
          outcomes: data.outcomes.map((o) => ({
            id: o.outcome_id ?? o.outcomeID ?? o.id,
            odds: o.odds,
            active: o.active
          }))
        }
      ]
    }
    if (Array.isArray(data.markets)) {
      return data.markets
    }
    return []
  }

  const applyMarketUpdate = (data) => {
    const markets = normalizeMarkets(data)
    if (!markets.length) return
    const updatedOutcomesCopy = { ...updatedOutcomes.value }
    markets.forEach((marketItem) => {
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
    outcomes.value = outcomes.value.map((outcome) => ({
      ...outcome,
      odds: 0,
      active: 0
    }))
    const updatedOutcomesCopy = { ...updatedOutcomes.value }
    outcomes.value.forEach((outcome) => {
      const key = `${outcome.marketID}-${outcome.outcomeID}-${outcome.specifier || ''}`
      updatedOutcomesCopy[key] = {
        odds: 0,
        active: 0,
        timestamp: Date.now()
      }
    })
    updatedOutcomes.value = updatedOutcomesCopy
    if (onBetStop) {
      onBetStop()
    }
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
