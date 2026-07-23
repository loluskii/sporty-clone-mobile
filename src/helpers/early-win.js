export const DEFAULT_DERIVED_MARKET_CONFIG = {
  1: {
    baseLabel: '1X2 Base',
    featureMarketId: 1601,
    modes: [
      { key: '1up', id: 1601, label: '1UP' },
      { key: '2up', id: 1601, label: '2UP' }
    ]
  },
  18: {
    baseLabel: 'Over/Under Base',
    modes: [{ key: 'earlygoal', id: 60180, label: 'Early Goals' }]
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
export const EARLY_WIN_BASE_MARKET_ID = 1
export const X_UP_FEATURE_MARKET_ID = 1601
export const EARLY_GOAL_BASE_MARKET_ID = 18
export const EARLY_GOAL_DERIVED_MARKET_ID = 60180
export const EARLY_GOAL_ALLOWED_TOTALS = ['1.5', '2.5', '3.5']

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

export const isXUpMarketId = (marketId) => Number(marketId) === X_UP_FEATURE_MARKET_ID

export const getEarlyWinModeFromSpecifier = (specifier = '') => {
  const xupValue = getSpecifierValue(specifier, 'xup')
  if (xupValue === '1') return '1up'
  if (xupValue === '2') return '2up'
  return 'base'
}

export const normalizeDerivedMarketIds = (input) => {
  const values = Array.isArray(input) ? input : input != null ? [input] : []
  return [...new Set(values.map(Number).filter((id) => Number.isFinite(id)))]
}

export const isFootballSport = (sportId) => {
  return Number(sportId) === EARLY_WIN_FOOTBALL_SPORT_ID
}

export const getEarlyWinModeFromMarketId = (marketId) => {
  const normalizedMarketId = Number(marketId || 0)
  if (normalizedMarketId === X_UP_FEATURE_MARKET_ID) {
    return 'base'
  }
  return MODE_BY_DERIVED_MARKET_ID.get(normalizedMarketId) || 'base'
}

export const getFeatureMarketIdForMode = (mode = 'none') => {
  const normalizedMode = String(mode || 'none').toLowerCase()
  if (normalizedMode === '1up' || normalizedMode === '2up') return X_UP_FEATURE_MARKET_ID
  if (normalizedMode === 'earlygoal') return EARLY_GOAL_DERIVED_MARKET_ID
  return ''
}

export const getBaseMarketIdFromMarketId = (marketId) => {
  return BASE_MARKET_BY_DERIVED_ID.get(Number(marketId)) || Number(marketId || 0)
}

export const stripEarlyWinSuffix = (marketName = '') => {
  return String(marketName || '')
    .trim()
    .replace(/\s*(?:[-–]?\s*(?:xup\s*=\s*\d+|xup|(1|2|3)up)\s*)+$/i, '')
    .trim()
}

export const formatEarlyWinMarketName = (baseMarketName = '', mode = 'base') => {
  const safeBaseName = stripEarlyWinSuffix(baseMarketName).trim()
  if (mode === 'base') return safeBaseName
  return [safeBaseName, 'XUP'].filter(Boolean).join(' - ')
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

const inferEarlyWinModeFromMarketName = (marketName = '') => {
  const suffixMatch = String(marketName || '')
    .trim()
    .match(/(?:^|[-–])\s*(1|2|3)\s*up$/i)

  if (!suffixMatch) return 'base'

  const normalizedMode = `${suffixMatch[1]}up`
  return EARLY_WIN_MODE_KEYS.includes(normalizedMode) ? normalizedMode : 'base'
}

const normalizeFixtureText = (value = '') => String(value || '').trim().toLowerCase()

const getFixtureMarkets = (fixture = {}) => {
  if (Array.isArray(fixture?.market)) return fixture.market
  if (Array.isArray(fixture?.markets)) return fixture.markets
  return []
}

export const getFixtureDerivedMarketIds = (fixture = {}) => {
  const directDerivedIds = normalizeDerivedMarketIds(
    fixture?.derived_market_ids || fixture?.derived_market_id
  )
  const extendDerivedIds = getFixtureMarkets(fixture)
    .flatMap((market = {}) => (Array.isArray(market.marketExtendVOS) ? market.marketExtendVOS : []))
    .map((extend = {}) => Number(extend.nodeMarketId || extend.node_market_id || 0))
    .filter((marketId) => Number.isFinite(marketId) && marketId > 0)

  return [...new Set([...directDerivedIds, ...extendDerivedIds])]
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

const getSpecifierValue = (specifier = '', key = '') => {
  const normalizedKey = String(key || '').trim().toLowerCase()
  if (!normalizedKey) return ''

  const segment = splitSpecifierSegments(specifier).find((part) =>
    part.toLowerCase().startsWith(`${normalizedKey}=`)
  )

  return segment ? segment.split('=').slice(1).join('=').trim() : ''
}

const getEarlyGoalBaseSpecifier = (specifier = '') => {
  const total = getSpecifierValue(specifier, 'total')
  return total ? `total=${total}` : String(specifier || '')
}

const isSupported1x2DerivedOutcome = ({ outcomeId, displayName = '', outcomeName = '' }) => {
  const normalizedOutcomeId = String(outcomeId || '').trim()
  if (normalizedOutcomeId === '1' || normalizedOutcomeId === '3') {
    return true
  }

  const normalizedLabel = String(displayName || outcomeName || '')
    .trim()
    .toLowerCase()

  return normalizedLabel === '1' || normalizedLabel === '2'
}

const isSupportedEarlyGoalOutcome = ({ outcomeId, specifier = '' }) => {
  const normalizedOutcomeId = String(outcomeId || '').trim()
  const total = getSpecifierValue(specifier, 'total')

  return normalizedOutcomeId === '12' && EARLY_GOAL_ALLOWED_TOTALS.includes(total)
}

export const isSupportedDerivedOutcome = ({
  marketId,
  baseMarketId,
  mode = 'base',
  outcomeId,
  outcomeName = '',
  displayName = '',
  specifier = ''
}) => {
  const normalizedMode = String(mode || 'base').toLowerCase()
  const normalizedBaseMarketId = Number(baseMarketId || getBaseMarketIdFromMarketId(marketId) || 0)
  const normalizedMarketId = Number(marketId || 0)

  if (
    normalizedBaseMarketId === EARLY_WIN_BASE_MARKET_ID &&
    (normalizedMode === '1up' ||
      normalizedMode === '2up' ||
      normalizedMarketId === X_UP_FEATURE_MARKET_ID)
  ) {
    return isSupported1x2DerivedOutcome({ outcomeId, displayName, outcomeName })
  }

  if (
    normalizedBaseMarketId === EARLY_GOAL_BASE_MARKET_ID &&
    (normalizedMode === 'earlygoal' || normalizedMarketId === EARLY_GOAL_DERIVED_MARKET_ID)
  ) {
    return isSupportedEarlyGoalOutcome({ outcomeId, specifier })
  }

  return true
}

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
  const targetSpecifier = String(reference.specifier || reference.idSpecifier || '')
  if (targetOutcomeId) {
    const idIndex = outcomes.findIndex((outcome) => {
      if (getFixtureOutcomeId(outcome) !== targetOutcomeId) return false
      if (!targetSpecifier) return true
      return specifierMatches(getFixtureOutcomeSpecifier(outcome), targetSpecifier)
    })
    if (idIndex !== -1) return idIndex
  }

  if (targetSpecifier) {
    const specifierIndex = outcomes.findIndex((outcome) =>
      specifierMatches(getFixtureOutcomeSpecifier(outcome), targetSpecifier)
    )
    if (specifierIndex !== -1) return specifierIndex
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

const findOutcomeByReference = (
  market,
  reference = {},
  { allowSpecifierOnlyMatch = true, allowSourceIndexMatch = true } = {}
) => {
  const outcomes = Array.isArray(market?.outcomes) ? market.outcomes : []
  if (!outcomes.length) return null

  const targetOutcomeId = String(reference.outcomeId || '')
  const targetSpecifier = String(reference.specifier || reference.idSpecifier || '')
  if (targetOutcomeId) {
    const byId = outcomes.find((outcome) => {
      if (getFixtureOutcomeId(outcome) !== targetOutcomeId) return false
      if (!targetSpecifier) return true
      return specifierMatches(getFixtureOutcomeSpecifier(outcome), targetSpecifier)
    })
    if (byId) return byId
  }

  if (targetSpecifier && allowSpecifierOnlyMatch) {
    const bySpecifier = outcomes.find((outcome) =>
      specifierMatches(getFixtureOutcomeSpecifier(outcome), targetSpecifier)
    )
    if (bySpecifier) return bySpecifier
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
  if (
    allowSourceIndexMatch &&
    Number.isInteger(sourceIndex) &&
    sourceIndex >= 0 &&
    sourceIndex < outcomes.length
  ) {
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
  if (!isFootballSport(sportId)) {
    return []
  }

  const normalizedDerivedIds = normalizeDerivedMarketIds(derivedMarketIds)
  const explicitIds = normalizedDerivedIds.filter((id) => MODE_BY_DERIVED_MARKET_ID.has(id))
  const supportsXUpFeature =
    Number(marketId || 0) === EARLY_WIN_BASE_MARKET_ID &&
    normalizedDerivedIds.includes(X_UP_FEATURE_MARKET_ID)

  if (supportsXUpFeature) {
    return [X_UP_FEATURE_MARKET_ID]
  }

  return explicitIds
}

export const getSupportedEarlyWinModes = (input) => {
  const derivedMarketIds = getSupportedDerivedMarketIds(input)
  if (derivedMarketIds.includes(X_UP_FEATURE_MARKET_ID)) {
    return [...EARLY_WIN_MODE_KEYS]
  }

  const modes = derivedMarketIds
    .map((marketId) => getEarlyWinModeFromMarketId(marketId))
    .filter((mode) => mode !== 'base')

  return EARLY_WIN_MODE_KEYS.filter((mode) => modes.includes(mode))
}

const getFixtureMarketExtensions = (fixture = {}) => {
  return getFixtureMarkets(fixture).flatMap((market = {}) => {
    const extensions = Array.isArray(market.marketExtendVOS) ? market.marketExtendVOS : []
    return extensions
      .map((extend = {}) => ({
        rootMarketId: Number(extend.rootMarketId || extend.root_market_id || market.marketID || market.marketId || market.market_id || 0),
        nodeMarketId: Number(extend.nodeMarketId || extend.node_market_id || 0),
        nodeSpecifier: String(extend.nodeSpecifier || extend.node_specifier || '').trim(),
        notSupport: Boolean(extend.notSupport)
      }))
      .filter((extend) => Number.isFinite(extend.rootMarketId) && extend.rootMarketId > 0)
  })
}

export const getSupportedEarlyWinModesFromFixture = ({
  fixture = {},
  baseMarketId = EARLY_WIN_BASE_MARKET_ID,
  derivedMarketIds = []
} = {}) => {
  if (!isFootballSport(fixture?.sportID || fixture?.sportId)) return []

  const normalizedBaseMarketId = Number(baseMarketId || 0)
  const extensionModes = getFixtureMarketExtensions(fixture)
    .filter(
      (extend) =>
        extend.rootMarketId === normalizedBaseMarketId &&
        extend.nodeMarketId === X_UP_FEATURE_MARKET_ID &&
        !extend.notSupport
    )
    .map((extend) => getEarlyWinModeFromSpecifier(extend.nodeSpecifier))
    .filter((mode) => EARLY_WIN_MODE_KEYS.includes(mode))

  const derivedModes = getSupportedEarlyWinModes({
    sportId: fixture?.sportID || fixture?.sportId,
    marketId: normalizedBaseMarketId,
    derivedMarketIds
  })

  return [...new Set([...derivedModes, ...extensionModes])]
}

export const getDerivedMarketIdForMode = (baseMarketId, mode, supportedDerivedMarketIds = []) => {
  const normalizedMode = normalizeEarlyWinMode(mode)
  if (normalizedMode === 'base') {
    return Number(baseMarketId || 0)
  }

  const normalizedDerivedMarketIds = normalizeDerivedMarketIds(supportedDerivedMarketIds)
  if (normalizedDerivedMarketIds.includes(X_UP_FEATURE_MARKET_ID)) {
    return X_UP_FEATURE_MARKET_ID
  }

  const explicitMatch = normalizedDerivedMarketIds.find(
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
  const baseOutcomeSupported = isSupportedDerivedOutcome({
    baseMarketId,
    mode: '1up',
    outcomeId,
    outcomeName,
    displayName,
    specifier
  })

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
    displayName,
    specifier
  }

  const xupOutcomes = [
    ...flatOutcomes.filter(
      (outcome) => Number(outcome.marketID ?? outcome.marketId ?? outcome.market_id ?? 0) === X_UP_FEATURE_MARKET_ID
    ),
    ...markets.flatMap((market) =>
      getFixtureMarketId(market) === X_UP_FEATURE_MARKET_ID && Array.isArray(market.outcomes)
        ? market.outcomes.map((outcome) => ({
            ...outcome,
            marketID: getFixtureMarketId(market),
            marketName: getFixtureMarketName(market),
            specifier: getFixtureMarketSpecifier(market) || getFixtureOutcomeSpecifier(outcome)
          }))
        : []
    )
  ].filter(
    (outcome, index, self) =>
      index ===
      self.findIndex(
        (item) =>
          getFixtureOutcomeId(item) === getFixtureOutcomeId(outcome) &&
          String(getFixtureOutcomeSpecifier(item) || '') === String(getFixtureOutcomeSpecifier(outcome) || '')
      )
  )

  if (Number(baseMarketId || 0) === EARLY_WIN_BASE_MARKET_ID && xupOutcomes.length) {
    const xupMarket =
      markets.find((item) => getFixtureMarketId(item) === X_UP_FEATURE_MARKET_ID) || {
        marketID: X_UP_FEATURE_MARKET_ID,
        marketName: formatEarlyWinMarketName(baseMarketName, 'base'),
        outcomes: xupOutcomes
      }

    EARLY_WIN_MODE_KEYS.forEach((mode) => {
      const modeSpecifier = `xup=${mode === '1up' ? 1 : 2}`
      const xupOutcome =
        xupOutcomes.find(
          (outcome) =>
            getEarlyWinModeFromSpecifier(getFixtureOutcomeSpecifier(outcome)) === mode &&
            String(getFixtureOutcomeId(outcome)) === String(outcomeId || '')
        ) ||
        xupOutcomes.find(
          (outcome) =>
            getEarlyWinModeFromSpecifier(getFixtureOutcomeSpecifier(outcome)) === mode
        )

      if (!xupOutcome) return

      const normalizedOdds = Number(xupOutcome.odds)
      if (!Number.isFinite(normalizedOdds) || normalizedOdds <= 0) return
      if (mode !== 'base' && !baseOutcomeSupported) return

      quotes[mode] = {
        marketId: X_UP_FEATURE_MARKET_ID,
        marketName: formatEarlyWinMarketName(baseMarketName, mode),
        specifier: modeSpecifier,
        idSpecifier: modeSpecifier,
        outcomeId: getFixtureOutcomeId(xupOutcome),
        outcomeName: getFixtureOutcomeName(xupOutcome),
        displayName: getFixtureOutcomeDisplayName(xupOutcome),
        odds: normalizedOdds,
        active: getFixtureOutcomeActive(xupOutcome),
        statusName: getLocalQuoteStatusName({
          market: xupMarket,
          outcome: xupOutcome,
          odds: normalizedOdds
        })
      }
    })
  }

  if (markets.length) {
    const sourceMarket =
      findFixtureMarket(markets, marketId || baseMarketId, specifier) ||
      findFixtureMarket(markets, baseMarketId, specifier)
    if (!sourceMarket) return {}

    const sourceIndex = findOutcomeIndex(sourceMarket, reference)

    candidateMarketIds.forEach((candidateMarketId) => {
      if (Number(candidateMarketId) === X_UP_FEATURE_MARKET_ID) return

      const market = findFixtureMarket(markets, candidateMarketId, specifier)
      if (!market) return

      const outcome = findOutcomeByReference(
        market,
        {
          ...reference,
          sourceIndex
        },
        {
          allowSpecifierOnlyMatch: false,
          allowSourceIndexMatch: false
        }
      )
      if (!outcome) return

      const normalizedOdds = Number(outcome.odds)
      const marketSpecifier = getFixtureMarketSpecifier(market)
      const mode =
        Number(candidateMarketId) === Number(baseMarketId)
          ? 'base'
          : Number(candidateMarketId) === X_UP_FEATURE_MARKET_ID
            ? getEarlyWinModeFromSpecifier(
                marketSpecifier || getFixtureOutcomeSpecifier(outcome)
              )
            : getEarlyWinModeFromMarketId(candidateMarketId)
      if (mode !== 'base' && !baseOutcomeSupported) return

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
    if (Number(candidateMarketId) === X_UP_FEATURE_MARKET_ID) return

    const outcomesForMarket = findFixtureOutcomes(flatOutcomes, candidateMarketId, specifier)
    if (!outcomesForMarket.length) return

    const outcome = findOutcomeByReference(
      { outcomes: outcomesForMarket },
      {
        ...reference,
        sourceIndex
      },
      {
        allowSpecifierOnlyMatch: false,
        allowSourceIndexMatch: false
      }
    )
    if (!outcome) return

    const normalizedOdds = Number(outcome.odds)
    const mode =
      Number(candidateMarketId) === Number(baseMarketId)
        ? 'base'
        : Number(candidateMarketId) === X_UP_FEATURE_MARKET_ID
          ? getEarlyWinModeFromSpecifier(getFixtureOutcomeSpecifier(outcomesForMarket[0]))
          : getEarlyWinModeFromMarketId(candidateMarketId)
    if (mode !== 'base' && !baseOutcomeSupported) return

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
  derivedMarketIds,
  specifier = ''
}) => {
  const normalizedMarketId = Number(marketId || 0)
  const derivedMode =
    normalizedMarketId === X_UP_FEATURE_MARKET_ID
      ? 'base'
      : getEarlyWinModeFromMarketId(normalizedMarketId)
  const inferredModeFromSpecifier = getEarlyWinModeFromSpecifier(specifier)
  const inferredMode =
    EARLY_WIN_MODE_KEYS.includes(derivedMode)
      ? derivedMode
      : inferredModeFromSpecifier !== 'base'
        ? inferredModeFromSpecifier
        : inferEarlyWinModeFromMarketName(marketName)
  const currentMode = EARLY_WIN_MODE_KEYS.includes(inferredMode) ? inferredMode : 'base'
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
    supportsEarlyWin: isFootballSport(sportId) && supportedEarlyWinModes.length > 0,
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
  const baseOutcomeSupported = isSupportedDerivedOutcome({
    baseMarketId,
    mode: 'earlygoal',
    outcomeId,
    outcomeName,
    displayName,
    specifier
  })

  const normalizedCurrentMarketId = Number(marketId || 0)
  const isCurrentEarlyGoal = normalizedCurrentMarketId === EARLY_GOAL_DERIVED_MARKET_ID
  const resolvedBaseMarketId = isCurrentEarlyGoal
    ? Number(baseMarketId || getBaseMarketIdFromMarketId(normalizedCurrentMarketId) || 0)
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
    displayName,
    specifier
  }
  const baseSpecifier = getEarlyGoalBaseSpecifier(specifier)

  if (markets.length) {
    const sourceMarket =
      findFixtureMarket(markets, normalizedCurrentMarketId || resolvedBaseMarketId, specifier) ||
      findFixtureMarket(markets, resolvedBaseMarketId, specifier)
    if (!sourceMarket) return {}

    const sourceIndex = findOutcomeIndex(sourceMarket, reference)

    candidateMarketIds.forEach((candidateMarketId) => {
      const mode = Number(candidateMarketId) === resolvedBaseMarketId ? 'base' : 'earlygoal'
      const candidateSpecifier = mode === 'base' ? baseSpecifier : specifier
      const market = findFixtureMarket(markets, candidateMarketId, candidateSpecifier)
      if (!market) return

      const outcome = findOutcomeByReference(
        market,
        {
          ...reference,
          specifier: candidateSpecifier,
          idSpecifier: candidateSpecifier,
          sourceIndex
        },
        {
          allowSpecifierOnlyMatch: false,
          allowSourceIndexMatch: false
        }
      )
      if (!outcome) return

      const normalizedOdds = Number(outcome.odds)
      if (mode !== 'base' && !baseOutcomeSupported) return

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
    const mode = Number(candidateMarketId) === resolvedBaseMarketId ? 'base' : 'earlygoal'
    const candidateSpecifier = mode === 'base' ? baseSpecifier : specifier
    const outcomesForMarket = findFixtureOutcomes(flatOutcomes, candidateMarketId, candidateSpecifier)
    if (!outcomesForMarket.length) return

    const outcome = findOutcomeByReference(
      { outcomes: outcomesForMarket },
      {
        ...reference,
        specifier: candidateSpecifier,
        idSpecifier: candidateSpecifier,
        sourceIndex
      },
      {
        allowSpecifierOnlyMatch: false,
        allowSourceIndexMatch: false
      }
    )
    if (!outcome) return

    const normalizedOdds = Number(outcome.odds)
    if (mode !== 'base' && !baseOutcomeSupported) return

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
    ? Number(baseMarketId || getBaseMarketIdFromMarketId(normalizedMarketId) || 0)
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
