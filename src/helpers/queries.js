import {
  fetchWrapper
} from './fetch-wrapper'
import {
  BASE_API,
  BET_PROXY_API,
  CASINO_CLIENT_API,
  CASINO_PROVIDER_API,
  CLIENT_ID,
  NEW_BASE_API,
  NEW_BET_API,
  NEW_FIXTURES_API,
  NEW_NOTIFICATION_API
} from './constants'
import Cookies from 'js-cookie'
import moment from 'moment'

function today() {
  let today = new Date()
  let day = today.getDate().toString().padStart(2, '0') // Add leading zero if less than 10
  let month = (today.getMonth() + 1).toString().padStart(2, '0')
  let year = today.getFullYear()

  return year + '-' + month + '-' + day
}

function tomorrow() {
  let tomorrow = new Date()
  tomorrow.setDate((tomorrow.getDate() + 1).toString().padStart(2, '0'))
  return tomorrow.getFullYear() + '-' + (tomorrow.getMonth() + 1) + '-' + tomorrow.getDate()
}

function end() {
  let future = new Date()
  future.setDate(future.getDate() + 21)
  return (
    future.getFullYear() +
    '-' +
    (future.getMonth() + 1).toString().padStart(2, '0') +
    '-' +
    future.getDate()
  )
}

const date = new Date()
const offset = date.getTimezoneOffset()
const sign = offset >= 0 ? '-' : '+'
const offsetHours = Math.abs(offset / 60)

const parseData = async (response) => {
  return response instanceof Promise ? (await response)?.data : response.data
}

const requestCache = new Map()
const inflightRequests = new Map()
const DEFAULT_CACHE_TTL_MS = 5 * 60 * 1000
const DEFAULT_RETRY_DELAYS_MS = [2000, 4000, 8000]

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const getCacheScope = (scope = 'global') => {
  if (scope === 'auth') {
    return Cookies.get('SBE-TOKEN') || 'anonymous'
  }

  return String(scope || 'global')
}

const getCachedValue = (key) => {
  const entry = requestCache.get(key)
  if (!entry) return null
  if (entry.expiresAt > Date.now()) return entry.value
  requestCache.delete(key)
  return null
}

const setCachedValue = (key, value, ttlMs) => {
  requestCache.set(key, {
    value,
    expiresAt: Date.now() + ttlMs
  })
}

const retryWithBackoff = async (fetcher, delays = DEFAULT_RETRY_DELAYS_MS) => {
  let lastError = null

  for (let attempt = 0; attempt <= delays.length; attempt += 1) {
    try {
      return await fetcher()
    } catch (error) {
      lastError = error
      if (attempt >= delays.length) break
      await sleep(delays[attempt])
    }
  }

  throw lastError
}

const cachedRequest = async (
  cacheKey,
  fetcher,
  { ttlMs = DEFAULT_CACHE_TTL_MS, scope = 'global', skipCache = false } = {}
) => {
  const normalizedKey = `${getCacheScope(scope)}:${cacheKey}`

  if (!skipCache) {
    const cachedValue = getCachedValue(normalizedKey)
    if (cachedValue !== null) return cachedValue
  }

  if (inflightRequests.has(normalizedKey)) {
    return inflightRequests.get(normalizedKey)
  }

  const requestPromise = retryWithBackoff(fetcher)
    .then((value) => {
      if (!skipCache) {
        setCachedValue(normalizedKey, value, ttlMs)
      }
      return value
    })
    .finally(() => {
      inflightRequests.delete(normalizedKey)
    })

  inflightRequests.set(normalizedKey, requestPromise)
  return requestPromise
}

export const invalidateCachedRequest = (cacheKey, scope = 'global') => {
  const normalizedKey = `${getCacheScope(scope)}:${cacheKey}`
  requestCache.delete(normalizedKey)
  inflightRequests.delete(normalizedKey)
}

export const normalizeSportsbookFeatureConfig = (payload = {}) => {
  const data = payload?.data ?? payload ?? {}

  return {
    accaBonus: data.accaBonus ?? null,
    flex: data.flex ?? null,
    cutOne: data.cutOne ?? null,
    stakeLimits: data.stakeLimits ?? null
  }
}

let casinoCatalogPromise = null

const formatCasinoCategoryName = (value = '') => {
  return String(value)
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

const normalizeCasinoProvider = (provider = {}) => {
  const id = String(provider.provider_id ?? provider.id ?? '')

  return {
    ...provider,
    id,
    provider_id: id,
    active: String(provider.active ?? '0') === '1',
    name: provider.name ?? ''
  }
}

const normalizeCasinoCategory = (category = {}, index = 0, total = 0) => {
  const id = String(category.category_id ?? category.id ?? '')
  const slug = category.category ?? category.slug ?? ''

  return {
    ...category,
    id,
    category_id: id,
    slug,
    name: formatCasinoCategoryName(slug),
    priority: total - index
  }
}

const normalizeCasinoGame = (game = {}, index = 0, total = 0, providerMap = new Map(), categoryMap = new Map()) => {
  const id = String(game.id ?? game.gameId ?? '')
  const providerId = String(game.provider_id ?? game.providerId ?? '')
  const categoryId = String(game.category_id ?? game.categoryId ?? '')
  const providerName = providerMap.get(providerId)?.name ?? 'Casino'
  const categoryName = categoryMap.get(categoryId)?.name ?? ''

  return {
    ...game,
    id,
    gameId: id,
    providerId,
    categoryId,
    provider_id: providerId,
    category_id: categoryId,
    title: game.game_name ?? game.title ?? '',
    image: game.game_image ?? game.image ?? '',
    game_name: game.game_name ?? game.title ?? '',
    game_image: game.game_image ?? game.image ?? '',
    gameCode: game.game_code ?? game.gameCode ?? '',
    game_code: game.game_code ?? game.gameCode ?? '',
    type: providerName,
    providerName,
    categoryName,
    priority: total - index
  }
}

const normalizeCasinoListResponse = (payload = {}) => {
  const data = payload?.data ?? {}
  const providers = (data.providers ?? []).map(normalizeCasinoProvider)
  const categories = (data.categories ?? []).map((category, index, list) =>
    normalizeCasinoCategory(category, index, list.length)
  )
  const providerMap = new Map(providers.map((provider) => [provider.id, provider]))
  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  const games = (data.games ?? []).map((game, index, list) =>
    normalizeCasinoGame(game, index, list.length, providerMap, categoryMap)
  )

  return {
    status_code: payload?.status_code,
    status_description: payload?.status_description,
    data: {
      providers,
      categories,
      games,
      meta: data.meta ?? {}
    }
  }
}

const getCasinoCatalog = async (forceRefresh = false) => {
  if (!casinoCatalogPromise || forceRefresh) {
    casinoCatalogPromise = parseData(fetchWrapper.get(`${CASINO_CLIENT_API}/casino_list`))
  }

  return normalizeCasinoListResponse(await casinoCatalogPromise)
}

const getCasinoListTab = async (tab, params = {}) => {
  const query = new URLSearchParams({ tab, ...params })
  return normalizeCasinoListResponse(
    await parseData(fetchWrapper.get(`${CASINO_CLIENT_API}/casino_list?${query.toString()}&game_type=casino`))
  )
}

export const fetchGlobalVars = async () => {
  return fetchWrapper.get(`${NEW_BASE_API}/auth/globalvariables/${CLIENT_ID}`)
}

export const fetchBanners = async () => {
  return parseData(
    fetchWrapper.get(
      `${NEW_BASE_API}/content-management/banner?clientId=${import.meta.env.VITE_CLIENT_ID}`
    )
  )
}

export const fetchBonusList = async () => {
  return fetchWrapper.get(`${NEW_BASE_API}/bonus/acca-bonus?section=onliners`)
}

export const fetchSportsbookFeatureConfig = async (category = 'online') => {
  return normalizeSportsbookFeatureConfig(
    await parseData(fetchWrapper.get(`${BET_PROXY_API}/${CLIENT_ID}/features/config?category=${category}`))
  )
}

export const previewAccaBonus = async (payload) => {
  return parseData(fetchWrapper.post(`${BET_PROXY_API}/${CLIENT_ID}/acca-bonus/preview`, payload))
}

export const previewCutOne = async (payload) => {
  return parseData(fetchWrapper.post(`${BET_PROXY_API}/${CLIENT_ID}/cut-one/preview`, payload))
}

export const previewFlex = async (payload) => {
  return parseData(fetchWrapper.post(`${BET_PROXY_API}/${CLIENT_ID}/flex/preview`, payload))
}

export const getSplitPropsData = async (payload) => {
  return fetchWrapper.post(`${BASE_API}/api/sports/get-split-props`, payload)
}

export const getCombosData = async (payload) => {
  return fetchWrapper.post(`${BASE_API}/api/sports/get-combos`, {
    selections: payload.selections
  })
}

export const getGameLobbyUrl = async (payload) => {
  return parseData(
    fetchWrapper.post(`${CASINO_PROVIDER_API}/providers/qtech/${CLIENT_ID}/platform/games/lobby-url2`, payload, {
          skipAuthLogout: true
        }),
  );
};

export const login = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BASE_API}/auth/login?source=mobile`, payload))
}

export const register = async (payload) => {
  return fetchWrapper.post(`${NEW_BASE_API}/auth/register/`, payload)
}

export const sendOTP = async (payload) => {
  return fetchWrapper.post(`${NEW_BASE_API}/notification/send-otp`, payload)
}

export const verifyOTP = async (payload) => {
  return fetchWrapper.post(`${NEW_BASE_API}/notification/verify-otp`, payload)
}

export const verifyUsername = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BASE_API}/auth/verify-username`, payload))
}

export const resetPassword = async (payload) => {
  return parseData(fetchWrapper.patch(`${NEW_BASE_API}/auth/update/reset-password`, payload))
}

export const updateProfile = async (payload) => {
  return parseData(fetchWrapper.put(`${NEW_BASE_API}/auth/update/details`, payload))
}

export const processAccountVerification = async (payload) => {
  return parseData(
    fetchWrapper.post(`${NEW_BASE_API}/auth/kyc`, payload),
  );
};


export const getUserDetailsByToken = async () => {
  return cachedRequest(
    'user-details',
    () =>
      parseData(
        fetchWrapper.get(`${NEW_BASE_API}/auth/details/${CLIENT_ID}`, undefined, {
          skipAuthLogout: true
        })
      ),
    { ttlMs: 60 * 1000, scope: 'auth' }
  )
}

export const getTopTournaments = async () => {
  return parseData(fetchWrapper.get(`${NEW_FIXTURES_API}/${CLIENT_ID}/top_tournament?source=mobile`))
}

export const getTopTournamentFixtures = async (topTournamentId, source = 'mobile') => {
  const params = new URLSearchParams({
    source,
    structure: 'outcomes'
  })

  return parseData(
    fetchWrapper.get(
      `${NEW_FIXTURES_API}/v1/${CLIENT_ID}/fixtures/top-tournament/${topTournamentId}?${params.toString()}`
    )
  )
}

export const getCodeHubItems = async (data) => {
  const {
    page = 1,
    perPage,
    limit,
    sort = 'created|desc',
    start,
    end,
    from,
    to,
    minOdd,
    maxOdd,
    minFold,
    maxFold,
    betType,
    search
  } = data || {}

  const params = new URLSearchParams()
  params.set('page', page)
  params.set('perPage', perPage || limit || 20)
  params.set('sort', sort)

  const resolvedStart = start || from
  const resolvedEnd = end || to

  if (resolvedStart) params.set('start', resolvedStart)
  if (resolvedEnd) params.set('end', resolvedEnd)
  if (minOdd !== undefined && minOdd !== null && minOdd !== '') params.set('minOdd', minOdd)
  if (maxOdd !== undefined && maxOdd !== null && maxOdd !== '') params.set('maxOdd', maxOdd)
  if (minFold !== undefined && minFold !== null && minFold !== '') params.set('minFold', minFold)
  if (maxFold !== undefined && maxFold !== null && maxFold !== '') params.set('maxFold', maxFold)

  // Preserve legacy filters until all callers are migrated.
  if (betType !== undefined && betType !== null && betType !== '') params.set('betType', betType)
  if (search) params.set('search', search)

  return cachedRequest(
    `codehub:${params.toString()}`,
    () => parseData(fetchWrapper.get(`${NEW_BET_API}/${CLIENT_ID}/codehub?${params.toString()}`)),
    { ttlMs: 2 * 60 * 1000 }
  )
}

export const getSportsMenu = async () => {
  return cachedRequest(
    'sports-menu',
    () => parseData(fetchWrapper.get(`${NEW_FIXTURES_API}/${CLIENT_ID}/sports`)),
    { ttlMs: 15 * 60 * 1000 }
  )
}

export const getCategoriesBySport = async (sportID, period) => {
  const todayDate = moment().startOf('day').format('YYYY-MM-DD')
  const tomorrowDate = moment().add(1, 'day').startOf('day').format('YYYY-MM-DD')
  const isTodayPeriod = todayDate === period?.startDate && todayDate === period?.endDate
  const isTomorrowPeriod = tomorrowDate === period?.startDate && tomorrowDate === period?.endDate
  // Determine the period type
  const periodParam = isTodayPeriod ? 'start=' + todayDate + '&end=' + todayDate
    : isTomorrowPeriod ? 'start=' + tomorrowDate + '&end=' + tomorrowDate :
      `start=${period?.startDate}&end=${period?.endDate}`
  // Fetch and return the parsed data
  return parseData(
    fetchWrapper.get(
      `${NEW_FIXTURES_API}/${CLIENT_ID}/categories/${sportID}?${period ? periodParam : ''}&source=mobile`
    )
  )
}

export const getTournamentsByCategories = async (sid, categoryId, period = null) => {
  let periodFilter = null
  if(period){
    periodFilter = `&start=${period.startDate}&end=${period.endDate}`
  }
  return parseData(
    fetchWrapper.get(
      `${NEW_FIXTURES_API}/${CLIENT_ID}/tournaments/${sid}?category_id=${categoryId}${periodFilter ?? ''}&source=mobile`
    )
  )
}

export const getFixturesByCategories = async (categoryId, sid) => {
  return parseData(
    fetchWrapper.get(
      `${NEW_FIXTURES_API}/v1/${CLIENT_ID}/sports/get-fixtures-by-categories/${categoryId}?timeoffset=${sign}${offsetHours}&sportID=${sid}&limit=50&source=mobile`
    )
  )
}

export const searchFixtures = async (q) => {
  return parseData(
    fetchWrapper.get(
      `${NEW_FIXTURES_API}/search?page=1&perPage=50&search=${q}`
    )
  )
}

export const getLiveHighlights = async () => {
  return parseData(
    fetchWrapper.get(`${NEW_FIXTURES_API}/v1/${CLIENT_ID}/fixtures/live/0?per_page=50&source=mobile`)
  )
}

export const getLiveCountBySport = async (sid) => {
  return parseData(fetchWrapper.get(`${NEW_FIXTURES_API}/live/counter`))
}

export const getSportHighlights = async (payload) => {
  const { sid = 1, page = 1, per_page = 60, tournament_id = 0, category_id = 0, hours = 0, today = 0, tomorrow = 0, upcoming = 0, start = '', end = '', order_type = 'priority|asc', feature_market_id = '' } = payload;
  const params = new URLSearchParams()
  Object.entries({ page, per_page, tournament_id, category_id, hours, today, tomorrow, upcoming, order_type, start, end, feature_market_id }).forEach(
    ([key, value]) => {
      if (value !== '' && value !== null && value !== undefined) {
        params.set(key, value)
      }
    }
  )
  return parseData(
    fetchWrapper.get(
      `${NEW_FIXTURES_API}/v1/${CLIENT_ID}/fixtures/highlights/${sid}?${params}`
    )
  )
}

export const getFixturesByTournamentId = async (id, sid, period = null) => {
  return parseData(
    fetchWrapper.get(
      `${NEW_FIXTURES_API}/v1/${CLIENT_ID}/sports/get-fixtures/${id}?sportID=${sid}&marketID=1&source=mobile&timeoffset=${sign}${offsetHours}&period=${period ? period : 'all'
      }&limit=50`
    )
  )
}

export const getMarketsGrouping = async (sid) => {
  return parseData(
    fetchWrapper.get(`${NEW_FIXTURES_API}/${CLIENT_ID}/markets/groups?sport_id=${sid}`)
  )
}

export const getBets = async (payload) => {
  const { page = 1, perPage = 5, status, start, end } = payload
  const params = new URLSearchParams({ page, perPage })

  if (Array.isArray(status)) {
    status
      .filter((value) => value !== undefined && value !== null && value !== '')
      .forEach((value) => params.append('status', value))
  } else if (status !== undefined && status !== null && status !== '') {
    params.set('status', status)
  }
  if (start) {
    params.set('start', start)
  }
  if (end) {
    params.set('end', end)
  }

  return parseData(fetchWrapper.get(`${NEW_BET_API}/${CLIENT_ID}/bet?${params.toString()}`))
}

// export const getSettledBets = async (payload) => {
//   return parseData(fetchWrapper.post(`${NEW_BASE_API}/bets/history?page=1`, payload))
// }

export const getTransactionsData = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BASE_API}/user/wallet/transactions`, payload))
}

export const getPendingWithdrawalsData = async () => {
  return parseData(
    fetchWrapper.get(
      `${NEW_BASE_API}/user/wallet/list-pending-withdrawal/${import.meta.env.VITE_CLIENT_ID}`
    )
  )
}

export const cancelPendingWithdrawal = async (payload) => {
  return parseData(
    fetchWrapper.post(
      `${NEW_BASE_API}/user/wallet/cancel-withdrawal/${import.meta.env.VITE_CLIENT_ID}`,
      payload
    )
  )
}

export const fetchBankAssets = async () => {
  return parseData(fetchWrapper.get(`${NEW_BASE_API}/user/wallet/bank-accounts`))
}

export const updatePassword = async (payload) => {
  return parseData(fetchWrapper.put(`${NEW_BASE_API}/auth/update/password/`, payload))
}

export const placeBet2 = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BET_API}/${CLIENT_ID}/bet`, payload))
}

export const reportBetslipAbandoned = async (payload) => {
  return parseData(
    fetchWrapper.post(
      `${NEW_BASE_API}/crm/betslip/abandoned?clientId=${CLIENT_ID}`,
      payload
    )
  )
}

export const reportBetslipActivity = async (payload) => {
  return parseData(
    fetchWrapper.post(
      `${NEW_BASE_API}/crm/betslip/activity?clientId=${CLIENT_ID}`,
      payload
    )
  )
}

export const closeBetslipSession = async (payload) => {
  return parseData(
    fetchWrapper.post(
      `${NEW_BASE_API}/crm/betslip/session/close?clientId=${CLIENT_ID}`,
      payload
    )
  )
}

export const validateBetslipSelections = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_FIXTURES_API}/odd/status`, payload))
}

export const fetchCashoutForBet = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BET_API}/${CLIENT_ID}/cashout/build`, payload))
}

export const performCashout = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BET_API}/${CLIENT_ID}/cashout/placement`, payload))
}

export const bookBet2 = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BASE_API}/bets/book-bet/${CLIENT_ID}`, payload))
}

export const loadBetslipByCode = async (shareCode) => {
  return parseData(
    fetchWrapper.get(`${NEW_BET_API}/${CLIENT_ID}/codehub/${shareCode}`)
  )
}

export const fetchCustomCodes = async () => {
  return parseData(fetchWrapper.get(`${NEW_BET_API}/${CLIENT_ID}/custom-codes`))
}

export const createCustomCode = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BET_API}/${CLIENT_ID}/custom-codes`, payload))
}

export const deleteCustomCode = async (code) => {
  return parseData(fetchWrapper.delete(`${NEW_BET_API}/${CLIENT_ID}/custom-codes/${code}`))
}

export const assignCustomCode = async (code, payload) => {
  return parseData(fetchWrapper.post(`${NEW_BET_API}/${CLIENT_ID}/custom-codes/${code}/assign`, payload))
}

export const getPromotions = async () => {
  return parseData(
    fetchWrapper.get(`${NEW_BASE_API}/games/promotions?clientId=${import.meta.env.VITE_CLIENT_ID}`)
  )
}

export const getCasinoBonusGames = async (userId) => {
  return parseData(
    fetchWrapper.get(
      `${NEW_BASE_API}/games/bonus-games?clientId=${import.meta.env.VITE_CLIENT_ID}&userId=${userId}`
    )
  )
}

export const getGamesBySearch = async (gameName) => {
  const response = await getCasinoListTab('games', { search: gameName })
  return {
    ...response,
    games: response.data.games,
    data: response.data.games
  }
}

export const getCasinoListGames = async () => {
  const response = await getCasinoListTab('games')
  return {
    ...response,
    data: response.data.games
  }
}

export const getCasinoGameById = async (gameId) => {
  const response = await getCasinoCatalog()
  const normalizedGameId = String(gameId ?? '')

  return response.data.games.find((game) => String(game.id) === normalizedGameId) || null
}

export const getCasinoGamesByProviderCategory = async (providerId, categoryId = '') => {
  const params = new URLSearchParams()

  if (providerId !== undefined && providerId !== null && providerId !== '') {
    params.set('provider_id', String(providerId))
  }

  if (categoryId !== undefined && categoryId !== null && categoryId !== '') {
    params.set('category_id', String(categoryId))
  }

  const response = normalizeCasinoListResponse(
    await parseData(fetchWrapper.get(`${CASINO_CLIENT_API}/casino_providers?${params.toString()}&game_type=casino`))
  )

  const normalizedProviderId = providerId !== undefined && providerId !== null && providerId !== ''
    ? String(providerId)
    : ''
  const normalizedCategoryId = categoryId !== undefined && categoryId !== null && categoryId !== ''
    ? String(categoryId)
    : ''

  return {
    ...response,
    data: response.data.games.filter((game) => {
      const matchesProvider = normalizedProviderId ? game.providerId === normalizedProviderId : true
      const matchesCategory = normalizedCategoryId ? game.categoryId === normalizedCategoryId : true
      return matchesProvider && matchesCategory
    })
  }
}

export const getGamesByProviders = async (providerId) => {
  return getCasinoGamesByProviderCategory(providerId)
}

export const getProviders = async () => {
  const response = await getCasinoListTab('providers')
  return {
    ...response,
    data: response.data.providers
  }
}

export const getCasinoStartUrl = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BASE_API}/games/${CLIENT_ID}/start`, payload))
}

export const getGoldenRaceLobbyUrl = async (payload, authToken) => {
  return parseData(
    fetchWrapper.post(`${CASINO_PROVIDER_API}/providers/goldenrace/lobby`, payload, {
      authToken,
      skipAuthLogout: true
    })
  )
}

export const getQtechLaunchUrl = async (gameId, payload, authToken) => {
  return parseData(
    fetchWrapper.post(`${CASINO_PROVIDER_API}/providers/qtech/${CLIENT_ID}/platform/games/${gameId}/launch-url`, payload, {
      authToken,
      skipAuthLogout: true
    })
  )
}

export const getSmatVirtualStartUrl = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BASE_API}/games/${CLIENT_ID}/start-url`, payload))
}

export const getTopGameCategories = async () => {
  const response = await getCasinoListTab('categories')
  return {
    ...response,
    data: response.data.categories
  }
}

export const gamesByTopCategory = async (id) => {
  const response = await getCasinoCatalog()

  return {
    ...response,
    data: id
      ? response.data.games.filter((game) => game.categoryId === String(id))
      : response.data.games
  }
}

export const getJackpots = async () => {
  return parseData(
    fetchWrapper.get(
      `${NEW_BASE_API}/games/active-jackpot?clientId=${import.meta.env.VITE_CLIENT_ID} `
    )
  )
}

export const getJackpotWinners = async () => {
  return parseData(
    fetchWrapper.get(
      `${NEW_BASE_API}/games/jackpot-winners?clientId=${import.meta.env.VITE_CLIENT_ID}`
    )
  )
}

export const getPaymentMethods = async () => {
  return parseData(
    fetchWrapper.get(
      `${NEW_BASE_API}/user/wallet/${import.meta.env.VITE_CLIENT_ID}/payment-methods`
    )
  )
}

export const getBanksList = async () => {
  return cachedRequest(
    'banks-list',
    () => parseData(fetchWrapper.get(`${NEW_BASE_API}/user/wallet/${CLIENT_ID}/banks`)),
    { ttlMs: 60 * 60 * 1000 }
  )
}

export const verifyAccount = async (payload) => {
  return parseData(
    fetchWrapper.post(`${NEW_BASE_API}/user/wallet/verify-bank-account?source=mobile`, payload)
  )
}

export const getDepositURL = async (payload) => {
  return parseData(
    fetchWrapper.post(`${NEW_BASE_API}/user/wallet/initiate-deposit?source=mobile`, payload)
  )
}

export const verifyDeposit = async (channel, ref) => {
  return parseData(
    fetchWrapper.get(
      `${NEW_BASE_API}/user/wallet/verify-payment?paymentChannel=${channel}&transactionRef=${ref}&clientId=${CLIENT_ID}`
    )
  )
}

export const withdrawalRequest = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BASE_API}/user/wallet/withdraw?source=mobile`, payload))
}

export const smileandpayPayout = async (payload) => {
  return parseData(fetchWrapper.post(`${NEW_BASE_API}/user/wallet/smileandpay/payout/${CLIENT_ID}?source=mobile`, payload))
}

export const transferRequest = async (payload) => {
  return parseData(
    fetchWrapper.put(
      `${NEW_BASE_API}/auth/initiate-transfer/${import.meta.env.VITE_CLIENT_ID}`,
      payload
    )
  )
}

export const getUserBonus = async () => {
  return parseData(fetchWrapper.get(`${NEW_BASE_API}/bonus/user/list?client_id=${CLIENT_ID}`))
}

export const getUserActiveBonus = async () => {
  return parseData(
    fetchWrapper.get(`${NEW_BASE_API}/bonus/get-active-bonus?client_id=${CLIENT_ID}`)
  )
}

export const getUserCashbackBonus = async () => {
  return parseData(
    fetchWrapper.get(`${NEW_BASE_API}/bonus/user/check-cashback-bonus?clientId=${CLIENT_ID}`)
  )
}

export const fetchUserNotifications = async () => {
  return cachedRequest(
    'user-notifications',
    () =>
      parseData(
        fetchWrapper.get(`${NEW_BASE_API}/notification/user`, undefined, {
          skipAuthLogout: true
        })
      ),
    { ttlMs: 60 * 1000, scope: 'auth' }
  )
}

export const markUserNotificationRead = async (id) => {
  return parseData(fetchWrapper.patch(`${NEW_BASE_API}/notification/user/${id}/read`, undefined, { skipAuthLogout: true }))
}

export const deleteUserNotification = async (id) => {
  return parseData(fetchWrapper.delete(`${NEW_BASE_API}/notification/user/${id}`, undefined, { skipAuthLogout: true }))
}

export const checkFirstDeposit = async () => {
  return parseData(
    fetchWrapper.get(`${NEW_BASE_API}/bonus/user/check-deposit-bonus?client_id=${CLIENT_ID}`)
  )
}

export const awardBonus = async (payload) => {
  return parseData(
    fetchWrapper.post(`${NEW_BASE_API}/bonus/user/award?client_id=${CLIENT_ID}`, payload)
  )
}

export const getCMS = async (page) => {
  return parseData(
    fetchWrapper.get(
      `${NEW_BASE_API}/content-management/page?clientId=${import.meta.env.VITE_CLIENT_ID}&slug=${page}`
    )
  )
}

// ============================================
// NEW FEEDS API ENDPOINTS
// ============================================

/**
 * Get live fixtures from new feeds API
 * @param {number} sportId - Sport ID (0 for all sports, 1 for Soccer, etc.)
 * @param {number} tournamentId - Tournament ID filter (0 for all)
 * @param {number} categoryId - Category ID filter (0 for all)
 * @param {string} orderType - Order type ('priority' or 'time')
 * @returns {Promise} Live fixtures data
 */
export const getFeedsLiveFixtures = async (sportId = 0, tournamentId = 0, categoryId = 0, orderType = 'priority') => {
  return parseData(
    fetchWrapper.get(
      `${NEW_FIXTURES_API}/v1/${CLIENT_ID}/fixtures/live/${sportId}?tournament_id=${tournamentId}&category_id=${categoryId}&order_type=${orderType}`
    )
  )
}

/**
 * Get single game details with all markets from new feeds API
 * @param {number} gameId - Game/Match ID
 * @param {number} groupId - Market group ID (0 for all)
 * @returns {Promise} Game details with markets and outcomes
 */
export const getFeedsGameDetail = async (gameId, groupId = 0) => {
  return parseData(
    fetchWrapper.get(`${NEW_FIXTURES_API}/${CLIENT_ID}/game/${gameId}?group_id=${groupId}`)
  )
}
