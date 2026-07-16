const PLACEHOLDER_LABEL_MAP = {
  competitor1: '1',
  competitor2: '2',
  home: '1',
  away: '2',
  team1: '1',
  team2: '2',
  participant1: '1',
  participant2: '2'
}

const cleanWhitespace = (value = '') => String(value || '').replace(/\s{2,}/g, ' ').trim()

const getMarketExtendId = (extend = {}) =>
  Number(extend?.nodeMarketId || extend?.node_market_id || 0)

const parseSpecifierMap = (specifier = '') => {
  return String(specifier || '')
    .split('|')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((acc, part) => {
      const eqIndex = part.indexOf('=')
      if (eqIndex === -1) return acc

      const key = part.slice(0, eqIndex).trim().toLowerCase()
      const value = part.slice(eqIndex + 1).trim()
      if (key) {
        acc[key] = value
      }
      return acc
    }, {})
}

const normalizePlaceholders = (value = '', specifierMap = {}) => {
  let text = String(value || '')

  text = text.replace(
    /\{\$?(competitor1|competitor2|home|away|team1|team2|participant1|participant2)\}/gi,
    (_, token) => PLACEHOLDER_LABEL_MAP[token.toLowerCase()] || ''
  )

  text = text.replace(/\{total\}/gi, specifierMap.total ?? '')
  text = text.replace(/\{[+-]?hcp\}/gi, specifierMap.hcp ?? specifierMap.handicap ?? '')

  text = text.replace(/\{([a-z0-9_+-]+)\}/gi, (_, token) => {
    const normalizedToken = token.toLowerCase()
    if (normalizedToken === 'total') return specifierMap.total ?? ''
    if (normalizedToken === 'hcp' || normalizedToken === '+hcp' || normalizedToken === '-hcp') {
      return specifierMap.hcp ?? specifierMap.handicap ?? ''
    }
    return specifierMap[normalizedToken] ?? ''
  })

  text = text.replace(/\(\s*\)/g, '')
  text = text.replace(/\s+([,.;:!?])/g, '$1')
  return cleanWhitespace(text)
}

const normalizeMarketName = (name = '') => {
  const text = cleanWhitespace(String(name || ''))
  if (!text) return ''

  return cleanWhitespace(
    text
      .replace(/\b(home|away)\s+team\b/gi, (_, side) => side)
      .replace(/\s*[-–]?\s*(?:xup\s*=\s*)?(1|2|3)\s*up\s*$/i, ' - XUP')
      .replace(/\s*\(\s*incl\.\s*overtime\s*\)\s*$/i, ' (incl. overtime)')
      .replace(/\s*\(\s*incl\.\s*extra\s*time\s*\)\s*$/i, ' (incl. extra time)')
  )
}

export const normalizeFixtureMarket = (market = {}) => {
  const specifierMap = parseSpecifierMap(market.specifier || market.specifiers || '')
  const outcomes = Array.isArray(market.outcomes) ? market.outcomes : []

  return {
    ...market,
    marketName: normalizeMarketName(market.marketName ?? market.market_name ?? market.name ?? ''),
    outcomes: outcomes.map((outcome = {}) => {
      const outcomeName = outcome.outcomeName ?? outcome.outcome_name ?? outcome.displayName ?? ''
      const displayName = outcome.displayName ?? outcome.outcomeName ?? outcome.outcome_name ?? ''
      const normalizedOutcomeName = normalizePlaceholders(outcomeName, specifierMap)
      const normalizedDisplayName = normalizePlaceholders(displayName, specifierMap)

      return {
        ...outcome,
        outcomeName: normalizedOutcomeName || cleanWhitespace(String(outcomeName || '')),
        displayName: normalizedDisplayName || cleanWhitespace(String(displayName || ''))
      }
    })
  }
}

export const normalizeFixtureMarkets = (markets = []) => {
  const seenMarketKeys = new Set()
  const normalizedMarkets = []

  ;(Array.isArray(markets) ? markets : []).forEach((market, index) => {
    const marketId = Number(market?.marketID ?? market?.marketId ?? market?.market_id ?? 0)
    if (!Number.isFinite(marketId) || marketId <= 0) return
    const marketSpecifier = String(market?.specifier ?? market?.specifiers ?? '')
    const marketKey = `${marketId}|${marketSpecifier}`

    const normalizedMarket = {
      ...normalizeFixtureMarket(market),
      __orderIndex: index
    }

    if (seenMarketKeys.has(marketKey)) {
      const existing = normalizedMarkets.find(
        (item) =>
          Number(item.marketID ?? item.marketId ?? item.market_id ?? 0) === marketId &&
          String(item.specifier ?? item.specifiers ?? '') === marketSpecifier
      )

      if (existing) {
        const existingExtends = Array.isArray(existing.marketExtendVOS) ? existing.marketExtendVOS : []
        const nextExtends = Array.isArray(normalizedMarket.marketExtendVOS)
          ? normalizedMarket.marketExtendVOS
          : []
        const mergedExtends = [...existingExtends, ...nextExtends].filter((extend, extendIndex, self) => {
          const extendId = getMarketExtendId(extend)
          return extendId > 0
            ? self.findIndex((item) => getMarketExtendId(item) === extendId) === extendIndex
            : self.findIndex((item) => JSON.stringify(item) === JSON.stringify(extend)) === extendIndex
        })

        existing.marketExtendVOS = mergedExtends
        if (!Array.isArray(existing.outcomes) || existing.outcomes.length === 0) {
          existing.outcomes = Array.isArray(normalizedMarket.outcomes) ? normalizedMarket.outcomes : []
        }
        if (!existing.specifier && normalizedMarket.specifier) {
          existing.specifier = normalizedMarket.specifier
        }
        if (!existing.marketName && normalizedMarket.marketName) {
          existing.marketName = normalizedMarket.marketName
        }
      }

      return
    }

    seenMarketKeys.add(marketKey)
    normalizedMarkets.push(normalizedMarket)
  })

  return normalizedMarkets
    .sort((left, right) => left.__orderIndex - right.__orderIndex)
    .map(({ __orderIndex, ...market }) => market)
}
