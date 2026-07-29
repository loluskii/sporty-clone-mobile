import { defineStore } from 'pinia'
import { getTopBets, getSportHighlights, FEED_TOGGLE, normalizeFixtureMarkets } from '@/helpers'

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
        const response = await getTopBets()

        if (response?.data) {
          // Process tournaments
          const uniqueTournamentIds = new Set()
          const uniqueTournaments = []

          for (const tournament of response.data) {
            if (!uniqueTournamentIds.has(tournament.tournament_id)) {
              uniqueTournamentIds.add(tournament.tournament_id)
              uniqueTournaments.push(tournament)
            }
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
                const games = await getSportHighlights({
                  sid: tournament.sport_id,
                  page: 1,
                  per_page: 5,
                  tournament_id: tournament.tournament_id
                })

                if (!games?.data?.fixtures?.length || !games?.data?.markets?.length) {
                  // Early return if no valid data
                  const index = this.featuredTournaments.findIndex(
                    (x) => x.tournament_id === tournament.tournament_id
                  )
                  if (index !== -1) {
                    this.featuredTournaments.splice(index, 1)
                  }
                  return
                }

                if (games?.data?.fixtures?.length && games?.data?.markets?.length) {
                  // Take only first 5 fixtures
                  const tournamentGames = {
                    tournamentID: tournament.tournament_id,
                    priority: Number(tournament.priority || 0),
                    fixtures: (games.data.fixtures || []).map((fixture) => ({
                      ...fixture,
                      sportID: fixture.sportID || fixture.sportId || tournament.sportID || tournament.sportId,
                      sportId: fixture.sportId || fixture.sportID || tournament.sportID || tournament.sportId,
                      tournamentID: fixture.tournamentID || fixture.tournament_id || tournament.tournament_id,
                      tournament: fixture.tournament || tournament.tournament_name,
                      categoryID: fixture.categoryID || fixture.category_id || tournament.categoryID || tournament.category_id,
                      categoryName: fixture.categoryName || tournament.category_name || fixture.categoryName
                    })),
                    markets: normalizeFixtureMarkets(games.data.markets)
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
