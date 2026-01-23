import { computed } from 'vue'
import { useCouponStore, useUtilsStore } from '@/stores'
import { formatNumber } from '@/helpers'

export function useBetslipCalculations({ betSlipType, betType }) {
  const couponStore = useCouponStore()
  const { SportsbookGlobalVariable } = useUtilsStore()

  const selectionsLength = computed(() => couponStore.coupon.selections.length)

  const minStake = computed(() => {
    const raw = betSlipType.value === 'Combo'
      ? SportsbookGlobalVariable.comboMinStake
      : SportsbookGlobalVariable.singleMinStake
    return Number(raw || 0)
  })

  const maxStake = computed(() => {
    const raw = betSlipType.value === 'Combo'
      ? SportsbookGlobalVariable.comboMaxStake
      : SportsbookGlobalVariable.singleMaxStake
    return Number(raw || 0)
  })

  const updateStake = (stake) => {
    const parsed = Number(stake)
    const normalized = Number.isFinite(parsed)
      ? Math.min(maxStake.value || parsed, Math.max(minStake.value, parsed))
      : minStake.value
    couponStore.coupon.stake = normalized
    return couponStore.updateWinnings({
      stake: normalized,
      id: 'all'
    })
  }

  const isSingleMulti = computed(
    () => betSlipType.value === 'Single' && selectionsLength.value > 1
  )

  const stakeDisplay = computed(() => {
    return isSingleMulti.value ? couponStore.coupon.stake : couponStore.coupon.totalStake
  })

  const totalStakeAmount = computed(() => Number(couponStore.coupon.totalStake || 0))

  const totalStakeDisplay = computed(() => {
    return couponStore.coupon.totalStake === '' ? 0.0 : formatNumber(couponStore.coupon.totalStake)
  })

  const totalStake = computed(() => {
    return couponStore.coupon.totalStake === '' ? 0.0 : formatNumber(couponStore.coupon.totalStake)
  })

  const taxEnabled = computed(() => SportsbookGlobalVariable.taxEnabled === '1')
  const exciseTax = computed(() => parseFloat(SportsbookGlobalVariable.exciseTax || 0))

  const stakeAfterTax = computed(() => {
    const excise = totalStakeAmount.value * (exciseTax.value / 100)
    return totalStakeAmount.value - excise
  })

  const wthTax = computed(() => {
    const wth = parseFloat(SportsbookGlobalVariable.wthTax || 0) / 100
    return (stakeAfterTax.value * couponStore.coupon.totalOdds - totalStakeAmount.value) * wth
  })

  const maxBonus = computed(() => couponStore.coupon.maxBonus)
  const minWin = computed(() => couponStore.coupon.minWin)
  const maxWin = computed(() => couponStore.coupon.maxWin)

  const totalOdds = computed(() => formatNumber(couponStore.coupon.totalOdds))
  const minOdds = computed(() => formatNumber(couponStore.coupon.minOdds || 0))
  const maxOdds = computed(() => formatNumber(couponStore.coupon.maxOdds || 0))
  const showTotalOdds = computed(() => betType.value === 'Multiple' || betType.value === 'Split')
  const totalOddsDisplay = computed(() => {
    if (betType.value === 'Split') {
      return `${minOdds.value} ~ ${maxOdds.value}`
    }
    return totalOdds.value
  })

  const potentialWin = computed(() => {
    const stake = totalStakeAmount.value || 0
    const totalOdd = parseFloat(couponStore.coupon.totalOdds) || 0
    const wth = parseFloat(SportsbookGlobalVariable.wthTax || 0)
    const isSingleBet = betSlipType.value === 'Single' && selectionsLength.value === 1
    const isMultipleBet = betSlipType.value === 'Multiple'
    const isSystemBet = betSlipType.value === 'Combo'
    const isSplitMultiple = betSlipType.value === 'Multiple' && betType.value === 'Split'

    if (taxEnabled.value) {
      let finalPayout = stake * totalOdd

      if (exciseTax.value > 0) {
        finalPayout = parseFloat(stakeAfterTax.value || 0) * totalOdd
      }

      if (wth > 0) {
        finalPayout = finalPayout - parseFloat(wthTax.value || 0)
      }

      const taxedWin = formatNumber((finalPayout + parseFloat(maxBonus.value || 0)).toFixed(2))
      if (isSingleMulti.value || isSystemBet || isSplitMultiple) {
        return `${formatNumber(parseFloat(minWin.value || 0))} ~ ${taxedWin}`
      }
      return taxedWin
    }

    if (isMultipleBet || isSingleBet) {
      return formatNumber(parseFloat(maxWin.value || 0))
    }
    if (isSingleMulti.value || isSystemBet || isSplitMultiple) {
      return `${formatNumber(parseFloat(minWin.value || 0))} ~ ${formatNumber(
        parseFloat(maxWin.value || 0)
      )}`
    }
    return formatNumber(parseFloat(maxWin.value || 0))
  })

  return {
    selectionsLength,
    isSingleMulti,
    stakeDisplay,
    totalStakeAmount,
    totalStakeDisplay,
    totalStake,
    taxEnabled,
    exciseTax,
    stakeAfterTax,
    wthTax,
    showTotalOdds,
    totalOddsDisplay,
    maxBonus,
    potentialWin,
    updateStake
  }
}
