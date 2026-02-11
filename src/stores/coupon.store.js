import { defineStore } from 'pinia'
// import _ from 'lodash'
import { useUsersStore } from '@/stores'
import emitter from '../plugins/emitter'
import CouponCalculation from '@/helpers/coupon-calculation.js'
import {
  calculateWinnings,
  groupSelections,
  groupTournament,
  calculateTotalOdds,
  checkBetType,
  checkIfHasLive,
  getDataFromPayload,
  calculateBonus,
  getSplitProps,
  placeBet2,
  bookBet2,
  CLIENT_ID,
  validateBetslipSelections,
  formatNumber
} from '@/helpers'
import { useMqttService } from '@/composables/useMqtt'

const couponCalculation = new CouponCalculation()
const WTH_PERC = import.meta.env.VITE_WTH_PERC
const { subscribe } = useMqttService()

export const useCouponStore = defineStore({
  id: 'coupon',
  state: () => ({
    betPlaced: null,
    loadedCoupon: null,
    confirm: false,
    sportsbookBonusList: [],
    SportsbookGlobalVariable: {},
    isBetslipLoading: false,
    isBetslipBooking: false,
    mode: 'real',
    isSimulating: false,
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
    setBetslipMode(nextMode) {
      // Keep stake initialized to min stake when toggling mode (unless user cleared to 0).
      this.mode = nextMode
      const isCombo = this.coupon.betslip_type === 'Combo' || this.coupon.bet_type === 'Combo'
      const minStake = isCombo
        ? Number(this.SportsbookGlobalVariable?.comboMinStake || 0)
        : Number(this.SportsbookGlobalVariable?.singleMinStake || 0)
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
      if (!data || !data.markets) return

      const matchId = selection.matchId || selection.fixture?.matchID
      const dataMatchId = data.event_id || data.match_id

      // If the data doesn't match our event, ignore it
      if (dataMatchId && String(dataMatchId) !== String(matchId)) {
        // console.log('📊 Betslip: Ignoring odds change for match ID', dataMatchId, 'our match ID is', matchId);
        return
      }

      // console.log('📊 Betslip: Processing odds change for match ID', matchId);

      const markets = data.markets || []
      let updatedAnySelection = false

      if (markets.length > 0) {
        // Find all selections from this match
        const matchSelections = this.coupon.selections.filter(
          (sel) =>
            String(sel.matchId) === String(matchId) ||
            String(sel.fixture?.matchID) === String(matchId)
        )

        matchSelections.forEach((selection) => {
          const marketId = selection.marketId || selection.market_id
          const outcomeId = selection.outcomeId || selection.odd_id

          // Find the market
          const market = markets.find((m) => String(m.id) === String(marketId))
          if (market && market.outcomes) {
            // Find the outcome
            const outcome = market.outcomes.find((o) => String(o.id) === String(outcomeId))

            if (outcome) {
              // console.log('📊 Betslip: Found outcome', outcome);
              if (!outcome.active) {
                // If outcome is not active, suspend the selection
                // console.log(`📊 Betslip: Outcome not active, suspending selection for match ID ${matchId}`);
                selection.suspended = true
                selection.unavailable = true
                // Only require acceptance when data changes (not when adding selections).
                this.coupon.acceptChanges = false
                updatedAnySelection = true
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

                // Update odds if they've changed
                if (outcome.odds !== selection.odds) {
                  // console.log(`📊 Betslip: Updating odds from ${selection.odds} to ${outcome.odds} for match ID ${matchId}`);
                  selection.odds = outcome.odds
                  selection.changed = true
                  // Flip acceptChanges only on odds/availability updates.
                  this.coupon.acceptChanges = false
                  updatedAnySelection = true

                  // Reset the changed flag after 5 seconds
                  setTimeout(() => {
                    selection.changed = false

                    // Force a reactivity update
                    this.updateWinnings({
                      stake: this.coupon.totalStake,
                      id: 'all'
                    })
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
        // console.log(`⚠️ BET STOP: Suspending ${matchSelections.length} selections in betslip for match ID ${matchId}`);

        matchSelections.forEach((selection) => {
          selection.suspended = true
          selection.unavailable = true
          selection.odds = 0
        })
        // Bet stop is a data change; force acceptChanges.
        this.coupon.acceptChanges = false

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

      const globalVars = this.SportsbookGlobalVariable
      let type = couponPayload.type

      const data = getDataFromPayload(couponPayload)

      let couponData = { ...this.coupon }
      const bonusList = this.sportsbookBonusList

      this.coupon.event_type = type

      if (!this.coupon.selections.length) {
        //add selection to selections list
        this.coupon.selections.push(data)

        this.coupon.bet_type = 'Single'
        this.coupon.betslip_type = 'Single'
        this.coupon.totalOdds = (parseFloat(this.coupon.totalOdds) * parseFloat(data.odds)).toFixed(
          2
        )

        //calculate and get pot winnings with bonus
        const winnings = calculateWinnings(this.coupon, globalVars, bonusList)
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
            // const bonus = calculateBonus(this.coupon, globalVars, bonusList);
            // console.log(bonus, "bon");
            //group selections by match
            this.coupon.tournaments = groupTournament(this.coupon.selections)
            this.coupon.fixtures = groupSelections(this.coupon.selections)

            // con
            //bet type
            this.coupon.bet_type = 'Split'
            this.coupon.betslip_type = 'Multiple'
            this.clearBankers()

            const splitProps = await getSplitProps(this.coupon)
            //calculate winnings
            let minStake =
              splitProps.minStake !== undefined && splitProps.minStake !== ''
                ? splitProps.minStake
                : this.coupon.stake || this.SportsbookGlobalVariable.singleMinStake || 0
            minStake = Number(minStake) || 0
            this.coupon.stake = minStake
            const minWinnings = parseFloat(splitProps.minOdds) * parseFloat(minStake)
            const maxWinnings = parseFloat(splitProps.maxOdds) * parseFloat(minStake)

            console.log(minWinnings, maxWinnings)
            //calculate bonus
            this.coupon.minBonus = calculateBonus(this.coupon, globalVars, bonusList)

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
          this.clearBankers()
          const splitProps = await getSplitProps(this.coupon)

          const minStake =
            splitProps.minStake !== undefined && splitProps.minStake !== ''
              ? splitProps.minStake
              : this.coupon.stake || this.SportsbookGlobalVariable.singleMinStake || 0
          this.coupon.minStake = Number(minStake) || 0
          this.coupon.stake = this.coupon.minStake

          //calculate winnings
          const minWinnings = parseFloat(splitProps.minOdds) * parseFloat(this.coupon.minStake)
          const maxWinnings = parseFloat(splitProps.maxOdds) * parseFloat(this.coupon.minStake)
          //calculate bonus
          this.coupon.minBonus = calculateBonus(this.coupon, globalVars, bonusList)

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
            const winnings = calculateWinnings(this.coupon, globalVars, bonusList)
            // console.log(winnings);
            this.coupon.maxWin = winnings.maxWin
            this.coupon.maxBonus = winnings.maxBonus
            this.coupon.wthTax = winnings.wthTax
            this.coupon.grossWin = winnings.grossWin
          }
        }
      }

      // After successfully adding selection, subscribe to its updates
      this.manageSubscription(selection, true)
    },
    async removeSelection(id) {
      const globalVars = this.SportsbookGlobalVariable
      const res = this.coupon.selections ? [...this.coupon.selections] : []
      const data = res.find((item) => item.selectionId === id || item.id === id)
      // Call manageSubscription after updating selections array
      if (data) {
        this.manageSubscription(data, false)
      }

      const bonusList = this.sportsbookBonusList
      const newSelection = this.coupon.selections.filter(
        (item) => item.selectionId !== id && item.id !== id
      )

      this.coupon.selections = newSelection

      if (this.coupon.selections.length > 0) {
        const prevBetType = this.coupon.bet_type
        this.coupon.tournaments = groupTournament(this.coupon.selections)
        this.coupon.fixtures = groupSelections(this.coupon.selections)

        if (this.coupon.selections.length === 1) {
          this.coupon.bet_type = 'Single'
        } else {
          this.coupon.bet_type = checkBetType(this.coupon.fixtures)
        }

        if (this.coupon.bet_type === 'Split') {
          const splitProps = await getSplitProps(this.coupon)
          //calculate winnings
          const minWinnings = parseFloat(splitProps.minOdds) * parseFloat(splitProps.minStake)
          const maxWinnings = parseFloat(splitProps.maxOdds) * parseFloat(splitProps.minStake)
          //calculate bonus
          this.coupon.minBonus = calculateBonus(this.coupon, globalVars, bonusList)

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
          this.coupon.minBonus = calculateBonus(this.coupon, globalVars, bonusList)
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
            const winnings = calculateWinnings(this.coupon, globalVars, bonusList)
            this.coupon.maxWin = winnings.maxWin
            this.coupon.maxBonus = winnings.maxBonus
            this.coupon.wthTax = winnings.wthTax
            this.coupon.grossWin = winnings.grossWin
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
          source: 'mobile'
        }
        this.coupon = coupon
      }
    },
    async updateWinnings(payload) {
      const { stake, id } = payload
      const globalVars = { ...this.SportsbookGlobalVariable }
      const coupondata = JSON.parse(JSON.stringify(this.coupon))
      const bonusList = this.sportsbookBonusList

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
            // Calculate Winnings using only active selections
            const winnings = calculateWinnings(activeCoupon, globalVars, bonusList)
            this.coupon.maxWin = winnings.maxWin
            this.coupon.maxBonus = winnings.maxBonus
            this.coupon.wthTax = winnings.wthTax
            this.coupon.grossWin = winnings.grossWin
          }
        }
      }
      // Persist stake for Multiple mode after recalculation.
      if (this.coupon.betslip_type === 'Multiple') {
        this.setStakeCache('Multiple', this.coupon.totalStake)
      }
    },
    updateComboWinnings(val, combo) {
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
          const calculatedCoupon = couponCalculation.calcPotentialWins(coupondata, this.sportsbookBonusList, this.SportsbookGlobalVariable.MinBonusOdd);
          coupondata = couponCalculation.updateFromCalculatedCoupon(coupondata, calculatedCoupon, this.SportsbookGlobalVariable, this.sportsbookBonusList);
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
          const calculatedCoupon = couponCalculation.calcPotentialWins(coupondata, this.sportsbookBonusList, this.SportsbookGlobalVariable.MinBonusOdd);
          coupondata = couponCalculation.updateFromCalculatedCoupon(coupondata, calculatedCoupon, this.SportsbookGlobalVariable, this.sportsbookBonusList);
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

      const minStake = betslip_type === 'Combo'
        ? Number(this.SportsbookGlobalVariable?.comboMinStake || 0)
        : Number(this.SportsbookGlobalVariable?.singleMinStake || 0)
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

      const newSelections = selections.map((item) => {
        const newItem = Object.assign({}, item)
        // Reset per-selection stake when toggling types.
        newItem.stake = betslip_type === 'Single' ? nextStake : ''
        return newItem
      })
      this.coupon.selections = newSelections

      if (betslip_type === 'Combo' && this.coupon.combos?.length) {
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
            bets.push({
              betType: 'multi',
              selections: buildSelections(multiples),
              stake: Number(coupondata.stake || 0),
              totalStake: Number(coupondata.stake || 0)
            })
          }
          return bets
        }
        if (coupondata.betslip_type === 'Single' || coupondata.bet_type === 'Single') {
          return buildSingleBets(selections)
        }
        return [
          {
            betType: 'multi',
            selections: buildSelections(selections),
            stake: Number(coupondata.stake || 0),
            totalStake: Number(coupondata.totalStake || coupondata.stake || 0)
          }
        ]
      }

      if (type === 'bet') {
        this.isBetslipLoading = true
        coupondata.isBooking = this.mode === 'real' ? 0 : 2
        if (bonusId) {
          coupondata.bonusId = bonusId
          coupondata.useBonus = true
        }

        // Transform coupon data to new API format
        const payload = {
          bets: buildBets(),
          bonusId: coupondata.bonusId || 0,
          isBooking: coupondata.isBooking,
          source: coupondata.source || 'web',
          useBonus: coupondata.useBonus || false
        }

        try {
          const res = await placeBet2(payload)
          this.isBetslipLoading = false
          return res
        } catch (error) {
          console.log(error)
          emitter.emit('showErrorMessage', error)
        }
      } else if (type == 'book') {
        try {
          coupondata.isBooking = 1

          // Transform coupon data to new API format for booking
          const payload = {
            bets: buildBets(),
            bonusId: coupondata.bonusId || 0,
            isBooking: 1,
            source: coupondata.source || 'web',
            useBonus: coupondata.useBonus || false
          }

          const res = await bookBet2(payload)
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
        const coupon = {
          acceptChanges: false,
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
          source: 'mobile'
        }
        this.coupon = coupon
        // Clear cached stakes when betslip is emptied.
        this.betslipStakeCache = { Single: null, Multiple: null, Combo: null }
      } catch (error) {
        // console.error("📊 Betslip: Error in clearBetslip:", error);
        // Still try to reset the coupon state even if cleanup fails
        this.coupon = {
          acceptChanges: false,
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
          source: 'mobile'
        }
        this.activeSubscriptions = []
        // Clear cached stakes when betslip is emptied.
        this.betslipStakeCache = { Single: null, Multiple: null, Combo: null }
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

        console.log('📊 Betslip: Successfully resubscribed to all selections')
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

          // Update each selection with the new odds and active status
          validatedSelections.forEach((validatedSelection) => {
            const selection = this.coupon.selections.find(
              (sel) =>
                String(sel.matchId) === String(validatedSelection.match_id) &&
                String(sel.marketId) === String(validatedSelection.market_id) &&
                String(sel.outcomeId) === String(validatedSelection.outcome_id)
            )

            if (selection) {
              const oldOdds = selection.odds
              selection.odds = validatedSelection.odds

              // Handle different status states based on status_name
              selection.suspended = validatedSelection.status_name === 'Suspended'
              selection.unavailable = validatedSelection.status_name === 'Deactivated'
              selection.changed = parseFloat(oldOdds) !== validatedSelection.odds
              // Validation odds/status changes should require acceptance.
              if (selection.changed || selection.suspended || selection.unavailable) {
                this.coupon.acceptChanges = false
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
            id: 'all'
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
        console.log('📊 Betslip: Successfully unsubscribed from all selections')
      } catch (error) {
        console.error('📊 Betslip: Error in unsubscribeAll:', error)
      }
    },
  },
  persist: {
    storage: localStorage,
    afterRestore: (ctx) => {
      // Resubscribe to MQTT topics for all selections in the betslip
      if (ctx.store.coupon.selections && ctx.store.coupon.selections.length > 0) {
        // console.log('📊 Betslip: Resubscribing to MQTT topics for all selections after page refresh')
        ctx.store.resubscribeToAllSelections()
      }
    }
  }
})
