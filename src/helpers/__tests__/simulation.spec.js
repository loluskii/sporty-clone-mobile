import { describe, expect, it } from 'vitest'
import { SIM_ALLOWED_SPORT_IDS, isSimulationSportAllowed } from '@/helpers/constants'

describe('simulation sport eligibility', () => {
  it('allows football and keeps the allowlist extensible', () => {
    expect(SIM_ALLOWED_SPORT_IDS).toEqual([1])
    expect(isSimulationSportAllowed(1)).toBe(true)
  })

  it('rejects sports that are not enabled for simulation', () => {
    expect(isSimulationSportAllowed(2)).toBe(false)
    expect(isSimulationSportAllowed('4')).toBe(false)
  })
})
