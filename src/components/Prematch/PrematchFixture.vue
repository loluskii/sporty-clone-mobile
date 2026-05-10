<template lang="">
  <div style="min-height: 102px; width: 100%">
    <div data-op="label-prematch" class="m-event-sport m-sports-row">
      <div class="m-event-meta">
        <div>
          <span class="m-time" style="margin-right: 5px">{{ eventTimeLabel }}</span>
          <!-- <span class="m-game-id" style="margin-right: 5px">ID {{ eventData.gameID }}</span> -->
          <span class="m-league-name">{{ eventData.categoryName }} - {{ eventData.tournament }}</span>
        </div>
        <img src="@/assets/images/chart.png" style="height: 12px" alt=""
          @click="showFixtureAnalysis(eventData.match_id)" srcset="" />
      </div>
      <div class="x-table-row m-sports-table">
        <div class="x-table-cell m-info-cell" @click="
            $router.push({
              name: 'fixtures-detail',
              params: {
                sport: slugify(eventData.sportName),
                tournament_name: slugify(eventData.tournament),
                event_name: slugify(eventData.name),
                event_id: eventData.matchID
              }
            })
          ">
          <div class="team">{{ eventData.homeTeam }}</div>
          <div class="team">{{ eventData.awayTeam }}</div>
        </div>
        <div class="x-table-cell m-market-cell">
          <div class="m-market m-event-market-default market-id-1" style="position: relative">
            <template v-if="eventData.outcomes">
              <template v-if="outcomes.length">
                <div v-if="activeMarket.specifier !== ''" class="m-outcome m-event-outcome-default specifiers-select"
                  @click="toggleList">
                  <div tabindex="0" class="grid-specifier-select">
                    <div class="grid-specifier-select-label">
                      {{ activeSpecifier }}
                    </div>
                    <div class="grid-specifier-select-icon">
                      <em class="icon">^</em>
                    </div>
                    <!---->
                  </div>
                </div>
                <div class="af-select-list m-event-specifiers-order" v-if="specifierOpen"
                  :class="'af-select-list-' + eventData.matchID"
                  style="width: 62px; opacity: 1; position: absolute; top: 34px; left: 0">
                  <span class="af-select-item" @click="setActiveSpecifierAndClose(item)" v-for="(item, i) in getSpecifiers"
                    :key="i">{{ item.value }}</span>
                </div>
                <Odds @click="addToBetslip(eventData, odd)" v-for="(odd, index) in outcomes"
                  :key="index" :odds="odd" :selectionClass="
                    isSelected(
                      createID(
                        eventData.matchID,
                        odd.marketID,
                        odd.outcomeID,
                        odd.specifier,
                        activeMarket.marketName,
                        odd.outcomeName
                      ),
                      
                      couponStore.coupon
                    )
                      ? 'm-outcome--checked'
                      : ''
                  "></Odds>
              </template>
              <template v-else>
                <div v-if="activeMarket.specifier !== ''"
                  class="m-outcome--disabled m-outcome m-event-outcome-default m-icon-lock">
                  <span data-op="prematch-lock" class="m-icon-lock"></span>
                </div>
                <EmptyOdds v-for="(odd, index) in activeMarket.outcomes" :key="index"></EmptyOdds>
              </template>
            </template>
            <EmptyOdds v-else></EmptyOdds>
          </div>
        </div>
      </div>
      <div class="m-event-footer">
        <div class="m-market-size">+{{ eventData.activeMarkets }}</div>
      </div>
    </div>
  </div>
  <!---->
</template>
<script setup>
import { defineComponent, computed, watch, ref } from 'vue'
import { createID, isSelected, slugify } from '@/helpers'
import Odds from '@/components/Prematch/Odds.vue'
import EmptyOdds from '@/components/EmptyOdds.vue'
import { useCouponStore } from '@/stores'
import emitter from '@/plugins/emitter'
import { SIM_ALLOWED_MARKETS } from '@/helpers'
import { useMatchOdds } from '@/composables/useMatchOdds'

const couponStore = useCouponStore()

const props = defineProps({
  eventData: Object,
  activeMarket: Object
})

const specifierOpen = ref(false)

const matchId = computed(() => props.eventData.matchID)
const baseOutcomes = computed(() => props.eventData.outcomes || [])
const sportId = computed(() => props.eventData?.sportID || 1)
const eventTimeLabel = computed(() => {
  const rawDate = props.eventData?.date
  if (!rawDate) return ''
  const date = new Date(rawDate)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
})

const { outcomes, activeSpecifier, getSpecifiers, setActiveSpecifier } = useMatchOdds({
  matchId,
  activeMarket: computed(() => props.activeMarket),
  baseOutcomes,
  sportId,
  onBetStop: () => {
    const matchTime = new Date(props.eventData.date)
    const currentTime = new Date()
    if (matchTime <= currentTime) {
      emitter.emit('remove-fixture', matchId.value)
    }
  },
  onMessage: (messageType, data) => {
    if (messageType !== 'match_status') return
    const matchStatus = String(data?.match_status || '').toLowerCase()
    if (matchStatus && !matchStatus.includes('not')) {
      emitter.emit('remove-fixture', matchId.value)
    }
  }
})

const toggleList = () => {
  specifierOpen.value = !specifierOpen.value
}

const setActiveSpecifierAndClose = (spec) => {
  setActiveSpecifier(spec)
  toggleList()
}

function showFixtureAnalysis(id) {
  return window.open(
    `https://s5.sir.sportradar.com/betradar/en/match/${id}`,
    'stats',
    'width=1078,height=768'
  )
}

function addToBetslip(event, odd) {
  if (odd.active === 0 || odd.odds <= 1) return
  const id = createID(
    event.matchID,
    odd.marketID,
    odd.outcomeID,
    odd.specifier,
    props.activeMarket.marketName,
    odd.outcomeName
  )
  const marketId = parseInt(odd.marketID)
  if (couponStore.betslipMode && !SIM_ALLOWED_MARKETS.includes(marketId)) {
    emitter.emit(
      'showErrorMessage',
      'This market is not supported in simulation mode. Exit Simulation mode to add to betslip'
    )
    return
  }
  const data = {
    fixture: event,
    market_name: props.activeMarket.marketName,
    market_id: odd.marketID,
    ele_id: id,
    outcome: odd,
    odds: odd.odds,
    odd_id: odd.outcomeID,
    odd_name: odd.outcomeName,
    type: 'prematch',
    event_id: event.matchID,
    specifier: odd.specifier
  }

  return couponStore.toggleCouponSelection(data)
}

watch(
  () => props.activeMarket,
  () => {
    specifierOpen.value = false
  }
)

defineComponent({
  name: 'PrematchFixture',
  components: { Odds, EmptyOdds }
})
</script>

<style scoped>
.m-event-sport {
  border-bottom: .5px solid #dedede;
  display: block;
  padding: 0.66666667rem 0;
}

.m-event-sport:hover,
.m-event-sport:active,
.m-event-sport:visited {
  text-decoration: none;
}

.m-event-sport .m-event-meta {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  color: #9ca0ab;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  font-size: 0.83333333rem;
  -webkit-box-pack: space-between;
  -webkit-justify-content: space-between;
  -ms-flex-pack: space-between;
  justify-content: space-between;
  line-height: 1.25rem;
}

.m-event-sport .m-event-meta>span {
  margin-right: 0.83333333rem;
}

.m-event-sport .m-event-meta>span:last-child {
  margin-right: 0;
}

.m-event-sport .m-event-meta .m-event-icon {
  display: inline-block;
  -webkit-box-flex: 0;
  -webkit-flex: 0;
  -ms-flex: 0;
  flex: 0;
  margin: 0 0.33333333rem 0 -0.83333333rem;
}

.m-event-sport .m-event-meta .m-event-icon svg,
.m-event-sport .m-event-meta .m-event-icon img {
  height: 1.066rem;
  vertical-align: top;
}

.m-event-sport .m-event-meta .m-time {
  -webkit-box-flex: 0;
  -webkit-flex: 0;
  -ms-flex: 0;
  flex: 0;
  white-space: nowrap;

}

.m-event-sport .m-event-meta .m-game-id {
  -webkit-box-flex: 0;
  -webkit-flex: 0;
  -ms-flex: 0;
  flex: 0;
  white-space: nowrap;
}

.m-event-sport .m-event-meta .m-league-name {
  display: inline-block;
  vertical-align: top;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-event-sport .m-event-meta .event-labels {
  margin: 0 0.91666667rem 0 -0.83333333rem;
}

.m-event-sport .m-sports-table {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  margin-top: 0.66666667rem;
}

.m-event-sport .m-market-cell {
  -webkit-box-flex: 0;
  -webkit-flex: 0 0 auto;
  -ms-flex: 0 0 auto;
  flex: 0 0 auto;
  width: 55%;
}

.m-event-sport .m-market-cell .m-market .m-outcome {
  background: #d6ebdc;
  background: var(--brand-prematch-odds-bg);
  color: var(--brand-prematch-odds-text);
}

.m-event-sport .m-market-cell .m-market .m-outcome--checked {
  background-color: var(--brand-active-prematch-odds-bg);
  color: #ffffff;
}

.m-event-sport .m-market-cell .m-market .m-outcome--checked:before {
  color: #ffffff !important;
  color: var(--brand-tertiary) !important;
}

.m-event-sport .m-market-cell .m-market .m-outcome--disabled {
  background-color: #dcdee5;
  background-color: var(--c-prematch-outcome-disabled-bg);
  color: #9ca0ab;
  color: var(--text-disable-type1-primary);
}

.m-event-sport .m-market-cell .m-market .m-outcome--up:before,
.m-event-sport .m-market-cell .m-market .m-outcome--down:before {
  color: #096b27;
  color: var(--brand-secondary);
}

.m-event-sport .m-info-cell>div {
  line-height: 1.4;
}

.m-event-sport .m-info-cell .team {
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  color: #353a45;
  padding-right: 0.83333333rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.m-event-sport .m-event-footer {
  -webkit-box-align: center;
  -webkit-align-items: center;
  -ms-flex-align: center;
  align-items: center;
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-pack: justify;
  -webkit-justify-content: space-between;
  -ms-flex-pack: justify;
  justify-content: space-between;
  margin-top: 0.41666667rem;
}

.m-event-sport .m-event-footer .m-event-comment {
  color: #9ca0ab;
  font-size: 0.83333333rem;
}

.m-event-sport .m-market-size {
  color: #9ca0ab;
  font-size: 0.83333333rem;
  width: 45%;
}

.m-event-sport .m-market-size .media-icon {
  margin-left: 0.25rem;
}

.m-event-sport .m-market-size .media-icon+.media-icon {
  margin-left: 0.41666667rem;
}

.m-event-sport .m-market-size .sfm-icon {
  -webkit-transform: translateY(-1px);
  -ms-transform: translateY(-1px);
  transform: translateY(-1px);
}

.m-tab-active {
  background-color: var(--brand-secondary);
  color: #ffffff !important;
}

.m-sports-table .m-date-row {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
  -webkit-box-sizing: border-box;
  box-sizing: border-box;
  height: 2rem;
  line-height: 2rem;
  padding: 0 0.83333333rem;
  z-index: 25 !important;
}

.m-sports-table .m-date-row .m-date {
  color: #353a45;
  color: var(--text-type1-primary);
  font-size: 1rem;
}

.m-sports-table .m-date-row .market-title {
  display: -webkit-box;
  display: -webkit-flex;
  display: -ms-flexbox;
  display: flex;
  -webkit-box-flex: 0;
  -webkit-flex: 0 1 auto;
  -ms-flex: 0 1 auto;
  flex: 0 1 auto;
  width: 55%;
}

.m-sports-table .m-date-row .market-title>div {
  color: #9ca0ab;
  color: var(--text-type1-secondary);
  -webkit-box-flex: 1;
  -webkit-flex: 1;
  -ms-flex: 1;
  flex: 1;
  font-size: 0.83333333rem;
  text-align: center;
}

.m-sports-table .m-date-row .market-title .specifier-cell {
  min-width: 0;
  overflow: hidden;
}

.m-sports-table .m-sports-row {
  margin: 0 0.83333333rem;
}

.m-sports-table .m-inner-ads {
  display: block;
  margin: 0.83333333rem;
}

.m-sports-table .m-inner-ads img {
  display: block;
  width: 100%;
}

.af-select-item {
  display: inline-block;
  text-align: center;
  width: 100%;
}

.af-select-item.active {
  background-color: #fafafa;
  background-color: var(--background-general-primary);
  color: var(--brand-highlight-text);
  color: var(--brand-quaternary);
}

.af-select-item.hover {
  background-color: #f2f3f5;
  background-color: var(--background-type1-primary);
}
</style>
