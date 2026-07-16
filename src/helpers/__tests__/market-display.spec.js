import { describe, expect, it } from 'vitest'
import { normalizeFixtureMarket, normalizeFixtureMarkets } from '@/helpers'

const basketballMarkets = [
  {
    marketID: 219,
    marketName: 'winner (incl. overtime)',
    specifier: '',
    outcomes: [
      {
        outcomeName: '{$competitor1}',
        outcomeID: '4'
      },
      {
        outcomeName: '{$competitor2}',
        outcomeID: '5'
      }
    ],
    sportID: 2
  },
  {
    marketID: 223,
    marketName: 'handicap (incl. overtime)',
    specifier: '',
    outcomes: [
      {
        outcomeName: '{$competitor1} ({+hcp})',
        outcomeID: '1714'
      },
      {
        outcomeName: '{$competitor2} ({-hcp})',
        outcomeID: '1715'
      }
    ],
    sportID: 2
  },
  {
    marketID: 225,
    marketName: 'Over/Under (incl. overtime)',
    specifier: '',
    outcomes: [
      {
        outcomeName: 'over {total}',
        outcomeID: '12'
      },
      {
        outcomeName: 'under {total}',
        outcomeID: '13'
      }
    ],
    sportID: 2
  },
  {
    marketID: 225,
    marketName: 'Over/Under (incl. overtime)',
    specifier: 'total',
    outcomes: [
      {
        outcomeName: 'over',
        outcomeID: '12'
      },
      {
        outcomeName: 'under',
        outcomeID: '13'
      }
    ],
    sportID: 2
  },
  {
    marketID: 227,
    marketName: 'Home Over/Under (incl. overtime)',
    specifier: '',
    outcomes: [
      {
        outcomeName: 'over {total}',
        outcomeID: '12'
      },
      {
        outcomeName: 'under {total}',
        outcomeID: '13'
      }
    ],
    sportID: 2
  },
  {
    marketID: 228,
    marketName: 'Away Over/Under (incl. overtime)',
    specifier: '',
    outcomes: [
      {
        outcomeName: 'over {total}',
        outcomeID: '12'
      },
      {
        outcomeName: 'under {total}',
        outcomeID: '13'
      }
    ],
    sportID: 2
  }
]

describe('market display normalization', () => {
  it('preserves distinct market specifiers and normalizes placeholder labels', () => {
    const normalized = normalizeFixtureMarkets(basketballMarkets)

    expect(normalized).toHaveLength(6)
    expect(normalized.map((market) => market.marketID)).toEqual([219, 223, 225, 225, 227, 228])
    expect(normalized.find((market) => market.marketID === 219)?.outcomes.map((outcome) => outcome.outcomeName)).toEqual(['1', '2'])
    expect(normalized.find((market) => market.marketID === 223)?.outcomes.map((outcome) => outcome.outcomeName)).toEqual(['1', '2'])
    expect(
      normalized
        .filter((market) => market.marketID === 225)
        .map((market) => market.specifier)
    ).toEqual(['', 'total'])
    expect(
      normalized
        .filter((market) => market.marketID === 225)
        .map((market) => market.outcomes.map((outcome) => outcome.outcomeName))
    ).toEqual([
      ['over', 'under'],
      ['over', 'under']
    ])
  })

  it('cleans generic home/away placeholders without sport-specific rules', () => {
    const market = normalizeFixtureMarket({
      marketID: 999,
      marketName: 'home team over/under (incl. overtime)',
      specifier: 'total=3.5',
      outcomes: [
        { outcomeName: '{$competitor1} ({+hcp})', outcomeID: '1' },
        { outcomeName: '{$competitor2} ({-hcp})', outcomeID: '2' },
        { outcomeName: 'over {total}', outcomeID: '12' }
      ]
    })

    expect(market.marketName).toBe('home over/under (incl. overtime)')
    expect(market.outcomes.map((outcome) => outcome.outcomeName)).toEqual(['1', '2', 'over 3.5'])
  })
})
