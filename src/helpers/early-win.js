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
  '2up': '2UP'
}
export const EARLY_WIN_DEFAULT_MODE = '2up'
export const EARLY_WIN_FOOTBALL_SPORT_ID = 1

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
  return [safeBaseName, EARLY_WIN_MODE_LABELS[mode]].filter(Boolean).join(' ')
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
