import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'

// vi.hoisted runs before vi.mock factories so they can safely reference this state.
const { mockState, emitterMock } = vi.hoisted(() => ({
  mockState: {
    coupon: { coupon: { selections: [] } },
    utils: { SportsbookGlobalVariable: { Currency: 'NGN' } }
  },
  emitterMock: {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn()
  }
}))

vi.mock('@/stores', () => ({
  useCouponStore: () => mockState.coupon,
  useUtilsStore: () => mockState.utils
}))

vi.mock('@/plugins/emitter', () => ({
  default: emitterMock
}))

import Simulation from '../Simulation.vue'

const SimulationControlsStub = {
  name: 'SimulationControls',
  template: '<div data-test="sim-controls"></div>',
  emits: ['exit'],
  props: ['timerEnded', 'timerStarted']
}

const childStubs = {
  SimulationEvent: { template: '<div />' },
  SimulationPitch: { template: '<div />' },
  SimulationControls: SimulationControlsStub
}

// SIMULATION_DURATION inside the component:
//   KICKOFF(3) + (CLIP(4) + GOAL_BANNER(1)) * 4 + HALFTIME(2) = 25 seconds.
// Advance a bit past so the interval's end check runs and pegs currentTime.
const ADVANCE_PAST_END_MS = 30_000

const mountSim = (simulationResults = {}, opts = {}) => {
  mockState.coupon.coupon.selections = opts.selections ?? [{ matchId: 1 }]
  if (opts.currency) {
    mockState.utils.SportsbookGlobalVariable = { Currency: opts.currency }
  }
  return mount(Simulation, {
    props: { simulationResults },
    global: { stubs: childStubs }
  })
}

const triggerControlsExit = async (wrapper, action) => {
  const controls = wrapper.findComponent(SimulationControlsStub)
  controls.vm.$emit('exit', action)
  await flushPromises()
}

const countModalEmits = () =>
  emitterMock.emit.mock.calls.filter(([event]) => event === 'showWinModal').length

describe('Simulation.vue', () => {
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    emitterMock.emit.mockClear()
    mockState.coupon.coupon.selections = [{ matchId: 1 }]
    mockState.utils.SportsbookGlobalVariable = { Currency: 'NGN' }
  })

  afterEach(() => {
    if (wrapper) wrapper.unmount()
    wrapper = null
    vi.useRealTimers()
  })

  describe('skip-to-result', () => {
    it('emits showWinModal but does NOT emit exit on skip when amountWon > 0', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 500 }] })
      await triggerControlsExit(wrapper, 'skip')

      expect(emitterMock.emit).toHaveBeenCalledWith('showWinModal', {
        amount: 500,
        currency: 'NGN'
      })
      expect(wrapper.emitted('exit')).toBeUndefined()
    })

    it('does NOT emit showWinModal or exit on skip when amountWon is 0', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 0 }] })
      await triggerControlsExit(wrapper, 'skip')

      expect(countModalEmits()).toBe(0)
      expect(wrapper.emitted('exit')).toBeUndefined()
    })

    it('handles missing betSummary without throwing or emitting', async () => {
      wrapper = mountSim({})
      await triggerControlsExit(wrapper, 'skip')

      expect(countModalEmits()).toBe(0)
      expect(wrapper.emitted('exit')).toBeUndefined()
    })

    it('emits showWinModal at most once across rapid repeated skips', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 200 }] })
      await triggerControlsExit(wrapper, 'skip')
      await triggerControlsExit(wrapper, 'skip')
      await triggerControlsExit(wrapper, 'skip')

      expect(countModalEmits()).toBe(1)
    })

    it('forwards the currency from the utils store in the modal payload', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 50 }] }, { currency: 'USD' })
      await triggerControlsExit(wrapper, 'skip')

      expect(emitterMock.emit).toHaveBeenCalledWith('showWinModal', {
        amount: 50,
        currency: 'USD'
      })
    })
  })

  describe('natural end', () => {
    it('emits showWinModal exactly once when the timer ends naturally on a win', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 100 }] })
      vi.advanceTimersByTime(ADVANCE_PAST_END_MS)
      await flushPromises()

      expect(countModalEmits()).toBe(1)
    })

    it('does NOT emit showWinModal when the timer ends naturally on a loss', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 0 }] })
      vi.advanceTimersByTime(ADVANCE_PAST_END_MS)
      await flushPromises()

      expect(countModalEmits()).toBe(0)
    })

    it('does NOT re-emit the modal if skip is pressed after natural end', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 100 }] })
      vi.advanceTimersByTime(ADVANCE_PAST_END_MS)
      await flushPromises()
      const before = countModalEmits()

      await triggerControlsExit(wrapper, 'skip')

      expect(countModalEmits()).toBe(before)
    })
  })

  describe('close action', () => {
    it('emits an exit event when controls request close', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 100 }] })
      await triggerControlsExit(wrapper, 'close')

      expect(wrapper.emitted('exit')).toBeTruthy()
      expect(wrapper.emitted('exit')).toHaveLength(1)
    })
  })

  describe('child contract', () => {
    it('updates the timerEnded prop on SimulationControls as the timer reaches the end', async () => {
      wrapper = mountSim({ bets: [{ amountWon: 0 }] })
      const controls = wrapper.findComponent(SimulationControlsStub)

      expect(controls.props('timerStarted')).toBe(false)
      expect(controls.props('timerEnded')).toBe(false)

      vi.advanceTimersByTime(ADVANCE_PAST_END_MS)
      await flushPromises()

      expect(controls.props('timerEnded')).toBe(true)
    })
  })
})
