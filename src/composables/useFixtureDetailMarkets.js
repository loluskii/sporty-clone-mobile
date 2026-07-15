import { computed, ref, watch } from 'vue'
import { chunks, X_UP_FEATURE_MARKET_ID, getFixtureDerivedMarketIds } from '@/helpers'

const DEFAULT_DERIVED_MARKET_IDS = [1601, 60180]

const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const normalizeRowLabel = (value) => {
  const text = String(value || '').trim()
  if (!text) return ''
  if (/^[0-9x]+$/i.test(text)) return text.toUpperCase()
  return text.replace(/\b\w/g, (char) => char.toUpperCase())
}

export function useFixtureDetailMarkets(eventMarkets, marketGroups, fixtureDetail = null) {
  // Shared active market-group tab state for both prematch and live detail pages.
  const selectedGroupId = ref(null)
  const activeSectionByGroup = ref({})

  const derivedMarketIds = computed(() => {
    const directDerivedIds = getFixtureDerivedMarketIds(fixtureDetail?.value || {})
    const marketExtendIds = Array.isArray(eventMarkets.value)
      ? [...new Set(
          eventMarkets.value
            .flatMap((market = {}) =>
              Array.isArray(market.marketExtendVOS) ? market.marketExtendVOS : []
            )
            .map((extend = {}) => Number(extend.nodeMarketId || extend.node_market_id || 0))
            .filter((id) => Number.isFinite(id) && id > 0)
        )]
      : []

    const ids = [...new Set([...directDerivedIds, ...marketExtendIds])]
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

  function getNumericSortValue(value) {
    const match = String(value || '').match(/-?\d+(\.\d+)?/)
    return match ? Number(match[0]) : Number.NaN
  }

  function getTitleInfo(title) {
    if (!title) return null
    const parts = title.split(',').map((part) => part.trim()).filter(Boolean)
    if (parts.length < 2) return null
    return { specifierLabel: parts[0], columns: parts.slice(1) }
  }

  function findOutcomeForColumn(outcomes, col) {
    const colLower = String(col || '').toLowerCase().trim()
    return (
      outcomes.find((outcome) => {
        const displayName = String(outcome.displayName || '').trim()
        const dn = displayName.toLowerCase()
        if (colLower === 'home') return /^1[\s(]|^1$/.test(displayName)
        if (colLower === 'away') return /^2[\s(]|^2$/.test(displayName)
        if (colLower === 'draw') return /^x[\s(]|^x$/i.test(displayName)
        return dn.startsWith(colLower)
      }) ?? null
    )
  }

  function getHcpFromDisplayName(displayName) {
    const match = String(displayName || '').match(/\(([^)]+)\)/)
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

  function isXupMarketGroup(marketGroup) {
    return Number(marketGroup?.marketID || 0) === X_UP_FEATURE_MARKET_ID
  }

  function getXupSortValue(marketGroup) {
    const specifier = String(marketGroup?.specifier || '')
    const specifierMatch = specifier.match(/xup\s*=\s*(\d+)/i)
    if (specifierMatch) {
      return Number(specifierMatch[1])
    }

    const marketName = String(marketGroup?.marketName || '')
    const nameMatch = marketName.match(/\b([123])\s*up\b/i)
    return nameMatch ? Number(nameMatch[1]) : Number.MAX_SAFE_INTEGER
  }

  function getGroupIdentity(marketGroup) {
    const cleanedName = cleanMarketName(marketGroup.marketName, marketGroup.specifier)
    if (isXupMarketGroup(marketGroup)) {
      return `${marketGroup.marketID}|${cleanedName}|${marketGroup.specifier || ''}`
    }
    return `${marketGroup.marketID}|${cleanedName}`
  }

  function createCell(market, outcome) {
    return {
      key: `${market.marketID}|${market.specifier || ''}|${outcome.outcomeID}`,
      market,
      outcome
    }
  }

  function buildFlatRows(outcomes, market) {
    return getChunks(outcomes).map((chunk, index) => ({
      key: `${market.marketID}|${market.specifier || ''}|row-${index}`,
      cells: sortByKey(chunk, 'outcomeID').map((outcome) => createCell(market, outcome))
    }))
  }

  function buildFlatLayout(marketGroup) {
    const sections =
      marketGroup.markets.length > 1 && marketGroup.specifier !== ''
        ? marketGroup.markets.map((market) => ({
            key: market.specifier || `${market.marketID}`,
            label: getSpecifierDisplayValue(market.specifier),
            rows: buildFlatRows(market.outcomes, market)
          }))
        : [
            {
              key: `${marketGroup.marketID}|flat`,
              label: null,
              rows: buildFlatRows(marketGroup.markets[0].outcomes, marketGroup.markets[0])
            }
          ]

    return {
      type: 'flat',
      sections: sortSections(sections)
    }
  }

  function stripConnectorArtifacts(value) {
    return String(value || '')
      .replace(/\s+/g, ' ')
      .replace(/^\s*(and|or|\/|,|-)\s*/i, '')
      .replace(/\s*(and|or|\/|,|-)\s*$/i, '')
      .replace(/\s{2,}/g, ' ')
      .trim()
  }

  function getSpecifierType(specifier) {
    return String(specifier || '').split('|')[0].split('=')[0].trim().toLowerCase()
  }

  function shouldAppendSpecifierToColumn(specifier) {
    return ['total', 'hcp'].includes(getSpecifierType(specifier))
  }

  function stripSpecifierValue(value, market) {
    const specifierValue = getSpecifierDisplayValue(market?.specifier)
    if (!specifierValue) return String(value || '').trim()

    return String(value || '')
      .replace(new RegExp(`\\b${escapeRegExp(specifierValue)}\\b`, 'gi'), '')
      .replace(/\s+/g, ' ')
      .trim()
  }

  function normalizeAxisValue(value, market) {
    return stripConnectorArtifacts(stripSpecifierValue(value, market)).toLowerCase()
  }

  function splitCompoundOutcome(outcome) {
    const displayName = String(outcome.displayName || outcome.outcomeName || '').trim()
    if (!displayName || !/\sand\s/i.test(displayName)) return null

    const parts = displayName.split(/\sand\s/i).map((part) => stripConnectorArtifacts(part))
    if (parts.length !== 2 || parts.some((part) => !part)) return null

    return {
      left: normalizeRowLabel(parts[0]),
      right: normalizeRowLabel(parts[1])
    }
  }

  function getOrderedUnique(values = []) {
    return values.filter((value, index) => values.indexOf(value) === index)
  }

  function getTitleTokens(titleInfo, market) {
    if (!titleInfo) return []
    return [titleInfo.specifierLabel, ...titleInfo.columns]
      .map((token) => normalizeAxisValue(token, market))
      .filter((token) => token && !['goals', 'goal'].includes(token))
  }

  function scoreAxisAgainstTitle(axisLabels, titleTokens, market) {
    return axisLabels.reduce((score, label) => {
      const normalizedLabel = normalizeAxisValue(label, market)
      return score + (titleTokens.includes(normalizedLabel) ? 1 : 0)
    }, 0)
  }

  function getDisplayColumns(columns, market) {
    if (!shouldAppendSpecifierToColumn(market?.specifier)) {
      return columns
    }

    const specifierValue = getSpecifierDisplayValue(market.specifier)
    return columns.map((column) => `${column} ${specifierValue}`.trim())
  }

  function getColumnPatterns(column, market) {
    const specifierValue = getSpecifierDisplayValue(market.specifier)
    const normalizedColumn = String(column || '').trim()
    const patterns = []

    if (specifierValue) {
      patterns.push(`${normalizedColumn} ${specifierValue}`)
      patterns.push(`${normalizedColumn.toLowerCase()} ${specifierValue}`)
    }

    patterns.push(normalizedColumn)
    return [...new Set(patterns.filter(Boolean))]
  }

  function extractCompoundCell(outcome, columns, market) {
    const displayName = String(outcome.displayName || outcome.outcomeName || '').trim()
    if (!displayName || !/\sand\s/i.test(displayName)) return null

    const matches = []
    columns.forEach((column) => {
      getColumnPatterns(column, market).forEach((pattern) => {
        const regex = new RegExp(`(^|\\s|\\()${escapeRegExp(pattern)}(?=\\s|\\)|$)`, 'i')
        if (regex.test(displayName)) {
          matches.push({ column, pattern, regex })
        }
      })
    })

    if (!matches.length) return null

    const chosenMatch = matches.sort((left, right) => right.pattern.length - left.pattern.length)[0]
    const rowLabel = normalizeRowLabel(
      stripConnectorArtifacts(displayName.replace(chosenMatch.regex, ' '))
    )

    if (!rowLabel) return null

    return {
      column: chosenMatch.column,
      rowLabel
    }
  }

  function buildCompoundMatrixLayout(marketGroup) {
    const titleInfo = getTitleInfo(marketGroup.markets[0]?.title)
    const sections = marketGroup.markets.map((market) => {
      const parsedOutcomes = market.outcomes.map((outcome) => ({
        market,
        outcome,
        extracted: splitCompoundOutcome(outcome)
      }))

      const matrixCandidates = parsedOutcomes.filter((item) => item.extracted)
      const leftovers = parsedOutcomes.filter((item) => !item.extracted).map((item) => item.outcome)

      if (matrixCandidates.length < 4) {
        return null
      }

      const leftLabels = getOrderedUnique(matrixCandidates.map((item) => item.extracted.left))
      const rightLabels = getOrderedUnique(matrixCandidates.map((item) => item.extracted.right))

      if (leftLabels.length < 2 || rightLabels.length < 2) {
        return null
      }

      const titleTokens = getTitleTokens(titleInfo, market)
      const leftScore = scoreAxisAgainstTitle(leftLabels, titleTokens, market)
      const rightScore = scoreAxisAgainstTitle(rightLabels, titleTokens, market)

      let rowLabels = leftLabels
      let columns = rightLabels

      if (leftScore > rightScore) {
        rowLabels = rightLabels
        columns = leftLabels
      } else if (leftScore === rightScore) {
        if (leftLabels.length < rightLabels.length) {
          rowLabels = rightLabels
          columns = leftLabels
        }
      }

      const totalSlots = rowLabels.length * columns.length
      if (totalSlots < 4 || matrixCandidates.length / totalSlots < 0.5) {
        return null
      }

      return {
        key: market.specifier || `${market.marketID}`,
        label: getSpecifierDisplayValue(market.specifier),
        columns,
        displayColumns: getDisplayColumns(columns, market),
        totalCols: columns.length + 1,
        rows: rowLabels.map((rowLabel) => ({
          key: `${market.marketID}|${market.specifier || ''}|${rowLabel}`,
          label: rowLabel,
          cells: columns.map((column) => {
            const match = matrixCandidates.find(
              (item) =>
                ((item.extracted.left === rowLabel && item.extracted.right === column) ||
                  (item.extracted.right === rowLabel && item.extracted.left === column))
            )
            return match ? createCell(market, match.outcome) : null
          })
        })),
        leftoverRows: leftovers.length ? buildFlatRows(leftovers, market) : []
      }
    })

    if (sections.some((section) => !section)) {
      return null
    }

    return {
      type: 'matrix',
      sections: sortSections(sections)
    }
  }

  function buildTitleMatrixLayout(marketGroup) {
    if (marketGroup.markets.length < 2) return null

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

    const columns = candidateCols.filter((col) => findOutcomeForColumn(sampleOutcomes, col) !== null)
    if (columns.length < 2) return null

    return {
      type: 'matrix',
      sections: [
        {
          key: `${marketGroup.marketID}|matrix`,
          label: null,
          columns,
          totalCols: columns.length + (specifierLabel !== null ? 1 : 0),
          rows: marketGroup.markets.map((market) => ({
            key: `${market.marketID}|${market.specifier || ''}`,
            label: specifierLabel !== null ? getRowLabel(market, specifierLabel) : null,
            cells: columns.map((column) => {
              const outcome = findOutcomeForColumn(market.outcomes, column)
              return outcome ? createCell(market, outcome) : null
            })
          }))
        }
      ]
    }
  }

  function buildMarketLayout(marketGroup) {
    if (!marketGroup.markets?.length) {
      return {
        type: 'flat',
        sections: []
      }
    }

    const compoundLayout = buildCompoundMatrixLayout(marketGroup)
    if (compoundLayout) {
      return compoundLayout
    }

    const titleMatrixLayout = buildTitleMatrixLayout(marketGroup)
    if (titleMatrixLayout) {
      return titleMatrixLayout
    }

    return buildFlatLayout(marketGroup)
  }

  function groupByMarketID(data) {
    const groupedMarkets = {}
    data.forEach((marketGroup) => {
      const { marketID, marketName, specifier } = marketGroup
      const key = getGroupIdentity({ marketID, marketName, specifier })
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

    return Object.values(groupedMarkets).map((group) => ({
      ...group,
      layout: buildMarketLayout(group)
    }))
  }

  function sortSections(sections = []) {
    return [...sections].sort((left, right) => {
      const leftValue = getNumericSortValue(left.label)
      const rightValue = getNumericSortValue(right.label)

      if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
        return leftValue - rightValue
      }

      if (left.label == null && right.label != null) return -1
      if (left.label != null && right.label == null) return 1
      return String(left.label || '').localeCompare(String(right.label || ''))
    })
  }

  function prioritizeDerivedMarkets(groups, ids = []) {
    if (!Array.isArray(groups) || groups.length < 3 || !Array.isArray(ids) || ids.length === 0) {
      return groups
    }

    const derivedSet = new Set(ids.map(Number))
    const baseGroup = groups.find((group) => !derivedSet.has(Number(group.marketID))) || groups[0]
    const xupGroups = []
    const derivedGroups = []
    const remainingGroups = []

    groups.forEach((group, index) => {
      if (group === baseGroup) return
      if (derivedSet.has(Number(group.marketID))) {
        const taggedGroup = { ...group, __groupIndex: index }
        if (isXupMarketGroup(group)) {
          xupGroups.push(taggedGroup)
        } else {
          derivedGroups.push(taggedGroup)
        }
      } else {
        remainingGroups.push({ ...group, __groupIndex: index })
      }
    })

    const orderedXupGroups = xupGroups
      .slice()
      .sort((left, right) => getXupSortValue(left) - getXupSortValue(right) || left.__groupIndex - right.__groupIndex)

    const orderedDerivedGroups = ids
      .filter((id) => Number(id) !== Number(X_UP_FEATURE_MARKET_ID))
      .flatMap((id) =>
        derivedGroups
          .filter((group) => Number(group.marketID) === Number(id))
          .sort((left, right) => left.__groupIndex - right.__groupIndex)
      )

    return [
      baseGroup,
      ...orderedXupGroups.map(({ __groupIndex, ...group }) => group),
      ...orderedDerivedGroups.map(({ __groupIndex, ...group }) => group),
      ...remainingGroups
        .sort((left, right) => left.__groupIndex - right.__groupIndex)
        .map(({ __groupIndex, ...group }) => group)
    ]
  }

  watch(
    () => fixtureDetail?.value?.matchID,
    () => {
      selectedGroupId.value = null
      activeSectionByGroup.value = {}
    }
  )

  function getGroupKey(marketGroup) {
    return getGroupIdentity(marketGroup)
  }

  function getSectionOptions(marketGroup) {
    return marketGroup?.layout?.sections || []
  }

  function getActiveSection(marketGroup) {
    const options = getSectionOptions(marketGroup)
    if (!options.length) return null

    const groupKey = getGroupKey(marketGroup)
    const selectedKey = activeSectionByGroup.value[groupKey]
    return options.find((section) => section.key === selectedKey) || options[0]
  }

  function setActiveSection(marketGroup, sectionKey) {
    const groupKey = getGroupKey(marketGroup)
    activeSectionByGroup.value = {
      ...activeSectionByGroup.value,
      [groupKey]: sectionKey
    }
  }

  function hasSectionTabs(marketGroup) {
    return getSectionOptions(marketGroup).length > 1
  }

  return {
    selectedGroupId,
    groupedMarketsByTab,
    filteredMarkets,
    displayGroupedMarkets,
    sortedMarketGroups,
    hasNoMarketsInSelectedGroup,
    sortByKey,
    getChunks,
    getMarketColumns: buildTitleMatrixLayout,
    findOutcomeForColumn,
    getRowLabel,
    colClass,
    cleanMarketName,
    getSpecifierDisplayValue,
    getActiveSection,
    setActiveSection,
    hasSectionTabs
  }
}
