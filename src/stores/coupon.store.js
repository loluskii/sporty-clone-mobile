import { defineStore } from 'pinia'
// import _ from 'lodash'
import { useUsersStore } from '@/stores'
import emitter from '../plugins/emitter'
import CouponCalculation from '@/helpers/coupon-calculation.js'
import {
  buildEarlyGoalSelectionState,
  buildEarlyWinSelectionState,
  calculateWinnings,
  groupSelections,
  groupTournament,
  calculateTotalOdds,
  checkBetType,
  checkIfHasLive,
  getDataFromPayload,
  getDerivedMarketIdForMode,
  EARLY_WIN_DEFAULT_MODE,
  EARLY_GOAL_BASE_MARKET_ID,
  EARLY_GOAL_DERIVED_MARKET_ID,
  formatEarlyGoalMarketName,
  formatEarlyWinMarketName,
  calculateBonus,
  getSplitProps,
  placeBet2,
  bookBet2,
  normalizeAccaBonusConfig,
  previewAccaBonus,
  previewCutOne,
  previewFlex,
  CLIENT_ID,
  validateBetslipSelections,
  formatNumber,
  buildCouponSelectionPayload,
  createID
} from '@/helpers'
import { useMqttService } from '@/composables/useMqtt'

const couponCalculation = new CouponCalculation()
const WTH_PERC = import.meta.env.VITE_WTH_PERC
const { subscribe } = useMqttService()

// Shared payload shape for all preview endpoints — server derives odds/eligibility
// from these identifiers, so clients only need to send selection coordinates.
const buildPreviewSelection = (selection = {}) => ({
  marketId: Number(selection.marketId || selection.market_id || 0),
  matchId: selection.matchId || selection.match_id,
  outcomeId: String(
    selection.outcomeId || selection.outcomeID || selection.odd_id || ''
  ),
  specifier: String(selection.specifier || selection.specifiers || '')
})

const getSpecifierSegmentValue = (specifier = '', key = '') => {
  const normalizedKey = String(key || '').trim().toLowerCase()
  if (!normalizedKey) return ''

  const segment = String(specifier || '')
    .split('|')
    .map((part) => part.trim())
    .find((part) => part.toLowerCase().startsWith(`${normalizedKey}=`))

  return segment ? segment.split('=').slice(1).join('=').trim() : ''
}

const toEarlyGoalBaseSpecifier = (specifier = '') => {
  const total = getSpecifierSegmentValue(specifier, 'total')
  return total ? `total=${total}` : String(specifier || '')
}

export const useCouponStore = defineStore({
  id: 'coupon',
  state: () => ({
    betPlaced: null,
    loadedCoupon: null,
    confirm: false,
    sportsbookBonusList: [],
    sportsbookFeatureConfig: {
      accaBonus: null,
      flex: null,
      cutOne: null,
      stakeLimits: null
    },
    SportsbookGlobalVariable: {},
    isBetslipLoading: false,
    isBetslipBooking: false,
    isEarlyWinLoading: false,
    accaBonusPreviewRequestId: 0,
    cutOnePreviewRequestId: 0,
    cutOnePreview: null,
    flexPreviewRequestId: 0,
    flexPreview: null,
    isCutOneLoading: false,
    isFlexLoading: false,
    isEarlyGoalLoading: false,
    mode: 'real',
    isSimulating: false,
    earlyWinBulkMode: EARLY_WIN_DEFAULT_MODE,
    coupon: {
      acceptChanges: true,
      betslip_type: 'Single',
      bet_type: 'Single',
      selections: [],
      combos: [],
      totalOdds: 1,
      isBooking: 0,
      // maxBonus: 0,
      // minBonus: 0,
      // grossWin: 0,
      // maxWin: 0,
      // minWin: 0,
      stake: 100,
      totalStake: 100,
      // minOdds: 1,
      // maxOdds: 1,
      // wthTax: 0,
      // exciseDuty: 0,
      bonusId: null,
      useBonus: false,
      useCashback: false,
      useCutOne: false,
      useFlex: false,
      flexAmount: 2,
      useEarlyGoal: false,
      source: 'mobile'
    },
    activeSubscriptions: [], // Will store objects with topic and unsubscribe function
    activeKeyboardKey: null,
    // Persist stake per betslip type to avoid drift when switching modes.
    betslipStakeCache: {
      Single: null,
      Multiple: null,
      Combo: null
    }
  }),
  getters: {
    betslipMode: (state) => state.mode === 'sim'
  },
  actions: {
    createEmptyCouponState(overrides = {}) {
      return {
        acceptChanges: false,
        betslip_type: 'Single',
        bet_type: 'Single',
        selections: [],
        combos: [],
        totalOdds: 1,
        isBooking: 0,
        maxBonus: 0,
        minBonus: 0,
        grossWin: 0,
        maxWin: 0,
        minWin: 0,
        stake: 100,
        totalStake: 100,
        minOdds: 1,
        maxOdds: 1,
        wthTax: 0,
        exciseDuty: 0,
        bonusId: null,
        useBonus: false,
        useCashback: false,
        useCutOne: false,
        useFlex: false,
        flexAmount: 2,
        useEarlyGoal: false,
        source: 'mobile',
        ...overrides
      }
    },
    getGlobalVariableFlag(key, fallback = false) {
      const value = this.SportsbookGlobalVariable?.[key]
      if (value === undefined || value === null || value === '') return fallback
      return String(value) === '1' || value === true || Number(value) === 1
    },
    getGlobalVariableNumber(key, fallback = 0) {
      const value = Number(this.SportsbookGlobalVariable?.[key])
      return Number.isFinite(value) ? value : fallback
    },
    isSystemBetEnabled() {
      return this.getGlobalVariableFlag('EnableSystemBet', true)
    },
    isSplitBetEnabled() {
      return this.getGlobalVariableFlag('EnableSplitBet', true)
    },
    isPrematchBetEnabled() {
      return this.getGlobalVariableFlag(
        'AcceptPrematchBets',
        this.getGlobalVariableFlag('acceptPrematchBets', true)
      )
    },
    isLiveBetEnabled() {
      return this.getGlobalVariableFlag(
        'AcceptLiveBets',
        this.getGlobalVariableFlag('acceptLiveBets', true)
      )
    },
    getLiveSelectionCount() {
      return (this.coupon.selections || []).filter(
        (selection) => String(selection?.type || '').toLowerCase() === 'live'
      ).length
    },
    getSelectionLimit() {
      return this.getGlobalVariableNumber('MaxNoOfSelection', 0)
    },
    getLiveSelectionLimit() {
      const liveLimit = this.getGlobalVariableNumber('LiveTicketMax', 0)
      if (liveLimit > 0) return liveLimit
      return this.getSelectionLimit()
    },
    getMinStakeForBetslipType(betslipType) {
      if (betslipType === 'Combo') {
        return this.getGlobalVariableNumber('comboMinStake', 0)
      }

      return this.getGlobalVariableNumber('singleMinStake', 0)
    },
    getMaxStakeForBetslipType(betslipType) {
      if (betslipType === 'Combo') {
        return this.getGlobalVariableNumber('comboMaxStake', 0)
      }

      return this.getGlobalVariableNumber('singleMaxStake', 0)
    },
    getExciseTaxRate() {
      return this.getGlobalVariableNumber('exciseTax', 0)
    },
    getWithholdingTaxRate() {
      return this.getGlobalVariableNumber('wthTax', 0)
    },
    getMinBonusOddValue() {
      return this.getAccaBonusConfig().minOddsPerLeg
    },
    getAccaBonusConfig() {
      return normalizeAccaBonusConfig(this.sportsbookFeatureConfig?.accaBonus)
    },
    getCutOneConfig() {
      const config = this.sportsbookFeatureConfig?.cutOne || {}
      return {
        id: config?.id ?? null,
        enabled:
          Boolean(config?.is_active) &&
          String(config?.status || 'active').toLowerCase() === 'active',
        minSelections: Number(config?.min_selections || 0),
        minOddsPerLeg: Number(config?.min_odds_per_leg || 0),
        penaltyMargin: Number(config?.penalty_margin || 0)
      }
    },
    getActiveCouponSelections(selections = this.coupon.selections) {
      if (!Array.isArray(selections)) return []

      return selections.filter((selection) => {
        return !selection?.suspended && !selection?.unavailable && parseFloat(selection?.odds) > 1
      })
    },
    applyAccumulatorBaseWinnings(activeSelections = this.getActiveCouponSelections()) {
      const fallbackTotalOdds =
        activeSelections.length > 0 ? Number(calculateTotalOdds(activeSelections).toFixed(2)) : 0
      const totalOdds = Number(this.coupon.totalOdds || 0) || fallbackTotalOdds
      const stake = Number(this.coupon.totalStake || this.coupon.stake || 0)
      const grossWin =
        Number.isFinite(totalOdds) && Number.isFinite(stake)
          ? Number((totalOdds * stake).toFixed(2))
          : 0

      this.coupon.maxBonus = 0
      this.coupon.grossWin = grossWin
      this.coupon.maxWin = grossWin
      this.coupon.wthTax = 0
    },
    clearCutOnePreview({ resetSelection = false } = {}) {
      this.cutOnePreviewRequestId += 1
      this.cutOnePreview = null
      this.isCutOneLoading = false
      if (resetSelection) {
        this.coupon.useCutOne = false
      }
    },
    clearFlexPreview({ resetSelection = false } = {}) {
      this.flexPreviewRequestId += 1
      this.flexPreview = null
      this.isFlexLoading = false
      if (resetSelection) {
        this.coupon.useFlex = false
      }
    },
    getSelectionProbability(selection = {}) {
      const providedProbability = Number(selection?.probability)
      if (Number.isFinite(providedProbability) && providedProbability > 0 && providedProbability <= 1) {
        return providedProbability
      }

      const odds = Number(selection?.odds || 0)
      if (!Number.isFinite(odds) || odds <= 0) {
        return 0
      }

      return Number((1 / odds).toFixed(6))
    },
    canSelectCutOne(activeSelections = this.getActiveCouponSelections()) {
      const cutOneConfig = this.getCutOneConfig()
      if (!cutOneConfig.enabled) return false
      if (this.coupon.betslip_type !== 'Multiple' || this.coupon.bet_type !== 'Multiple') return false
      if (this.coupon.useBonus || this.coupon.useCashback || Number(this.coupon.bonusId || 0) > 0) return false
      if (activeSelections.length < cutOneConfig.minSelections) return false

      return activeSelections.every((selection) => Number(selection?.odds || 0) >= cutOneConfig.minOddsPerLeg)
    },
    isCutOneApplied() {
      return Boolean(
        this.coupon.useCutOne &&
          this.cutOnePreview?.enabled &&
          this.cutOnePreview?.qualifies &&
          Number(this.cutOnePreview?.cut_one_odds || 0) > 0
      )
    },
    getDisplayedTotalOddsValue() {
      if (this.isCutOneApplied()) {
        return Number(this.cutOnePreview?.cut_one_odds || 0)
      }

      if (this.isFlexApplied()) {
        return Number(this.flexPreview?.flex_odds || 0)
      }

      return Number(this.coupon.totalOdds || 0)
    },
    getDisplayedMaxWin() {
      return Number(this.coupon.maxWin || 0)
    },
    async refreshCutOnePreview(activeSelections = this.getActiveCouponSelections()) {
      if (!this.coupon.useCutOne) {
        this.clearCutOnePreview()
        return false
      }

      if (!this.canSelectCutOne(activeSelections)) {
        this.clearCutOnePreview({ resetSelection: true })
        return false
      }

      const requestId = ++this.cutOnePreviewRequestId
      const stake = Number(this.coupon.totalStake || this.coupon.stake || 0)
      this.isCutOneLoading = true

      try {
        const response = await previewCutOne({
          selections: activeSelections.map(buildPreviewSelection),
          stake
        })

        if (requestId !== this.cutOnePreviewRequestId) {
          return false
        }

        if (Number(response?.status_code) !== 200 || !response?.data?.enabled || !response?.data?.qualifies) {
          this.clearCutOnePreview({ resetSelection: true })
          return false
        }

        this.cutOnePreview = response.data
        this.coupon.maxBonus = 0
        this.coupon.grossWin = Number(response.data?.potential_payout || 0)
        this.coupon.maxWin = Number(response.data?.potential_payout || 0)
        this.coupon.wthTax = 0
        return true
      } catch (error) {
        if (requestId !== this.cutOnePreviewRequestId) {
          return false
        }
        console.error('[cutOne] preview failed', error)
        this.clearCutOnePreview({ resetSelection: true })
        return false
      } finally {
        if (requestId === this.cutOnePreviewRequestId) {
          this.isCutOneLoading = false
        }
      }
    },
    isAccaPreviewEligible(activeSelections = this.getActiveCouponSelections()) {
      const accaBonusConfig = this.getAccaBonusConfig()
      const stake = Number(this.coupon.totalStake || this.coupon.stake || 0)

      // Acca Bonus is suppressed whenever Flex or Cut-1 is selected.
      if (this.coupon.useFlex || this.coupon.useCutOne) return false

      return Boolean(
        accaBonusConfig.enabled &&
          this.coupon.betslip_type === 'Multiple' &&
          this.coupon.bet_type === 'Multiple' &&
          activeSelections.length > 1 &&
          stake > 0
      )
    },
    async refreshAccaBonusPreview() {
      const requestId = ++this.accaBonusPreviewRequestId

      if (this.coupon.betslip_type !== 'Multiple' || this.coupon.bet_type !== 'Multiple') {
        return
      }

      const activeSelections = this.getActiveCouponSelections()
      this.applyAccumulatorBaseWinnings(activeSelections)

      if (!this.isAccaPreviewEligible(activeSelections)) {
        return
      }
      const stake = Number(this.coupon.totalStake || this.coupon.stake || 0)

      try {
        const response = await previewAccaBonus({
          selections: activeSelections.map(buildPreviewSelection),
          stake
        })

        if (requestId !== this.accaBonusPreviewRequestId) {
          return
        }

        if (Number(response?.status_code) !== 200 || !response?.data?.enabled) {
          return
        }

        const bonusAmount = Number(response?.data?.bonus_amount || 0)
        const potentialReturns = Number(
          response?.data?.potential_returns ?? response?.data?.potential_payout ?? 0
        )

        this.coupon.maxBonus = Number.isFinite(bonusAmount) ? bonusAmount : 0

        if (Number.isFinite(potentialReturns) && potentialReturns >= 0) {
          this.coupon.grossWin = potentialReturns
          this.coupon.maxWin = potentialReturns
        }
      } catch (error) {
        if (requestId !== this.accaBonusPreviewRequestId) {
          return
        }
        console.error('[accaBonus] preview failed', error)
      }
    },
    async refreshMultipleBetslipPreview() {
      const activeSelections = this.getActiveCouponSelections()

      if (this.coupon.useCutOne) {
        this.accaBonusPreviewRequestId += 1
        const cutOneApplied = await this.refreshCutOnePreview(activeSelections)
        if (cutOneApplied || this.coupon.useCutOne) {
          return
        }
      } else {
        this.clearCutOnePreview()
      }

      if (this.coupon.useFlex) {
        this.accaBonusPreviewRequestId += 1
        const flexApplied = await this.refreshFlexPreview(activeSelections)
        if (flexApplied || this.coupon.useFlex) {
          return
        }
      } else {
        this.clearFlexPreview()
      }

      await this.refreshAccaBonusPreview()
    },
    async toggleCutOne() {
      if (this.coupon.useCutOne) {
        this.coupon.useCutOne = false
        this.clearCutOnePreview()
        if (this.coupon.betslip_type === 'Multiple' && this.coupon.bet_type === 'Multiple') {
          await this.refreshMultipleBetslipPreview()
        }
        return
      }

      if (!this.canSelectCutOne()) {
        return
      }

      // Cut One and Flex are mutually exclusive — selecting one cancels the other.
      if (this.coupon.useFlex) {
        this.coupon.useFlex = false
        this.clearFlexPreview()
      }

      this.coupon.useCutOne = true
      await this.refreshMultipleBetslipPreview()
    },
    getFlexConfig() {
      const config = this.sportsbookFeatureConfig?.flex || {}
      return {
        id: config?.id ?? null,
        enabled:
          Boolean(config?.is_active) &&
          String(config?.status || 'active').toLowerCase() === 'active',
        minSelections: Number(config?.min_selections || 0),
        maxSelections: Number(config?.max_selections || 0),
        margin: Number(config?.margin || 0)
      }
    },
    getFlexMaximumWins(activeSelections = this.getActiveCouponSelections()) {
      const selectionCount = Array.isArray(activeSelections) ? activeSelections.length : 0
      return Math.max(1, selectionCount - 1)
    },
    getFlexMinimumWins() {
      return 2
    },
    getDefaultFlexMinimumWins(activeSelections = this.getActiveCouponSelections()) {
      return this.getFlexMaximumWins(activeSelections)
    },
    getResolvedFlexMinimumWins(activeSelections = this.getActiveCouponSelections()) {
      const maxWins = this.getFlexMaximumWins(activeSelections)
      const requestedMinWins = Math.floor(Number(this.coupon.flexAmount || 0))
      const normalizedMinWins =
        Number.isFinite(requestedMinWins) && requestedMinWins > 0
          ? requestedMinWins
          : this.getDefaultFlexMinimumWins(activeSelections)

      return Math.min(maxWins, Math.max(this.getFlexMinimumWins(), normalizedMinWins))
    },
    canSelectFlex(activeSelections = this.getActiveCouponSelections()) {
      const flexConfig = this.getFlexConfig()
      if (!flexConfig.enabled) return false
      if (this.coupon.betslip_type !== 'Multiple' || this.coupon.bet_type !== 'Multiple') return false
      if (this.coupon.useBonus || this.coupon.useCashback || Number(this.coupon.bonusId || 0) > 0) return false
      if (activeSelections.length < flexConfig.minSelections) return false
      if (flexConfig.maxSelections > 0 && activeSelections.length > flexConfig.maxSelections) return false
      return true
    },
    isFlexApplied() {
      return Boolean(
        this.coupon.useFlex &&
          this.flexPreview?.enabled &&
          this.flexPreview?.qualifies &&
          Number(this.flexPreview?.flex_odds || 0) > 0
      )
    },
    async refreshFlexPreview(activeSelections = this.getActiveCouponSelections()) {
      if (!this.coupon.useFlex) {
        this.clearFlexPreview()
        return false
      }

      if (!this.canSelectFlex(activeSelections)) {
        this.clearFlexPreview({ resetSelection: true })
        return false
      }

      const resolvedMinWins = this.getResolvedFlexMinimumWins(activeSelections)
      if (Number(this.coupon.flexAmount || 0) !== resolvedMinWins) {
        this.coupon.flexAmount = resolvedMinWins
      }

      const requestId = ++this.flexPreviewRequestId
      const stake = Number(this.coupon.totalStake || this.coupon.stake || 0)
      this.isFlexLoading = true

      try {
        const response = await previewFlex({
          minWins: resolvedMinWins,
          selections: activeSelections.map(buildPreviewSelection),
          stake
        })

        if (requestId !== this.flexPreviewRequestId) {
          return false
        }

        if (Number(response?.status_code) !== 200 || !response?.data?.enabled || !response?.data?.qualifies) {
          this.clearFlexPreview({ resetSelection: true })
          return false
        }

        this.flexPreview = response.data
        this.coupon.maxBonus = 0
        this.coupon.grossWin = Number(response.data?.potential_payout || 0)
        this.coupon.maxWin = Number(response.data?.potential_payout || 0)
        this.coupon.wthTax = 0
        return true
      } catch (error) {
        if (requestId !== this.flexPreviewRequestId) {
          return false
        }
        console.error('[flex] preview failed', error)
        this.clearFlexPreview({ resetSelection: true })
        return false
      } finally {
        if (requestId === this.flexPreviewRequestId) {
          this.isFlexLoading = false
        }
      }
    },
    async toggleFlex() {
      if (this.coupon.useFlex) {
        this.coupon.useFlex = false
        this.clearFlexPreview()
        if (this.coupon.betslip_type === 'Multiple' && this.coupon.bet_type === 'Multiple') {
          await this.refreshMultipleBetslipPreview()
        }
        return
      }

      if (!this.canSelectFlex()) {
        return
      }

      // Flex and Cut One are mutually exclusive — selecting one cancels the other.
      if (this.coupon.useCutOne) {
        this.coupon.useCutOne = false
        this.clearCutOnePreview()
      }

      this.coupon.flexAmount = this.getDefaultFlexMinimumWins()
      this.coupon.useFlex = true
      await this.refreshMultipleBetslipPreview()
    },
    async setFlexAmount(value) {
      const next = Math.floor(Number(value) || 0)
      const min = this.getFlexMinimumWins()
      const max = this.getFlexMaximumWins()
      this.coupon.flexAmount = Math.min(max, Math.max(min, next))
      if (this.coupon.useFlex && this.coupon.betslip_type === 'Multiple' && this.coupon.bet_type === 'Multiple') {
        await this.refreshMultipleBetslipPreview()
      }
    },
    isSelectionEarlyGoalEligible(selection) {
      if (!selection) return false
      return Boolean(
        selection?.supportsEarlyGoal ||
          selection?.earlyGoalMode === 'earlygoal' ||
          Number(selection?.marketId || selection?.market_id || 0) === EARLY_GOAL_DERIVED_MARKET_ID
      )
    },
    syncEarlyGoalStateFromSelections(selections = this.coupon.selections) {
      const hasActiveEarlyGoal = Array.isArray(selections)
        ? selections.some((selection) => (selection?.earlyGoalMode || 'base') === 'earlygoal')
          || selections.some(
            (selection) =>
              Number(selection?.marketId || selection?.market_id || 0) === EARLY_GOAL_DERIVED_MARKET_ID
          )
        : false

      this.coupon.useEarlyGoal = hasActiveEarlyGoal
      return hasActiveEarlyGoal
    },
    canSelectEarlyGoal(activeSelections = this.getActiveCouponSelections()) {
      return activeSelections.some(
        (selection) =>
          Number(selection?.baseMarketId || selection?.marketId || selection?.market_id || 0) ===
            EARLY_GOAL_BASE_MARKET_ID && selection?.supportsEarlyGoal
      )
    },
    getEarlyGoalValidationSpecifier(selection, mode) {
      const currentSpecifier = selection?.specifier || ''
      const baseSpecifier = selection?.baseSpecifier || currentSpecifier
      const localQuote = selection?.earlyGoalLocalQuotes?.[mode]

      if (localQuote?.specifier) {
        return mode === 'base'
          ? toEarlyGoalBaseSpecifier(localQuote.specifier)
          : localQuote.specifier
      }

      if (mode === 'base') {
        return toEarlyGoalBaseSpecifier(baseSpecifier || currentSpecifier)
      }

      const derivedSpecifier =
        currentSpecifier.includes('minsnr=')
          ? currentSpecifier
          : selection?.earlyGoalLocalQuotes?.earlygoal?.specifier || ''

      return derivedSpecifier.includes('minsnr=') ? derivedSpecifier : ''
    },
    async fetchEarlyGoalQuoteForSelection(selection, mode, targetMarketId) {
      if (!selection || !targetMarketId) return null

      const specifier = this.getEarlyGoalValidationSpecifier(selection, mode)
      if (mode === 'earlygoal' && !specifier) return null

      const response = await validateBetslipSelections([
        {
          match_id: parseInt(selection.matchId),
          market_id: parseInt(targetMarketId),
          outcome_id: String(selection.baseOutcomeId || selection.outcomeId),
          producer_id: selection.producerId || 0,
          specifier
        }
      ])

      if (Number(response?.status_code) !== 200 || !response?.data) return null

      const [validatedQuote] = Array.isArray(response.data)
        ? response.data
        : Object.values(response.data)
      if (!validatedQuote) return null

      const statusName = validatedQuote.status_name || validatedQuote.statusName || 'Active'
      const parsedOdds = Number(validatedQuote.odds)
      const odds = Number.isFinite(parsedOdds) ? parsedOdds : 0
      const quote = {
        marketId: Number(validatedQuote.market_id || validatedQuote.marketId || targetMarketId),
        marketName: formatEarlyGoalMarketName(selection.baseMarketName, mode),
        specifier: validatedQuote.specifier ?? specifier,
        idSpecifier: validatedQuote.specifier ?? specifier,
        outcomeId: String(
          validatedQuote.outcome_id ||
            validatedQuote.outcomeId ||
            selection.baseOutcomeId ||
            selection.outcomeId
        ),
        outcomeName:
          validatedQuote.outcome_name ||
          validatedQuote.outcomeName ||
          selection.baseOutcomeName ||
          selection.outcomeName,
        displayName:
          validatedQuote.display_name ||
          validatedQuote.displayName ||
          selection.baseDisplayName ||
          selection.displayName,
        odds,
        active: validatedQuote.active ?? 1,
        statusName
      }

      if (statusName === 'Active' && quote.odds <= 1) return null

      selection.earlyGoalLocalQuotes = {
        ...(selection.earlyGoalLocalQuotes || {}),
        [mode]: quote
      }

      if (mode === 'earlygoal') {
        selection.supportedEarlyGoalMarketIds = [
          ...new Set([
            ...(Array.isArray(selection.supportedEarlyGoalMarketIds)
              ? selection.supportedEarlyGoalMarketIds
              : []),
            quote.marketId
          ].filter((marketId) => Number.isFinite(Number(marketId)) && Number(marketId) > 0))
        ]
        selection.supportsEarlyGoal = true
      }

      return quote
    },
    updateSelectionEarlyGoalState(selection, mode = 'base', quote = null) {
      const normalizedMode = mode === 'earlygoal' ? 'earlygoal' : 'base'
      const resolvedQuote =
        quote ||
        (normalizedMode === 'base'
          ? {
              marketId: selection.baseMarketId,
              marketName: selection.baseMarketName,
              specifier: selection.baseSpecifier ?? '',
              idSpecifier: selection.baseSelectionKeySpecifier ?? '',
              outcomeId: selection.baseOutcomeId || selection.outcomeId,
              outcomeName: selection.baseOutcomeName || selection.outcomeName,
              displayName: selection.baseDisplayName || selection.displayName,
              odds: selection.baseOdds ?? selection.odds,
              statusName: selection.baseStatusName || 'Active'
            }
          : null)

      const targetMarketId =
        Number(resolvedQuote?.marketId) || (normalizedMode === 'base' ? selection.baseMarketId : 0)
      const targetMarketName = formatEarlyGoalMarketName(selection.baseMarketName, normalizedMode)
      const targetSpecifier = resolvedQuote?.specifier ?? selection.baseSpecifier ?? ''
      const targetOutcomeId =
        resolvedQuote?.outcomeId ??
        (normalizedMode === 'base'
          ? selection.baseOutcomeId || selection.outcomeId
          : selection.outcomeId)
      const targetOutcomeName =
        resolvedQuote?.outcomeName ??
        (normalizedMode === 'base'
          ? selection.baseOutcomeName || selection.outcomeName
          : selection.outcomeName)
      const targetDisplayName =
        resolvedQuote?.displayName ??
        (normalizedMode === 'base'
          ? selection.baseDisplayName || selection.displayName
          : selection.displayName)
      const targetSelectionKeySpecifier =
        resolvedQuote?.idSpecifier ??
        (normalizedMode === 'base'
          ? selection.baseSelectionKeySpecifier ?? selection.selectionKeySpecifier ?? ''
          : selection.selectionKeySpecifier ?? '')
      const normalizedOdds = Number(resolvedQuote?.odds)
      const resolvedStatusName = resolvedQuote?.statusName || 'Active'
      const isActive =
        resolvedStatusName === 'Active' && Number.isFinite(normalizedOdds) && normalizedOdds > 1

      selection.marketId = targetMarketId
      selection.marketName = targetMarketName
      selection.earlyGoalMode = normalizedMode
      selection.earlyGoalLabel = targetMarketName
      selection.specifier = targetSpecifier
      selection.selectionKeySpecifier = targetSelectionKeySpecifier
      selection.outcomeId = targetOutcomeId
      selection.outcomeName = targetOutcomeName
      selection.displayName = targetDisplayName
      selection.currentSelectionId = this.buildCurrentSelectionId(selection, {
        marketId: targetMarketId,
        marketName: targetMarketName,
        selectionKeySpecifier: targetSelectionKeySpecifier,
        outcomeId: targetOutcomeId,
        outcomeName: targetOutcomeName
      })
      selection.changed = false

      if (isActive) {
        selection.odds = normalizedOdds.toFixed(2)
        selection.suspended = false
        selection.unavailable = false
        return
      }

      selection.odds =
        Number.isFinite(normalizedOdds) && normalizedOdds > 1 ? normalizedOdds.toFixed(2) : 0
      selection.suspended = resolvedStatusName === 'Suspended' || !resolvedStatusName
      selection.unavailable = resolvedStatusName === 'Deactivated' || !resolvedStatusName
    },
    async applyEarlyGoalToSelections(selectionIds = [], enabled = true) {
      const targetSelections = (this.coupon.selections || []).filter((selection) =>
        selectionIds.includes(String(selection.selectionId))
      )
      if (!targetSelections.length) return 0

      this.isEarlyGoalLoading = true

      try {
        const pendingSelections = (
          await Promise.all(
            targetSelections.map(async (selection) => {
              const desiredMode = enabled ? 'earlygoal' : 'base'
              if (desiredMode === 'earlygoal' && !this.isSelectionEarlyGoalEligible(selection)) {
                return null
              }
              if (desiredMode === (selection.earlyGoalMode || 'base')) {
                return null
              }

              const targetMarketId =
                desiredMode === 'base'
                  ? EARLY_GOAL_BASE_MARKET_ID
                  : EARLY_GOAL_DERIVED_MARKET_ID
              const localQuote =
                selection.earlyGoalLocalQuotes?.[desiredMode] ||
                (desiredMode === 'base' ? selection.earlyGoalLocalQuotes?.base || null : null)
              const resolvedQuote =
                localQuote ||
                (await this.fetchEarlyGoalQuoteForSelection(
                  selection,
                  desiredMode,
                  targetMarketId
                ))
              if (!resolvedQuote) return null

              return {
                selection,
                desiredMode,
                localQuote: resolvedQuote
              }
            })
          )
        ).filter(Boolean)

        if (!pendingSelections.length) {
          return 0
        }

        let appliedCount = 0
        pendingSelections.forEach((item) => {
          this.updateSelectionEarlyGoalState(
            item.selection,
            item.desiredMode,
            item.localQuote
          )
          appliedCount += 1
        })

        if (!appliedCount) {
          return 0
        }

        this.syncEarlyGoalStateFromSelections()
        await this.refreshCouponAfterSelectionMutation()
        return appliedCount
      } catch (error) {
        console.error('[earlyGoal] failed to update selections', error)
        emitter.emit('showErrorMessage', 'Unable to update early goal selections right now.')
        return 0
      } finally {
        this.isEarlyGoalLoading = false
      }
    },
    async toggleEarlyGoal() {
      if (this.coupon.useEarlyGoal) {
        const actionableSelectionIds = (this.coupon.selections || [])
          .filter((selection) => this.isSelectionEarlyGoalEligible(selection))
          .map((selection) => String(selection.selectionId))
        if (actionableSelectionIds.length) {
          await this.applyEarlyGoalToSelections(actionableSelectionIds, false)
        }
        return
      }
      if (!this.canSelectEarlyGoal()) return
      const supportedSelectionIds = this.getActiveCouponSelections()
        .filter(
          (selection) =>
            Number(selection?.baseMarketId || selection?.marketId || selection?.market_id || 0) ===
              EARLY_GOAL_BASE_MARKET_ID && selection.supportsEarlyGoal
        )
        .map((selection) => String(selection.selectionId))
      const appliedCount = await this.applyEarlyGoalToSelections(supportedSelectionIds, true)
      if (!appliedCount) {
        this.coupon.useEarlyGoal = false
      }
    },
    async setSelectionEarlyGoalMode(selection, mode = 'base') {
      if (!selection?.selectionId || this.isEarlyGoalLoading) return 0

      const currentMode = selection.earlyGoalMode || 'base'
      const desiredMode = mode === 'earlygoal' ? 'earlygoal' : 'base'
      const nextEnabled = desiredMode === 'earlygoal' ? currentMode !== 'earlygoal' : false

      return this.applyEarlyGoalToSelections([String(selection.selectionId)], nextEnabled)
    },
    isTaxEnabled() {
      return (
        this.getExciseTaxRate() > 0 ||
        this.getWithholdingTaxRate() > 0 ||
        this.getGlobalVariableFlag('taxEnabled', false)
      )
    },
    getSelectionKey(selection) {
      if (!selection) return ''
      const selectionId = selection.selectionId || selection.id
      if (selectionId) return String(selectionId)
      const matchId = selection.matchId || selection.match_id || selection.fixture?.matchID || ''
      const marketId = selection.marketId || selection.market_id || ''
      const outcomeId = selection.outcomeId || selection.odd_id || selection.outcomeID || ''
      const specifier = selection.specifier || ''
      return `${matchId}:${marketId}:${outcomeId}:${specifier}`
    },
    buildCurrentSelectionId(selection, overrides = {}) {
      const marketId = overrides.marketId ?? selection.marketId ?? selection.baseMarketId ?? 0
      const marketName =
        overrides.marketName ??
        selection.marketName ??
        (selection.earlyGoalMode === 'earlygoal'
          ? formatEarlyGoalMarketName(selection.baseMarketName, selection.earlyGoalMode)
          : formatEarlyWinMarketName(selection.baseMarketName, selection.earlyWinMode))
      const specifier =
        overrides.selectionKeySpecifier ??
        selection.selectionKeySpecifier ??
        selection.baseSelectionKeySpecifier ??
        selection.specifier ??
        selection.baseSpecifier ??
        ''
      const outcomeId = overrides.outcomeId ?? selection.outcomeId
      const outcomeName = overrides.outcomeName ?? selection.outcomeName

      return createID(
        selection.matchId,
        marketId,
        outcomeId,
        specifier,
        marketName,
        outcomeName
      )
    },
    normalizeSelectionEarlyWinState(selection = {}) {
      const currentMarketId = Number(selection.marketId || selection.market_id || 0)
      const earlyWinState = buildEarlyWinSelectionState({
        sportId: selection.sportId || selection.sportID || selection.sport_id,
        marketId: currentMarketId,
        marketName: selection.baseMarketName || selection.marketName || '',
        derivedMarketIds:
          selection.supportedDerivedMarketIds ||
          selection.derived_market_ids ||
          selection.derived_market_id
      })
      const earlyGoalState = buildEarlyGoalSelectionState({
        sportId: selection.sportId || selection.sportID || selection.sport_id,
        marketId: currentMarketId,
        marketName: selection.baseMarketName || selection.marketName || '',
        baseMarketId: selection.baseMarketId,
        derivedMarketIds:
          selection.supportedEarlyGoalMarketIds ||
          selection.supportedDerivedMarketIds ||
          selection.derived_market_ids ||
          selection.derived_market_id
      })
      const isEarlyGoalMarketCandidate = earlyGoalState.isEarlyGoalMarketCandidate
      const selectionBaseState = isEarlyGoalMarketCandidate ? earlyGoalState : earlyWinState

      selection.baseMarketId = selection.baseMarketId || selectionBaseState.baseMarketId
      selection.baseMarketName =
        selectionBaseState.baseMarketName || selection.baseMarketName || selection.marketName || ''
      selection.baseSpecifier = selection.baseSpecifier ?? selection.specifier ?? ''
      selection.baseSelectionKeySpecifier =
        selection.baseSelectionKeySpecifier ??
        selection.selectionKeySpecifier ??
        selection.baseSpecifier ??
        ''
      selection.selectionKeySpecifier =
        selection.selectionKeySpecifier ?? selection.baseSelectionKeySpecifier
      selection.baseOutcomeId = selection.baseOutcomeId || selection.outcomeId
      selection.baseOutcomeName = selection.baseOutcomeName || selection.outcomeName
      selection.baseDisplayName = selection.baseDisplayName || selection.displayName
      selection.earlyWinLocalQuotes =
        selection.earlyWinLocalQuotes && typeof selection.earlyWinLocalQuotes === 'object'
          ? selection.earlyWinLocalQuotes
          : {}
      selection.baseOdds =
        selection.baseOdds ?? selection.earlyWinLocalQuotes?.base?.odds ?? selection.odds
      selection.baseStatusName =
        selection.baseStatusName || selection.earlyWinLocalQuotes?.base?.statusName || 'Active'
      selection.earlyGoalLocalQuotes =
        selection.earlyGoalLocalQuotes && typeof selection.earlyGoalLocalQuotes === 'object'
          ? selection.earlyGoalLocalQuotes
          : {}
      const localSupportedModes = ['1up', '2up'].filter((mode) =>
        Boolean(selection.earlyWinLocalQuotes?.[mode])
      )
      const isDerivedEarlyWinSelection =
        (selection.earlyWinMode || earlyWinState.earlyWinMode || 'base') !== 'base' &&
        Number(selection.baseMarketId || selectionBaseState.baseMarketId || 0) === 1
      selection.hasExplicitDerivedMarkets =
        localSupportedModes.length > 0 ||
        selection.hasExplicitDerivedMarkets === true ||
        (isDerivedEarlyWinSelection && Array.isArray(selection.supportedEarlyWinModes) && selection.supportedEarlyWinModes.length > 0)
      selection.supportedDerivedMarketIds = [
        ...new Set([
          ...(Array.isArray(selection.supportedDerivedMarketIds)
            ? selection.supportedDerivedMarketIds
            : []),
          ...localSupportedModes
            .map((mode) => Number(selection.earlyWinLocalQuotes?.[mode]?.marketId))
            .filter((marketId) => Number.isFinite(marketId) && marketId > 0),
          ...earlyWinState.supportedDerivedMarketIds
        ])
      ]
      selection.supportedEarlyWinModes = [
        ...new Set([
          ...(isDerivedEarlyWinSelection && Array.isArray(selection.supportedEarlyWinModes)
            ? selection.supportedEarlyWinModes
            : []),
          ...localSupportedModes
        ])
      ]
      selection.supportsEarlyWin =
        localSupportedModes.length > 0 || isDerivedEarlyWinSelection
      selection.isDerived = selection.supportsEarlyWin
      selection.earlyWinMode = selection.earlyWinMode || earlyWinState.earlyWinMode || 'base'
      selection.supportedEarlyGoalMarketIds = [
        ...new Set([
          ...(Array.isArray(selection.supportedEarlyGoalMarketIds)
            ? selection.supportedEarlyGoalMarketIds
            : []),
          ...earlyGoalState.supportedDerivedMarketIds,
          Number(selection.earlyGoalLocalQuotes?.earlygoal?.marketId || 0)
        ].filter((marketId) => Number.isFinite(marketId) && marketId > 0))
      ]
      const hasLocalEarlyGoalQuote = Number(selection.earlyGoalLocalQuotes?.earlygoal?.marketId || 0) > 0
      selection.supportsEarlyGoal =
        hasLocalEarlyGoalQuote ||
        selection.earlyGoalMode === 'earlygoal'
      selection.earlyGoalMode = selection.earlyGoalMode || earlyGoalState.earlyGoalMode || 'base'
      selection.marketName =
        selection.earlyGoalMode === 'earlygoal'
          ? formatEarlyGoalMarketName(selection.baseMarketName, selection.earlyGoalMode)
          : formatEarlyWinMarketName(selection.baseMarketName, selection.earlyWinMode)
      selection.earlyWinLabel = formatEarlyWinMarketName(
        selection.baseMarketName,
        selection.earlyWinMode
      )
      selection.earlyGoalLabel = formatEarlyGoalMarketName(
        selection.baseMarketName,
        selection.earlyGoalMode
      )
      selection.currentSelectionId =
        selection.currentSelectionId || this.buildCurrentSelectionId(selection)

      return selection
    },
    async fetchEarlyWinQuoteForSelection(selection, mode, targetMarketId) {
      if (!selection || !targetMarketId) return null

      const response = await validateBetslipSelections([
        {
          match_id: parseInt(selection.matchId),
          market_id: parseInt(targetMarketId),
          outcome_id: String(selection.baseOutcomeId || selection.outcomeId),
          producer_id: selection.producerId || 0,
          specifier: selection.baseSpecifier ?? selection.specifier ?? ''
        }
      ])

      if (Number(response?.status_code) !== 200 || !response?.data) return null

      const [validatedQuote] = Array.isArray(response.data)
        ? response.data
        : Object.values(response.data)
      if (!validatedQuote) return null

      const statusName = validatedQuote.status_name || validatedQuote.statusName || 'Active'
      const parsedOdds = Number(validatedQuote.odds)
      const odds = Number.isFinite(parsedOdds) ? parsedOdds : 0
      const quote = {
        marketId: Number(validatedQuote.market_id || validatedQuote.marketId || targetMarketId),
        marketName: formatEarlyWinMarketName(selection.baseMarketName, mode),
        specifier: validatedQuote.specifier ?? selection.baseSpecifier ?? '',
        idSpecifier: validatedQuote.specifier ?? selection.baseSelectionKeySpecifier ?? '',
        outcomeId: String(validatedQuote.outcome_id || validatedQuote.outcomeId || selection.baseOutcomeId || selection.outcomeId),
        outcomeName: validatedQuote.outcome_name || validatedQuote.outcomeName || selection.baseOutcomeName || selection.outcomeName,
        displayName: validatedQuote.display_name || validatedQuote.displayName || selection.baseDisplayName || selection.displayName,
        odds,
        active: validatedQuote.active ?? 1,
        statusName
      }

      if (statusName === 'Active' && quote.odds <= 1) return null

      selection.earlyWinLocalQuotes = {
        ...(selection.earlyWinLocalQuotes || {}),
        [mode]: quote
      }
      selection.supportedDerivedMarketIds = [
        ...new Set([
          ...(Array.isArray(selection.supportedDerivedMarketIds)
            ? selection.supportedDerivedMarketIds
            : []),
          quote.marketId
        ].filter((marketId) => Number.isFinite(Number(marketId)) && Number(marketId) > 0))
      ]
      if (mode !== 'base') {
        selection.supportedEarlyWinModes = [
          ...new Set([
            ...(Array.isArray(selection.supportedEarlyWinModes)
              ? selection.supportedEarlyWinModes
              : []),
            mode
          ])
        ]
        selection.supportsEarlyWin = true
        selection.isDerived = true
      }

      return quote
    },
    applySelectionPayloadToExistingSelection(existingSelection, nextSelectionData) {
      const normalized = this.normalizeSelectionEarlyWinState({
        ...existingSelection,
        ...nextSelectionData,
        fixed: existingSelection.fixed,
        stake: existingSelection.stake
      })

      Object.assign(existingSelection, normalized, {
        suspended: false,
        unavailable: false,
        changed: false
      })
    },
    updateSelectionModeState(selection, mode, odds, statusName = 'Active', quote = null) {
      const normalizedMode = mode || 'base'
      const resolvedQuote =
        quote ||
        (normalizedMode === 'base'
          ? {
              marketId: selection.baseMarketId,
              marketName: selection.baseMarketName,
              specifier: selection.baseSpecifier ?? '',
              idSpecifier: selection.baseSelectionKeySpecifier ?? '',
              outcomeId: selection.baseOutcomeId || selection.outcomeId,
              outcomeName: selection.baseOutcomeName || selection.outcomeName,
              displayName: selection.baseDisplayName || selection.displayName,
              odds: selection.baseOdds ?? selection.odds,
              statusName: selection.baseStatusName || 'Active'
            }
          : null)
      const targetMarketId =
        Number(resolvedQuote?.marketId) ||
        (normalizedMode === 'base'
          ? selection.baseMarketId
          : getDerivedMarketIdForMode(
              selection.baseMarketId,
              normalizedMode,
              selection.supportedDerivedMarketIds
            ))
      const targetMarketName = formatEarlyWinMarketName(selection.baseMarketName, normalizedMode)
      const targetSpecifier = resolvedQuote?.specifier ?? selection.baseSpecifier ?? ''
      const targetOutcomeId =
        resolvedQuote?.outcomeId ??
        (normalizedMode === 'base'
          ? selection.baseOutcomeId || selection.outcomeId
          : selection.outcomeId)
      const targetOutcomeName =
        resolvedQuote?.outcomeName ??
        (normalizedMode === 'base'
          ? selection.baseOutcomeName || selection.outcomeName
          : selection.outcomeName)
      const targetDisplayName =
        resolvedQuote?.displayName ??
        (normalizedMode === 'base'
          ? selection.baseDisplayName || selection.displayName
          : selection.displayName)
      const targetSelectionKeySpecifier =
        resolvedQuote?.idSpecifier ??
        (normalizedMode === 'base'
          ? selection.baseSelectionKeySpecifier ?? selection.selectionKeySpecifier ?? ''
          : selection.selectionKeySpecifier ?? '')
      const normalizedOdds = Number(resolvedQuote?.odds ?? odds)
      const resolvedStatusName = resolvedQuote?.statusName || statusName || 'Active'
      const isActive =
        resolvedStatusName === 'Active' && Number.isFinite(normalizedOdds) && normalizedOdds > 1

      selection.marketId = targetMarketId
      selection.marketName = targetMarketName
      selection.earlyWinMode = normalizedMode
      selection.earlyWinLabel = targetMarketName
      selection.specifier = targetSpecifier
      selection.selectionKeySpecifier = targetSelectionKeySpecifier
      selection.outcomeId = targetOutcomeId
      selection.outcomeName = targetOutcomeName
      selection.displayName = targetDisplayName
      selection.currentSelectionId = this.buildCurrentSelectionId(selection, {
        marketId: targetMarketId,
        marketName: targetMarketName,
        selectionKeySpecifier: targetSelectionKeySpecifier,
        outcomeId: targetOutcomeId,
        outcomeName: targetOutcomeName
      })
      selection.changed = false

      if (isActive) {
        selection.odds = normalizedOdds.toFixed(2)
        selection.suspended = false
        selection.unavailable = false
        return
      }

      selection.odds =
        Number.isFinite(normalizedOdds) && normalizedOdds > 1 ? normalizedOdds.toFixed(2) : 0
      selection.suspended = resolvedStatusName === 'Suspended' || !resolvedStatusName
      selection.unavailable = resolvedStatusName === 'Deactivated' || !resolvedStatusName
    },
    async refreshCouponAfterSelectionMutation() {
      if (!Array.isArray(this.coupon.selections) || !this.coupon.selections.length) {
        this.coupon.useEarlyGoal = false
        return
      }

      this.syncEarlyGoalStateFromSelections()

      this.coupon.tournaments = groupTournament(this.coupon.selections)
      this.coupon.fixtures = groupSelections(this.coupon.selections)

      if (this.coupon.betslip_type === 'Combo' || this.coupon.bet_type === 'Combo') {
        this.recalculateCombos()
        const comboStake =
          Number(this.betslipStakeCache?.Combo) ||
          Number(this.coupon.combos?.find((combo) => Number(combo?.Stake ?? 0) > 0)?.Stake ?? 0)
        this.updateComboWinnings(comboStake, null)
        return
      }

      if (this.coupon.bet_type === 'Split' && this.coupon.betslip_type === 'Multiple') {
        const splitProps = await getSplitProps(this.coupon)
        this.coupon.minWin = splitProps.minWin
        this.coupon.maxWin = splitProps.maxWin
        this.coupon.minOdds = splitProps.minOdds
        this.coupon.maxOdds = splitProps.maxOdds
        this.coupon.maxBonus = splitProps.maxBonus
        return
      }

      const stake =
        this.coupon.betslip_type === 'Single' || this.coupon.bet_type === 'Single'
          ? this.coupon.stake
          : this.coupon.totalStake

      await this.updateWinnings({
        stake,
        id: 'all'
      })
    },
    async toggleCouponSelection(selectionPayload) {
      const nextSelection = this.normalizeSelectionEarlyWinState(getDataFromPayload(selectionPayload))
      const existingSelection = this.coupon.selections.find(
        (selection) => String(selection.selectionId) === String(nextSelection.selectionId)
      )

      if (!existingSelection) {
        return this.addToCoupon(selectionPayload)
      }

      if (String(existingSelection.currentSelectionId) === String(nextSelection.currentSelectionId)) {
        return this.removeSelection(existingSelection.selectionId)
      }

      this.applySelectionPayloadToExistingSelection(existingSelection, nextSelection)
      if (nextSelection.earlyWinMode !== 'base') {
        this.earlyWinBulkMode = nextSelection.earlyWinMode
      }
      await this.refreshCouponAfterSelectionMutation()
      return existingSelection
    },
    async applyEarlyWinModeToSelections(selectionIds = [], mode = 'base', options = {}) {
      const targetSelections = (this.coupon.selections || []).filter((selection) =>
        selectionIds.includes(String(selection.selectionId))
      )
      if (!targetSelections.length) return 0

      this.isEarlyWinLoading = true

      try {
        const pendingSelections = (
          await Promise.all(
            targetSelections.map(async (selection) => {
              const desiredMode = mode === 'base' ? 'base' : mode
              if (
                desiredMode !== 'base' &&
                desiredMode !== '1up' &&
                desiredMode !== '2up'
              ) {
                return null
              }
              if (desiredMode === (selection.earlyWinMode || 'base')) {
                return null
              }

              const targetMarketId =
                desiredMode === 'base'
                  ? selection.baseMarketId
                  : getDerivedMarketIdForMode(
                      selection.baseMarketId,
                      desiredMode,
                      selection.supportedDerivedMarketIds
                    )

              if (!targetMarketId) return null

              const localQuote =
                selection.earlyWinLocalQuotes?.[desiredMode] ||
                (desiredMode === 'base' ? selection.earlyWinLocalQuotes?.base || null : null)
              const resolvedQuote =
                localQuote ||
                (await this.fetchEarlyWinQuoteForSelection(
                  selection,
                  desiredMode,
                  targetMarketId
                ))
              if (!resolvedQuote) return null

              return {
                selection,
                desiredMode,
                targetMarketId,
                localQuote: resolvedQuote
              }
            })
          )
        ).filter(Boolean)

        if (!pendingSelections.length) {
          return 0
        }

        let appliedCount = 0
        pendingSelections.forEach((item) => {
          this.updateSelectionModeState(
            item.selection,
            item.desiredMode,
            item.localQuote?.odds,
            item.localQuote?.statusName,
            item.localQuote
          )
          appliedCount += 1
        })

        if (!appliedCount) {
          return 0
        }

        if (mode !== 'base') {
          this.earlyWinBulkMode = mode
        }

        await this.refreshCouponAfterSelectionMutation()
        return appliedCount
      } catch (error) {
        console.error('[earlyWin] failed to update selections', error)
        emitter.emit('showErrorMessage', 'Unable to update early win selections right now.')
        return 0
      } finally {
        this.isEarlyWinLoading = false
      }
    },
    hasSplitSelections(selections = this.coupon.selections) {
      if (!Array.isArray(selections)) return false
      const counts = {}
      for (const selection of selections) {
        const key = String(
          selection?.matchId || selection?.match_id || selection?.fixture?.matchID || ''
        )
        if (!key) continue
        counts[key] = (counts[key] || 0) + 1
        if (counts[key] > 1) return true
      }
      return false
    },
    recalculateCombos() {
      if (this.coupon.betslip_type !== 'Combo' && this.coupon.bet_type !== 'Combo') return
      const previousCombos = Array.isArray(this.coupon.combos) ? this.coupon.combos : []
      const calculatedGroup = couponCalculation.calcCombinations(this.coupon)
      const previousStakes = previousCombos
        .map((combo) => Number(combo?.Stake ?? combo?.stake ?? 0))
        .filter((stake) => Number.isFinite(stake) && stake > 0)
      const hasCommonStake =
        previousStakes.length > 0 && previousStakes.every((stake) => stake === previousStakes[0])
      const commonStake = hasCommonStake ? previousStakes[0] : null
      const mergedCombos = calculatedGroup.Groups.map((group) => {
        let stake = 0
        if (commonStake !== null) {
          stake = commonStake
        } else {
          const match = previousCombos.find(
            (combo) => Number(combo?.Grouping) === Number(group?.Grouping)
          )
          stake = Number(match?.Stake ?? match?.stake ?? 0) || 0
        }
        return {
          ...group,
          Stake: stake
        }
      })
      this.coupon.combos = mergedCombos
      const totalStake = mergedCombos.reduce((sum, combo) => {
        const comboStake = Number(combo?.Stake ?? 0)
        const combinations = Number(combo?.Combinations ?? 0)
        if (!Number.isFinite(comboStake) || comboStake <= 0) return sum
        if (!Number.isFinite(combinations) || combinations <= 0) return sum
        return sum + comboStake * combinations
      }, 0)
      if (totalStake > 0) {
        this.coupon.totalStake = totalStake
        this.coupon.stake = totalStake
      }
    },
    clearBankers() {
      if (!Array.isArray(this.coupon.selections) || this.coupon.selections.length === 0) return
      let changed = false
      const updatedSelections = this.coupon.selections.map((selection) => {
        if (selection.fixed) {
          changed = true
          return { ...selection, fixed: false }
        }
        return selection
      })
      if (!changed) return
      this.coupon.selections = updatedSelections
      this.recalculateCombos()
      this.updateWinnings({
        stake: this.coupon.totalStake,
        id: 'all'
      })
    },
    toggleBanker(selection) {
      if (!selection) return
      if (this.hasSplitSelections()) {
        emitter.emit('showErrorMessage', 'Bankers are not available for split bets.')
        return
      }
      const targetKey = this.getSelectionKey(selection)
      if (!targetKey) return
      let changed = false
      const updatedSelections = this.coupon.selections.map((item) => {
        if (this.getSelectionKey(item) === targetKey) {
          const nextFixed = !item.fixed
          if (nextFixed !== item.fixed) {
            changed = true
          }
          return { ...item, fixed: nextFixed }
        }
        return item
      })
      if (!changed) return
      this.coupon.selections = updatedSelections
      this.recalculateCombos()
      this.updateWinnings({
        stake: this.coupon.totalStake,
        id: 'all'
      })
    },
    manageSubscription(selection, isAdding = true) {
      try {
        if (!selection) {
          // console.warn(
          //   "📊 Betslip: Cannot manage subscription - selection is null/undefined",
          // );
          return
        }

        const matchId = String(selection.matchId || selection.fixture?.matchID)
        if (!matchId) {
          // console.warn(
          //   "📊 Betslip: Cannot manage subscription - matchId is missing",
          // );
          return
        }

        const type = selection.type
        if (!type) {
          // console.warn(
          //   "📊 Betslip: Cannot manage subscription - type is missing",
          // );
          return
        }

        const sportId =
          selection.sportId ||
          selection.fixture?.sportID ||
          selection.fixture?.sport_id ||
          selection.sportID ||
          1
        const baseTopic = `sports/${sportId}/match/${matchId}`
        const oddsChangeTopic = `${baseTopic}/markets`
        const betStopTopic = `${baseTopic}/bet_stop`
        const subscriptionKey = `${type}:${matchId}`

        if (isAdding) {
          if (!this.activeSubscriptions.some((sub) => sub.key === subscriptionKey)) {
            const unsubscribeOdds = subscribe(oddsChangeTopic, (data) => {
              this.handleOddsChange(data, selection)
            })
            const unsubscribeBetStop = subscribe(betStopTopic, (data) => {
              this.handleBetStop(data, selection)
            })
            this.activeSubscriptions.push({
              key: subscriptionKey,
              matchId,
              type,
              oddsChangeTopic,
              betStopTopic,
              unsubscribeOdds,
              unsubscribeBetStop
            })
          }
        } else {
          const hasOtherSelectionsFromMatch = this.coupon.selections.some(
            (s) =>
              String(s.matchId || s.fixture?.matchID) === matchId &&
              String(s.type || '') === String(type || '') &&
              s.selectionId !== selection.selectionId
          )
          if (!hasOtherSelectionsFromMatch) {
            const subscription = this.activeSubscriptions.find(
              (sub) => sub.key === subscriptionKey
            )
            if (subscription) {
              try {
                if (typeof subscription.unsubscribeOdds === 'function') {
                  subscription.unsubscribeOdds()
                }
                if (typeof subscription.unsubscribeBetStop === 'function') {
                  subscription.unsubscribeBetStop()
                }
              } catch (error) {
                // console.error(
                //   "📊 Betslip: Error unsubscribing from topics:",
                //   error,
                // );
              }
              this.activeSubscriptions = this.activeSubscriptions.filter(
                (sub) => sub.key !== subscriptionKey
              )
            }
          }
        }
      } catch (error) {
        // console.error("📊 Betslip: Error in manageSubscription:", error);
      }
    },
    setActiveKeyboardKey(key) {
      this.activeKeyboardKey = key
    },
    setStakeCache(betslipType, value) {
      if (!this.betslipStakeCache || !betslipType) return
      const normalized = Number(value)
      this.betslipStakeCache[betslipType] = Number.isFinite(normalized) ? normalized : null
    },
    async setBetslipMode(nextMode) {
      this.mode = nextMode

      // Sim mode only supports Multiple bets — force the switch so Single
      // and Combo (System) coupons aren't simulated with an incompatible type.
      if (nextMode === 'sim' && this.coupon.betslip_type !== 'Multiple') {
        await this.setBetType('Multiple')
        return
      }

      // Keep stake initialized to min stake when toggling mode (unless user cleared to 0).
      const isCombo = this.coupon.betslip_type === 'Combo' || this.coupon.bet_type === 'Combo'
      const minStake = this.getMinStakeForBetslipType(isCombo ? 'Combo' : 'Single')
      const currentStake = Number(this.coupon.totalStake || 0)
      if (minStake > 0 && (!Number.isFinite(currentStake) || currentStake === 0)) {
        if (isCombo && Array.isArray(this.coupon.combos) && this.coupon.combos.length > 0) {
          this.updateComboWinnings(minStake, null)
        } else {
          this.updateWinnings({
            stake: minStake,
            id: 'all'
          })
        }
      }
    },
    handleOddsChange(data, selection) {
      if (!data) return

      const matchId = selection.matchId || selection.fixture?.matchID
      const dataMatchId = data.event_id || data.match_id

      // If the data doesn't match our event, ignore it
      if (dataMatchId && String(dataMatchId) !== String(matchId)) {
        // console.log('📊 Betslip: Ignoring odds change for match ID', dataMatchId, 'our match ID is', matchId);
        return
      }

      // console.log('📊 Betslip: Processing odds change for match ID', matchId);

      const normalizedMarkets = Array.isArray(data.markets)
        ? data.markets.map((market) => ({
            id: market.id ?? market.market_id ?? market.marketID,
            statusName: market.status_name ?? market.statusName ?? '',
            specifier: market.specifiers ?? market.specifier ?? '',
            outcomes: (market.outcomes || []).map((outcome) => ({
              id: outcome.id ?? outcome.outcome_id ?? outcome.outcomeID,
              odds: outcome.odds,
              active: outcome.active
            }))
          }))
        : data.market_id !== undefined || data.marketID !== undefined
          ? [
              {
                id: data.market_id ?? data.marketID,
                statusName: data.status_name ?? data.statusName ?? '',
                specifier: data.specifier ?? data.specifiers ?? '',
                outcomes: (data.outcomes || []).map((outcome) => ({
                  id: outcome.id ?? outcome.outcome_id ?? outcome.outcomeID,
                  odds: outcome.odds,
                  active: outcome.active
                }))
              }
            ]
          : []
      let updatedAnySelection = false

      if (normalizedMarkets.length > 0) {
        // Find all selections from this match
        const matchSelections = this.coupon.selections.filter(
          (sel) =>
            String(sel.matchId) === String(matchId) ||
            String(sel.fixture?.matchID) === String(matchId)
        )

        matchSelections.forEach((selection) => {
          const marketId = selection.marketId || selection.market_id
          const outcomeId = selection.outcomeId || selection.odd_id
          const selectionSpecifier = String(selection.specifier || '')

          // Find the market
          const market = normalizedMarkets.find(
            (m) =>
              String(m.id) === String(marketId) &&
              String(m.specifier || '') === selectionSpecifier
          )
          if (market && market.outcomes) {
            // Find the outcome
            const outcome = market.outcomes.find((o) => String(o.id) === String(outcomeId))
            const marketStatus = String(market.statusName || '').toLowerCase()

            if (outcome || marketStatus) {
              // console.log('📊 Betslip: Found outcome', outcome);
              const isMarketUnavailable =
                marketStatus === 'deactivated' ||
                marketStatus === 'settled' ||
                marketStatus === 'handedover'
              const isSuspended = marketStatus === 'suspended' || !outcome?.active

              if (isMarketUnavailable || isSuspended) {
                // If outcome is not active, suspend the selection
                // console.log(`📊 Betslip: Outcome not active, suspending selection for match ID ${matchId}`);
                const nextSuspended = true
                const nextUnavailable = isMarketUnavailable
                const nextOdds = isMarketUnavailable ? 0 : Number(outcome?.odds ?? selection.odds)

                if (
                  selection.suspended !== nextSuspended ||
                  selection.unavailable !== nextUnavailable ||
                  Number(selection.odds) !== nextOdds
                ) {
                  selection.suspended = nextSuspended
                  selection.unavailable = nextUnavailable
                  selection.odds = nextOdds
                  // Only require acceptance when data changes (not when adding selections).
                  this.coupon.acceptChanges = false
                  updatedAnySelection = true
                }
              } else {
                // If outcome is active, make sure it's not suspended
                if (selection.suspended || selection.unavailable) {
                  // console.log(`📊 Betslip: Reactivating previously suspended selection for match ID ${matchId}`);
                  selection.suspended = false
                  selection.unavailable = false
                  // Reactivations from feeds still count as data changes needing acceptance.
                  this.coupon.acceptChanges = false
                  updatedAnySelection = true
                }

                // Update odds if they've changed (compare as numbers to avoid type issues)
                const newOdds = parseFloat(outcome.odds)
                const currentOdds = parseFloat(selection.odds)
                if (newOdds !== currentOdds && !isNaN(newOdds)) {
                  selection.odds = newOdds
                  selection.changed = true
                  this.coupon.acceptChanges = false // Require user to accept changes
                  updatedAnySelection = true

                  // Reset the changed flag after 5 seconds
                  setTimeout(() => {
                    selection.changed = false
                  }, 5000)
                }
              }
            }
          }
        })

        // Only update winnings if we actually changed any selections
        if (updatedAnySelection) {
          this.updateWinnings({
            stake: this.coupon.totalStake,
            id: 'all'
          })
        }
      }
    },
    handleBetStop(data, selection) {
      const matchId = selection.matchId || selection.fixture?.matchID
      const dataMatchId = data.event_id || data.match_id

      if (dataMatchId && String(dataMatchId) !== String(matchId)) {
        // console.log(`📊 Betslip: Ignoring bet stop for match ID ${dataMatchId}, our match ID is ${matchId}`);
        return
      }

      // console.log(`⚠️ BET STOP: Processing bet stop for match ID ${matchId}`);

      // Find all selections from this match
      const matchSelections = this.coupon.selections.filter(
        (sel) =>
          String(sel.matchId) === String(matchId) ||
          String(sel.fixture?.matchID) === String(matchId)
      )

      if (matchSelections.length > 0) {
        matchSelections.forEach((selection) => {
          selection.suspended = true
          selection.unavailable = true
          selection.odds = 0
        })
        // Bet stop is a data change; force acceptChanges.
        this.coupon.acceptChanges = false

        this.coupon.acceptChanges = false // Require user to accept changes

        // Force a reactivity update
        this.updateWinnings({
          stake: this.coupon.totalStake,
          id: 'all'
        })
      }
    },
    async addToCoupon(selection) {
      // Adding selections should not clear pending odds-change acceptance.
      const hasPendingChanges = this.coupon.selections.some(
        (sel) => sel?.changed || sel?.suspended || sel?.unavailable
      )
      if (!hasPendingChanges) {
        this.coupon.acceptChanges = true
      }
      const couponPayload = selection

      let type = couponPayload.type
      const accaBonusConfig = this.getAccaBonusConfig()

      const data = this.normalizeSelectionEarlyWinState(getDataFromPayload(couponPayload))
      if (this.coupon.useEarlyGoal && data.supportsEarlyGoal && data.earlyGoalLocalQuotes?.earlygoal) {
        this.updateSelectionEarlyGoalState(data, 'earlygoal', data.earlyGoalLocalQuotes.earlygoal)
      }
      const selectionType = String(type || data.type || '').toLowerCase()
      const totalSelectionLimit = this.getSelectionLimit()
      const liveSelectionLimit = this.getLiveSelectionLimit()
      const hasExistingSelectionFromMatch = this.coupon.selections.some(
        (item) => String(item.matchId) === String(data.matchId)
      )

      if (selectionType === 'live' && !this.isLiveBetEnabled()) {
        emitter.emit('showErrorMessage', 'Live bets are currently unavailable.')
        return null
      }

      if (selectionType !== 'live' && !this.isPrematchBetEnabled()) {
        emitter.emit('showErrorMessage', 'Prematch bets are currently unavailable.')
        return null
      }

      if (totalSelectionLimit > 0 && this.coupon.selections.length >= totalSelectionLimit) {
        emitter.emit(
          'showErrorMessage',
          `You can only add up to ${totalSelectionLimit} selections to this betslip.`
        )
        return null
      }

      if (
        selectionType === 'live' &&
        liveSelectionLimit > 0 &&
        this.getLiveSelectionCount() >= liveSelectionLimit
      ) {
        emitter.emit(
          'showErrorMessage',
          `You can only add up to ${liveSelectionLimit} live selections to this betslip.`
        )
        return null
      }

      if (hasExistingSelectionFromMatch && !this.isSplitBetEnabled()) {
        emitter.emit(
          'showErrorMessage',
          'Multiple selections from the same fixture are currently unavailable.'
        )
        return null
      }

      let couponData = { ...this.coupon }

      this.coupon.event_type = type

      if (!this.coupon.selections.length) {
        //add selection to selections list
        this.coupon.selections.push(data)
        this.syncEarlyGoalStateFromSelections()

        this.coupon.bet_type = 'Single'
        this.coupon.betslip_type = 'Single'
        this.coupon.totalOdds = (parseFloat(this.coupon.totalOdds) * parseFloat(data.odds)).toFixed(
          2
        )

        //calculate and get pot winnings with bonus
        const winnings = calculateWinnings(this.coupon, accaBonusConfig)
        // console.log(winnings)
        this.coupon.maxWin = winnings.maxWin
        this.coupon.maxBonus = winnings.maxBonus
        this.coupon.wthTax = winnings.wthTax
        this.coupon.grossWin = winnings.grossWin
        this.coupon.fixtures = groupSelections(this.coupon.selections)
        this.coupon.tournaments = groupTournament(this.coupon.selections)
        // check if event is live
        if (type === 'live') this.coupon.hasLive = true
      } else {
        this.coupon.betslip_type = 'Multiple'
        this.coupon.bet_type = 'Multiple'

        for (let i = 0; i < couponData.selections.length; i++) {
          if (couponData.selections[i].matchId === data.matchId) {
            //add selection to selections list
            this.coupon.selections.push(data)
            this.syncEarlyGoalStateFromSelections()
            // const bonus = calculateBonus(this.coupon, globalVars, bonusList);
            // console.log(bonus, "bon");
            //group selections by match
            this.coupon.tournaments = groupTournament(this.coupon.selections)
            this.coupon.fixtures = groupSelections(this.coupon.selections)

            // con
            //bet type
            this.coupon.bet_type = 'Split'
            this.coupon.betslip_type = 'Multiple'
            this.accaBonusPreviewRequestId += 1
            this.clearCutOnePreview({ resetSelection: true })
            this.clearFlexPreview({ resetSelection: true })
            this.clearBankers()

            const splitProps = await getSplitProps(this.coupon)
            //calculate winnings
            let minStake =
              splitProps.minStake !== undefined && splitProps.minStake !== ''
                ? splitProps.minStake
                : this.coupon.stake || this.getMinStakeForBetslipType('Single') || 0
            minStake = Number(minStake) || 0
            this.coupon.stake = minStake
            const minWinnings = parseFloat(splitProps.minOdds) * parseFloat(minStake)
            const maxWinnings = parseFloat(splitProps.maxOdds) * parseFloat(minStake)

            //calculate bonus
            this.coupon.minBonus = calculateBonus(this.coupon, accaBonusConfig)

            this.coupon.minGrossWin = parseFloat(splitProps.minBonus) + minWinnings
            this.coupon.minWTH = ((this.coupon.minGrossWin - this.coupon.stake) * WTH_PERC) / 100
            this.coupon.minWin = this.coupon.minGrossWin - this.coupon.minWTH
            this.coupon.grossWin = parseFloat(splitProps.maxBonus) + maxWinnings
            this.coupon.wthTax = ((this.coupon.grossWin - this.coupon.stake) * WTH_PERC) / 100
            this.coupon.maxWin = this.coupon.grossWin - this.coupon.wthTax

            const calculatedGroup = couponCalculation.calcCombinations(this.coupon)
            this.coupon.combos = calculatedGroup.Groups

            return
          }
        }

        //add selection to selections list
        this.coupon.selections.push(data)
        this.syncEarlyGoalStateFromSelections()
        // const bonus = calculateBonus(this.coupon, globalVars, bonusList);
        // console.log(bonus, "bon");

        this.coupon.totalOdds = (parseFloat(this.coupon.totalOdds) * parseFloat(data.odds)).toFixed(
          2
        )

        //group selections by match
        this.coupon.tournaments = groupTournament(this.coupon.selections)
        this.coupon.fixtures = groupSelections(this.coupon.selections)
        //check bet type
        this.coupon.bet_type = checkBetType(this.coupon.fixtures)
        this.coupon.betslip_type = 'Multiple'
        if (this.coupon.bet_type === 'Split') {
          this.clearBankers()
          const calculatedGroup = couponCalculation.calcCombinations(this.coupon)
          this.coupon.combos = calculatedGroup.Groups
        }
        // check if event is live

        if (type === 'live') this.coupon.hasLive = true

        if (this.coupon.bet_type === 'Split') {
          this.accaBonusPreviewRequestId += 1
          this.clearCutOnePreview({ resetSelection: true })
          this.clearFlexPreview({ resetSelection: true })
          this.clearBankers()
          const splitProps = await getSplitProps(this.coupon)

          const minStake =
            splitProps.minStake !== undefined && splitProps.minStake !== ''
              ? splitProps.minStake
              : this.coupon.stake || this.getMinStakeForBetslipType('Single') || 0
          this.coupon.minStake = Number(minStake) || 0
          this.coupon.stake = this.coupon.minStake

          //calculate winnings
          const minWinnings = parseFloat(splitProps.minOdds) * parseFloat(this.coupon.minStake)
          const maxWinnings = parseFloat(splitProps.maxOdds) * parseFloat(this.coupon.minStake)
          //calculate bonus
          this.coupon.minBonus = calculateBonus(this.coupon, accaBonusConfig)

          this.coupon.minGrossWin = parseFloat(this.coupon.minBonus) + minWinnings
          this.coupon.minWTH = ((this.coupon.minGrossWin - this.coupon.stake) * WTH_PERC) / 100
          this.coupon.minWin = this.coupon.minGrossWin - this.coupon.minWTH
          this.coupon.grossWin = parseFloat(splitProps.maxBonus) + maxWinnings
          const wthTax = ((this.coupon.grossWin - this.coupon.stake) * WTH_PERC) / 100
          this.coupon.wthTax = wthTax < 1 ? 0 : wthTax
          this.coupon.maxWin = this.coupon.grossWin - this.coupon.wthTax

          return
        } else {
          const calculatedGroup = couponCalculation.calcCombinations(this.coupon)
          this.coupon.combos = calculatedGroup.Groups
          //calculate and get pot winnings with bonus
          if (this.coupon.bet_type === 'Combo') {
            // dispatch({ type: SET_COUPON_DATA, payload: couponData });
            if (this.coupon.Groupings && couponData.Groupings.length) {
              // updateComboWinningsFromTotal()
            }
          } else {
            await this.refreshMultipleBetslipPreview()
          }
        }
      }

      // After successfully adding selection, subscribe to its updates
      this.manageSubscription(selection, true)
    },
    buildCouponPayloadFromLoadedSelection(selection = {}) {
      const matchId = selection.matchId || selection.match_id || selection.eventId || selection.event_id
      const marketId = Number(selection.marketId || selection.market_id || 0)
      const outcomeId = selection.outcomeId || selection.outcome_id || selection.odd_id
      const eventName = selection.eventName || selection.event_name || ''
      const [homeTeam = '', awayTeam = ''] = eventName.split(/\s+vs\.?\s+/i)
      const marketName = selection.marketName || selection.market_name || ''
      const outcomeName = selection.outcomeName || selection.outcome_name || ''
      const startTime = selection.startTime || selection.eventDate || selection.event_date || selection.date
      const sportId = selection.sportId || selection.sportID || selection.sport_id
      const producerId = selection.producerId || selection.producerID || selection.producer_id
      const specifier = selection.specifier || ''
      const inferredDerivedMarketIds = [60100, 60200, EARLY_GOAL_DERIVED_MARKET_ID].includes(marketId)
        ? [marketId]
        : []
      const loadedOutcome = {
        outcomeID: outcomeId,
        outcomeName,
        displayName: selection.displayName || outcomeName,
        odds: selection.odds,
        probability: selection.probability,
        active: selection.active ?? 1,
        producerID: producerId,
        marketID: marketId,
        specifier
      }

      const fixture = {
        matchID: matchId,
        gameID: selection.eventId || selection.event_id || matchId,
        name: eventName,
        date: startTime,
        tournament: selection.tournament || selection.tournamentName || '',
        categoryName: selection.category || selection.categoryName || '',
        sportName: selection.sport || selection.sportName || '',
        sportID: sportId,
        producerID: producerId,
        homeTeam: selection.homeTeam || homeTeam.trim(),
        awayTeam: selection.awayTeam || awayTeam.trim(),
        combinability: selection.combinability || 0,
        derived_market_ids: [
          ...new Set(
            [
              ...(Array.isArray(selection.supportedDerivedMarketIds)
                ? selection.supportedDerivedMarketIds
                : []),
              ...(Array.isArray(selection.supportedEarlyGoalMarketIds)
                ? selection.supportedEarlyGoalMarketIds
                : []),
              ...(Array.isArray(selection.derived_market_ids)
                ? selection.derived_market_ids
                : selection.derived_market_id != null
                  ? [selection.derived_market_id]
                  : []),
              ...inferredDerivedMarketIds
            ]
              .map(Number)
              .filter((value) => Number.isFinite(value) && value > 0)
          )
        ],
        outcomes: Array.isArray(selection.outcomes) && selection.outcomes.length
          ? selection.outcomes
          : [loadedOutcome]
      }
      const market = {
        marketID: marketId,
        marketName,
        specifier
      }
      const outcome = {
        outcomeID: outcomeId,
        outcomeName,
        displayName: selection.displayName || outcomeName,
        odds: selection.odds,
        probability: selection.probability,
        active: selection.active ?? 1,
        producerID: producerId,
        specifier:
          selection.selectionKeySpecifier ??
          selection.baseSelectionKeySpecifier ??
          specifier
      }

      return {
        ...buildCouponSelectionPayload({
          fixture,
          market,
          outcome,
          type: selection.type || (selection.isLive ? 'live' : 'prematch')
        }),
        fixture: {
          ...fixture
        },
        outcome: {
          ...outcome
        },
        odds: selection.odds,
        odd_id: outcomeId,
        odd_name: outcomeName,
        type: selection.type || (selection.isLive ? 'live' : 'prematch')
      }
    },
    async rebuildBetslipFromLoadedSelections(loadedData) {
      const selections = Array.isArray(loadedData)
        ? loadedData
        : Array.isArray(loadedData?.selections)
          ? loadedData.selections
          : []

      this.clearBetslip()

      const activeSelections = selections.filter((selection) => {
        const matchId = selection?.matchId || selection?.match_id || selection?.eventId || selection?.event_id
        const marketId = selection?.marketId || selection?.market_id
        const outcomeId = selection?.outcomeId || selection?.outcome_id || selection?.odd_id
        const odds = Number(selection?.odds)
        const statusName = String(selection?.statusName || '').toLowerCase()
        return (
          matchId &&
          marketId &&
          outcomeId &&
          Number.isFinite(odds) &&
          odds > 1 &&
          Number(selection?.active ?? 1) !== 0 &&
          statusName !== 'suspended' &&
          statusName !== 'deactivated'
        )
      })

      for (const selection of activeSelections) {
        await this.addToCoupon(this.buildCouponPayloadFromLoadedSelection(selection))
      }

      this.coupon.source = 'mobile'
      return this.coupon.selections.length
    },
    async removeSelection(id) {
      const res = this.coupon.selections ? [...this.coupon.selections] : []
      const data = res.find((item) => item.selectionId === id || item.id === id)
      // Call manageSubscription after updating selections array
      if (data) {
        this.manageSubscription(data, false)
      }

      const accaBonusConfig = this.getAccaBonusConfig()
      const newSelection = this.coupon.selections.filter(
        (item) => item.selectionId !== id && item.id !== id
      )

      this.coupon.selections = newSelection
      this.syncEarlyGoalStateFromSelections(newSelection)

      if (this.coupon.selections.length > 0) {
        const prevBetType = this.coupon.bet_type
        this.coupon.tournaments = groupTournament(this.coupon.selections)
        this.coupon.fixtures = groupSelections(this.coupon.selections)

        if (this.coupon.selections.length === 1) {
          this.coupon.bet_type = 'Single'
          this.coupon.betslip_type = 'Single'
          this.accaBonusPreviewRequestId += 1
          this.clearCutOnePreview({ resetSelection: true })
          this.clearFlexPreview({ resetSelection: true })
        } else {
          this.coupon.bet_type = checkBetType(this.coupon.fixtures)
        }

        if (this.coupon.bet_type === 'Split') {
          this.accaBonusPreviewRequestId += 1
          this.clearCutOnePreview({ resetSelection: true })
          this.clearFlexPreview({ resetSelection: true })
          const splitProps = await getSplitProps(this.coupon)
          //calculate winnings
          const minWinnings = parseFloat(splitProps.minOdds) * parseFloat(splitProps.minStake)
          const maxWinnings = parseFloat(splitProps.maxOdds) * parseFloat(splitProps.minStake)
          //calculate bonus
          this.coupon.minBonus = calculateBonus(this.coupon, accaBonusConfig)

          this.coupon.minGrossWin = parseFloat(this.coupon.minBonus) + minWinnings
          this.coupon.minWTH = ((this.coupon.minGrossWin - this.coupon.stake) * WTH_PERC) / 100
          this.coupon.minWin = this.coupon.minGrossWin - this.coupon.minWTH
          this.coupon.grossWin = parseFloat(this.coupon.maxBonus) + maxWinnings
          this.coupon.wthTax = ((this.coupon.grossWin - this.coupon.stake) * WTH_PERC) / 100
          this.coupon.maxWin = this.coupon.grossWin - this.coupon.wthTax
        } else {
          if (prevBetType === 'Split') {
            this.coupon.totalOdds = calculateTotalOdds(
              this.coupon.selections.filter(
                (s) => !s.suspended && !s.unavailable && parseFloat(s.odds) > 1
              )
            )
          } else {
            if (!data.suspended && !data.unavailable && parseFloat(data.odds) > 1) {
              this.coupon.totalOdds = (
                parseFloat(this.coupon.totalOdds) / parseFloat(data.odds)
              ).toFixed(2)
            }
            if (isNaN(this.coupon.totalOdds) || this.coupon.totalOdds <= 0) {
              this.coupon.totalOdds = calculateTotalOdds(
                this.coupon.selections.filter(
                  (s) => !s.suspended && !s.unavailable && parseFloat(s.odds) > 1
                )
              )
            }
          }
          this.coupon.minBonus = calculateBonus(this.coupon, accaBonusConfig)
          this.coupon.hasLive = checkIfHasLive(this.coupon.selections)

          const calculatedGroup = couponCalculation.calcCombinations(this.coupon)
          this.coupon.combos = calculatedGroup.Groups
          // couponData.combos = await getCombos(couponData);
          //calculate and get pot winnings with bonus
          if (this.coupon.bet_type === 'Combo') {
            // dispatch({ type: SET_COUPON_DATA, payload: coupondata })
            // if (coupondata.Groupings && coupondata.Groupings.length) {
            //   const calculatedCoupon = couponCalculation.calcPotentialWins(coupondata, bonusList);
            //   coupondata = coupondata.updateFromCalculatedCoupon(coupondata, calculatedCoupon);
            //   // update combos with max win
            //   coupondata.combos.forEach(combo => {
            //     for (let i = 0; i < coupondata.Groupings.length; i++) {
            //       if (combo.Grouping === coupondata.Groupings[i].Grouping) {
            //         combo.minWIn = coupondata.Groupings[i].minWin;
            //         combo.maxWin = coupondata.Groupings[i].maxWin;
            //         combo.Stake = coupondata.Groupings[i].Stake;
            //       }
            //     }
            //   })
            //   setTimeout(() => {
            //     return dispatch(updateComboWinningsFromTotal());
            //   }, 500);
            // }
          } else {
            if (this.coupon.bet_type === 'Multiple' && this.coupon.betslip_type === 'Multiple') {
              await this.refreshMultipleBetslipPreview()
            } else {
              const winnings = calculateWinnings(this.coupon, accaBonusConfig)
              this.coupon.maxWin = winnings.maxWin
              this.coupon.maxBonus = winnings.maxBonus
              this.coupon.wthTax = winnings.wthTax
              this.coupon.grossWin = winnings.grossWin
            }
          }
        }
      } else {
        const coupon = {
          acceptChanges: true,
          selections: [],
          combos: [],
          totalOdds: 1,
          maxBonus: 0,
          minBonus: 0,
          grossWin: 0,
          maxWin: 0,
          minWin: 0,
          stake: 100,
          totalStake: 100,
          minOdds: 1,
          maxOdds: 1,
          wthTax: 0,
          exciseDuty: 0,
          useBonus: false,
          useCashback: false,
          useCutOne: false,
          useFlex: false,
          source: 'mobile'
        }
        this.accaBonusPreviewRequestId += 1
        this.clearCutOnePreview()
        this.clearFlexPreview()
        this.coupon = coupon
      }
    },
    async updateWinnings(payload) {
      const { stake, id, skipPreview = false } = payload
      const coupondata = JSON.parse(JSON.stringify(this.coupon))
      const accaBonusConfig = this.getAccaBonusConfig()

      // Filter out suspended or unavailable selections
      const activeSelections = this.coupon.selections.filter((selection) => {
        return !selection.suspended && !selection.unavailable && parseFloat(selection.odds) > 1
      })

      if (stake === '') {
        this.coupon.stake = ''
        this.coupon.totalStake = ''
        // Clearing stake should also clear the cached value for this mode.
        this.setStakeCache(this.coupon.betslip_type, null)

        if (this.coupon.betslip_type == 'Single') {
          if (id === 'all') {
            // Update only active selections
            const newSelections = this.coupon.selections.map((item) => {
              const newItem = Object.assign({}, item)
              // Only clear stake for active selections
              if (!newItem.suspended && !newItem.unavailable && parseFloat(newItem.odds) > 1) {
                newItem.stake = ''
              }
              return newItem
            })
            this.coupon.selections = newSelections
            return
          }

          let totalStake = 0
          let minWin = []
          let maxWin = 0

          // Update selections but only calculate for active ones
          const newSelections = this.coupon.selections.map((item) => {
            const newItem = Object.assign({}, item)

            // Only update the specific selection if it's active
            if (
              item.selectionId === id &&
              !item.suspended &&
              !item.unavailable &&
              parseFloat(item.odds) > 1
            ) {
              newItem.stake = 0
            }

            // Only include active selections in calculations
            if (!newItem.suspended && !newItem.unavailable && parseFloat(newItem.odds) > 1) {
              totalStake += parseFloat(newItem.stake || 0)
              if (newItem.stake !== 0) {
                minWin.push(newItem.odds * newItem.stake)
                maxWin += newItem.odds * parseFloat(newItem.stake)
              }
            }

            return newItem
          })

          this.coupon.selections = newSelections
          this.coupon.totalStake = totalStake
          this.coupon.minWin = minWin.length > 0 ? Math.min(...minWin) : 0
          this.coupon.maxWin = maxWin
        }
      }

      if (stake !== '') {
        if (this.coupon.betslip_type === 'Single' || this.coupon.bet_type === 'Single') {
          let maxWin = 0
          let minWin = []
          let totalStake = 0

          // Only use active selections for odds calculations
          const activeOdds = activeSelections.map((s) => parseFloat(s.odds))
          const maxOdds = activeOdds.length > 0 ? Math.max(...activeOdds) : 0
          const minOdds = activeOdds.length > 0 ? Math.min(...activeOdds) : 0

          if (id === 'all') {
            const stakePerBet = parseFloat(stake)
            this.coupon.stake = stake // set new total stake
            this.coupon.totalStake = stake * this.coupon.selections.length

            // Update all selections but only calculate for active ones
            const updatedSelections = this.coupon.selections.map((selection) => {
              const updatedSelection = { ...selection }

              // Only set stake for active selections
              if (
                !updatedSelection.suspended &&
                !updatedSelection.unavailable &&
                parseFloat(updatedSelection.odds) > 1
              ) {
                updatedSelection.stake = stakePerBet
                maxWin += updatedSelection.odds * stakePerBet
                minWin.push(updatedSelection.odds * stakePerBet)
                totalStake += stakePerBet
              } else {
                updatedSelection.stake = 0
              }

              return updatedSelection
            })

            this.coupon.selections = updatedSelections
            this.coupon.stake = stake
            this.coupon.maxWin = maxWin
            this.coupon.minWin = minWin.length > 0 ? Math.min(...minWin) : 0
            this.coupon.totalStake = totalStake
            // Persist per-bet stake for Single mode.
            this.setStakeCache('Single', stake)
          } else if (id === 'single') {
            // For single selection bet
            const selection = this.coupon.selections[0]

            // Only calculate if selection is active
            if (!selection.suspended && !selection.unavailable && parseFloat(selection.odds) > 1) {
              this.coupon.stake = stake
              this.coupon.totalStake = parseFloat(stake)
              this.coupon.maxWin = selection.odds * parseFloat(stake)
            } else {
              this.coupon.stake = stake
              this.coupon.totalStake = parseFloat(stake)
              this.coupon.maxWin = 0
            }
            // Persist per-bet stake for Single mode.
            this.setStakeCache('Single', stake)
          } else {
            // For updating a specific selection
            const index = this.coupon.selections.findIndex((i) => i.selectionId === id)

            if (index !== -1) {
              const updatedSelections = [...this.coupon.selections]

              // Only update stake if selection is active
              if (
                !updatedSelections[index].suspended &&
                !updatedSelections[index].unavailable &&
                parseFloat(updatedSelections[index].odds) > 1
              ) {
                updatedSelections[index].stake = parseFloat(stake)
              }

              // Calculate totals using only active selections
              updatedSelections.forEach((selection) => {
                if (
                  !selection.suspended &&
                  !selection.unavailable &&
                  parseFloat(selection.odds) > 1 &&
                  parseFloat(selection.stake) > 0
                ) {
                  maxWin += selection.odds * parseFloat(selection.stake)
                  minWin.push(selection.odds * selection.stake)
                  totalStake += parseFloat(selection.stake)
                }
              })

              this.coupon.selections = updatedSelections
              this.coupon.stake = ''
              this.coupon.maxWin = maxWin
              this.coupon.minWin = minWin.length > 0 ? Math.min(...minWin) : 0
              this.coupon.totalStake = totalStake
              // Persist per-bet stake for Single mode.
              this.setStakeCache('Single', stake)
            }
          }

          this.coupon.totalOdds = parseFloat(maxOdds).toFixed(2)
          this.coupon.minOdds = parseFloat(minOdds).toFixed(2)
          this.accaBonusPreviewRequestId += 1
          this.clearCutOnePreview({ resetSelection: true })
          this.clearFlexPreview({ resetSelection: true })
          this.coupon.maxBonus = 0
          this.coupon.grossWin = Number(this.coupon.maxWin || 0)
          this.coupon.wthTax = 0
        } else {
          // For multiple bets, only use active selections
          if (activeSelections.length === 0) {
            // No valid selections for multiple bet
            this.coupon.totalOdds = '0.00'
            this.coupon.totalStake = parseFloat(stake) // Keep the stake as entered
            this.coupon.exciseDuty = 0
            this.coupon.stake = this.coupon.totalStake
            this.coupon.maxWin = 0
            this.coupon.maxBonus = 0
            this.coupon.wthTax = 0
            this.coupon.grossWin = 0
            this.clearCutOnePreview({ resetSelection: true })
            this.clearFlexPreview({ resetSelection: true })
          } else {
            // Calculate total odds using only active selections
            this.coupon.totalOdds = calculateTotalOdds(activeSelections).toFixed(2)
            this.coupon.totalStake = parseFloat(stake)
            this.coupon.exciseDuty = (this.coupon.totalStake * 0) / 100
            this.coupon.stake = this.coupon.totalStake - this.coupon.exciseDuty

            // Create a modified coupon with only active selections for winnings calculation
            const activeCoupon = {
              ...this.coupon,
              selections: activeSelections
            }

            if (this.coupon.bet_type === 'Split' && this.coupon.betslip_type === 'Multiple') {
              this.accaBonusPreviewRequestId += 1
              this.clearCutOnePreview({ resetSelection: true })
              this.clearFlexPreview({ resetSelection: true })
              // Split bets need server-calculated min/max wins based on current stake.
              try {
                const updated = await getSplitProps(this.coupon)
                // Cache the latest split props so we can reuse them if the API is unavailable.
                this.coupon.lastSplitProps = {
                  minWin: updated.minWin,
                  maxWin: updated.maxWin,
                  minOdds: updated.minOdds,
                  maxOdds: updated.maxOdds,
                  maxBonus: updated.maxBonus
                }
              } catch (error) {
                // Fall back to cached split props when the endpoint is unavailable.
                if (this.coupon.lastSplitProps) {
                  const cached = this.coupon.lastSplitProps
                  this.coupon.minWin = cached.minWin
                  this.coupon.maxWin = cached.maxWin
                  this.coupon.minOdds = cached.minOdds
                  this.coupon.maxOdds = cached.maxOdds
                  this.coupon.maxBonus = cached.maxBonus
                }
              }
              // Enforce non-zero minWin for split bets (avoid "0.00 ~ maxWin").
              if (!this.coupon.minWin || Number(this.coupon.minWin) <= 0) {
                const fallback = Number(this.coupon.maxWin || 0)
                if (fallback > 0) {
                  this.coupon.minWin = fallback
                }
              }
              return
            }
            // Preview endpoints should only run on betlist mutations, not on open-time validation.
            if (!skipPreview) {
              await this.refreshMultipleBetslipPreview()
            } else if (
              !Number(this.coupon.maxWin || 0) &&
              !Number(this.coupon.grossWin || 0) &&
              !Number(this.coupon.maxBonus || 0)
            ) {
              this.applyAccumulatorBaseWinnings(activeSelections)
            }
          }
        }
      }
      // Persist stake for Multiple mode after recalculation.
      if (this.coupon.betslip_type === 'Multiple') {
        this.setStakeCache('Multiple', this.coupon.totalStake)
      }
    },
    updateComboWinnings(val, combo) {
      this.accaBonusPreviewRequestId += 1
      this.clearCutOnePreview({ resetSelection: true })
      this.clearFlexPreview({ resetSelection: true })
      let coupondata = { ...this.coupon };
      let stake = val;
      if (stake === '') {
        stake = 0;
      } else {
        stake = val
      }

      if(!combo) {// update all combo stake
        // Persist per-line stake for Combo mode.
        this.setStakeCache('Combo', stake)
        let total = 0
        coupondata.totalStake = stake;
        coupondata.exciseDuty = coupondata.totalStake * 0 / 100;
        coupondata.stake = coupondata.totalStake - coupondata.exciseDuty;
        const Groupings = [];
        // get minimum stake per combo
        let minStake = parseFloat(coupondata.stake) / coupondata.combos.length;
        let comboLength = 0;

        for (let x = 0; x < coupondata.combos.length; x++) {
          coupondata.combos[x].Stake = parseFloat(stake);;
          comboLength += coupondata.combos[x].Grouping;
          Groupings.push(coupondata.combos[x]);
        }

        coupondata.comboSelection = comboLength;
        coupondata.noOfCombos = coupondata.combos.length;
        coupondata.Groupings = Groupings;
        coupondata.minStake = parseFloat(coupondata.stake) / comboLength;

        if (coupondata.Groupings && coupondata.Groupings.length) {
          const calculatedCoupon = couponCalculation.calcPotentialWins(coupondata, this.getAccaBonusConfig());
          coupondata = couponCalculation.updateFromCalculatedCoupon(coupondata, calculatedCoupon, this.getAccaBonusConfig());
          // update combos with max win
          coupondata.combos.forEach((combo) => {
            for (let i = 0; i < coupondata.Groupings.length; i++) {
              if (combo.Grouping === coupondata.Groupings[i].Grouping) {
                combo.minWin = coupondata.Groupings[i].minWin;
                combo.maxWin = coupondata.Groupings[i].maxWin;
                combo.Stake = parseFloat(stake);
                total += parseFloat(combo.Stake) * parseFloat(coupondata.Groupings[i].Combinations);
              }
            }
          });
        }

        coupondata.totalStake = total;
        coupondata.exciseDuty = coupondata.totalStake * 0 / 100;
        coupondata.stake = coupondata.totalStake - coupondata.exciseDuty;

        this.coupon = coupondata;

      } else {// update single combo stake
        // Persist per-line stake for Combo mode.
        this.setStakeCache('Combo', stake)
        let stakeValue = Number(stake);
        if (!Number.isFinite(stakeValue)) {
          stakeValue = 0;
        }

        combo.Stake = stakeValue;

        if (!coupondata.Groupings || !coupondata.Groupings.length) {
          coupondata.Groupings = stakeValue > 0 ? [combo] : [];
        } else {
          const groupIndex = coupondata.Groupings.findIndex(function (g) { return g.Grouping === combo.Grouping; });
          if (stakeValue > 0) {
            if (groupIndex === -1) {
              coupondata.Groupings = [...coupondata.Groupings, combo];
            } else {//update combo stake
              const groupings = [...coupondata.Groupings]
              groupings[groupIndex] = combo;
              coupondata.Groupings = groupings;
            }
          } else if (groupIndex !== -1) {
            coupondata.Groupings = coupondata.Groupings.filter((group) => group.Grouping !== combo.Grouping);
          }
        }

        coupondata.Groupings = (coupondata.Groupings || []).filter((group) => {
          const groupStake = Number(group.Stake || group.stake || 0);
          return Number.isFinite(groupStake) && groupStake > 0;
        });

        if (coupondata.Groupings.length) {
          const calculatedCoupon = couponCalculation.calcPotentialWins(coupondata, this.getAccaBonusConfig());
          coupondata = couponCalculation.updateFromCalculatedCoupon(coupondata, calculatedCoupon, this.getAccaBonusConfig());
        } else {
          coupondata.minWin = 0;
          coupondata.maxWin = 0;
          coupondata.minBonus = 0;
          coupondata.maxBonus = 0;
          coupondata.minOdds = 0;
          coupondata.maxOdds = 0;
        }
        let total = 0;

        const combos = []

        // update combos with max win
        coupondata.combos.forEach((item) => {
          let comboItem = { ...item };
          comboItem.minWin = 0;
          comboItem.maxWin = 0;
          comboItem.checked = false;
          for (let i = 0; i < coupondata.Groupings.length; i++) {
            if (comboItem.Grouping === coupondata.Groupings[i].Grouping) {
              comboItem.minWin = formatNumber(coupondata.Groupings[i].minWin);
              comboItem.maxWin = formatNumber(coupondata.Groupings[i].maxWin);
              comboItem.Stake = coupondata.Groupings[i].Stake;
              comboItem.checked = true;
              total += parseFloat(comboItem.Stake) * parseFloat(coupondata.Groupings[i].Combinations);
            }
          }
          combos.push(comboItem);
        });
        coupondata.combos = combos;
        coupondata.totalStake = total;
        coupondata.exciseDuty = coupondata.totalStake * 0 / 100;
        coupondata.stake = coupondata.totalStake - coupondata.exciseDuty;

        this.coupon = coupondata;
      }
    },
    async setBetType(type) {
      if (type === 'Combo' && !this.isSystemBetEnabled()) {
        emitter.emit('showErrorMessage', 'System bets are currently unavailable.')
        return
      }

      const betslip_type = type
      if (betslip_type !== 'Combo') {
        this.clearBankers()
      }
      this.coupon.betslip_type = betslip_type

      // Recompute bet type based on current selections (handles Split when switching back).
      if (betslip_type === 'Multiple') {
        this.coupon.fixtures = groupSelections(this.coupon.selections)
        this.coupon.bet_type = checkBetType(this.coupon.fixtures)
      } else {
        this.coupon.bet_type = betslip_type
      }

      const minStake = this.getMinStakeForBetslipType(betslip_type)
      const cachedStake = this.betslipStakeCache?.[betslip_type]
      // Restore the last stake for this mode; fall back to min stake on first visit.
      const nextStake =
        Number.isFinite(Number(cachedStake)) && Number(cachedStake) > 0
          ? Number(cachedStake)
          : Number(minStake || 0)
      const selections = this.coupon.selections ? [...this.coupon.selections] : []
      this.coupon.stake = nextStake
      this.coupon.totalStake = nextStake
      this.coupon.minStake = nextStake
      this.coupon.minWin = 0
      this.coupon.minBonus = 0
      this.coupon.maxWin = 0
      this.coupon.maxBonus = 0
      if (betslip_type !== 'Multiple') {
        this.clearCutOnePreview({ resetSelection: true })
        this.clearFlexPreview({ resetSelection: true })
      }

      const newSelections = selections.map((item) => {
        const newItem = Object.assign({}, item)
        // Reset per-selection stake when toggling types.
        newItem.stake = betslip_type === 'Single' ? nextStake : ''
        return newItem
      })
      this.coupon.selections = newSelections

      if (betslip_type === 'Combo' && this.coupon.combos?.length) {
        this.accaBonusPreviewRequestId += 1
        this.clearCutOnePreview({ resetSelection: true })
        this.clearFlexPreview({ resetSelection: true })
        // Restore combo stakes on switch to system bets.
        this.coupon.combos = this.coupon.combos.map((combo) => ({
          ...combo,
          Stake: nextStake,
          stake: nextStake
        }))
        this.updateComboWinnings(nextStake, null)
        return
      }

      if (this.coupon.bet_type === 'Split' && betslip_type === 'Multiple') {
        this.accaBonusPreviewRequestId += 1
        this.clearCutOnePreview({ resetSelection: true })
        this.clearFlexPreview({ resetSelection: true })
        // Split requires min/max win from split props.
        await getSplitProps(this.coupon)
        // Persist stake for Multiple mode on split.
        this.setStakeCache('Multiple', this.coupon.totalStake)
        return
      }

      this.updateWinnings({
        stake: nextStake,
        id: 'all'
      })
    },
    async placeBet(e, type, bonusId) {
      let ele = e.target
      const coupondata = { ...this.coupon }
      const usersStore = useUsersStore()
      if (usersStore.currentUser) {
        coupondata.userId = usersStore.currentUser.id
        coupondata.username = usersStore.currentUser.username
        coupondata.userRole = usersStore.currentUser.role
      }
      coupondata.clientId = CLIENT_ID

      if (type === 'bet' && coupondata.stake === 0) {
        alert('error. stake must be greater than 0')
        return
      }
      const buildSelections = (selections) =>
        selections.map((selection) => ({
          marketId: parseInt(selection.marketId || selection.market_id) || 0,
          matchId: parseInt(selection.matchId || selection.match_id) || 0,
          outcomeId: String(selection.outcomeId || selection.odd_id || selection.outcomeID),
          specifier: selection.specifier || ''
        }))

      const buildSingleBets = (selections) => {
        return selections.map((selection) => {
          const rawStake = Number(selection.stake || 0)
          const stake = Number.isFinite(rawStake) ? rawStake : 0
          return {
            betType: 'single',
            selections: buildSelections([selection]),
            stake,
            totalStake: stake
          }
        })
      }

      const buildSystemPayload = () => {
        const selections = coupondata.selections || []
        const combos = coupondata.combos || []
        const sizedCombos = combos
          .filter((combo) => Number(combo.Grouping || combo.grouping) > 0)
          .map((combo) => ({
            size: Number(combo.Grouping || combo.grouping),
            stake: Number(combo.Stake || combo.stake || 0)
          }))
          .filter((combo) => Number.isFinite(combo.size) && Number(combo.stake) > 0)
          .sort((a, b) => a.size - b.size)
        const sizes = sizedCombos.map((combo) => combo.size)
        const stakes = sizedCombos.map((combo) => combo.stake)
        const unitStake =
          stakes.length && stakes.every((value) => value === stakes[0]) ? [stakes[0]] : stakes
        // Bankers payload should be an array of indexes for fixed selections.
        const bankerSelections = selections
          .map((selection, index) => ({ selection, index }))
          .filter((entry) => entry.selection.fixed)
          .map((entry) => entry.index)
        return {
          betType: 'system',
          stake: 0,
          totalStake: 0,
          system: {
            sizes,
            unitStake,
            bankers: bankerSelections
          },
          selections: buildSelections(coupondata.selections)
        }
      }

      const buildMultiplePayload = (selections) => {
        const isStandardMultiple =
          coupondata.betslip_type === 'Multiple' && coupondata.bet_type === 'Multiple'
        const stake =
          coupondata.bet_type === 'Split' && coupondata.betslip_type === 'Multiple'
            ? Number(coupondata.stake || 0)
            : Number(coupondata.totalStake || coupondata.stake || 0)

        if (isStandardMultiple && coupondata.useFlex) {
          return {
            betType: 'flex',
            selections: buildSelections(selections),
            stake,
            totalStake: stake,
            flex: {
              minWins: Number(coupondata.flexAmount || 0)
            }
          }
        }

        return {
          betType: 'multi',
          selections: buildSelections(selections),
          stake,
          totalStake: stake,
          ...(isStandardMultiple && coupondata.useCutOne
            ? {
                cutOne: {
                  enabled: true
                }
              }
            : {})
        }
      }

      const buildBets = () => {
        const selections = coupondata.selections || []
        if (coupondata.betslip_type === 'Combo' || coupondata.bet_type === 'Combo') {
          return [buildSystemPayload()]
        }
        if (coupondata.bet_type === 'Split' && coupondata.betslip_type === 'Multiple') {
          const matchCounts = selections.reduce((acc, selection) => {
            const key = String(selection.matchId || selection.match_id || selection.fixture?.matchID)
            acc[key] = (acc[key] || 0) + 1
            return acc
          }, {})
          const singles = selections.filter((selection) => {
            const key = String(selection.matchId || selection.match_id || selection.fixture?.matchID)
            return matchCounts[key] > 1
          })
          const multiples = selections.filter((selection) => {
            const key = String(selection.matchId || selection.match_id || selection.fixture?.matchID)
            return matchCounts[key] <= 1
          })
          const bets = []
          if (singles.length) {
            bets.push(...buildSingleBets(singles))
          }
          if (multiples.length) {
            bets.push(buildMultiplePayload(multiples))
          }
          return bets
        }
        if (coupondata.betslip_type === 'Single' || coupondata.bet_type === 'Single') {
          return buildSingleBets(selections)
        }
        return [buildMultiplePayload(selections)]
      }

      if (type === 'bet') {
        this.isBetslipLoading = true
        coupondata.isBooking = this.mode === 'real' ? 0 : 2
        if (bonusId) {
          coupondata.bonusId = bonusId
          coupondata.useBonus = true
        }

        // Transform coupon data to new API format
        const suppressBonusFunding = Boolean(
          coupondata.useCutOne || coupondata.useFlex
        )
        const payload = {
          bets: buildBets(),
          bonusId: suppressBonusFunding ? 0 : coupondata.bonusId || 0,
          isBooking: coupondata.isBooking,
          source: coupondata.source || 'web',
          useBonus: suppressBonusFunding ? false : coupondata.useBonus || false
        }

        try {
          const res = await placeBet2(payload)
          this.isBetslipLoading = false
          return res
        } catch (error) {
          emitter.emit('showErrorMessage', error)
        }
      } else if (type == 'book') {
        try {
          coupondata.isBooking = 1

          // Transform coupon data to new API format for booking
          const suppressBonusFunding = Boolean(
          coupondata.useCutOne || coupondata.useFlex
        )
          const payload = {
            bets: buildBets(),
            bonusId: suppressBonusFunding ? 0 : coupondata.bonusId || 0,
            isBooking: 1,
            source: coupondata.source || 'web',
            useBonus: suppressBonusFunding ? false : coupondata.useBonus || false
          }

          const res = await placeBet2(payload)
          this.isBetslipLoading = false
          return res
        } catch (error) {
          ele.disabled = false
          ele.innerHTML = 'Place Bet'
          // console.error(error)
          emitter.emit('showErrorMessage', error)
        }
      }
    },
    clearBetslip() {
      try {
        // Clean up all MQTT subscriptions using manageSubscription
        if (Array.isArray(this.coupon.selections)) {
          this.coupon.selections.forEach((selection) => {
            if (selection) {
              this.manageSubscription(selection, false)
            }
          })
        }
        this.activeSubscriptions = []

        // Reset coupon state
        const coupon = this.createEmptyCouponState()
        this.accaBonusPreviewRequestId += 1
        this.clearCutOnePreview()
        this.clearFlexPreview()
        this.coupon = coupon
        // Clear cached stakes when betslip is emptied.
        this.betslipStakeCache = { Single: null, Multiple: null, Combo: null }
        this.earlyWinBulkMode = EARLY_WIN_DEFAULT_MODE
        this.isEarlyWinLoading = false
      } catch (error) {
        // console.error("📊 Betslip: Error in clearBetslip:", error);
        // Still try to reset the coupon state even if cleanup fails
        this.coupon = this.createEmptyCouponState()
        this.accaBonusPreviewRequestId += 1
        this.clearCutOnePreview()
        this.clearFlexPreview()
        this.activeSubscriptions = []
        // Clear cached stakes when betslip is emptied.
        this.betslipStakeCache = { Single: null, Multiple: null, Combo: null }
        this.earlyWinBulkMode = EARLY_WIN_DEFAULT_MODE
        this.isEarlyWinLoading = false
      }
    },
    resubscribeToAllSelections() {
      try {
        // Clear any existing subscriptions that might be invalid
        this.activeSubscriptions = []

        // Resubscribe to all selections in the betslip
        this.coupon.selections.forEach((selection) => {
          if (selection) {
            this.manageSubscription(selection, true)
          }
        })

      } catch (error) {
        console.error('📊 Betslip: Error resubscribing to selections:', error)
      }
    },
    async validateAndSubscribe() {
      if (!this.coupon.selections.length) return

      try {
        // Prepare selections for validation
        const selections = this.coupon.selections.map((event) => ({
          match_id: parseInt(event.matchId),
          market_id: parseInt(event.marketId),
          outcome_id: String(event.outcomeId),
          producer_id: event.producerId || 0,
          specifier: event.specifier || ''
        }))

        // Validate selections
        const res = await validateBetslipSelections(selections)

        if (res.status_code === 200 && res.data) {
          const validatedSelections = Array.isArray(res.data) ? res.data : Object.values(res.data)
          let hasSelectionChange = false

          // Update each selection with the new odds and active status
          validatedSelections.forEach((validatedSelection) => {
            const selection = this.coupon.selections.find(
              (sel) =>
                String(sel.matchId) === String(validatedSelection.match_id) &&
                String(sel.marketId) === String(validatedSelection.market_id) &&
                String(sel.outcomeId) === String(validatedSelection.outcome_id) &&
                String(sel.specifier || '') === String(validatedSelection.specifier || '')
            )

            if (selection) {
              const oldOdds = selection.odds
              // Handle different status states based on status_name
              const nextSuspended = validatedSelection.status_name === 'Suspended'
              const nextUnavailable = validatedSelection.status_name === 'Deactivated'
              const didChange =
                parseFloat(oldOdds) !== validatedSelection.odds ||
                selection.suspended !== nextSuspended ||
                selection.unavailable !== nextUnavailable

              selection.odds = validatedSelection.odds
              selection.suspended = nextSuspended
              selection.unavailable = nextUnavailable
              selection.changed = didChange
              // Validation odds/status changes should require acceptance.
              if (didChange) {
                this.coupon.acceptChanges = false
                hasSelectionChange = true
              }

              // Reset the changed flag after 1 second
              setTimeout(() => {
                selection.changed = false
              }, 1000)
            }
          })

          // Recalculate winnings after updating all selections
          this.updateWinnings({
            stake: this.coupon.totalStake,
            id: 'all',
            skipPreview: !hasSelectionChange
          })

          emitter.emit('odds-validated', validatedSelections)
        }

        // Subscribe to MQTT only for selections that are not unavailable
        this.coupon.selections.forEach((selection) => {
          if (selection && !selection.unavailable) {
            this.manageSubscription(selection, true)
          }
        })

      } catch (error) {
        console.error('📊 Betslip: Error validating selections:', error)
      }
    },
    unsubscribeAll() {
      try {
        // Unsubscribe from all active subscriptions
        this.activeSubscriptions.forEach((subscription) => {
          try {
            if (typeof subscription.unsubscribeOdds === 'function') {
              subscription.unsubscribeOdds()
            }
            if (typeof subscription.unsubscribeBetStop === 'function') {
              subscription.unsubscribeBetStop()
            }
          } catch (error) {
            console.error('📊 Betslip: Error unsubscribing:', error)
          }
        })

        // Clear the subscriptions array
        this.activeSubscriptions = []
      } catch (error) {
        console.error('📊 Betslip: Error in unsubscribeAll:', error)
      }
    },
  },
  // persist: {
  //   storage: localStorage,
  //   afterRestore: (ctx) => {
  //     // Resubscribe to MQTT topics for all selections in the betslip
  //     if (ctx.store.coupon.selections && ctx.store.coupon.selections.length > 0) {
  //       // console.log('📊 Betslip: Resubscribing to MQTT topics for all selections after page refresh')
  //       ctx.store.resubscribeToAllSelections()
  //     }
  //   }
  // }
})
