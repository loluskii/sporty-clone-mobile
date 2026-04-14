import { computed } from 'vue'
import { useCouponStore, useUtilsStore } from '@/stores'
import { formatNumber } from '@/helpers'

export function useBetslipCalculations({ betSlipType, betType }) {
  const couponStore = useCouponStore()
  const { SportsbookGlobalVariable } = useUtilsStore()

  const selectionsLength = computed(() => couponStore.coupon.selections.length)

  const maxStake = computed(() => {
    const raw = betSlipType.value === 'Combo'
      ? SportsbookGlobalVariable.comboMaxStake
      : SportsbookGlobalVariable.singleMaxStake
    return Number(raw || 0)
  })

  const updateStake = (stake) => {
    if (stake === '') {
      // Clearing should set stake to 0, not snap back to a minimum.
      couponStore.coupon.stake = 0
      return couponStore.updateWinnings({
        stake: 0,
        id: 'all'
      })
    }
    // Do not clamp to the minimum while typing; the submit disabled state handles min validation.
    const parsed = Number(stake)
    let normalized = Number.isFinite(parsed) ? parsed : 0
    const maxValue = Number(maxStake.value || 0) > 0 ? Number(maxStake.value) : null
    if (!Number.isFinite(normalized)) {
      normalized = 0
    }
    if (maxValue !== null && normalized > maxValue) {
      normalized = maxValue
    }
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
    const isMultipleBet = betSlipType.value === 'Multiple' && betType.value === 'Multiple'
    const isSystemBet = betSlipType.value === 'Combo'
    const isSplitMultiple = betSlipType.value === 'Multiple' && betType.value === 'Split'

    if (taxEnabled.value) {
      if (isSplitMultiple) {
        // Split should show a min~max range with the same tax logic applied to both ends.
        const minOddValue = Number(couponStore.coupon.minOdds || 0)
        const maxOddValue = Number(couponStore.coupon.maxOdds || 0)
        const stakeBase = totalStakeAmount.value || 0
        const stakeNet =
          exciseTax.value > 0 ? parseFloat(stakeAfterTax.value || 0) : stakeBase
        const wthRate = parseFloat(SportsbookGlobalVariable.wthTax || 0) / 100
        const minGross = stakeNet * (Number.isFinite(minOddValue) ? minOddValue : 0)
        const maxGross = stakeNet * (Number.isFinite(maxOddValue) ? maxOddValue : 0)
        const minWth = (minGross - stakeBase) * wthRate
        const maxWth = (maxGross - stakeBase) * wthRate
        const minNet = Math.max(0, minGross - minWth)
        const maxNet = Math.max(0, maxGross - maxWth)
        return `${formatNumber(minNet)} ~ ${formatNumber(maxNet)}`
      }
      let finalPayout = stake * totalOdd

      if (exciseTax.value > 0) {
        finalPayout = parseFloat(stakeAfterTax.value || 0) * totalOdd
      }

      if (wth > 0) {
        finalPayout = finalPayout - parseFloat(wthTax.value || 0)
      }

      const taxedWin = formatNumber((finalPayout + parseFloat(maxBonus.value || 0)).toFixed(2))
      if (isSingleMulti.value || isSystemBet) {
        return `${formatNumber(parseFloat(minWin.value || 0))} ~ ${taxedWin}`
      }
      return taxedWin
    }

    if (isMultipleBet || isSingleBet) {
      // Multiple uses max win only.
      return formatNumber(parseFloat(maxWin.value || 0))
    }
    if (isSingleMulti.value || isSystemBet) {
      // Combo and single show a min~max range.
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
