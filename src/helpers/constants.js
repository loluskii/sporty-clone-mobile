export const BASE_API = import.meta.env.VITE_BASE_URL || 'https://prod.sportsbookengine.com'
export const NEW_BASE_API = import.meta.env.VITE_NEW_BASE_API || 'https://prod.sportsbookengine.com/api/v2'
export const NEW_FIXTURES_API =
  import.meta.env.VITE_NEW_FIXTURES_API || 'https://fixture-prod.sportsbookengine.com'
export const NEW_NOTIFICATION_API =
  import.meta.env.VITE_NEW_NOTIFICATION_API || 'https://notification-prod.sportsbookengine.com/api/v2'
export const NEW_BET_API =
  import.meta.env.VITE_NEW_BET_API || 'https://bet-prod.sportsbookengine.com/v1'
export const BET_PROXY_API = import.meta.env.VITE_BET_PROXY_API || '/bet'
export const CASINO_CLIENT_API = import.meta.env.VITE_CASINO_CLIENT_API || '/casino-client'
export const CASINO_PROVIDER_API = import.meta.env.VITE_CASINO_PROVIDER_API || CASINO_CLIENT_API
export const CASINO_PROVIDER_PUBLIC_API =
  import.meta.env.VITE_CASINO_PROVIDER_PUBLIC_API || 'https://clientapi.sportsbookengine.com'
export const CLIENT_ID = 4
// export const FEEDS_API = import.meta.env.VITE_FEEDS_API
// export const FEEDS_API_BASE = import.meta.env.VITE_FEEDS_API?.replace('/v1', '') || ''

// export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID
export const AUTH_EXCLUDE_LIST = []
export const WTH_PERC = 0
export const APP_KEY = 'SBE'
export const SIM_ALLOWED_MARKETS = [
  1, 10,11,16, 18,26, 29,45,60, 68,74, 75, 80, 83, 90, 94,95, 1601, 60100, 60200
];
export const SIM_ENABLED = true;
export const DEPOSIT_ALLOWED = true
export const FEED_TOGGLE = true;

export const PINIA_PERSIST_OPTIONS = {
  storage: localStorage
}

export const sportsList = [
  {
    sport_id: 1,
    name: 'Soccer'
  },
  {
    sport_id: 2,
    name: 'Basketball'
  },
  {
    sport_id: 4,
    name: 'Ice Hockey'
  },
  {
    sport_id: 5,
    name: 'Tennis'
  },
  {
    sport_id: 6,
    name: 'Handball'
  },
  {
    sport_id: 8,
    name: 'Boxing'
  },
  {
    sport_id: 9,
    name: 'Rugby'
  },
  {
    sport_id: 10,
    name: 'Aussie Rules'
  },
  {
    sport_id: 11,
    name: 'American Football'
  },
  {
    sport_id: 13,
    name: 'Floorball'
  },
  {
    sport_id: 15,
    name: 'Table Tennis'
  },
  {
    sport_id: 16,
    name: 'Cricket'
  },
  {
    sport_id: 17,
    name: 'Darts'
  },
  {
    sport_id: 18,
    name: 'Volleyball'
  },
  {
    sport_id: 21,
    name: 'MMA'
  },
  {
    sport_id: 24,
    name: 'Bandy'
  },
  {
    sport_id: 25,
    name: 'Futsal'
  },
  {
    sport_id: 56,
    name: 'Waterpolo'
  },
  {
    sport_id: 60,
    name: 'Kabaddi'
  }
]
