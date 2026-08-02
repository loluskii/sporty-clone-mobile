import { defineStore } from 'pinia'
import {
  getTopTournaments,
  getTopTournamentFixtures,
  FEED_TOGGLE,
  normalizeFixtureMarkets
} from '@/helpers'

const FEATURED_DEFAULT_MARKET_NAMES = {
  1: '1X2',
  10: 'Double chance',
  11: 'Draw no bet',
  18: 'Total',
  29: 'Both teams to score',
  1601: 'X-UP'
}

const getFeaturedMarketKey = (marketId, specifier = '') => `${marketId}|${specifier}`

const getFeaturedMarketName = (marketId) => {
  return FEATURED_DEFAULT_MARKET_NAMES[Number(marketId)] || `Market ${marketId}`
}

const buildFeaturedMarketsFromFixtures = (fixtures = []) => {
  const marketMap = new Map()

  fixtures.forEach((fixture) => {
    const explicitMarkets = [
      ...(Array.isArray(fixture.market) ? fixture.market : []),
      ...(Array.isArray(fixture.markets) ? fixture.markets : [])
    ]

    explicitMarkets.forEach((market) => {
      const marketId = Number(market?.marketID ?? market?.marketId ?? market?.market_id ?? market?.id ?? 0)
      if (!Number.isFinite(marketId) || marketId <= 0) return

      const specifier = String(market?.specifier ?? market?.specifiers ?? '')
      const key = getFeaturedMarketKey(marketId, specifier)

      if (!marketMap.has(key)) {
        marketMap.set(key, {
          ...market,
          marketID: marketId,
          marketName: market?.marketName ?? market?.market_name ?? market?.name ?? getFeaturedMarketName(marketId),
          specifier,
          sportID: market?.sportID ?? market?.sportId ?? market?.sport_id ?? fixture?.sportID ?? fixture?.sportId,
          outcomes: Array.isArray(market?.outcomes) ? market.outcomes : []
        })
      }
    })

    const outcomes = Array.isArray(fixture.outcomes) ? fixture.outcomes : []
    outcomes.forEach((outcome) => {
      const marketId = Number(outcome?.marketID ?? outcome?.marketId ?? outcome?.market_id ?? 0)
      if (!Number.isFinite(marketId) || marketId <= 0) return

      const specifier = String(outcome?.specifier ?? outcome?.specifiers ?? '')
      const key = getFeaturedMarketKey(marketId, specifier)
      const existing = marketMap.get(key)

      if (existing) {
        if (!Array.isArray(existing.outcomes)) {
          existing.outcomes = []
        }

        const duplicateIndex = existing.outcomes.findIndex(
          (item) =>
            String(item?.outcomeID ?? item?.outcomeId ?? item?.outcome_id ?? '') ===
              String(outcome?.outcomeID ?? outcome?.outcomeId ?? outcome?.outcome_id ?? '') &&
            String(item?.specifier ?? item?.specifiers ?? '') === specifier
        )

        if (duplicateIndex === -1) {
          existing.outcomes.push(outcome)
        }
        return
      }

      marketMap.set(key, {
        marketID: marketId,
        marketName: getFeaturedMarketName(marketId),
        specifier,
        sportID: fixture?.sportID ?? fixture?.sportId,
        outcomes: [outcome]
      })
    })
  })

  return normalizeFixtureMarkets(Array.from(marketMap.values()))
}

export const useUtilsStore = defineStore({
  id: 'utils',
  state: () => ({
    clickId: null,
    brandName: '',
    sportID: 1,
    live: false,
    banners: [],
    sportsMenu: [],
    marketGroups: [],
    activeLiveMarkets: [],
    homeCarousel: [],
    SportsbookBonusList: [],
    SportsbookFeatureConfig: {
      accaBonus: null,
      flex: null,
      cutOne: null,
      stakeLimits: null
    },
    SportsbookGlobalVariable: {
      "AllowRegistration": "Yes",
      "EnableSplitBet": "0",
      "EnableSystemBet": "1",
      "comboMaxStake": "1000000",
      "MinBetStake": "20",
      "comboMinStake": "20",
      "MaxCombinationOddLength": "10000000",
      "Currency": "₦",
      "DialCode": "+234",
      "EnableBankAcct": "1",
      "enableCashout": "1",
      "taxEnabled": "0",
      "exciseTax": "13.04",
      "wthTax": "20",
      "LiabilityThreshold": "0",
      "LiveTicketMax": "40",
      "Logo": "",
      "MaxPayout": "50000000",
      "MinBonusOdd": "1.18",
      "MinDeposit": "100",
      "MinWithdrawal": "1000",
      "PaymentDay": "tuesday",
      "PowerBonusStartDate": "2024-11-01",
      "singleMaxStake": "50000",
      "SingleMaxWinning": "500000",
      "singleMinStake": "100",
      "SingleTicketLenght": "1000000",
      "MaxNoOfSelection": "50"
    },
    showBetslipCount: true,
    showFooter: true,
    showMobileNavigation: true,
    errorMessage: null,
    categoriesList: [],
    bonusModalShown: null,
    popupDialogShown: null,
    previousRoute: null,
    // Featured games state
    featuredTournaments: [],
    featuredTournamentGames: [],
    featuredLastFetchTime: null,
    featuredIsLoading: false,
    featuredError: null,
    activeFeaturedTournament: null,
    isFetchingTournamentGames: false,
    banksList: [],
    activeBetView: 'open_bets'
  }),

  actions: {
    async fetchFeaturedGames() {
      if (!FEED_TOGGLE) return;
      // Prevent concurrent fetches
      if (this.featuredIsLoading || this.isFetchingTournamentGames) {
        return
      }

      this.featuredIsLoading = true
      this.featuredError = null

      try {
        const response = await getTopTournaments()

        const topTournaments = Array.isArray(response) ? response : response?.data || []

        if (topTournaments.length) {
          // Process tournaments
          const uniqueTournamentIds = new Set()
          const uniqueTournaments = []

          for (const tournament of topTournaments) {
            const tournamentId = tournament.tournament_id || tournament.tournamentID || tournament.id
            if (!tournamentId || uniqueTournamentIds.has(tournamentId)) {
              continue
            }

            uniqueTournamentIds.add(tournamentId)
            uniqueTournaments.push({
              ...tournament,
              top_tournament_id: tournament.id || tournament.top_tournament_id || tournament.topTournamentID,
              tournament_id: tournamentId,
              tournamentID: tournamentId,
              categoryID: tournament.categoryID || tournament.category_id,
              categoryName: tournament.categoryName || tournament.category_name || tournament.country || tournament.country_name
            })
          }

          this.featuredTournaments = uniqueTournaments.sort(
            (a, b) =>
              Number(b.priority || 0) - Number(a.priority || 0) 
          )

          // Set active tournament to the first one if not already set
          if (!this.activeFeaturedTournament && this.featuredTournaments.length > 0) {
            this.activeFeaturedTournament = this.featuredTournaments[0].tournament_id
          }

          // Fetch games for each tournament
          await this.fetchTournamentGames()
        }
      } catch (error) {
        console.error('Error fetching featured games:', error)
        this.featuredError = error.message
      } finally {
        this.featuredIsLoading = false
      }
    },

    async fetchTournamentGames() {
      // Prevent concurrent fetches
      if (this.isFetchingTournamentGames) {
        return
      }

      this.isFetchingTournamentGames = true
      const CONCURRENCY_LIMIT = 3
      const chunks = []

      for (let i = 0; i < this.featuredTournaments.length; i += CONCURRENCY_LIMIT) {
        chunks.push(this.featuredTournaments.slice(i, i + CONCURRENCY_LIMIT))
      }

      // Clear existing games before fetching new ones
      this.featuredTournamentGames = []
      const rawList = []

      try {
        for (const chunk of chunks) {
          await Promise.all(
            chunk.map(async (tournament) => {
              try {
                const topTournamentId =
                  tournament.top_tournament_id ||
                  tournament.topTournamentID ||
                  tournament.id ||
                  tournament.tournament_id
                const games = await getTopTournamentFixtures(topTournamentId)

                const fixtures = games?.data?.fixtures || games?.fixtures || []
                const markets =
                  normalizeFixtureMarkets(games?.data?.markets || games?.markets || []) ||
                  []
                const normalizedMarkets = markets.length ? markets : buildFeaturedMarketsFromFixtures(fixtures)

                if (!fixtures.length || !normalizedMarkets.length) {
                  return
                }

                if (fixtures.length && normalizedMarkets.length) {
                  // Take only first 5 fixtures
                  const tournamentGames = {
                    tournamentID: tournament.tournament_id,
                    priority: Number(tournament.priority || 0),
                    fixtures: fixtures.map((fixture) => ({
                      ...fixture,
                      sportID: fixture.sportID || fixture.sportId || tournament.sportID || tournament.sportId,
                      sportId: fixture.sportId || fixture.sportID || tournament.sportID || tournament.sportId,
                      tournamentID: fixture.tournamentID || fixture.tournament_id || tournament.tournament_id,
                      tournament: fixture.tournament || tournament.tournament_name,
                      categoryID: fixture.categoryID || fixture.category_id || tournament.categoryID || tournament.category_id,
                      categoryName:
                        fixture.categoryName ||
                        fixture.category_name ||
                        tournament.categoryName ||
                        tournament.category_name ||
                        tournament.country_name
                    })),
                    markets: normalizedMarkets
                  }

                  rawList.push(tournamentGames)
                }
              } catch (error) {
                console.error(`Error processing tournament ${tournament.tournament_id}:`, error)
              }
            })
          )
        }
        this.featuredTournamentGames = rawList.sort((a, b) => b.priority - a.priority);
      } finally {
        this.isFetchingTournamentGames = false
      }
    },

    setActiveFeaturedTournament(tournamentId) {
      this.activeFeaturedTournament = tournamentId
    },

    clearFeaturedData() {
      this.featuredTournaments = []
      this.featuredTournamentGames = []
      this.featuredLastFetchTime = null
      this.featuredError = null
      this.activeFeaturedTournament = null
    },

    handleOddsChange(data) {
      if (!data || !data.markets) return

      // Find and update the fixture in featuredTournamentGames
      this.featuredTournamentGames = this.featuredTournamentGames.map((tournament) => {
        const updatedFixtures = tournament.fixtures.map((fixture) => {
          if (String(fixture.matchID) === String(data.matchID)) {
            // Update outcomes for the matching market
            const updatedOutcomes = fixture.outcomes.map((outcome) => {
              const market = data.markets.find((m) => m.id === outcome.marketID)
              if (market && market.outcomes) {
                const updatedOutcome = market.outcomes.find(
                  (o) => String(o.id) === String(outcome.outcomeID)
                )
                if (updatedOutcome) {
                  return {
                    ...outcome,
                    odds: updatedOutcome.odds,
                    active: updatedOutcome.active ? 1 : 0
                  }
                }
              }
              return outcome
            })
            return {
              ...fixture,
              outcomes: updatedOutcomes
            }
          }
          return fixture
        })
        return {
          ...tournament,
          fixtures: updatedFixtures
        }
      })
    },

    handleBetStop(data) {
      // Find and update the fixture in featuredTournamentGames
      this.featuredTournamentGames = this.featuredTournamentGames.map((tournament) => {
        const updatedFixtures = tournament.fixtures.map((fixture) => {
          if (String(fixture.matchID) === String(data.matchID)) {
            // Set all outcomes to inactive
            const updatedOutcomes = fixture.outcomes.map((outcome) => ({
              ...outcome,
              odds: 0,
              active: 0
            }))
            return {
              ...fixture,
              outcomes: updatedOutcomes
            }
          }
          return fixture
        })
        return {
          ...tournament,
          fixtures: updatedFixtures
        }
      })
    }
  },

  persist: {
    storage: localStorage,
    paths: [
      'brandName',
      'sportID',
      'live',
      'sportsMenu',
      'marketGroups',
      'activeLiveMarkets',
      'homeCarousel',
      'SportsbookBonusList',
      'SportsbookFeatureConfig',
      'SportsbookGlobalVariable',
      'showBetslipCount',
      'showFooter',
      'showMobileNavigation',
      'errorMessage',
      'categoriesList',
      'previousRoute',
      'activeBetView',
      // 'featuredTournaments',
      // 'featuredTournamentGames',
      'popupDialogShown',
      'bonusModalShown',
      'banners'
    ]
  }
})
