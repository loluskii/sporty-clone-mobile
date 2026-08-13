const DEFAULT_ENV_MODE = 'production'

const resolvedMode = String(
  import.meta.env.VITE_ENV_MODE ||
    import.meta.env.VITE_MODE ||
    import.meta.env.MODE ||
    DEFAULT_ENV_MODE
)
  .trim()
  .toLowerCase()

const isProductionMode = resolvedMode === DEFAULT_ENV_MODE

const fallbackByMode = (value, fallback) => (value && String(value).trim() ? value : fallback)

export const BASE_API = isProductionMode
  ? fallbackByMode(import.meta.env.VITE_BASE_URL, 'https://prod.sportsbookengine.com')
  : 'https://stag.sportsbookengine.com'
export const NEW_BASE_API = isProductionMode
  ? fallbackByMode(import.meta.env.VITE_NEW_BASE_API, 'https://prod.sportsbookengine.com/api/v2')
  : 'https://stag.sportsbookengine.com/api/v2'
export const NEW_FIXTURES_API = isProductionMode
  ? fallbackByMode(import.meta.env.VITE_NEW_FIXTURES_API, 'https://fixture-prod.sportsbookengine.com')
  : 'https://fixture.sportsbookengine.com'
export const NEW_NOTIFICATION_API = isProductionMode
  ? fallbackByMode(
      import.meta.env.VITE_NEW_NOTIFICATION_API,
      'https://notification-prod.sportsbookengine.com/api/v2'
    )
  : 'https://stag.sportsbookengine.com/api/v2'
export const NEW_BET_API = isProductionMode
  ? fallbackByMode(import.meta.env.VITE_NEW_BET_API, 'https://bet-prod.sportsbookengine.com/v1')
  : 'https://bet.staging.sportsbookengine.com/v1'
export const BET_PROXY_API = '/bet'
export const CASINO_CLIENT_API = isProductionMode
  ? fallbackByMode(import.meta.env.VITE_CASINO_CLIENT_API, '/casino-client')
  : '/casino-client'
export const CASINO_PROVIDER_API = isProductionMode
  ? fallbackByMode(import.meta.env.VITE_CASINO_PROVIDER_API, CASINO_CLIENT_API)
  : CASINO_CLIENT_API
export const CASINO_PROVIDER_PUBLIC_API = isProductionMode
  ? fallbackByMode(
      import.meta.env.VITE_CASINO_PROVIDER_PUBLIC_API,
      'https://clientapi-prod.sportsbookengine.com'
    )
  : 'https://clientapi-prod.sportsbookengine.com'
export const CLIENT_ID = import.meta.env.VITE_CLIENT_ID ? Number(import.meta.env.VITE_CLIENT_ID) : 6
export const AUTH_EXCLUDE_LIST = []
export const APP_KEY = import.meta.env.VITE_APP_KEY || 'SCP'
export const SIM_ALLOWED_MARKETS = [
  1, 10, 11, 16, 18, 26, 29, 45, 60, 68, 74, 75, 80, 83, 90, 94, 95, 1601
];
// Keep this list extensible as simulation support is added for more sports.
export const SIM_ALLOWED_SPORT_IDS = [1];
export const isSimulationSportAllowed = (sportId) =>
  SIM_ALLOWED_SPORT_IDS.includes(Number(sportId));
export const SIM_ENABLED = true;
export const DEPOSIT_ALLOWED = true
export const FEED_TOGGLE = true
export const SMS_BYPASS = true
export const EXCLUDED_LIVE_SPORT_IDS = []

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
