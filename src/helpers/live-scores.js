const SCORE_BREAKDOWN_SPORT_IDS = new Set(['5', '15'])
const SET_BREAKDOWN_SPORTS = new Set(['tennis', 'table tennis', 'badminton', 'volleyball'])
const QUARTER_BREAKDOWN_SPORTS = new Set(['basketball'])
const PERIOD_BREAKDOWN_SPORTS = new Set(['ice hockey', 'handball'])

function normalizeSportName(value = '') {
  return String(value || '')
    .trim()
    .toLowerCase()
}

function formatScoreValue(value, fallback = '') {
  if (value === 0 || value === '0') return '0'
  const text = String(value ?? '').trim()
  return text || fallback
}

function normalizePeriodScores(periodScores) {
  if (!Array.isArray(periodScores)) return []

  return periodScores
    .map((periodScore, index) => {
      const home = periodScore?.home_score ?? periodScore?.homeScore ?? null
      const away = periodScore?.away_score ?? periodScore?.awayScore ?? null
      const description = String(periodScore?.description ?? '').trim()
      const number = periodScore?.number ?? index + 1

      if (home === null && away === null && !description && number === undefined) {
        return null
      }

      return {
        number,
        home_score: home,
        away_score: away,
        description,
        match_status_code: periodScore?.match_status_code,
        type: periodScore?.type
      }
    })
    .filter(Boolean)
    .sort((left, right) => Number(left.number ?? 0) - Number(right.number ?? 0))
}

function getPeriodLabel(periodScore, index) {
  const description = String(periodScore?.description ?? '').trim().toLowerCase()
  const number = String(periodScore?.number ?? index + 1).trim()

  if (description.includes('set')) return `S${number || index + 1}`
  if (description.includes('half')) return `H${number || index + 1}`
  if (description.includes('quarter')) return `Q${number || index + 1}`
  if (description.includes('period')) return `P${number || index + 1}`

  return number ? `P${number}` : `P${index + 1}`
}

function getBreakdownTotalLabel(fixture) {
  const sportName = normalizeSportName(fixture?.sportName)

  if (SET_BREAKDOWN_SPORTS.has(sportName)) return 'S'
  if (QUARTER_BREAKDOWN_SPORTS.has(sportName)) return 'T'
  if (PERIOD_BREAKDOWN_SPORTS.has(sportName)) return 'T'

  return 'FT'
}

export function supportsLiveScoreBreakdown(fixture = {}) {
  const sportId = String(fixture?.sportID ?? '').trim()
  const sportName = normalizeSportName(fixture?.sportName)

  if (SCORE_BREAKDOWN_SPORT_IDS.has(sportId)) return true
  if (SET_BREAKDOWN_SPORTS.has(sportName)) return true
  if (QUARTER_BREAKDOWN_SPORTS.has(sportName)) return true
  if (PERIOD_BREAKDOWN_SPORTS.has(sportName)) return true

  return false
}

export function getLiveScoreboard(fixture = {}, variant = 'detail') {
  const totalHome = formatScoreValue(
    fixture?.homeScore ??
      fixture?.eventInfo?.score?.home ??
      fixture?.eventInfo?.score?.home_score ??
      fixture?.eventInfo?.scores?.home ??
      fixture?.eventInfo?.scores?.home_score,
    '0'
  )
  const totalAway = formatScoreValue(
    fixture?.awayScore ??
      fixture?.eventInfo?.score?.away ??
      fixture?.eventInfo?.score?.away_score ??
      fixture?.eventInfo?.scores?.away ??
      fixture?.eventInfo?.scores?.away_score,
    '0'
  )
  const periodScores = normalizePeriodScores(fixture?.eventInfo?.period_scores)
  const showBreakdown = supportsLiveScoreBreakdown(fixture)
  const totalColumn = {
    key: 'total',
    kind: 'total',
    label: showBreakdown && periodScores.length ? getBreakdownTotalLabel(fixture) : 'FT',
    home: totalHome,
    away: totalAway
  }
  const columns = []

  if (variant === 'list') {
    if (showBreakdown) {
      const latestPeriodScore = periodScores[periodScores.length - 1]

      if (latestPeriodScore) {
        columns.push({
          key: `period-${String(latestPeriodScore.number ?? periodScores.length)}`,
          kind: 'period',
          label: getPeriodLabel(latestPeriodScore, periodScores.length - 1),
          home: formatScoreValue(latestPeriodScore.home_score, '-'),
          away: formatScoreValue(latestPeriodScore.away_score, '-')
        })
      }
    }

    if (!showBreakdown || periodScores.length !== 1) {
      columns.push(totalColumn)
    }
  } else {
    if (showBreakdown) {
      periodScores.forEach((periodScore, index) => {
        columns.push({
          key: `period-${String(periodScore.number ?? index + 1)}`,
          kind: 'period',
          label: getPeriodLabel(periodScore, index),
          home: formatScoreValue(periodScore.home_score, '-'),
          away: formatScoreValue(periodScore.away_score, '-')
        })
      })
    }

    columns.push(totalColumn)
  }

  return {
    columns,
    hasBreakdown: columns.length > 1
  }
}
