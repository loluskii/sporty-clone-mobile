export const DEFAULT_DERIVED_MARKET_CONFIG = {
  1: {
    baseLabel: '1X2 Base',
    modes: [
      { key: '1up', id: 60100, label: '1UP' },
      { key: '2up', id: 60200, label: '2UP' }
    ]
  }
}

export const EARLY_WIN_MODE_KEYS = ['1up', '2up']
export const EARLY_WIN_MODE_LABELS = {
  base: 'Base',
  '1up': '1UP',
  '2up': '2UP',
  earlygoal: 'Early Goals'
}
export const EARLY_WIN_DEFAULT_MODE = '2up'
export const EARLY_WIN_FOOTBALL_SPORT_ID = 1
export const EARLY_GOAL_BASE_MARKET_ID = 18
export const EARLY_GOAL_DERIVED_MARKET_ID = 60180

const MODE_BY_DERIVED_MARKET_ID = new Map()
const BASE_MARKET_BY_DERIVED_ID = new Map()
const DERIVED_MARKET_BY_BASE_AND_MODE = new Map()

Object.entries(DEFAULT_DERIVED_MARKET_CONFIG).forEach(([baseMarketId, config]) => {
  const modeMap = new Map()
  ;(config?.modes || []).forEach((mode) => {
    const marketId = Number(mode.id)
    MODE_BY_DERIVED_MARKET_ID.set(marketId, mode.key)
    BASE_MARKET_BY_DERIVED_ID.set(marketId, Number(baseMarketId))
    modeMap.set(mode.key, marketId)
  })
  DERIVED_MARKET_BY_BASE_AND_MODE.set(Number(baseMarketId), modeMap)
})

export const normalizeEarlyWinMode = (mode) => {
  return EARLY_WIN_MODE_KEYS.includes(mode) ? mode : 'base'
}

export const normalizeDerivedMarketIds = (input) => {
  const values = Array.isArray(input) ? input : input != null ? [input] : []
  return [...new Set(values.map(Number).filter((id) => Number.isFinite(id)))]
}

export const isFootballSport = (sportId) => {
  return Number(sportId) === EARLY_WIN_FOOTBALL_SPORT_ID
}

export const getEarlyWinModeFromMarketId = (marketId) => {
  return MODE_BY_DERIVED_MARKET_ID.get(Number(marketId)) || 'base'
}

export const getBaseMarketIdFromMarketId = (marketId) => {
  return BASE_MARKET_BY_DERIVED_ID.get(Number(marketId)) || Number(marketId || 0)
}

export const stripEarlyWinSuffix = (marketName = '') => {
  return String(marketName || '')
    .replace(/\s*[-–]?\s*(1|2)up$/i, '')
    .trim()
}

export const formatEarlyWinMarketName = (baseMarketName = '', mode = 'base') => {
  const safeBaseName = String(baseMarketName || '').trim()
  if (mode === 'base') return safeBaseName
  return [safeBaseName, EARLY_WIN_MODE_LABELS[mode]].filter(Boolean).join(' - ')
}

export const stripEarlyGoalSuffix = (marketName = '') => {
  return String(marketName || '')
    .replace(/\s*[-–]?\s*early goals$/i, '')
    .trim()
}

export const formatEarlyGoalMarketName = (baseMarketName = '', mode = 'base') => {
  const safeBaseName = String(baseMarketName || '').trim()
  if (mode === 'base') return safeBaseName
  return [safeBaseName, EARLY_WIN_MODE_LABELS[mode]].filter(Boolean).join(' - ')
}

const normalizeFixtureText = (value = '') => String(value || '').trim().toLowerCase()

const getFixtureMarkets = (fixture = {}) => {
  if (Array.isArray(fixture?.market)) return fixture.market
  if (Array.isArray(fixture?.markets)) return fixture.markets
  return []
}

const getFixtureFlatOutcomes = (fixture = {}) => {
  return Array.isArray(fixture?.outcomes) ? fixture.outcomes : []
}

const getFixtureMarketId = (market = {}) =>
  Number(market.marketID ?? market.marketId ?? market.market_id ?? market.id ?? 0)

const getFixtureMarketName = (market = {}) =>
  String(market.marketName ?? market.market_name ?? market.name ?? '').trim()

const getFixtureMarketSpecifier = (market = {}) =>
  String(market.specifier ?? market.specifiers ?? '')

const getFixtureMarketStatus = (market = {}) =>
  String(market.statusName ?? market.status_name ?? '').trim()

const getFixtureOutcomeId = (outcome = {}) =>
  String(outcome.outcomeID ?? outcome.outcomeId ?? outcome.id ?? '')

const getFixtureOutcomeSpecifier = (outcome = {}) =>
  String(outcome.specifier ?? outcome.specifiers ?? '')

const getFixtureOutcomeName = (outcome = {}) =>
  String(outcome.outcomeName ?? outcome.name ?? outcome.displayName ?? '').trim()

const getFixtureOutcomeDisplayName = (outcome = {}) =>
  String(outcome.displayName ?? outcome.outcomeName ?? outcome.name ?? '').trim()

const getFixtureOutcomeActive = (outcome = {}) =>
  Number(outcome.active ?? outcome.isActive ?? 1)

const getConfiguredDerivedMarketIds = (baseMarketId) => {
  const modeMap = DERIVED_MARKET_BY_BASE_AND_MODE.get(Number(baseMarketId || 0))
  return modeMap ? [...modeMap.values()] : []
}

const splitSpecifierSegments = (specifier = '') =>
  String(specifier || '')
    .split('|')
    .map((segment) => segment.trim())
    .filter(Boolean)

const specifierMatches = (candidateSpecifier = '', referenceSpecifier = '') => {
  const normalizedCandidate = String(candidateSpecifier || '')
  const normalizedReference = String(referenceSpecifier || '')

  if (!normalizedReference) return true
  if (!normalizedCandidate) return false
  if (normalizedCandidate === normalizedReference) return true

  const candidateSegments = splitSpecifierSegments(normalizedCandidate)
  const referenceSegments = splitSpecifierSegments(normalizedReference)

  if (!referenceSegments.length) return normalizedCandidate === normalizedReference

  return referenceSegments.every((segment) => candidateSegments.includes(segment))
}

const findFixtureMarket = (markets, marketId, specifier = '') => {
  const candidates = markets.filter((market) => getFixtureMarketId(market) === Number(marketId))
  if (!candidates.length) return null

  const normalizedSpecifier = String(specifier || '')
  return (
    candidates.find(
      (market) => specifierMatches(getFixtureMarketSpecifier(market), normalizedSpecifier)
    ) || candidates[0]
  )
}

const findFixtureOutcomes = (outcomes, marketId, specifier = '') => {
  const candidates = outcomes.filter(
    (outcome) =>
      Number(outcome.marketID ?? outcome.marketId ?? outcome.market_id ?? 0) === Number(marketId)
  )
  if (!candidates.length) return []

  const normalizedSpecifier = String(specifier || '')
  const exactMatches = candidates.filter(
    (outcome) => specifierMatches(getFixtureOutcomeSpecifier(outcome), normalizedSpecifier)
  )

  return exactMatches.length ? exactMatches : candidates
}

const findOutcomeIndex = (market, reference = {}) => {
  const outcomes = Array.isArray(market?.outcomes) ? market.outcomes : []
  if (!outcomes.length) return -1

  const targetOutcomeId = String(reference.outcomeId || '')
  if (targetOutcomeId) {
    const idIndex = outcomes.findIndex((outcome) => getFixtureOutcomeId(outcome) === targetOutcomeId)
    if (idIndex !== -1) return idIndex
  }

  const candidateNames = [
    normalizeFixtureText(reference.outcomeName),
    normalizeFixtureText(reference.displayName)
  ].filter(Boolean)

  if (candidateNames.length) {
    const nameIndex = outcomes.findIndex((outcome) => {
      const outcomeNames = [
        normalizeFixtureText(getFixtureOutcomeName(outcome)),
        normalizeFixtureText(getFixtureOutcomeDisplayName(outcome))
      ].filter(Boolean)
      return candidateNames.some((name) => outcomeNames.includes(name))
    })
    if (nameIndex !== -1) return nameIndex
  }

  return -1
}

const findOutcomeByReference = (market, reference = {}) => {
  const outcomes = Array.isArray(market?.outcomes) ? market.outcomes : []
  if (!outcomes.length) return null

  const targetOutcomeId = String(reference.outcomeId || '')
  if (targetOutcomeId) {
    const byId = outcomes.find((outcome) => getFixtureOutcomeId(outcome) === targetOutcomeId)
    if (byId) return byId
  }

  const candidateNames = [
    normalizeFixtureText(reference.outcomeName),
    normalizeFixtureText(reference.displayName)
  ].filter(Boolean)

  if (candidateNames.length) {
    const byName = outcomes.find((outcome) => {
      const outcomeNames = [
        normalizeFixtureText(getFixtureOutcomeName(outcome)),
        normalizeFixtureText(getFixtureOutcomeDisplayName(outcome))
      ].filter(Boolean)
      return candidateNames.some((name) => outcomeNames.includes(name))
    })
    if (byName) return byName
  }

  const sourceIndex = Number(reference.sourceIndex)
  if (Number.isInteger(sourceIndex) && sourceIndex >= 0 && sourceIndex < outcomes.length) {
    return outcomes[sourceIndex]
  }

  return null
}

const getLocalQuoteStatusName = ({ market, outcome, odds }) => {
  const marketStatus = getFixtureMarketStatus(market)
  if (marketStatus && marketStatus !== 'Active') {
    return marketStatus
  }

  if (getFixtureOutcomeActive(outcome) !== 1) {
    return 'Suspended'
  }

  return Number.isFinite(odds) && odds > 1 ? 'Active' : 'Suspended'
}

const getFlatQuoteStatusName = ({ outcome, odds }) => {
  if (getFixtureOutcomeActive(outcome) !== 1) {
    return 'Suspended'
  }

  return Number.isFinite(odds) && odds > 1 ? 'Active' : 'Suspended'
}

export const getSupportedDerivedMarketIds = ({ sportId, marketId, derivedMarketIds }) => {
  const explicitIds = normalizeDerivedMarketIds(derivedMarketIds).filter((id) =>
    MODE_BY_DERIVED_MARKET_ID.has(id)
  )

  if (!isFootballSport(sportId)) {
    return []
  }

  return explicitIds
}

export const getSupportedEarlyWinModes = (input) => {
  const modes = getSupportedDerivedMarketIds(input)
    .map((marketId) => getEarlyWinModeFromMarketId(marketId))
    .filter((mode) => mode !== 'base')

  return EARLY_WIN_MODE_KEYS.filter((mode) => modes.includes(mode))
}

export const getDerivedMarketIdForMode = (baseMarketId, mode, supportedDerivedMarketIds = []) => {
  const normalizedMode = normalizeEarlyWinMode(mode)
  if (normalizedMode === 'base') {
    return Number(baseMarketId || 0)
  }

  const explicitMatch = normalizeDerivedMarketIds(supportedDerivedMarketIds).find(
    (marketId) => getEarlyWinModeFromMarketId(marketId) === normalizedMode
  )
  if (explicitMatch) {
    return explicitMatch
  }

  return DERIVED_MARKET_BY_BASE_AND_MODE.get(Number(baseMarketId || 0))?.get(normalizedMode) || 0
}

export const buildEarlyWinLocalQuoteMap = ({
  fixture,
  sportId,
  baseMarketId,
  baseMarketName = '',
  supportedDerivedMarketIds = [],
  marketId,
  specifier = '',
  outcomeId,
  outcomeName,
  displayName
}) => {
  if (!isFootballSport(sportId)) return {}

  const markets = getFixtureMarkets(fixture)
  const flatOutcomes = getFixtureFlatOutcomes(fixture)
  if (!markets.length && !flatOutcomes.length) return {}

  const configuredDerivedMarketIds = getConfiguredDerivedMarketIds(baseMarketId).filter(
    (candidateId) =>
      markets.some((market) => getFixtureMarketId(market) === Number(candidateId)) ||
      flatOutcomes.some(
        (outcome) =>
          Number(outcome.marketID ?? outcome.marketId ?? outcome.market_id ?? 0) ===
          Number(candidateId)
      )
  )

  const candidateMarketIds = [
    Number(baseMarketId || 0),
    ...normalizeDerivedMarketIds([
      ...supportedDerivedMarketIds,
      ...configuredDerivedMarketIds
    ])
  ].filter((candidateId) => Number.isFinite(candidateId) && candidateId > 0)

  const quotes = {}
  const reference = {
    outcomeId,
    outcomeName,
    displayName
  }

  if (markets.length) {
    const sourceMarket =
      findFixtureMarket(markets, marketId || baseMarketId, specifier) ||
      findFixtureMarket(markets, baseMarketId, specifier)
    if (!sourceMarket) return {}

    const sourceIndex = findOutcomeIndex(sourceMarket, reference)

    candidateMarketIds.forEach((candidateMarketId) => {
      const market = findFixtureMarket(markets, candidateMarketId, specifier)
      if (!market) return

      const outcome = findOutcomeByReference(market, {
        ...reference,
        sourceIndex
      })
      if (!outcome) return

      const normalizedOdds = Number(outcome.odds)
      const mode =
        Number(candidateMarketId) === Number(baseMarketId)
          ? 'base'
          : getEarlyWinModeFromMarketId(candidateMarketId)

      quotes[mode] = {
        marketId: Number(candidateMarketId),
        marketName: getFixtureMarketName(market),
        specifier: getFixtureMarketSpecifier(market),
        idSpecifier: getFixtureOutcomeSpecifier(outcome),
        outcomeId: getFixtureOutcomeId(outcome),
        outcomeName: getFixtureOutcomeName(outcome),
        displayName: getFixtureOutcomeDisplayName(outcome),
        odds: normalizedOdds,
        active: getFixtureOutcomeActive(outcome),
        statusName: getLocalQuoteStatusName({
          market,
          outcome,
          odds: normalizedOdds
        })
      }
    })

    return quotes
  }

  const primarySourceOutcomes = findFixtureOutcomes(
    flatOutcomes,
    marketId || baseMarketId,
    specifier
  )
  const sourceOutcomes = primarySourceOutcomes.length
    ? primarySourceOutcomes
    : findFixtureOutcomes(flatOutcomes, baseMarketId, specifier)
  if (!sourceOutcomes.length) return {}

  const sourceIndex = findOutcomeIndex({ outcomes: sourceOutcomes }, reference)

  candidateMarketIds.forEach((candidateMarketId) => {
    const outcomesForMarket = findFixtureOutcomes(flatOutcomes, candidateMarketId, specifier)
    if (!outcomesForMarket.length) return

    const outcome = findOutcomeByReference(
      { outcomes: outcomesForMarket },
      {
        ...reference,
        sourceIndex
      }
    )
    if (!outcome) return

    const normalizedOdds = Number(outcome.odds)
    const mode =
      Number(candidateMarketId) === Number(baseMarketId)
        ? 'base'
        : getEarlyWinModeFromMarketId(candidateMarketId)

    quotes[mode] = {
      marketId: Number(candidateMarketId),
      marketName: formatEarlyWinMarketName(baseMarketName, mode),
      specifier: getFixtureOutcomeSpecifier(outcome) || String(specifier || ''),
      idSpecifier: getFixtureOutcomeSpecifier(outcome),
      outcomeId: getFixtureOutcomeId(outcome),
      outcomeName: getFixtureOutcomeName(outcome),
      displayName: getFixtureOutcomeDisplayName(outcome),
      odds: normalizedOdds,
      active: getFixtureOutcomeActive(outcome),
      statusName: getFlatQuoteStatusName({
        outcome,
        odds: normalizedOdds
      })
    }
  })

  return quotes
}

export const buildEarlyWinSelectionState = ({
  sportId,
  marketId,
  marketName,
  derivedMarketIds
}) => {
  const currentMode = getEarlyWinModeFromMarketId(marketId)
  const baseMarketId = getBaseMarketIdFromMarketId(marketId)
  const baseMarketName =
    currentMode === 'base'
      ? String(marketName || '').trim()
      : stripEarlyWinSuffix(marketName) || String(marketName || '').trim()

  const explicitDerivedMarketIds = getSupportedDerivedMarketIds({
    sportId,
    marketId: baseMarketId,
    derivedMarketIds
  })
  const supportedDerivedMarketIds = [...explicitDerivedMarketIds]

  if (currentMode !== 'base' && !supportedDerivedMarketIds.includes(Number(marketId))) {
    supportedDerivedMarketIds.push(Number(marketId))
  }

  const supportedEarlyWinModes = getSupportedEarlyWinModes({
    sportId,
    marketId: baseMarketId,
    derivedMarketIds: supportedDerivedMarketIds
  })

  return {
    baseMarketId,
    baseMarketName,
    earlyWinMode: currentMode,
    explicitDerivedMarketIds,
    hasExplicitDerivedMarkets: isFootballSport(sportId) && explicitDerivedMarketIds.length > 0,
    supportedDerivedMarketIds,
    supportedEarlyWinModes,
    supportsEarlyWin: isFootballSport(sportId) && explicitDerivedMarketIds.length > 0,
    currentMarketName: formatEarlyWinMarketName(baseMarketName, currentMode)
  }
}

export const buildEarlyGoalLocalQuoteMap = ({
  fixture,
  sportId,
  marketId,
  baseMarketId,
  baseMarketName = '',
  specifier = '',
  outcomeId,
  outcomeName,
  displayName,
  derivedMarketIds = []
}) => {
  if (!isFootballSport(sportId)) return {}

  const normalizedCurrentMarketId = Number(marketId || 0)
  const isCurrentEarlyGoal = normalizedCurrentMarketId === EARLY_GOAL_DERIVED_MARKET_ID
  const resolvedBaseMarketId = isCurrentEarlyGoal
    ? Number(baseMarketId || 0)
    : normalizedCurrentMarketId
  if (resolvedBaseMarketId !== EARLY_GOAL_BASE_MARKET_ID) return {}

  const explicitDerivedIds = normalizeDerivedMarketIds(derivedMarketIds)
  const supportsDerived =
    explicitDerivedIds.includes(EARLY_GOAL_DERIVED_MARKET_ID) || isCurrentEarlyGoal
  if (!supportsDerived) return {}

  const markets = getFixtureMarkets(fixture)
  const flatOutcomes = getFixtureFlatOutcomes(fixture)
  if (!markets.length && !flatOutcomes.length) return {}

  const candidateMarketIds = [resolvedBaseMarketId, EARLY_GOAL_DERIVED_MARKET_ID]
  const quotes = {}
  const reference = {
    outcomeId,
    outcomeName,
    displayName
  }

  if (markets.length) {
    const sourceMarket =
      findFixtureMarket(markets, normalizedCurrentMarketId || resolvedBaseMarketId, specifier) ||
      findFixtureMarket(markets, resolvedBaseMarketId, specifier)
    if (!sourceMarket) return {}

    const sourceIndex = findOutcomeIndex(sourceMarket, reference)

    candidateMarketIds.forEach((candidateMarketId) => {
      const market = findFixtureMarket(markets, candidateMarketId, specifier)
      if (!market) return

      const outcome = findOutcomeByReference(market, {
        ...reference,
        sourceIndex
      })
      if (!outcome) return

      const normalizedOdds = Number(outcome.odds)
      const mode = Number(candidateMarketId) === resolvedBaseMarketId ? 'base' : 'earlygoal'

      quotes[mode] = {
        marketId: Number(candidateMarketId),
        marketName:
          mode === 'base'
            ? getFixtureMarketName(market)
            : formatEarlyGoalMarketName(baseMarketName, mode),
        specifier: getFixtureMarketSpecifier(market),
        idSpecifier: getFixtureOutcomeSpecifier(outcome),
        outcomeId: getFixtureOutcomeId(outcome),
        outcomeName: getFixtureOutcomeName(outcome),
        displayName: getFixtureOutcomeDisplayName(outcome),
        odds: normalizedOdds,
        active: getFixtureOutcomeActive(outcome),
        statusName: getLocalQuoteStatusName({
          market,
          outcome,
          odds: normalizedOdds
        })
      }
    })

    return quotes
  }

  const primarySourceOutcomes = findFixtureOutcomes(
    flatOutcomes,
    normalizedCurrentMarketId || resolvedBaseMarketId,
    specifier
  )
  const sourceOutcomes = primarySourceOutcomes.length
    ? primarySourceOutcomes
    : findFixtureOutcomes(flatOutcomes, resolvedBaseMarketId, specifier)
  if (!sourceOutcomes.length) return {}

  const sourceIndex = findOutcomeIndex({ outcomes: sourceOutcomes }, reference)

  candidateMarketIds.forEach((candidateMarketId) => {
    const outcomesForMarket = findFixtureOutcomes(flatOutcomes, candidateMarketId, specifier)
    if (!outcomesForMarket.length) return

    const outcome = findOutcomeByReference(
      { outcomes: outcomesForMarket },
      {
        ...reference,
        sourceIndex
      }
    )
    if (!outcome) return

    const normalizedOdds = Number(outcome.odds)
    const mode = Number(candidateMarketId) === resolvedBaseMarketId ? 'base' : 'earlygoal'

    quotes[mode] = {
      marketId: Number(candidateMarketId),
      marketName: formatEarlyGoalMarketName(baseMarketName, mode),
      specifier: getFixtureOutcomeSpecifier(outcome) || String(specifier || ''),
      idSpecifier: getFixtureOutcomeSpecifier(outcome),
      outcomeId: getFixtureOutcomeId(outcome),
      outcomeName: getFixtureOutcomeName(outcome),
      displayName: getFixtureOutcomeDisplayName(outcome),
      odds: normalizedOdds,
      active: getFixtureOutcomeActive(outcome),
      statusName: getFlatQuoteStatusName({
        outcome,
        odds: normalizedOdds
      })
    }
  })

  return quotes
}

export const buildEarlyGoalSelectionState = ({
  sportId,
  marketId,
  marketName,
  derivedMarketIds,
  baseMarketId
}) => {
  const normalizedMarketId = Number(marketId || 0)
  const isCurrentEarlyGoal = normalizedMarketId === EARLY_GOAL_DERIVED_MARKET_ID
  const resolvedBaseMarketId = isCurrentEarlyGoal
    ? Number(baseMarketId || 0)
    : normalizedMarketId
  const isEarlyGoalMarketCandidate =
    isFootballSport(sportId) &&
    Number(resolvedBaseMarketId) === EARLY_GOAL_BASE_MARKET_ID
  const baseMarketName =
    isCurrentEarlyGoal
      ? stripEarlyGoalSuffix(marketName) || String(marketName || '').trim()
      : String(marketName || '').trim()
  const explicitDerivedMarketIds = isEarlyGoalMarketCandidate
    ? normalizeDerivedMarketIds(derivedMarketIds).filter(
        (id) => id === EARLY_GOAL_DERIVED_MARKET_ID
      )
    : []
  const supportedDerivedMarketIds = [...explicitDerivedMarketIds]

  if (isCurrentEarlyGoal && !supportedDerivedMarketIds.includes(EARLY_GOAL_DERIVED_MARKET_ID)) {
    supportedDerivedMarketIds.push(EARLY_GOAL_DERIVED_MARKET_ID)
  }

  return {
    baseMarketId: resolvedBaseMarketId,
    baseMarketName,
    earlyGoalMode: isCurrentEarlyGoal ? 'earlygoal' : 'base',
    explicitDerivedMarketIds,
    isEarlyGoalMarketCandidate,
    hasExplicitDerivedMarkets: isEarlyGoalMarketCandidate && explicitDerivedMarketIds.length > 0,
    supportedDerivedMarketIds,
    supportsEarlyGoal: isEarlyGoalMarketCandidate && explicitDerivedMarketIds.length > 0,
    currentMarketName: formatEarlyGoalMarketName(
      baseMarketName,
      isCurrentEarlyGoal ? 'earlygoal' : 'base'
    )
  }
}

export const getPreferredEarlyWinModeForSelection = (
  selection,
  preferredMode = EARLY_WIN_DEFAULT_MODE
) => {
  const modes = Array.isArray(selection?.supportedEarlyWinModes)
    ? selection.supportedEarlyWinModes
    : []

  if (modes.includes(preferredMode)) {
    return preferredMode
  }

  return modes[0] || 'base'
}
