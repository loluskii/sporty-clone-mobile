import moment from 'moment'
// import _ from 'lodash'
// Split props are computed locally since the API endpoint is deprecated.
// import { brandDetails } from '/branding'
import { brandDetails as defBrandDetails } from '/branding-template'
import { useUtilsStore } from '../stores/utils.store'

export const applyBranding = async () => {
  try {
    let defConfig
    // if (brandDetails) {
    //   defConfig = brandDetails
    // } else {
    defConfig = defBrandDetails
    // }
    const config = defConfig
    const utilsStore = useUtilsStore()
    const loadFont = (url) => {
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = url
      document.head.appendChild(link)
    }

    utilsStore.brandName = config.name

    loadFont(config.fonts.primaryFontURL)
    loadFont(config.fonts.secondaryFontURL)

    document.documentElement.style.setProperty('--brand-primary', config.colors.primaryColor)
    document.documentElement.style.setProperty('--brand-secondary', config.colors.secondaryColor)
    document.documentElement.style.setProperty('--brand-tertiary', config.colors.tertiaryColor)

    document.documentElement.style.setProperty(
      '--brand-background-primary',
      config.colors.primaryBackground
    )
    document.documentElement.style.setProperty(
      '--brand-background-secondary',
      config.colors.secondaryBackground
    )

    document.documentElement.style.setProperty(
      '--brand-button-primary',
      config.colors.primaryButtonBackgroundColor
    )

    document.documentElement.style.setProperty(
      '--brand-active-tab-bg',
      config.colors.activeTabColor
    )

    document.documentElement.style.setProperty(
      '--brand-background-live',
      config.colors.liveContainerBackgroundColor
    )

    document.documentElement.style.setProperty(
      '--brand-text-primary',
      config.colors.primaryTextColor
    )

    document.documentElement.style.setProperty(
      '--brand-text-secondary',
      config.colors.secondaryTextColor
    )

    document.documentElement.style.setProperty(
      '--brand-prematch-odds-bg',
      config.colors.prematchOddBackgroundColor
    )

    document.documentElement.style.setProperty(
      '--brand-prematch-odds-text',
      config.colors.prematchOddTextColor
    )

    document.documentElement.style.setProperty(
      '--brand-active-prematch-odds-bg',
      config.colors.activePrematchOddBackground
    )

    document.documentElement.style.setProperty(
      '--brand-active-prematch-odds-text',
      config.colors.activePrematchOddTextColor
    )

    document.documentElement.style.setProperty(
      '--brand-live-odds-bg',
      config.colors.liveOddBackgroundColor
    )

    document.documentElement.style.setProperty(
      '--brand-live-odds-text',
      config.colors.liveOddTextColor
    )

    document.documentElement.style.setProperty(
      '--brand-active-live-odds-bg',
      config.colors.activeLiveOddBackground
    )

    document.documentElement.style.setProperty(
      '--brand-active-live-odds-text',
      config.colors.activeLiveOddTextColor
    )

    document.documentElement.style.setProperty(
      '--brand-highlight-text',
      config.colors.highlightTextColor
    )

    document.documentElement.style.setProperty(
      '--brand-primary-font-family',
      config.fonts.primaryFont
    )
    document.documentElement.style.setProperty(
      '--brand-secondary-font-family',
      config.fonts.secondaryFont
    )

    const logoElement = document.getElementById('logo')
    if (logoElement) {
      logoElement.src = config.images.logo
    }

    return { success: true }
  } catch (error) {
    console.error('Error applying branding:', error)
  }
}

export default applyBranding

export const calculateBonus = (coupondata, globalVars, bonusList) => {
  if (!globalVars || !bonusList) {
    return
  }
  let ticket_length = 0,
    totalBonusOdds = 1,
    minBonusOdd = globalVars?.MinBonusOdd,
    bonusInfo = {},
    bonus = 0
  //count eligible tickets for bonus
  coupondata.selections.forEach((item) => {
    if (item.odds >= minBonusOdd) {
      totalBonusOdds = totalBonusOdds * item.odds
      ticket_length++
    }
  })

  //get bonus settings for ticket length
  bonusList.forEach((item) => {
    if (item.ticket_length === ticket_length) bonusInfo = item
  })

  //calculate total bonus
  if (bonusInfo.bonus !== undefined) {
    const maxWin = totalBonusOdds * coupondata.totalStake
    bonus = (maxWin * parseFloat(bonusInfo.bonus)) / 100
  }
  return bonus
}

export const getDataFromPayload = (couponPayload) => {
  const data = {
    matchId: parseInt(couponPayload.fixture.matchID),
    eventId: parseInt(couponPayload.fixture.gameID),
    event_id: parseInt(couponPayload.fixture.gameID),
    eventName: couponPayload.fixture.name,
    marketId: couponPayload.market_id,
    marketName: couponPayload.market_name,
    specifier: couponPayload.specifier,
    outcomeName: couponPayload.outcome.outcomeName,
    displayName: couponPayload.outcome.displayName,
    outcomeId: couponPayload.outcome.outcomeID,
    odds: parseFloat(couponPayload.outcome.odds).toFixed(2),
    eventDate: couponPayload.fixture.date,
    tournament: couponPayload.fixture.tournament,
    category: couponPayload.fixture.categoryName,
    sport: couponPayload.fixture.sportName,
    sportId: couponPayload.fixture.sportID,
    type: couponPayload?.type || 'prematch',
    fixed: false,
    combinability: couponPayload.fixture.combinability || 0,
    selectionId: couponPayload.ele_id,
    element_id: couponPayload.ele_id,
    homeTeam: couponPayload.fixture.homeTeam || couponPayload.fixture.competitor1,
    awayTeam: couponPayload.fixture.awayTeam || couponPayload.fixture.competitor2,
    producerId: couponPayload.outcome.producerID || couponPayload.fixture.producerID,
    stake: 0,
    suspended: false,
    unavailable: false,
    changed: false,
    isDerived: (() => {
      const ids = couponPayload.fixture.derived_market_ids || couponPayload.fixture.derived_market_id
      return Array.isArray(ids) && ids.length > 0
    })()
  }

  // if (couponPayload?.type === 'live') {
  //   data.inPlayTime = couponPayload.fixture.eventTime
  //   data.score = couponPayload.fixture.homeScore + ':' + couponPayload.fixture.awayScore
  // }
  return data
}

export const formatDate = (date, format) => {
  const fixDateForAllBrowsers = date.replace(/-/g, '/')
  const d = new Date(fixDateForAllBrowsers)
  return moment(d).format(format)
}

export const slugify = (str) => {
  return str
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .replace(/\s+/g, '_')
}

export const unslugify = (str) => {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase())
}

export const chunks = (arr) => {
  if (arr % 2 == 0) {
    return arr.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / 2)
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []
      }
      resultArray[chunkIndex].push(item)
      return resultArray
    }, [])
  } else {
    return arr.reduce((resultArray, item, index) => {
      const chunkIndex = Math.floor(index / 3)
      if (!resultArray[chunkIndex]) {
        resultArray[chunkIndex] = []
      }
      resultArray[chunkIndex].push(item)
      return resultArray
    }, [])
  }
}

export const formatNumber = (number, dp) => {
  const decimal_place = dp ? dp : 2
  const formattedNumber = parseFloat(number)
    .toFixed(decimal_place)
    .replace(/\d(?=(\d{3})+\.)/g, '$&,')
  return formattedNumber
}

export const formatTotalOdds = (number) => {
  let odds = parseFloat(number)
  if (odds < 1000) {
    return odds.toFixed(2)
  } else if (odds < 1000000) {
    return (odds / 1000).toFixed(1) + 'k'
  } else if (odds < 1000000000) {
    return (odds / 1000000).toFixed(1) + 'M'
  } else {
    return (odds / 1000000000).toFixed(1) + 'B'
  }
}

export const formattedPhoneNumber = (phoneNumber) => {
  if (Number(phoneNumber)) {
    phoneNumber = String(phoneNumber)
  }
  let pNumber = phoneNumber.replace(/^0/, '').toString()

  const first = pNumber.charAt(0)
  if (first === '0') {
    return pNumber.substring(1)
  }
  return pNumber
}

export const getPlacedBetStatus = (status) => {
  switch (status) {
    case 0:
      return 'Pending'
    case 1:
      return 'Won'
    case 2:
      return 'Lost'
    case 3:
      return 'Cancelled'
    case 4:
      return 'Void'
    default:
      return 'Unknown'
  }
}

export const createID = (matchID, marketID, outcomeID, specifier = '', marketName = '', outcomeName = '') => {
  // Create a unique ID based on match, market, outcome, specifier, and names
  // This ensures selections are unique and human-readable
  const cleanSpecifier = String(specifier || '').replace(/[^a-zA-Z0-9]/g, '_')
  const cleanMarketName = String(marketName || '').replace(/\s+/g, '_')
  const cleanOutcomeName = String(outcomeName || '').replace(/\s+/g, '_')

  return `${matchID}_${marketID}_${outcomeID}${cleanSpecifier ? '_' + cleanSpecifier : ''}${cleanMarketName ? '_' + cleanMarketName : ''}${cleanOutcomeName ? '_' + cleanOutcomeName : ''}`
}


export const multibetCombination = (item) => {
  if (item.length === 1) {
    return 'Single'
  } else if (item.length > 1 && item.length <= 2) {
    return 'Doubles'
  } else if (item.length > 2 && item.length <= 3) {
    return 'Trebles'
  } else {
    return item.length
  }
}

export const min = (list) => {
  let minValue = list[0]
  for (let i = 1; i < list.length; i++) {
    if (list[i] < minValue) {
      minValue = list[i]
    }
  }
  return minValue
}

export const isSelected = (ele_id, coupon) => {
  let isExist = false

  if (coupon.selections.length > 0) {
    let count = coupon.selections.find((selection) => selection.selectionId === ele_id)
    if (count) {
      isExist = true
    }
  }
  return isExist
}

export const liveScore = (score, team) => {
  if (score) {
    const scoreArray = score.split(':')
    if (team === 'home') {
      return scoreArray[0]
    } else {
      return scoreArray[1]
    }
  }
}

export const calculateWinnings = (couponData, globalVars, bonusList) => {
  //calculate winnings
  let maxWin = parseFloat(couponData.totalOdds) * parseFloat(couponData.totalStake)
  //calculate bonus
  let maxBonus = calculateBonus(couponData, globalVars, bonusList)
  //add bonus to max winnings
  let total = maxWin + maxBonus
  // calculate With-holding tax
  let wthTax = ((total - couponData.totalStake) * 0) / 100

  return {
    maxWin: (total - wthTax).toFixed(2),
    grossWin: total,
    maxBonus: maxBonus,
    wthTax
  }
}

export const groupSelections = (data) => {
  let ArrKeyHolder = {}
  let Arr = []
  data.forEach(function (item) {
    ArrKeyHolder[item.matchId] = ArrKeyHolder[item.matchId] || {}
    let obj = ArrKeyHolder[item.matchId]

    if (Object.keys(obj).length === 0) Arr.push(obj)

    obj.eventName = item.eventName
    obj.eventId = item.eventId
    obj.type = item.type
    obj.started = item.eventDate
    obj.score = item.score
    obj.selections = obj.selections || []

    obj.selections.push(item)
  })
  return Arr
}

export const groupTournament = (data) => {
  let ArrKeyHolder = []
  let Arr = []
  data.forEach(function (item) {
    ArrKeyHolder[item.tournament] = ArrKeyHolder[item.tournament] || {}
    let obj = ArrKeyHolder[item.tournament]

    if (Object.keys(obj).length === 0) Arr.push(obj)

    obj.tournamentName = item.tournament
    obj.category = item.category
    obj.combinability = item.combinability
    obj.events = obj.events || []

    obj.events.push(item)
    obj.fixtures = groupSelections(obj.events)
  })
  return Arr
}

export const calculateTotalOdds = (selections) => {
  let totalOdds = 1

  selections.forEach((selection) => (totalOdds = totalOdds * selection.odds))

  return totalOdds
}

export const comboName = (len) => {
  switch (len) {
    case 1:
      return ' Singles'
    case 2:
      return ' Doubles'
    case 3:
      return ' Trebles'
    default:
      return +' ' + len + ' folds'
  }
}

export const checkBetType = (grouped) => {
  let betType = 'Multiple'
  grouped.forEach((item) => {
    if (item.selections.length > 1) {
      betType = 'Split'
      return false
    }
  })
  return betType
}

export const getSplitProps = async (couponData) => {
  // Preserve previous values so split wins don't drop to 0 if data is incomplete.
  const previous = {
    minOdds: Number(couponData?.minOdds || 0),
    maxOdds: Number(couponData?.maxOdds || 0),
    minWin: Number(couponData?.minWin || 0),
    maxWin: Number(couponData?.maxWin || 0),
    maxBonus: Number(couponData?.maxBonus || 0),
    minBonus: Number(couponData?.minBonus || 0),
    minStake: couponData?.minStake ?? ''
  }
  // Compute split props locally: one selection per match group.
  const selections = couponData?.selections || []
  const grouped = {}
  selections.forEach((selection) => {
    const key = String(
      selection?.matchId || selection?.match_id || selection?.fixture?.matchID || ''
    )
    if (!key) return
    grouped[key] = grouped[key] || []
    grouped[key].push(selection)
  })

  const groups = Object.values(grouped)
  const noOfCombos =
    groups.length > 0 ? groups.reduce((acc, group) => acc * group.length, 1) : 0

  let minOdds = 0
  let maxOdds = 0
  if (groups.length > 0) {
    minOdds = 1
    maxOdds = 1
    groups.forEach((group) => {
      const odds = group
        .map((item) => Number(item?.odds))
        .filter((value) => Number.isFinite(value))
      if (!odds.length) return
      // For split odds range, use min odds and sum of odds per match group (Sportybet behavior).
      minOdds *= Math.min(...odds)
      maxOdds *= odds.reduce((sum, value) => sum + value, 0)
    })
  }

  const stake = Number(couponData?.stake || couponData?.totalStake || 0)
  const minWin = Number.isFinite(stake) && minOdds > 0 ? minOdds * stake : previous.minWin
  const maxWin = Number.isFinite(stake) && maxOdds > 0 ? maxOdds * stake : previous.maxWin

  couponData.noOfCombos = noOfCombos
  couponData.minOdds = minOdds > 0 ? Number(minOdds.toFixed(2)) : previous.minOdds
  couponData.maxOdds = maxOdds > 0 ? Number(maxOdds.toFixed(2)) : previous.maxOdds
  couponData.maxBonus = previous.maxBonus || 0
  couponData.minWin = Number(minWin.toFixed(2))
  couponData.maxWin = Number(maxWin.toFixed(2))
  // Only set minStake if we already have a stake; otherwise let callers fallback to globals.
  couponData.minStake = stake > 0 ? stake : previous.minStake
  couponData.minBonus = previous.minBonus || 0
  return couponData
}

export const displayComboName = (grouping) => {
  switch (grouping) {
    case 1:
      return 'Single'
    case 2:
      return 'Double'
    case 3:
      return 'Treble'
    default:
      return grouping + ' folds'
  }
}

export const checkIfHasLive = (selections) => {
  let hasLive = false
  selections.forEach((item) => {
    if (item.type === 'live') {
      hasLive = true
    }
  })
  return hasLive
}
export const checkNoOfDraws = (selections) => {
  let no_of_draws = 0
  selections.forEach((selection) => {
    if (selection.oddname === 'X') no_of_draws++
  })
  return no_of_draws === selections.length && no_of_draws > 5
}

export const formatOdd = (odd) => {
  if (odd > 0 && odd % 1 === 0) {
    return odd + '.00'
  } else {
    return odd
  }
}

export const validateCombinability = (no_of_fixtures, tournaments) => {
  let res = { success: true }
  tournaments.forEach((tournament) => {
    switch (tournament.combinability) {
      case 'double':
        if (no_of_fixtures < 2) {
          res = {
            success: false,
            message:
              'You must select minimum of 2 games with ' +
              tournament.category +
              ' -> ' +
              tournament.tournamentName
          }
        }
        break
      case 'treble':
        if (no_of_fixtures < 3) {
          res = {
            success: false,
            message:
              'You must select minimum of 3 games with ' +
              tournament.category +
              ' -> ' +
              tournament.tournamentName
          }
        }
        break
      case 'min_5':
        if (no_of_fixtures < 5) {
          res = {
            success: false,
            message:
              'You must select minimum of 5 games with ' +
              tournament.category +
              ' -> ' +
              tournament.tournamentName
          }
        }
        break
    }
  })
  return res
}

export const formatString = (str, pos) => {
  let ast = '****'
  if (pos == 'pre') {
    return ast.concat(str.slice(-4))
  } else {
    let spaceIndex = str.indexOf(' ')
    return str.substr(0, spaceIndex + 5).concat(ast)
  }
}

export const sortArr = (arr, field) => {
  if (arr && arr.length) {
    const copyArr = [...arr]
    return copyArr.sort((a, b) => a[field] - b[field])
  } else {
    return arr
  }
}

export const extractIdsFromURL = (str, type) => {
  const parts = str.split('_')
  // Map through parts and extract IDs
  const ids = parts.map((part) => {
    // Split each part by colon to get the ID
    const segments = part.split(':')
    const id = segments[segments.length - 1] // Get the last segment as ID
    // Return the object based on the type
    return type === 'category' ? { categoryID: id } : { tournamentID: id }
  })

  return ids
}

export const getDateRange = (period) => {
  const today = moment().startOf('day')
  let startDate, endDate
  if (!period) return null

  switch (period) {
    case 'today':
      startDate = today
      endDate = moment().endOf('day')
      break

    case 'tomorrow':
      startDate = today.clone().add(1, 'day').startOf('day')
      endDate = today.clone().add(1, 'day').endOf('day')
      break

    case 'today_tomorrow':
      startDate = today
      endDate = today.clone().add(1, 'day').endOf('day')
      break

    case 'week':
      startDate = today.clone().startOf('week')
      endDate = today.clone().endOf('week')
      break

    default:
      return period
  }

  return {
    startDate: startDate.format('YYYY-MM-DD'),
    endDate: endDate.format('YYYY-MM-DD')
  }
}

export function debounce(func, delay = 300) {
  let timeout
  return (...args) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func(...args)
    }, delay)
  }
}

export const getNext7Days = () => {
  const today = new Date()
  const dateRanges = []

  for (let i = 0; i <= 7; i++) {
    const nextDate = new Date(today)
    nextDate.setDate(today.getDate() + i)
    const formattedDate = nextDate.toISOString().split('T')[0] // Format: yyyy-mm-dd
    dateRanges.push(formattedDate)
  }

  return dateRanges
}

export const getStartAndEndOfMonth = () => {
  const today = new Date()
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1) // First day of the month
  const formattedStartDate = startOfMonth.toISOString().split('T')[0] // Format: yyyy-mm-dd
  const formattedEndDate = today.toISOString().split('T')[0] // Today's date in yyyy-mm-dd format

  return { startDate: formattedStartDate, endDate: formattedEndDate }
}

export const stringIsLink = (text) => {
  const regex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i
  return regex.test(text.trim())
}
