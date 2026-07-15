const toNumber = (value, fallback = 0) => {
  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : fallback
}

const toOddsValue = (selection) => {
  if (selection && typeof selection === 'object') {
    return toNumber(selection.odds, 0)
  }

  return toNumber(selection, 0)
}

export const normalizeAccaBonusConfig = (config = {}) => {
  const tiers = Array.isArray(config?.bonus_tiers)
    ? config.bonus_tiers
        .map((tier) => ({
          legs: toNumber(tier?.legs, 0),
          percentage: toNumber(tier?.percentage, 0)
        }))
        .filter((tier) => tier.legs > 0 && tier.percentage > 0)
        .sort((left, right) => left.legs - right.legs)
    : []

  return {
    id: config?.id ?? null,
    enabled: Boolean(config?.is_active) && String(config?.status || 'active').toLowerCase() === 'active',
    minOddsPerLeg: toNumber(config?.min_odds_per_leg, 0),
    minTotalOdds: toNumber(config?.min_total_odds, 0),
    maxBonusAmount: toNumber(config?.max_bonus_amount, 0),
    tiers
  }
}

export const countAccaBonusQualifyingLegs = (selections = [], minOddsPerLeg = 0) => {
  return selections.reduce((count, selection) => {
    return toOddsValue(selection) >= minOddsPerLeg ? count + 1 : count
  }, 0)
}

export const getAccaBonusTier = (config = {}, qualifyingLegs = 0) => {
  const normalizedConfig = normalizeAccaBonusConfig(config)
  let resolvedTier = null

  normalizedConfig.tiers.forEach((tier) => {
    if (qualifyingLegs >= tier.legs) {
      resolvedTier = tier
    }
  })

  return resolvedTier
}

export const calculateAccaBonusPreview = ({
  selections = [],
  stake = 0,
  totalOdds = null,
  config = {}
} = {}) => {
  const normalizedConfig = normalizeAccaBonusConfig(config)
  const normalizedStake = Math.max(0, toNumber(stake, 0))
  const selectionOdds = Array.isArray(selections)
    ? selections.map((selection) => toOddsValue(selection)).filter((odds) => odds > 0)
    : []
  const resolvedTotalOdds =
    totalOdds !== null && totalOdds !== undefined
      ? toNumber(totalOdds, 0)
      : selectionOdds.length
        ? selectionOdds.reduce((product, odds) => product * odds, 1)
        : 0
  const qualifyingLegs = countAccaBonusQualifyingLegs(
    selectionOdds,
    normalizedConfig.minOddsPerLeg
  )
  const resolvedTier = getAccaBonusTier(normalizedConfig, qualifyingLegs)
  const bonusPercentage = toNumber(resolvedTier?.percentage, 0)
  const baseReturns = normalizedStake * resolvedTotalOdds
  const baseProfit = Math.max(0, baseReturns - normalizedStake)
  const qualifies =
    normalizedConfig.enabled &&
    normalizedStake > 0 &&
    resolvedTotalOdds >= normalizedConfig.minTotalOdds &&
    bonusPercentage > 0

  let bonusAmount = qualifies ? (baseProfit * bonusPercentage) / 100 : 0
  let bonusCapApplied = false

  if (normalizedConfig.maxBonusAmount > 0 && bonusAmount > normalizedConfig.maxBonusAmount) {
    bonusAmount = normalizedConfig.maxBonusAmount
    bonusCapApplied = true
  }

  const normalizedBonusAmount = Number(bonusAmount.toFixed(2))
  const potentialReturns = Number((baseReturns + normalizedBonusAmount).toFixed(2))

  return {
    enabled: normalizedConfig.enabled,
    qualifies,
    bonus_amount: normalizedBonusAmount,
    bonus_percentage: bonusPercentage,
    qualifying_legs: qualifyingLegs,
    total_odds: Number(resolvedTotalOdds.toFixed(2)),
    bonus_cap_applied: bonusCapApplied,
    config_id: normalizedConfig.id,
    potential_payout: potentialReturns,
    potential_returns: potentialReturns
  }
}
