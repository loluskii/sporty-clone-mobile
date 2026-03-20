import { computed, ref, watch } from 'vue'
import { chunks } from '@/helpers'

const DEFAULT_DERIVED_MARKET_IDS = [60100, 60200]

export function useFixtureDetailMarkets(eventMarkets, marketGroups, fixtureDetail = null) {
  // Shared active market-group tab state for both prematch and live detail pages.
  const selectedGroupId = ref(null)

  const derivedMarketIds = computed(() => {
    const derived = fixtureDetail?.value?.derived_market_ids || fixtureDetail?.value?.derived_market_id
    const normalizedDerived = Array.isArray(derived) ? derived : derived != null ? [derived] : null
    if (!normalizedDerived) {
      return DEFAULT_DERIVED_MARKET_IDS
    }
    const ids = normalizedDerived.map(Number).filter((id) => Number.isFinite(id))
    return ids.length ? ids : DEFAULT_DERIVED_MARKET_IDS
  })

  const groupedMarketsByTab = computed(() => {
    if (!eventMarkets.value || !marketGroups.value) {
      return {}
    }

    const grouped = {}
    marketGroups.value.forEach((group) => {
      grouped[group.id] = {
        ...group,
        markets: []
      }
    })

    eventMarkets.value.forEach((market) => {
      marketGroups.value.forEach((group) => {
        if (group.marketIDs.includes(market.marketID)) {
          if (!grouped[group.id]) {
            grouped[group.id] = {
              ...group,
              markets: []
            }
          }
          grouped[group.id].markets.push(market)
        }
      })
    })

    return grouped
  })

  const filteredMarkets = computed(() => {
    if (!eventMarkets.value) {
      return []
    }

    if (selectedGroupId.value === null) {
      return eventMarkets.value
    }

    const group = groupedMarketsByTab.value[selectedGroupId.value]
    return group ? group.markets : []
  })

  const displayGroupedMarkets = computed(() => {
    return prioritizeDerivedMarkets(groupByMarketID(filteredMarkets.value), derivedMarketIds.value)
  })

  const sortedMarketGroups = computed(() => {
    if (!marketGroups.value) {
      return []
    }
    return [...marketGroups.value].sort((a, b) => b.priority - a.priority)
  })

  const hasNoMarketsInSelectedGroup = computed(() => {
    if (selectedGroupId.value === null) {
      return false
    }

    const group = marketGroups.value.find((item) => item.id === selectedGroupId.value)
    if (!group) {
      return false
    }

    return group.marketIDs.length === 0 || (group.marketIDs.length === 1 && group.marketIDs[0] === 0)
  })

  function sortByKey(array, key, ascending = true) {
    return array.slice().sort((a, b) => {
      const valA = parseInt(a[key], 10)
      const valB = parseInt(b[key], 10)

      if (isNaN(valA) || isNaN(valB)) {
        return 0
      }

      return ascending ? valA - valB : valB - valA
    })
  }

  function getChunks(outcomes) {
    return outcomes ? chunks(outcomes) : []
  }

  function getTitleInfo(title) {
    if (!title) return null
    const parts = title.split(',')
    if (parts.length < 2) return null
    return { specifierLabel: parts[0], columns: parts.slice(1) }
  }

  function findOutcomeForColumn(outcomes, col) {
    const colLower = col.toLowerCase().trim()
    return (
      outcomes.find((outcome) => {
        const dn = outcome.displayName?.toLowerCase() ?? ''
        if (colLower === 'home') return /^1[\s(]|^1$/.test(outcome.displayName)
        if (colLower === 'away') return /^2[\s(]|^2$/.test(outcome.displayName)
        if (colLower === 'draw') return /^x[\s(]|^x$/i.test(outcome.displayName)
        return dn.startsWith(colLower)
      }) ?? null
    )
  }

  function getMarketColumns(marketGroup) {
    const title = marketGroup.markets[0]?.title
    const titleInfo = getTitleInfo(title)
    if (!titleInfo || titleInfo.columns.length === 0) return null

    const sampleOutcomes = marketGroup.markets[0].outcomes
    let specifierLabel = titleInfo.specifierLabel
    let candidateCols = titleInfo.columns

    if (findOutcomeForColumn(sampleOutcomes, specifierLabel) !== null) {
      specifierLabel = null
      candidateCols = [titleInfo.specifierLabel, ...titleInfo.columns]
    }

    const availableCols = candidateCols.filter(
      (col) => findOutcomeForColumn(sampleOutcomes, col) !== null
    )
    if (availableCols.length === 0) return null

    const totalCols = availableCols.length + (specifierLabel !== null ? 1 : 0)
    return { specifierLabel, columns: availableCols, totalCols }
  }

  function getHcpFromDisplayName(displayName) {
    const match = displayName.match(/\(([^)]+)\)/)
    return match ? match[1] : displayName
  }

  function getSpecifierDisplayValue(specifier) {
    if (!specifier) return ''
    const totalMatch = specifier.match(/total=([\d.]+)/)
    if (totalMatch) return totalMatch[1]
    const hcpMatch = specifier.match(/hcp=([+-]?[\d.]+)/)
    if (hcpMatch) return hcpMatch[1]
    const parts = specifier.split('|')
    return parts[parts.length - 1].split('=').pop()
  }

  function getRowLabel(market, specifierLabel) {
    if (specifierLabel?.toLowerCase() === 'handicap') {
      const homeOutcome = market.outcomes?.find((outcome) => /^1[\s(]/.test(outcome.displayName))
      if (homeOutcome) return getHcpFromDisplayName(homeOutcome.displayName)
    }
    return getSpecifierDisplayValue(market.specifier)
  }

  function colClass(n) {
    if (n <= 2) return 'm-outcome-two'
    if (n === 3) return 'm-outcome-three'
    return 'm-outcome-four'
  }

  function toOrdinal(n) {
    const num = parseInt(n)
    if (isNaN(num)) return String(n)
    const v = num % 100
    const suffix =
      v >= 11 && v <= 13 ? 'th' : ['th', 'st', 'nd', 'rd', 'th'][Math.min(num % 10, 4)]
    return num + suffix
  }

  function cleanMarketName(name, specifier) {
    if (!name.includes('=') || name.indexOf('=') > 20) return name

    const specMap = {}
    if (specifier) {
      specifier.split('|').forEach((part) => {
        const eqIdx = part.indexOf('=')
        if (eqIdx > -1) specMap[part.slice(0, eqIdx)] = part.slice(eqIdx + 1)
      })
    }

    let cleaned = name.replace(/^[\d\w|=.\-]+(?=th\s|st\s|nd\s|rd\s)/i, '')

    let ordinalPrefix = ''
    const ordinalMatch = cleaned.match(/^(th|st|nd|rd)\s/i)
    if (ordinalMatch) {
      cleaned = cleaned.replace(/^(?:th|st|nd|rd)\s*/i, '')
      const setnr = specMap.setnr || Object.values(specMap)[0]
      if (setnr) ordinalPrefix = toOrdinal(setnr) + ' '
    }

    cleaned = cleaned.replace(/\{!(\w+)\}/g, (_, key) =>
      specMap[key] ? toOrdinal(specMap[key]) : ''
    )
    cleaned = cleaned.replace(/\{(\w+)\}/g, (_, key) => specMap[key] ?? '')

    cleaned = (ordinalPrefix + cleaned).replace(/\s{2,}/g, ' ').trim()
    return cleaned || name
  }

  function groupByMarketID(data) {
    const groupedMarkets = {}
    data.forEach((marketGroup) => {
      const { marketID, marketName, specifier } = marketGroup
      // Key by cleaned name so split specifier-prefixed titles collapse correctly.
      const cleanedName = cleanMarketName(marketName, specifier)
      const key = `${marketID}|${cleanedName}`
      if (!groupedMarkets[key]) {
        groupedMarkets[key] = {
          marketID,
          marketName,
          specifier,
          markets: [marketGroup]
        }
      } else {
        groupedMarkets[key].markets.push(marketGroup)
      }
    })
    return Object.values(groupedMarkets)
  }

  function prioritizeDerivedMarkets(groups, ids = []) {
    if (!Array.isArray(groups) || groups.length < 3 || !Array.isArray(ids) || ids.length === 0) {
      return groups
    }

    const derivedSet = new Set(ids.map(Number))
    const firstGroup = groups[0]
    const derivedGroups = []
    const remainingGroups = []

    groups.slice(1).forEach((group) => {
      if (derivedSet.has(Number(group.marketID))) {
        derivedGroups.push(group)
      } else {
        remainingGroups.push(group)
      }
    })

    // Keep derived markets directly under the base market without disturbing their configured order.
    const orderedDerivedGroups = ids
      .map((id) => derivedGroups.find((group) => Number(group.marketID) === Number(id)))
      .filter(Boolean)

    return [firstGroup, ...orderedDerivedGroups, ...remainingGroups]
  }

  watch(
    () => fixtureDetail?.value?.matchID,
    () => {
      selectedGroupId.value = null
    }
  )

  return {
    selectedGroupId,
    groupedMarketsByTab,
    filteredMarkets,
    displayGroupedMarkets,
    sortedMarketGroups,
    hasNoMarketsInSelectedGroup,
    sortByKey,
    getChunks,
    getMarketColumns,
    findOutcomeForColumn,
    getRowLabel,
    colClass,
    cleanMarketName
  }
}
