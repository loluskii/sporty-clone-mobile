<template lang="">
  <div data-op="label-event-live" class="m-event-live x-live-row">
    <div class="m-event-meta">
      <span class="m-event-time">{{ gameData.eventTime }}</span>
      <span class="match-status">{{
        gameData.matchStatus == '1st half'
          ? 'H1'
          : gameData.matchStatus == '2nd half'
          ? 'H2'
          : gameData.matchStatus
      }}</span>
      <span class="m-league-name">{{ gameData.categoryName }} - {{ gameData.tournament }}</span>
      <div class="live-marker" data-cms-key="live">Live</div>
    </div>
    <div class="x-table-row x-live-table">
      <div
        @click="
          $router.push({
            name: 'live-fixtures-detail',
            params: {
              sport: slugify(gameData.sportName),
              tournament_name: slugify(gameData.tournament),
              event_name: slugify(gameData.name),
              event_id: gameData.matchID
            }
          })
        "
        class="x-table-cell m-info-cell"
      >
        <div class="team">{{ gameData.homeTeam }}</div>
        <div class="team">{{ gameData.awayTeam }}</div>
      </div>
      <div class="x-table-cell score">
        <div class="set-score">{{ gameData.homeScore }}</div>
        <div class="set-score">{{ gameData.awayScore }}</div>
      </div>

      <div class="x-table-cell m-market-cell">
        <div class="m-market m-event-market-default" style="position: relative">
          <template v-if="outcomes && outcomes.length">
            <div
              v-if="activeMarket.specifier !== ''"
              @click="toggleList"
              class="m-outcome m-event-outcome-default specifiers-select"
            >
              <div tabindex="0" class="grid-specifier-select">
                <div class="grid-specifier-select-label">{{ activeSpecifier }}</div>
                <div class="grid-specifier-select-icon">
                  <em class="icon">^</em>
                </div>
              </div>
            </div>
            <div
              class="af-select-list m-event-specifiers-order"
              v-if="specifierOpen"
              :class="'af-select-list-' + gameData.matchID"
              style="width: 71px; opacity: 1; position: absolute; top: 37px; left: 0"
            >
              <span
                class="af-select-item"
                @click="setActiveSpecifier(item)"
                v-for="(item, i) in getSpecifiers"
                :key="i"
                >{{ item.value }}</span
              >
            </div>
            <LiveOdds
              v-for="(odd, index) in uniqueOutcomes(outcomes)"
              @click="addToBetslip(gameData, odd)"
              :selectionClass="
                isSelected(
                  createID(
                    gameData.gameID,
                    gameData.matchID,
                    odd.outcomeName,
                    odd.oddID,
                    gameData.name
                  ),
                  couponStore.coupon
                )
                  ? 'm-outcome--checked'
                  : ''
              "
              :key="index"
              :odds="odd"
            ></LiveOdds>
          </template>
          <EmptyOdds v-for="(odd, index) in activeMarket.outcomes" :key="index" v-else></EmptyOdds>
        </div>
      </div>
    </div>
    <div class="m-event-footer">
      <div class="m-market-size">+{{ gameData.activeMarkets }}&gt;</div>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import LiveOdds from './LiveOdds.vue'
import EmptyOdds from '@/components/EmptyOdds.vue'
import { sortArr, createID, isSelected, slugify } from '@/helpers'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '../../helpers'

const couponStore = useCouponStore()

const props = defineProps({
  gameData: Object,
  activeMarket: Object
})

const activeSpecifier = ref()
const specifierOpen = ref(false)

const scores = ref()
const outcomes = ref([])

const getOdds = () => {
  if (props.activeMarket && props.gameData.activeMarkets > 0) {
    if (props.gameData.outcomes) {
      // Find and return the odds based on marketID and outcomeID
      const odds = props.gameData.outcomes
      let filtered = odds.filter((item) => item.marketID == props.activeMarket.marketID)
      let uniqueFiltered = uniqueOutcomes(filtered)
      // console.log(uniqueFiltered)
      if (props.activeMarket.specifier && props.activeMarket.specifier !== '') {
        let defaultSpecifier = uniqueFiltered[0]?.specifier
        if (defaultSpecifier) {
          uniqueFiltered = uniqueFiltered.filter((item) => item.specifier === defaultSpecifier)
          activeSpecifier.value = defaultSpecifier.split('=')[1]
        }
      }
      if (uniqueFiltered.length) {
        // console.log(_.sortBy(uniqueFiltered, 'outcomeID'))
        outcomes.value = sortArr(uniqueFiltered, 'outcomeID')
      } else {
        outcomes.value = []
      }
    }
  }
}

const getSpecifiers = computed(() => {
  if (props.activeMarket && props.activeMarket.specifier && props.activeMarket.specifier !== '') {
    const result = []

    const outcomes = props.gameData.outcomes
    if (outcomes.length > 0) {
      const filtered = outcomes.filter(
        (item) => item.marketID === parseInt(props.activeMarket.marketID)
      )

      let uniqueFiltered = uniqueOutcomes(filtered)

      uniqueFiltered.forEach((outcome) => {
        let specifier = outcome.specifier
        let found = result.find((item) => item.specifier === specifier)
        if (!found)
          // check if specifier has been listed
          result.push({ specifier, value: specifier.split('=')[1] }) //push value to array
      })
    }
    return result.sort((a, b) => a.value - b.value)
  } else {
    return []
  }
})

// set active specifier value
const setActiveSpecifier = (spec) => {
  if (props.gameData.outcomes) {
    // console.log(spec)
    const odds = props.gameData.outcomes
    let filtered = odds.filter((item) => item.marketID === parseInt(props.activeMarket.marketID))
    if (filtered) {
      let uniqueFiltered = uniqueOutcomes(filtered)
      uniqueFiltered = uniqueFiltered.filter((item) => item.specifier === spec.specifier)
      // console.log(uniqueFiltered)
      outcomes.value = uniqueFiltered
      activeSpecifier.value = spec.value
      toggleList()
    }
    // filtered = filtered.filter((item) => item.specifier === spec.specifier)
  } else {
    // console.log('sdfdf')
  }
}

const toggleList = () => {
  specifierOpen.value = !specifierOpen.value
}

function addToBetslip(event, odd) {
  if (odd.odds <= 1) return
  const id = createID(event.gameID, event.matchID, odd.outcomeName, odd.oddID, event.name)
  let marketId = parseInt(odd.marketID)
  if(couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)){
    emitter.emit('showErrorMessage', 'This market is not supported in simulation mode. Exit Simulation mode to add to betslip')
    return;
  }
  const data = {
    fixture: event,
    market_name: props.activeMarket.marketName,
    market_id: odd.marketID,
    ele_id: id,
    outcome: odd,
    odds: odd.odds,
    odd_id: odd.oddID,
    odd_name: odd.outcomeName,
    type: 'live',
    event_id: event.gameID,
    specifier: props.activeMarket.specifier
  }
  // return couponStore.addToCoupon(data)

  const existsInBetslip = isSelected(id, couponStore.coupon)
  return existsInBetslip ? couponStore.removeSelection(id) : couponStore.addToCoupon(data)
}

const uniqueOutcomes = (outcomes) => {
  let x = outcomes.filter(
    (outcome, index, self) =>
      index ===
      self.findIndex((o) => o.outcomeID == outcome.outcomeID && o.specifier == outcome.specifier)
  )
  return x
}

watch(
  [() => props.activeMarket, () => props.gameData.outcomes],
  () => {
    getOdds()
  },
  { immediate: true }
)

onMounted(() => {
  scores.value = {
    homeScore: props.gameData.homeScore,
    awayScore: props.gameData.awayScore
  }

  outcomes.value = props.gameData.outcomes || []
  getOdds()

  emitter.on(`odds-change-${props.gameData.matchID}`, (data) => {
    // console.log(`received odds change for ${data?.match_id}`, data.markets);
    // set scores
    scores.value = {
      homeScore: data.sport_event_status.home_score,
      awayScore: data.sport_event_status.away_score
    }
    // clone outcomes value
    const newOutcomes = [...outcomes.value]
    // odds change markets
    const markets = data.markets
    // build new outcomes
    for (let index = 0; index < newOutcomes.length; index++) {
      const outcome = { ...newOutcomes[index] }
      // find market
      const market = markets.find(
        (item) => item.id === outcome.marketID && item.specifiers === outcome.specifier
      )
      if (market) {
        if (market.outcomes) {
          market.outcomes.forEach((odd) => {
            if (odd.id === outcome.outcomeID && outcome.specifier === market.specifiers) {
              outcome.odds = odd.odds
              outcome.active = odd.active ? 1 : 0
            }
          })
        } else {
          outcome.odds = 0
        }
      }
      newOutcomes[index] = outcome
    }
    // update outcomes state
    outcomes.value = newOutcomes
  })

  // when a bet_stop message is received, all odds should be closed;
  emitter.on(`bet-stop-${props.gameData.matchID}`, (data) => {
    console.log(`received bet stop for ${data?.match_id}`)
    // clone outcomes value
    const newOutcomes = [...outcomes.value]
    // loop through current outcomes and updated odds to 0;
    for (let index = 0; index < newOutcomes.length; index++) {
      const outcome = { ...newOutcomes[index] }
      outcome.odds = 0
      outcome.active = 0
      // console.log('active: '+outcome)
      newOutcomes[index] = outcome
    }
    // update outcomes state
    outcomes.value = newOutcomes
  })
})
</script>

<style scoped>
.m-table {
  display: block;
  width: 100%;
}

.m-table .m-table-row {
  display: table;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  width: 100%;
}

.m-table .m-table-cell {
  display: table-cell;
  -webkit-box-flex: 1;
  -webkit-flex: 1 1 auto;
  -ms-flex: 1 1 auto;
  flex: 1 1 auto;
  min-width: 1%;
}
/* Live Fixture */
.m-live-table .m-live-row {
  margin: 0 0.83333333rem;
}
</style>
