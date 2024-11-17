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
      <!-- <span class="m-league-name">{{ gameData.categoryName }} - {{ gameData.tournament }}</span> -->
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
        <div class="set-score">{{ scores.homeScore }}</div>
        <div class="set-score">{{ scores.awayScore }}</div>
      </div>

      <div class="x-table-cell m-market-cell">
        <div class="m-market m-event-market-default">
          <template v-if="outcomes && outcomes.length">
            <template v-if="getOdds.length">
              <LiveOdds
                v-for="(odd, index) in uniqueOutcomes(getOdds)"
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
                :odds="odd.odds"
              ></LiveOdds>
            </template>
            <EmptyOdds
              v-for="(odd, index) in activeMarket.outcomes"
              :key="index"
              v-else-if="!getOdds.length && activeMarket.length"
            ></EmptyOdds>
            <EmptyOdds v-else></EmptyOdds>
          </template>
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
import { slugify, createID, isSelected } from '@/helpers'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'

// import _ from 'lodash'
const couponStore = useCouponStore()

const props = defineProps({
  gameData: Object,
  activeMarket: Object
})

const scores = ref({
  homeScore: 0,
  awayScore: 0
})
const outcomes = ref([])

const getOdds = computed(() => {
  if (outcomes.value) {
    // Find and return the odds based on marketID and outcomeID
    const odds = outcomes.value.filter((o) => o.marketID == props.activeMarket.marketID)
    return odds.sort((a, b) => a.outcomeID - b.outcomeID)
  } else {
    return []
  }
})

const uniqueOutcomes = (outcomes) => {
  let x = outcomes.filter(
    (outcome, index, self) =>
      index === self.findIndex((o) => o.outcomeID === outcome.outcomeID)
  );
  return x;
};

watch(
  () => props.gameData,
  () => {
    outcomes.value = props.gameData.outcomes || []
  },
  { immediate: true }
)

function addToBetslip(event, odd) {
  if (odd.odds <= 1) return
  const id = createID(event.gameID, event.matchID, odd.outcomeName, odd.oddID, event.name)
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

onMounted(() => {
  scores.value = {
    homeScore: props.gameData.homeScore,
    awayScore: props.gameData.awayScore
  }

  outcomes.value = props.gameData.outcomes || []

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
    // console.log(`received bet stop for ${data?.match_id}`);
    // clone outcomes value
    const newOutcomes = [...outcomes.value]
    // loop through current outcomes and updated odds to 0;
    for (let index = 0; index < newOutcomes.length; index++) {
      const outcome = { ...newOutcomes[index] }
      outcome.odds = 0
      outcome.active = 0
      newOutcomes[index] = outcome
      // console.log('active: ' + outcome)
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
</style>
