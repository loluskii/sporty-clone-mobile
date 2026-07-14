const TEAM_LOGO_BASE_URL =
  'https://firebasestorage.googleapis.com/v0/b/sbe-dev-ecd57.firebasestorage.app/o/TEAMS%2F'

const TEAM_LOGO_TOKEN = '8c7ef0e7-c4db-4446-b674-58d86d956efd'

export const getTeamLogoUrl = (teamName = '') =>
  `${TEAM_LOGO_BASE_URL}${encodeURIComponent(String(teamName).toUpperCase())}.png?alt=media&token=${TEAM_LOGO_TOKEN}`

export const getTeamLogoFallbackUrl = (side = 'home') =>
  side === 'away' ? '/images/team-fallback-away.png' : '/images/team-fallback-home.png'

export const setTeamLogoFallback = (event, side = 'home') => {
  if (!event?.target) return
  if (event.target.dataset.fallbackApplied === '1') return

  event.target.dataset.fallbackApplied = '1'
  event.target.src = getTeamLogoFallbackUrl(side)
}
